import { PublicKey } from "@solana/web3.js";

export interface NexusConfig {
  rpcUrl: string;
  walletPrivateKey?: string;
  percolatorProgramId: PublicKey;
  sovereignProgramId: PublicKey;
  sigmaProgramId?: PublicKey;
  exodusProgramId?: PublicKey;
  veilCsrProgramId?: PublicKey;
  stratumProgramId?: PublicKey;
}

export function loadConfigFromEnv(): NexusConfig {
  const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const walletPrivateKey = process.env.SOLANA_PRIVATE_KEY || undefined;

  const percolatorProgramId = new PublicKey(
    process.env.PERCOLATOR_PROGRAM_ID || "F1uxb9kqJg7jv1FoYCjqBm12RYDsTEPnHUbpTopsNVAg"
  );
  const sovereignProgramId = new PublicKey(
    process.env.SOVEREIGN_PROGRAM_ID || "2UAZc1jj4QTSkgrC8U9d4a7EM9AQunxMvW5g7rX7Af9T"
  );
  const sigmaProgramId = process.env.SIGMA_PROGRAM_ID
    ? new PublicKey(process.env.SIGMA_PROGRAM_ID)
    : undefined;
  const exodusProgramId = process.env.EXODUS_PROGRAM_ID
    ? new PublicKey(process.env.EXODUS_PROGRAM_ID)
    : undefined;
  const veilCsrProgramId = process.env.VEIL_CSR_PROGRAM_ID
    ? new PublicKey(process.env.VEIL_CSR_PROGRAM_ID)
    : undefined;
  const stratumProgramId = process.env.STRATUM_PROGRAM_ID
    ? new PublicKey(process.env.STRATUM_PROGRAM_ID)
    : undefined;

  return {
    rpcUrl,
    walletPrivateKey,
    percolatorProgramId,
    sovereignProgramId,
    sigmaProgramId,
    exodusProgramId,
    veilCsrProgramId,
    stratumProgramId,
  };
}
