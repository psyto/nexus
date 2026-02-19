import { Connection, PublicKey } from "@solana/web3.js";
import { getConnection } from "../../connection.js";
import type {
  SovereignIdentity,
  DimensionName,
  ConfidenceLevel,
} from "./types.js";
import { TIER_NAMES, DIMENSION_NAMES } from "./types.js";

export * from "./types.js";

const DEFAULT_PROGRAM_ID = new PublicKey("2UAZc1jj4QTSkgrC8U9d4a7EM9AQunxMvW5g7rX7Af9T");

export class SovereignClient {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection?: Connection, programId?: PublicKey) {
    this.connection = connection ?? getConnection();
    this.programId = programId ?? DEFAULT_PROGRAM_ID;
  }

  /**
   * Derive identity PDA for a wallet.
   */
  deriveIdentityPda(wallet: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("identity"), wallet.toBuffer()],
      this.programId,
    );
  }

  /**
   * Parse raw identity account data.
   * Layout (236 bytes total):
   *   8  bytes  discriminator
   *  32  bytes  owner (pubkey)
   *   8  bytes  created_at (i64 LE)
   * 160  bytes  5 x 32-byte authorities
   *  10  bytes  5 x u16 LE scores (trading, civic, developer, infra, creator)
   *   2  bytes  composite_score (u16 LE)
   *   1  byte   tier
   *   8  bytes  last_updated (i64 LE)
   *   1  byte   bump
   */
  parseSovereignIdentity(data: Buffer): SovereignIdentity {
    let offset = 8; // skip discriminator

    const owner = new PublicKey(data.subarray(offset, offset + 32)).toBase58();
    offset += 32;

    const createdAt = data.readBigInt64LE(offset);
    offset += 8;

    // skip 5 x 32-byte authorities
    offset += 5 * 32;

    const tradingScore = data.readUInt16LE(offset); offset += 2;
    const civicScore = data.readUInt16LE(offset); offset += 2;
    const developerScore = data.readUInt16LE(offset); offset += 2;
    const infraScore = data.readUInt16LE(offset); offset += 2;
    const creatorScore = data.readUInt16LE(offset); offset += 2;

    const compositeScore = data.readUInt16LE(offset); offset += 2;

    const tier = data.readUInt8(offset); offset += 1;

    const lastUpdated = data.readBigInt64LE(offset); offset += 8;

    const bump = data.readUInt8(offset);

    return {
      owner,
      createdAt,
      tradingScore,
      civicScore,
      developerScore,
      infraScore,
      creatorScore,
      compositeScore,
      tier,
      tierName: TIER_NAMES[tier] || "Unknown",
      lastUpdated,
      bump,
    };
  }

  /**
   * Fetch and parse identity for a wallet.
   */
  async getIdentity(wallet: string): Promise<SovereignIdentity> {
    const walletPubkey = new PublicKey(wallet);
    const [pda] = this.deriveIdentityPda(walletPubkey);
    const accountInfo = await this.connection.getAccountInfo(pda);
    if (!accountInfo || !accountInfo.data) {
      throw new Error(`No SOVEREIGN identity found for wallet ${wallet} (PDA: ${pda.toBase58()})`);
    }
    return this.parseSovereignIdentity(accountInfo.data as Buffer);
  }

  /**
   * Get a specific dimension score.
   */
  getDimensionScore(identity: SovereignIdentity, dimension: DimensionName): number {
    switch (dimension) {
      case "trading": return identity.tradingScore;
      case "civic": return identity.civicScore;
      case "developer": return identity.developerScore;
      case "infra": return identity.infraScore;
      case "creator": return identity.creatorScore;
    }
  }

  /**
   * Map tier to confidence level.
   */
  assessConfidence(tier: number): ConfidenceLevel {
    if (tier >= 4) return "high";
    if (tier >= 3) return "medium";
    if (tier >= 1) return "low";
    return "none";
  }

  /**
   * Validate a dimension name.
   */
  static validateDimension(dimension: string): dimension is DimensionName {
    return (DIMENSION_NAMES as readonly string[]).includes(dimension);
  }
}
