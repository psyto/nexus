import { Connection, PublicKey } from "@solana/web3.js";
import { getConnection } from "../../connection.js";
import type { OrderBookState, EpochState, OrderLeaf } from "./types.js";
import { createHash } from "crypto";

export * from "./types.js";

export class StratumClient {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection?: Connection, programId?: PublicKey) {
    this.connection = connection ?? getConnection();
    this.programId = programId ?? PublicKey.default;
  }

  // ── PDA derivation ────────────────────────────────────────────────

  deriveOrderBookPda(
    authority: string,
    baseMint: string,
    quoteMint: string,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("order_book"),
        new PublicKey(authority).toBuffer(),
        new PublicKey(baseMint).toBuffer(),
        new PublicKey(quoteMint).toBuffer(),
      ],
      this.programId,
    );
  }

  deriveEpochPda(orderBookPda: PublicKey, epochIndex: number): [PublicKey, number] {
    const epochBuf = Buffer.alloc(4);
    epochBuf.writeUInt32LE(epochIndex, 0);
    return PublicKey.findProgramAddressSync(
      [Buffer.from("epoch"), orderBookPda.toBuffer(), epochBuf],
      this.programId,
    );
  }

  // ── Read operations ───────────────────────────────────────────────

  async getOrderBook(
    authority: string,
    baseMint: string,
    quoteMint: string,
  ): Promise<OrderBookState> {
    const [pda] = this.deriveOrderBookPda(authority, baseMint, quoteMint);
    const info = await this.connection.getAccountInfo(pda);
    if (!info) throw new Error("Order book not found");
    return this.parseOrderBook(info.data as Buffer);
  }

  async getEpoch(orderBookPda: string, epochIndex: number): Promise<EpochState> {
    const obPda = new PublicKey(orderBookPda);
    const [pda] = this.deriveEpochPda(obPda, epochIndex);
    const info = await this.connection.getAccountInfo(pda);
    if (!info) throw new Error(`Epoch ${epochIndex} not found`);
    return this.parseEpoch(info.data as Buffer, epochIndex);
  }

  /**
   * Build merkle proof for a target order.
   * Pure computation — no on-chain reads.
   */
  getMerkleProof(orders: OrderLeaf[], targetIndex: number): {
    root: string;
    proof: string[];
    leaf: string;
  } {
    if (targetIndex < 0 || targetIndex >= orders.length) {
      throw new Error(`Target index out of range: ${targetIndex}`);
    }

    const leaves = orders.map((o) => this.hashOrder(o));
    const leaf = leaves[targetIndex];
    const proof: string[] = [];

    let level = [...leaves];
    let idx = targetIndex;

    while (level.length > 1) {
      // Pad to even length
      if (level.length % 2 !== 0) {
        level.push(level[level.length - 1]);
      }

      const nextLevel: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        // Collect proof node
        if (i === idx - (idx % 2)) {
          proof.push(level[i + (idx % 2 === 0 ? 1 : 0)]);
        }
        nextLevel.push(this.hashPair(level[i], level[i + 1]));
      }
      level = nextLevel;
      idx = Math.floor(idx / 2);
    }

    return { root: level[0], proof, leaf };
  }

  // ── Parsers ───────────────────────────────────────────────────────

  private parseOrderBook(data: Buffer): OrderBookState {
    let off = 8; // discriminator
    const authority = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const baseMint = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const quoteMint = new PublicKey(data.subarray(off, off + 32)).toBase58(); off += 32;
    const currentEpoch = data.readUInt32LE(off); off += 4;
    const totalOrders = data.readBigUInt64LE(off); off += 8;
    const totalVolume = data.readBigUInt64LE(off); off += 8;
    const bestBid = data.readBigUInt64LE(off); off += 8;
    const bestAsk = data.readBigUInt64LE(off); off += 8;
    const isActive = data.readUInt8(off) !== 0; off += 1;
    const bump = data.readUInt8(off);
    return {
      authority, baseMint, quoteMint, currentEpoch, totalOrders,
      totalVolume, bestBid, bestAsk, isActive, bump,
    };
  }

  private parseEpoch(data: Buffer, epochIndex: number): EpochState {
    let off = 8; // discriminator
    const merkleRootBytes = data.subarray(off, off + 32); off += 32;
    const merkleRoot = Buffer.from(merkleRootBytes).toString("hex");
    const orderCount = data.readUInt32LE(off); off += 4;
    const finalized = data.readUInt8(off) !== 0; off += 1;
    const finalizedAt = data.readBigInt64LE(off); off += 8;
    const createdAt = data.readBigInt64LE(off);
    return { epochIndex, merkleRoot, orderCount, finalized, finalizedAt, createdAt };
  }

  // ── Merkle helpers ────────────────────────────────────────────────

  private hashOrder(order: OrderLeaf): string {
    const buf = Buffer.alloc(8 + 8 + 1 + 8 + 8); // price + amount + side + epochIdx + orderIdx
    let off = 0;
    buf.writeBigUInt64LE(order.price, off); off += 8;
    buf.writeBigUInt64LE(order.amount, off); off += 8;
    buf.writeUInt8(order.side, off); off += 1;
    buf.writeUInt32LE(order.epochIndex, off); off += 4;
    buf.writeUInt32LE(order.orderIndex, off);
    return createHash("sha256").update(buf).digest("hex");
  }

  private hashPair(left: string, right: string): string {
    const combined = Buffer.concat([
      Buffer.from(left, "hex"),
      Buffer.from(right, "hex"),
    ]);
    return createHash("sha256").update(combined).digest("hex");
  }
}
