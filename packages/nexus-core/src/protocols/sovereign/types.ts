export interface SovereignIdentity {
  owner: string;
  createdAt: bigint;
  tradingScore: number;
  civicScore: number;
  developerScore: number;
  infraScore: number;
  creatorScore: number;
  compositeScore: number;
  tier: number;
  tierName: string;
  lastUpdated: bigint;
  bump: number;
}

export const TIER_NAMES: Record<number, string> = {
  1: "Bronze",
  2: "Silver",
  3: "Gold",
  4: "Platinum",
  5: "Diamond",
};

export const DIMENSION_NAMES = ["trading", "civic", "developer", "infra", "creator"] as const;
export type DimensionName = (typeof DIMENSION_NAMES)[number];

export type ConfidenceLevel = "high" | "medium" | "low" | "none";
