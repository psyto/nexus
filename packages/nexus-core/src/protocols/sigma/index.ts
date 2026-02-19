import { Connection, PublicKey } from "@solana/web3.js";
import { getConnection } from "../../connection.js";
import {
  deriveVariancePool,
  deriveVariancePosition,
  deriveFundingPool,
  deriveVolatilityIndex,
} from "./pda.js";
import type {
  VolatilityIndex,
  VariancePool,
  VariancePosition,
  FundingPool,
  FundingRate,
} from "./types.js";

export * from "./types.js";
export * from "./pda.js";

export class SigmaClient {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection?: Connection, programId?: PublicKey) {
    this.connection = connection ?? getConnection();
    this.programId = programId ?? PublicKey.default;
  }

  /**
   * Get volatility index level.
   */
  async getVolatilityIndex(indexName: string): Promise<VolatilityIndex> {
    const [pda] = deriveVolatilityIndex(this.programId, indexName);
    const info = await this.connection.getAccountInfo(pda);
    if (!info) throw new Error(`Volatility index not found: ${indexName}`);
    return this.parseVolatilityIndex(info.data as Buffer, indexName);
  }

  /**
   * Get variance swap pool state.
   */
  async getVariancePool(underlyingMint: string): Promise<VariancePool> {
    const mintPubkey = new PublicKey(underlyingMint);
    const [pda] = deriveVariancePool(this.programId, mintPubkey);
    const info = await this.connection.getAccountInfo(pda);
    if (!info) throw new Error(`Variance pool not found for mint ${underlyingMint}`);
    return this.parseVariancePool(info.data as Buffer);
  }

  /**
   * Get user's variance swap position.
   */
  async getPosition(underlyingMint: string, user: string, epoch: string): Promise<VariancePosition> {
    const mintPubkey = new PublicKey(underlyingMint);
    const userPubkey = new PublicKey(user);
    const [poolPda] = deriveVariancePool(this.programId, mintPubkey);
    const [pda] = deriveVariancePosition(this.programId, poolPda, userPubkey, BigInt(epoch));
    const info = await this.connection.getAccountInfo(pda);
    if (!info) throw new Error(`Position not found for ${user} in epoch ${epoch}`);
    return this.parseVariancePosition(info.data as Buffer);
  }

  /**
   * Get funding rate for a symbol.
   */
  async getFundingRate(marketSymbol: string): Promise<FundingRate> {
    const [pda] = deriveFundingPool(this.programId, marketSymbol);
    const info = await this.connection.getAccountInfo(pda);
    if (!info) throw new Error(`Funding pool not found for ${marketSymbol}`);
    const pool = this.parseFundingPool(info.data as Buffer, marketSymbol);
    return {
      marketSymbol,
      currentRate: pool.floatingRateAccumulator,
      annualizedRate: pool.fixedRate,
      lastUpdateSlot: pool.lastFundingUpdate,
    };
  }

  /**
   * Get funding swap pool state.
   */
  async getFundingPool(marketSymbol: string): Promise<FundingPool> {
    const [pda] = deriveFundingPool(this.programId, marketSymbol);
    const info = await this.connection.getAccountInfo(pda);
    if (!info) throw new Error(`Funding pool not found for ${marketSymbol}`);
    return this.parseFundingPool(info.data as Buffer, marketSymbol);
  }

  // ── Parsers ─────────────────────────────────────────────────────────

  private parseVolatilityIndex(data: Buffer, name: string): VolatilityIndex {
    let off = 8; // discriminator
    const currentLevel = data.readBigUInt64LE(off); off += 8;
    const lastUpdateSlot = data.readBigUInt64LE(off); off += 8;
    // SVI params (5 x i64)
    const a = data.readBigInt64LE(off); off += 8;
    const b = data.readBigInt64LE(off); off += 8;
    const rho = data.readBigInt64LE(off); off += 8;
    const m = data.readBigInt64LE(off); off += 8;
    const sigma = data.readBigInt64LE(off);
    return {
      name,
      currentLevel,
      lastUpdateSlot,
      sviParams: { a, b, rho, m, sigma },
    };
  }

  private parseVariancePool(data: Buffer): VariancePool {
    let off = 8; // discriminator
    const underlyingMint = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const collateralMint = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const currentEpoch = data.readBigUInt64LE(off); off += 8;
    const strikeVariance = data.readBigUInt64LE(off); off += 8;
    const totalLongNotional = data.readBigUInt64LE(off); off += 8;
    const totalShortNotional = data.readBigUInt64LE(off); off += 8;
    const lpDeposits = data.readBigUInt64LE(off); off += 8;
    const realizedVariance = data.readBigUInt64LE(off); off += 8;
    const lastUpdateSlot = data.readBigUInt64LE(off); off += 8;
    const isActive = data.readUInt8(off) !== 0;
    return {
      underlyingMint, collateralMint, currentEpoch, strikeVariance,
      totalLongNotional, totalShortNotional, lpDeposits, realizedVariance,
      lastUpdateSlot, isActive,
    };
  }

  private parseVariancePosition(data: Buffer): VariancePosition {
    let off = 8; // discriminator
    const owner = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const underlyingMint = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const epoch = data.readBigUInt64LE(off); off += 8;
    const isLong = data.readUInt8(off) !== 0; off += 1;
    const notional = data.readBigUInt64LE(off); off += 8;
    const entryVariance = data.readBigUInt64LE(off); off += 8;
    const collateralDeposited = data.readBigUInt64LE(off); off += 8;
    const unrealizedPnl = data.readBigInt64LE(off); off += 8;
    const settled = data.readUInt8(off) !== 0;
    return {
      owner, underlyingMint, epoch, isLong, notional, entryVariance,
      collateralDeposited, unrealizedPnl, settled,
    };
  }

  private parseFundingPool(data: Buffer, marketSymbol: string): FundingPool {
    let off = 8; // discriminator
    // Skip 32-byte symbol field
    off += 32;
    const currentEpoch = data.readBigUInt64LE(off); off += 8;
    const fixedRate = data.readBigInt64LE(off); off += 8;
    const floatingRateAccumulator = data.readBigInt64LE(off); off += 8;
    const totalReceiveFixed = data.readBigUInt64LE(off); off += 8;
    const totalPayFixed = data.readBigUInt64LE(off); off += 8;
    const lpDeposits = data.readBigUInt64LE(off); off += 8;
    const lastFundingUpdate = data.readBigUInt64LE(off); off += 8;
    const isActive = data.readUInt8(off) !== 0;
    return {
      marketSymbol, currentEpoch, fixedRate, floatingRateAccumulator,
      totalReceiveFixed, totalPayFixed, lpDeposits, lastFundingUpdate, isActive,
    };
  }
}
