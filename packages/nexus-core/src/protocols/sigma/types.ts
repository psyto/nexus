export interface VolatilityIndex {
  name: string;
  currentLevel: bigint;
  lastUpdateSlot: bigint;
  sviParams: {
    a: bigint;
    b: bigint;
    rho: bigint;
    m: bigint;
    sigma: bigint;
  };
}

export interface VariancePool {
  underlyingMint: string;
  collateralMint: string;
  currentEpoch: bigint;
  strikeVariance: bigint;
  totalLongNotional: bigint;
  totalShortNotional: bigint;
  lpDeposits: bigint;
  realizedVariance: bigint;
  lastUpdateSlot: bigint;
  isActive: boolean;
}

export interface VariancePosition {
  owner: string;
  underlyingMint: string;
  epoch: bigint;
  isLong: boolean;
  notional: bigint;
  entryVariance: bigint;
  collateralDeposited: bigint;
  unrealizedPnl: bigint;
  settled: boolean;
}

export interface FundingPool {
  marketSymbol: string;
  currentEpoch: bigint;
  fixedRate: bigint;
  floatingRateAccumulator: bigint;
  totalReceiveFixed: bigint;
  totalPayFixed: bigint;
  lpDeposits: bigint;
  lastFundingUpdate: bigint;
  isActive: boolean;
}

export interface FundingRate {
  marketSymbol: string;
  currentRate: bigint;
  annualizedRate: bigint;
  lastUpdateSlot: bigint;
}
