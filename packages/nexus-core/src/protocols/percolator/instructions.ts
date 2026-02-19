import { encU8, encU16, encU64, encI128 } from "./encode.js";

export const IX_TAG = {
  InitMarket: 0,
  InitUser: 1,
  InitLP: 2,
  DepositCollateral: 3,
  WithdrawCollateral: 4,
  KeeperCrank: 5,
  TradeNoCpi: 6,
  LiquidateAtOracle: 7,
  CloseAccount: 8,
  TopUpInsurance: 9,
  TradeCpi: 10,
} as const;

export interface DepositCollateralArgs {
  userIdx: number;
  amount: bigint | string;
}

export function encodeDepositCollateral(args: DepositCollateralArgs): Buffer {
  return Buffer.concat([
    encU8(IX_TAG.DepositCollateral),
    encU16(args.userIdx),
    encU64(args.amount),
  ]);
}

export interface WithdrawCollateralArgs {
  userIdx: number;
  amount: bigint | string;
}

export function encodeWithdrawCollateral(args: WithdrawCollateralArgs): Buffer {
  return Buffer.concat([
    encU8(IX_TAG.WithdrawCollateral),
    encU16(args.userIdx),
    encU64(args.amount),
  ]);
}

export interface TradeNoCpiArgs {
  lpIdx: number;
  userIdx: number;
  size: bigint | string;
}

export function encodeTradeNoCpi(args: TradeNoCpiArgs): Buffer {
  return Buffer.concat([
    encU8(IX_TAG.TradeNoCpi),
    encU16(args.lpIdx),
    encU16(args.userIdx),
    encI128(args.size),
  ]);
}
