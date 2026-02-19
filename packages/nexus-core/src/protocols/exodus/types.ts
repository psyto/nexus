export interface ProtocolConfig {
  authority: string;
  jpyMint: string;
  usdcMint: string;
  jpyVault: string;
  usdcVault: string;
  oracle: string;
  kycRegistry: string;
  sovereignProgram: string;
  conversionFeeBps: number;
  managementFeeBps: number;
  performanceFeeBps: number;
  totalDepositsUsdc: bigint;
  totalYieldEarned: bigint;
  pendingJpyConversion: bigint;
  depositNonce: bigint;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  bump: number;
}

export interface UserPosition {
  owner: string;
  protocolConfig: string;
  totalDepositedJpy: bigint;
  totalDepositedUsdc: bigint;
  currentShares: bigint;
  unrealizedYieldUsdc: bigint;
  realizedYieldUsdc: bigint;
  avgConversionRate: bigint;
  sovereignTier: number;
  monthlyDepositedJpy: bigint;
  monthlyDepositedUsdc: bigint;
  monthStart: bigint;
  depositCount: number;
  withdrawalCount: number;
  lastDepositAt: bigint;
  lastWithdrawalAt: bigint;
  depositNonce: bigint;
  createdAt: bigint;
  bump: number;
}

export interface YieldSource {
  protocolConfig: string;
  name: string;
  sourceType: number;
  tokenMint: string;
  depositVault: string;
  yieldTokenVault: string;
  currentApyBps: number;
  totalDeposited: bigint;
  totalShares: bigint;
  allocationWeightBps: number;
  minDeposit: bigint;
  maxAllocation: bigint;
  isActive: boolean;
  lastNavUpdate: bigint;
  navPerShare: bigint;
  bump: number;
}
