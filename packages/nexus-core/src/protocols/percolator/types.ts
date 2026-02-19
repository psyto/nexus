import { PublicKey } from "@solana/web3.js";

export interface SlabHeader {
  magic: bigint;
  version: number;
  bump: number;
  flags: number;
  resolved: boolean;
  admin: PublicKey;
  nonce: bigint;
  lastThrUpdateSlot: bigint;
}

export interface MarketConfig {
  collateralMint: PublicKey;
  vaultPubkey: PublicKey;
  indexFeedId: PublicKey;
  maxStalenessSlots: bigint;
  confFilterBps: number;
  vaultAuthorityBump: number;
  invert: number;
  unitScale: number;
  fundingHorizonSlots: bigint;
  fundingKBps: bigint;
  fundingInvScaleNotionalE6: bigint;
  fundingMaxPremiumBps: bigint;
  fundingMaxBpsPerSlot: bigint;
  threshFloor: bigint;
  threshRiskBps: bigint;
  threshUpdateIntervalSlots: bigint;
  threshStepBps: bigint;
  threshAlphaBps: bigint;
  threshMin: bigint;
  threshMax: bigint;
  threshMinStep: bigint;
  oracleAuthority: PublicKey;
  authorityPriceE6: bigint;
  authorityTimestamp: bigint;
  oraclePriceCapE2bps: bigint;
  lastEffectivePriceE6: bigint;
}

export interface InsuranceFund {
  balance: bigint;
  feeRevenue: bigint;
}

export interface RiskParams {
  warmupPeriodSlots: bigint;
  maintenanceMarginBps: bigint;
  initialMarginBps: bigint;
  tradingFeeBps: bigint;
  maxAccounts: bigint;
  newAccountFee: bigint;
  riskReductionThreshold: bigint;
  maintenanceFeePerSlot: bigint;
  maxCrankStalenessSlots: bigint;
  liquidationFeeBps: bigint;
  liquidationFeeCap: bigint;
  liquidationBufferBps: bigint;
  minLiquidationAbs: bigint;
}

export interface EngineState {
  vault: bigint;
  insuranceFund: InsuranceFund;
  currentSlot: bigint;
  fundingIndexQpbE6: bigint;
  lastFundingSlot: bigint;
  fundingRateBpsPerSlotLast: bigint;
  lastCrankSlot: bigint;
  maxCrankStalenessSlots: bigint;
  totalOpenInterest: bigint;
  cTot: bigint;
  pnlPosTot: bigint;
  liqCursor: number;
  gcCursor: number;
  lastSweepStartSlot: bigint;
  lastSweepCompleteSlot: bigint;
  crankCursor: number;
  sweepStartIdx: number;
  lifetimeLiquidations: bigint;
  lifetimeForceCloses: bigint;
  netLpPos: bigint;
  lpSumAbs: bigint;
  lpMaxAbs: bigint;
  lpMaxAbsSweep: bigint;
  numUsedAccounts: number;
  nextAccountId: bigint;
}

export enum AccountKind {
  User = 0,
  LP = 1,
}

export interface Account {
  kind: AccountKind;
  accountId: bigint;
  capital: bigint;
  pnl: bigint;
  reservedPnl: bigint;
  warmupStartedAtSlot: bigint;
  warmupSlopePerStep: bigint;
  positionSize: bigint;
  entryPrice: bigint;
  fundingIndex: bigint;
  matcherProgram: PublicKey;
  matcherContext: PublicKey;
  owner: PublicKey;
  feeCredits: bigint;
  lastFeeSlot: bigint;
}

export interface AccountSpec {
  name: string;
  signer: boolean;
  writable: boolean;
}
