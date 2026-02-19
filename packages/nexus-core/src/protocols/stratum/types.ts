export enum OrderSide {
  Bid = 0,
  Ask = 1,
}

export interface OrderLeaf {
  maker: string;
  orderId: string;
  side: OrderSide;
  price: bigint;
  amount: bigint;
  epochIndex: number;
  orderIndex: number;
  timestamp: bigint;
}

export interface EpochState {
  epochIndex: number;
  merkleRoot: string; // hex
  orderCount: number;
  finalized: boolean;
  finalizedAt: bigint;
  createdAt: bigint;
}

export interface OrderBookState {
  authority: string;
  baseMint: string;
  quoteMint: string;
  currentEpoch: number;
  totalOrders: bigint;
  totalVolume: bigint;
  bestBid: bigint;
  bestAsk: bigint;
  isActive: boolean;
  bump: number;
}
