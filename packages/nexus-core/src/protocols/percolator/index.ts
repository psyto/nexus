import {
  Connection,
  PublicKey,
  Keypair,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { getConnection, loadWallet } from "../../connection.js";
import {
  fetchSlab,
  parseHeader,
  parseConfig,
  parseParams,
  parseEngine,
  parseAccount,
  parseAllAccounts,
  parseUsedIndices,
} from "./slab.js";
import {
  encodeDepositCollateral,
  encodeWithdrawCollateral,
  encodeTradeNoCpi,
} from "./instructions.js";
import {
  buildAccountMetas,
  ACCOUNTS_DEPOSIT_COLLATERAL,
  ACCOUNTS_WITHDRAW_COLLATERAL,
  ACCOUNTS_TRADE_NOCPI,
  WELL_KNOWN,
} from "./accounts.js";
import { deriveVaultAuthority } from "./pda.js";
import { AccountKind } from "./types.js";
import type { TxResult } from "../../types.js";

export * from "./types.js";
export * from "./slab.js";
export * from "./encode.js";
export * from "./pda.js";
export * from "./instructions.js";
export * from "./accounts.js";

const DEFAULT_PROGRAM_ID = new PublicKey("F1uxb9kqJg7jv1FoYCjqBm12RYDsTEPnHUbpTopsNVAg");

export class PercolatorClient {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection?: Connection, programId?: PublicKey) {
    this.connection = connection ?? getConnection();
    this.programId = programId ?? DEFAULT_PROGRAM_ID;
  }

  /**
   * List all markets owned by the program.
   * Scans getProgramAccounts for slab accounts with the PERCOLAT magic.
   */
  async listMarkets(programId?: string) {
    const pid = programId ? new PublicKey(programId) : this.programId;
    const accounts = await this.connection.getProgramAccounts(pid, {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: "7gNAXLYVf5J", // base58 of PERCOLAT magic (8 bytes LE)
          },
        },
      ],
    });

    return accounts.map((acc) => {
      const data = Buffer.from(acc.account.data);
      const header = parseHeader(data);
      const config = parseConfig(data);
      const engine = parseEngine(data);
      const params = parseParams(data);

      return {
        pubkey: acc.pubkey.toBase58(),
        version: header.version,
        resolved: header.resolved,
        admin: header.admin.toBase58(),
        collateralMint: config.collateralMint.toBase58(),
        totalOpenInterest: engine.totalOpenInterest,
        vault: engine.vault,
        insuranceFund: engine.insuranceFund.balance,
        numUsedAccounts: engine.numUsedAccounts,
        fundingRateBpsPerSlotLast: engine.fundingRateBpsPerSlotLast,
        riskParams: {
          maintenanceMarginBps: params.maintenanceMarginBps,
          initialMarginBps: params.initialMarginBps,
          tradingFeeBps: params.tradingFeeBps,
          liquidationFeeBps: params.liquidationFeeBps,
        },
      };
    });
  }

  /**
   * Get full market state for a single slab.
   */
  async getMarket(slabAddress: string) {
    const slabPubkey = new PublicKey(slabAddress);
    const data = await fetchSlab(this.connection, slabPubkey);

    const header = parseHeader(data);
    const config = parseConfig(data);
    const engine = parseEngine(data);
    const params = parseParams(data);

    return { header, config, engine, params };
  }

  /**
   * Get a user's position by slab + index.
   */
  async getUserPosition(slabAddress: string, userIndex: number) {
    const slabPubkey = new PublicKey(slabAddress);
    const data = await fetchSlab(this.connection, slabPubkey);
    const account = parseAccount(data, userIndex);

    return {
      kind: account.kind === AccountKind.LP ? "LP" : "User",
      accountId: account.accountId,
      capital: account.capital,
      pnl: account.pnl,
      positionSize: account.positionSize,
      entryPrice: account.entryPrice,
      fundingIndex: account.fundingIndex,
      owner: account.owner.toBase58(),
      feeCredits: account.feeCredits,
    };
  }

  /**
   * Build a deposit collateral transaction.
   */
  async depositCollateral(
    slabAddress: string,
    userIndex: number,
    amount: string,
    walletPrivateKey?: string,
  ): Promise<TxResult> {
    const wallet = loadWallet(walletPrivateKey);
    if (!wallet) throw new Error("Wallet required for deposit_collateral. Set SOLANA_PRIVATE_KEY or pass walletPrivateKey.");

    const slabPubkey = new PublicKey(slabAddress);
    const data = await fetchSlab(this.connection, slabPubkey);
    const config = parseConfig(data);

    const { associatedTokenAddress } = await this.getAta(wallet.publicKey, config.collateralMint);

    const ixData = encodeDepositCollateral({ userIdx: userIndex, amount });
    const keys = buildAccountMetas(ACCOUNTS_DEPOSIT_COLLATERAL, [
      wallet.publicKey,
      slabPubkey,
      associatedTokenAddress,
      config.vaultPubkey,
      WELL_KNOWN.tokenProgram,
      WELL_KNOWN.clock,
    ]);

    return this.sendTransaction(
      new TransactionInstruction({ programId: this.programId, keys, data: ixData }),
      wallet,
    );
  }

  /**
   * Build a withdraw collateral transaction.
   */
  async withdrawCollateral(
    slabAddress: string,
    userIndex: number,
    amount: string,
    walletPrivateKey?: string,
  ): Promise<TxResult> {
    const wallet = loadWallet(walletPrivateKey);
    if (!wallet) throw new Error("Wallet required for withdraw_collateral. Set SOLANA_PRIVATE_KEY or pass walletPrivateKey.");

    const slabPubkey = new PublicKey(slabAddress);
    const data = await fetchSlab(this.connection, slabPubkey);
    const config = parseConfig(data);
    const [vaultPda] = deriveVaultAuthority(this.programId, slabPubkey);
    const { associatedTokenAddress } = await this.getAta(wallet.publicKey, config.collateralMint);

    const ixData = encodeWithdrawCollateral({ userIdx: userIndex, amount });
    // oracle account is a placeholder for now (no Pyth in devnet)
    const keys = buildAccountMetas(ACCOUNTS_WITHDRAW_COLLATERAL, [
      wallet.publicKey,
      slabPubkey,
      config.vaultPubkey,
      associatedTokenAddress,
      vaultPda,
      WELL_KNOWN.tokenProgram,
      WELL_KNOWN.clock,
      PublicKey.default, // oracle placeholder
    ]);

    return this.sendTransaction(
      new TransactionInstruction({ programId: this.programId, keys, data: ixData }),
      wallet,
    );
  }

  /**
   * Build a trade transaction.
   */
  async trade(
    slabAddress: string,
    lpIndex: number,
    userIndex: number,
    size: string,
    walletPrivateKey?: string,
  ): Promise<TxResult> {
    const wallet = loadWallet(walletPrivateKey);
    if (!wallet) throw new Error("Wallet required for trade. Set SOLANA_PRIVATE_KEY or pass walletPrivateKey.");

    const slabPubkey = new PublicKey(slabAddress);

    const ixData = encodeTradeNoCpi({ lpIdx: lpIndex, userIdx: userIndex, size });
    const keys = buildAccountMetas(ACCOUNTS_TRADE_NOCPI, [
      wallet.publicKey,
      wallet.publicKey, // LP signer (same wallet for now)
      slabPubkey,
      WELL_KNOWN.clock,
      PublicKey.default, // oracle placeholder
    ]);

    return this.sendTransaction(
      new TransactionInstruction({ programId: this.programId, keys, data: ixData }),
      wallet,
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private async getAta(owner: PublicKey, mint: PublicKey) {
    const { getAssociatedTokenAddress } = await import("@solana/spl-token");
    const associatedTokenAddress = await getAssociatedTokenAddress(mint, owner);
    return { associatedTokenAddress };
  }

  private async sendTransaction(
    instruction: TransactionInstruction,
    wallet: Keypair,
  ): Promise<TxResult> {
    try {
      const { blockhash } = await this.connection.getLatestBlockhash();
      const messageV0 = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToV0Message();

      const tx = new VersionedTransaction(messageV0);
      tx.sign([wallet]);

      const signature = await this.connection.sendTransaction(tx);
      await this.connection.confirmTransaction(signature, "confirmed");
      return { signature, success: true };
    } catch (e) {
      return {
        signature: "",
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
}
