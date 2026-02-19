import { PublicKey } from "@solana/web3.js";

export function deriveProtocolConfig(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("exodus_config")],
    programId,
  );
}

export function deriveUserPosition(
  programId: PublicKey,
  config: PublicKey,
  owner: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_position"), config.toBuffer(), owner.toBuffer()],
    programId,
  );
}

export function deriveYieldSource(
  programId: PublicKey,
  config: PublicKey,
  tokenMint: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("yield_source"), config.toBuffer(), tokenMint.toBuffer()],
    programId,
  );
}
