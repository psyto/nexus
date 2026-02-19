export interface SolverConfig {
  authority: string;
  solverPublicKey: string;
  feeRecipient: string;
  baseFee: bigint;
  feeRateBps: number;
  totalOrdersProcessed: bigint;
  totalVolumeUsdc: bigint;
  isActive: boolean;
  createdAt: bigint;
  bump: number;
}

export interface EncryptedOrder {
  orderId: string;
  owner: string;
  inputMint: string;
  outputMint: string;
  inputAmount: bigint;
  encryptedPayload: string; // base64 encoded
  status: OrderStatus;
  createdAt: bigint;
  expiresAt: bigint;
  bump: number;
}

export enum OrderStatus {
  Pending = 0,
  Filled = 1,
  Cancelled = 2,
  Expired = 3,
}
