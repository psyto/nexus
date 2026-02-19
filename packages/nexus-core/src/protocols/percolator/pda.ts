import { PublicKey } from "@solana/web3.js";

export function deriveVaultAuthority(
  programId: PublicKey,
  slab: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), slab.toBuffer()],
    programId
  );
}

export function deriveLpPda(
  programId: PublicKey,
  slab: PublicKey,
  lpIdx: number
): [PublicKey, number] {
  const idxBuf = Buffer.alloc(2);
  idxBuf.writeUInt16LE(lpIdx, 0);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("lp"), slab.toBuffer(), idxBuf],
    programId
  );
}
