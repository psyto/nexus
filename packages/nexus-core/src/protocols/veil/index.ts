import { Connection, PublicKey } from "@solana/web3.js";
import { getConnection } from "../../connection.js";
import type { SolverConfig, EncryptedOrder } from "./types.js";
import { OrderStatus } from "./types.js";

export * from "./types.js";

export class VeilClient {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection?: Connection, programId?: PublicKey) {
    this.connection = connection ?? getConnection();
    this.programId = programId ?? PublicKey.default;
  }

  // ── PDA derivation ────────────────────────────────────────────────

  deriveSolverConfig(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("solver_config")],
      this.programId,
    );
  }

  deriveOrderPda(owner: PublicKey, orderId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("order"), owner.toBuffer(), Buffer.from(orderId)],
      this.programId,
    );
  }

  // ── Read operations ───────────────────────────────────────────────

  async getSolverConfig(): Promise<SolverConfig> {
    const [pda] = this.deriveSolverConfig();
    const info = await this.connection.getAccountInfo(pda);
    if (!info) throw new Error("Solver config not found");
    return this.parseSolverConfig(info.data as Buffer);
  }

  async getOrder(owner: string, orderId: string): Promise<EncryptedOrder> {
    const ownerPubkey = new PublicKey(owner);
    const [pda] = this.deriveOrderPda(ownerPubkey, orderId);
    const info = await this.connection.getAccountInfo(pda);
    if (!info) throw new Error(`Order not found: ${orderId}`);
    return this.parseOrder(info.data as Buffer);
  }

  async getOrdersByOwner(owner: string): Promise<EncryptedOrder[]> {
    const ownerPubkey = new PublicKey(owner);
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      filters: [
        { dataSize: 280 }, // approximate order account size
        { memcmp: { offset: 40, bytes: ownerPubkey.toBase58() } }, // owner field after disc+orderId
      ],
    });

    return accounts.map((acc) => this.parseOrder(acc.account.data as Buffer));
  }

  // ── Parsers ───────────────────────────────────────────────────────

  private parseSolverConfig(data: Buffer): SolverConfig {
    let off = 8; // discriminator
    const authority = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const solverPublicKey = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const feeRecipient = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const baseFee = data.readBigUInt64LE(off); off += 8;
    const feeRateBps = data.readUInt16LE(off); off += 2;
    const totalOrdersProcessed = data.readBigUInt64LE(off); off += 8;
    const totalVolumeUsdc = data.readBigUInt64LE(off); off += 8;
    const isActive = data.readUInt8(off) !== 0; off += 1;
    const createdAt = data.readBigInt64LE(off); off += 8;
    const bump = data.readUInt8(off);
    return {
      authority, solverPublicKey, feeRecipient, baseFee, feeRateBps,
      totalOrdersProcessed, totalVolumeUsdc, isActive, createdAt, bump,
    };
  }

  private parseOrder(data: Buffer): EncryptedOrder {
    let off = 8; // discriminator
    // orderId: 32 bytes (fixed string padded)
    const orderIdBytes = data.subarray(off, off + 32); off += 32;
    const orderId = Buffer.from(orderIdBytes).toString("utf8").replace(/\0+$/, "");
    const owner = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const inputMint = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const outputMint = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const inputAmount = data.readBigUInt64LE(off); off += 8;
    // encryptedPayload: variable length (4-byte len prefix + bytes)
    const payloadLen = data.readUInt32LE(off); off += 4;
    const encryptedPayload = Buffer.from(data.subarray(off, off + payloadLen)).toString("base64"); off += payloadLen;
    const status = data.readUInt8(off) as OrderStatus; off += 1;
    const createdAt = data.readBigInt64LE(off); off += 8;
    const expiresAt = data.readBigInt64LE(off); off += 8;
    const bump = data.readUInt8(off);
    return {
      orderId, owner, inputMint, outputMint, inputAmount,
      encryptedPayload, status, createdAt, expiresAt, bump,
    };
  }
}
