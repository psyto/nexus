import { PublicKey } from "@solana/web3.js";

export function deriveVariancePool(
  programId: PublicKey,
  underlyingMint: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("variance_pool"), underlyingMint.toBuffer()],
    programId,
  );
}

export function deriveVariancePosition(
  programId: PublicKey,
  pool: PublicKey,
  user: PublicKey,
  epoch: bigint,
): [PublicKey, number] {
  const epochBuf = Buffer.alloc(8);
  epochBuf.writeBigUInt64LE(epoch);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("variance_position"), pool.toBuffer(), user.toBuffer(), epochBuf],
    programId,
  );
}

export function deriveFundingPool(
  programId: PublicKey,
  marketSymbol: string,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("funding_pool"), Buffer.from(marketSymbol)],
    programId,
  );
}

export function deriveVolatilityIndex(
  programId: PublicKey,
  indexName: string,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vol_index"), Buffer.from(indexName)],
    programId,
  );
}
