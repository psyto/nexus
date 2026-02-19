import { Connection, PublicKey } from "@solana/web3.js";
import { getConnection } from "../../connection.js";
import {
  deriveProtocolConfig,
  deriveUserPosition,
  deriveYieldSource,
} from "./pda.js";
import type { ProtocolConfig, UserPosition, YieldSource } from "./types.js";

export * from "./types.js";
export * from "./pda.js";

export class ExodusClient {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection?: Connection, programId?: PublicKey) {
    this.connection = connection ?? getConnection();
    this.programId = programId ?? PublicKey.default;
  }

  /**
   * Parse ProtocolConfig from account data.
   * Anchor layout: 8 byte discriminator + fields
   */
  private parseProtocolConfig(data: Buffer): ProtocolConfig {
    let off = 8; // skip discriminator
    const authority = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const jpyMint = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const usdcMint = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const jpyVault = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const usdcVault = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const oracle = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const kycRegistry = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const sovereignProgram = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const conversionFeeBps = data.readUInt16LE(off); off += 2;
    const managementFeeBps = data.readUInt16LE(off); off += 2;
    const performanceFeeBps = data.readUInt16LE(off); off += 2;
    const totalDepositsUsdc = data.readBigUInt64LE(off); off += 8;
    const totalYieldEarned = data.readBigUInt64LE(off); off += 8;
    const pendingJpyConversion = data.readBigUInt64LE(off); off += 8;
    const depositNonce = data.readBigUInt64LE(off); off += 8;
    const isActive = data.readUInt8(off) !== 0; off += 1;
    const createdAt = data.readBigInt64LE(off); off += 8;
    const updatedAt = data.readBigInt64LE(off); off += 8;
    const bump = data.readUInt8(off); off += 1;

    return {
      authority, jpyMint, usdcMint, jpyVault, usdcVault, oracle,
      kycRegistry, sovereignProgram, conversionFeeBps, managementFeeBps,
      performanceFeeBps, totalDepositsUsdc, totalYieldEarned,
      pendingJpyConversion, depositNonce, isActive, createdAt, updatedAt, bump,
    };
  }

  /**
   * Parse UserPosition from account data.
   */
  private parseUserPosition(data: Buffer): UserPosition {
    let off = 8; // skip discriminator
    const owner = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const protocolConfig = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const totalDepositedJpy = data.readBigUInt64LE(off); off += 8;
    const totalDepositedUsdc = data.readBigUInt64LE(off); off += 8;
    const currentShares = data.readBigUInt64LE(off); off += 8;
    const unrealizedYieldUsdc = data.readBigUInt64LE(off); off += 8;
    const realizedYieldUsdc = data.readBigUInt64LE(off); off += 8;
    const avgConversionRate = data.readBigUInt64LE(off); off += 8;
    const sovereignTier = data.readUInt8(off); off += 1;
    const monthlyDepositedJpy = data.readBigUInt64LE(off); off += 8;
    const monthlyDepositedUsdc = data.readBigUInt64LE(off); off += 8;
    const monthStart = data.readBigInt64LE(off); off += 8;
    const depositCount = data.readUInt32LE(off); off += 4;
    const withdrawalCount = data.readUInt32LE(off); off += 4;
    const lastDepositAt = data.readBigInt64LE(off); off += 8;
    const lastWithdrawalAt = data.readBigInt64LE(off); off += 8;
    const depositNonce = data.readBigUInt64LE(off); off += 8;
    const createdAt = data.readBigInt64LE(off); off += 8;
    const bump = data.readUInt8(off);

    return {
      owner, protocolConfig, totalDepositedJpy, totalDepositedUsdc,
      currentShares, unrealizedYieldUsdc, realizedYieldUsdc, avgConversionRate,
      sovereignTier, monthlyDepositedJpy, monthlyDepositedUsdc, monthStart,
      depositCount, withdrawalCount, lastDepositAt, lastWithdrawalAt,
      depositNonce, createdAt, bump,
    };
  }

  /**
   * Parse YieldSource from account data.
   */
  private parseYieldSource(data: Buffer): YieldSource {
    let off = 8; // skip discriminator
    const protocolConfig = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const nameBytes = data.subarray(off, off + 32); off += 32;
    const name = Buffer.from(nameBytes).toString("utf8").replace(/\0+$/, "");
    const sourceType = data.readUInt8(off); off += 1;
    const tokenMint = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const depositVault = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const yieldTokenVault = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const currentApyBps = data.readUInt16LE(off); off += 2;
    const totalDeposited = data.readBigUInt64LE(off); off += 8;
    const totalShares = data.readBigUInt64LE(off); off += 8;
    const allocationWeightBps = data.readUInt16LE(off); off += 2;
    const minDeposit = data.readBigUInt64LE(off); off += 8;
    const maxAllocation = data.readBigUInt64LE(off); off += 8;
    const isActive = data.readUInt8(off) !== 0; off += 1;
    const lastNavUpdate = data.readBigInt64LE(off); off += 8;
    const navPerShare = data.readBigUInt64LE(off); off += 8;
    const bump = data.readUInt8(off);

    return {
      protocolConfig, name, sourceType, tokenMint, depositVault,
      yieldTokenVault, currentApyBps, totalDeposited, totalShares,
      allocationWeightBps, minDeposit, maxAllocation, isActive,
      lastNavUpdate, navPerShare, bump,
    };
  }

  /**
   * Get protocol config.
   */
  async getProtocolConfig(programId?: string): Promise<ProtocolConfig> {
    const pid = programId ? new PublicKey(programId) : this.programId;
    const [configPda] = deriveProtocolConfig(pid);
    const info = await this.connection.getAccountInfo(configPda);
    if (!info) throw new Error(`Protocol config not found (PDA: ${configPda.toBase58()})`);
    return this.parseProtocolConfig(info.data as Buffer);
  }

  /**
   * Get user position.
   */
  async getUserPosition(owner: string, programId?: string): Promise<UserPosition> {
    const pid = programId ? new PublicKey(programId) : this.programId;
    const [configPda] = deriveProtocolConfig(pid);
    const ownerPubkey = new PublicKey(owner);
    const [positionPda] = deriveUserPosition(pid, configPda, ownerPubkey);
    const info = await this.connection.getAccountInfo(positionPda);
    if (!info) throw new Error(`User position not found for ${owner}`);
    return this.parseUserPosition(info.data as Buffer);
  }

  /**
   * Get yield sources for a token mint.
   */
  async getYieldSources(tokenMint: string, programId?: string): Promise<YieldSource> {
    const pid = programId ? new PublicKey(programId) : this.programId;
    const [configPda] = deriveProtocolConfig(pid);
    const mintPubkey = new PublicKey(tokenMint);
    const [ysPda] = deriveYieldSource(pid, configPda, mintPubkey);
    const info = await this.connection.getAccountInfo(ysPda);
    if (!info) throw new Error(`Yield source not found for mint ${tokenMint}`);
    return this.parseYieldSource(info.data as Buffer);
  }

  /**
   * Get portfolio value (USDC + JPY equivalent).
   */
  async getPortfolioValue(owner: string, programId?: string) {
    const position = await this.getUserPosition(owner, programId);
    return {
      owner: position.owner,
      totalDepositedJpy: position.totalDepositedJpy,
      totalDepositedUsdc: position.totalDepositedUsdc,
      currentShares: position.currentShares,
      unrealizedYieldUsdc: position.unrealizedYieldUsdc,
      realizedYieldUsdc: position.realizedYieldUsdc,
      avgConversionRate: position.avgConversionRate,
      sovereignTier: position.sovereignTier,
    };
  }
}
