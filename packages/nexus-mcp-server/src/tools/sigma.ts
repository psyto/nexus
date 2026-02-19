import { SigmaClient } from "@nexus/core";
import { jsonContent, errorContent } from "@nexus/core";
import type { ToolResponse } from "@nexus/core";

type Args = Record<string, unknown>;

export const SIGMA_TOOLS = [
  {
    name: "sigma_get_volatility_index",
    description: "Get the current volatility index level and SVI parameters.",
    inputSchema: {
      type: "object" as const,
      required: ["indexName"],
      properties: {
        indexName: { type: "string", description: "Volatility index name (e.g., 'SOL-30D')" },
      },
    },
  },
  {
    name: "sigma_get_variance_pool",
    description: "Get variance swap pool state: notionals, LP deposits, realized variance.",
    inputSchema: {
      type: "object" as const,
      required: ["underlyingMint"],
      properties: {
        underlyingMint: { type: "string", description: "Underlying token mint address" },
      },
    },
  },
  {
    name: "sigma_get_position",
    description: "Get user's variance swap position: notional, entry variance, PnL.",
    inputSchema: {
      type: "object" as const,
      required: ["underlyingMint", "user", "epoch"],
      properties: {
        underlyingMint: { type: "string", description: "Underlying token mint address" },
        user: { type: "string", description: "User wallet address" },
        epoch: { type: "string", description: "Epoch number" },
      },
    },
  },
  {
    name: "sigma_open_long",
    description: "Open a long variance position (profit when realized vol > strike). Write operation — deferred.",
    inputSchema: {
      type: "object" as const,
      required: ["underlyingMint", "collateralMint", "notional", "maxPremium"],
      properties: {
        underlyingMint: { type: "string", description: "Underlying token mint" },
        collateralMint: { type: "string", description: "Collateral token mint" },
        notional: { type: "string", description: "Notional amount" },
        maxPremium: { type: "string", description: "Max premium willing to pay" },
      },
    },
  },
  {
    name: "sigma_open_short",
    description: "Open a short variance position (profit when realized vol < strike). Write operation — deferred.",
    inputSchema: {
      type: "object" as const,
      required: ["underlyingMint", "collateralMint", "notional", "minPremium"],
      properties: {
        underlyingMint: { type: "string", description: "Underlying token mint" },
        collateralMint: { type: "string", description: "Collateral token mint" },
        notional: { type: "string", description: "Notional amount" },
        minPremium: { type: "string", description: "Min premium to receive" },
      },
    },
  },
  {
    name: "sigma_close_position",
    description: "Close a variance swap position early. Write operation — deferred.",
    inputSchema: {
      type: "object" as const,
      required: ["underlyingMint", "collateralMint", "epoch"],
      properties: {
        underlyingMint: { type: "string", description: "Underlying token mint" },
        collateralMint: { type: "string", description: "Collateral token mint" },
        epoch: { type: "string", description: "Epoch number" },
      },
    },
  },
  {
    name: "sigma_get_funding_rate",
    description: "Get the latest funding rate for a market symbol.",
    inputSchema: {
      type: "object" as const,
      required: ["marketSymbol"],
      properties: {
        marketSymbol: { type: "string", description: "Market symbol (e.g., 'SOL-PERP')" },
      },
    },
  },
  {
    name: "sigma_get_funding_pool",
    description: "Get funding swap pool state: fixed/floating rates, notionals, LP deposits.",
    inputSchema: {
      type: "object" as const,
      required: ["marketSymbol"],
      properties: {
        marketSymbol: { type: "string", description: "Market symbol (e.g., 'SOL-PERP')" },
      },
    },
  },
];

export async function handleSigmaTool(name: string, args: Args): Promise<ToolResponse> {
  const client = new SigmaClient();

  switch (name) {
    case "sigma_get_volatility_index": {
      const index = await client.getVolatilityIndex(args.indexName as string);
      return jsonContent(index);
    }

    case "sigma_get_variance_pool": {
      const pool = await client.getVariancePool(args.underlyingMint as string);
      return jsonContent(pool);
    }

    case "sigma_get_position": {
      const position = await client.getPosition(
        args.underlyingMint as string,
        args.user as string,
        args.epoch as string,
      );
      return jsonContent(position);
    }

    case "sigma_open_long":
      return errorContent("sigma_open_long: Write operation deferred — requires IDL + wallet integration.");

    case "sigma_open_short":
      return errorContent("sigma_open_short: Write operation deferred — requires IDL + wallet integration.");

    case "sigma_close_position":
      return errorContent("sigma_close_position: Write operation deferred — requires IDL + wallet integration.");

    case "sigma_get_funding_rate": {
      const rate = await client.getFundingRate(args.marketSymbol as string);
      return jsonContent(rate);
    }

    case "sigma_get_funding_pool": {
      const pool = await client.getFundingPool(args.marketSymbol as string);
      return jsonContent(pool);
    }

    default:
      return errorContent(`Unknown sigma tool: ${name}`);
  }
}
