import { PercolatorClient } from "@nexus/core";
import { jsonContent, errorContent } from "@nexus/core";
import type { ToolResponse } from "@nexus/core";

type Args = Record<string, unknown>;

export const PERCOLATOR_TOOLS = [
  {
    name: "percolator_list_markets",
    description:
      "List all Percolator perpetual markets with OI, insurance fund, vault balance, and risk parameters.",
    inputSchema: {
      type: "object" as const,
      properties: {
        programId: { type: "string", description: "Override program ID (optional)" },
      },
    },
  },
  {
    name: "percolator_get_market",
    description:
      "Get full market state for a Percolator slab: header, config, engine state, and risk parameters.",
    inputSchema: {
      type: "object" as const,
      required: ["slab"],
      properties: {
        slab: { type: "string", description: "Slab account address (base58)" },
      },
    },
  },
  {
    name: "percolator_get_user_position",
    description:
      "Get a user's position in a Percolator market: capital, PnL, position size, entry price, funding index.",
    inputSchema: {
      type: "object" as const,
      required: ["slab", "userIndex"],
      properties: {
        slab: { type: "string", description: "Slab account address (base58)" },
        userIndex: { type: "number", description: "User account index in the slab" },
      },
    },
  },
  {
    name: "percolator_deposit_collateral",
    description:
      "Deposit collateral to a user account in a Percolator market. Requires wallet.",
    inputSchema: {
      type: "object" as const,
      required: ["slab", "userIndex", "amount"],
      properties: {
        slab: { type: "string", description: "Slab account address (base58)" },
        userIndex: { type: "number", description: "User account index" },
        amount: { type: "string", description: "Amount in lamports/minor units" },
        walletPrivateKey: { type: "string", description: "Wallet private key (optional, uses env if not provided)" },
      },
    },
  },
  {
    name: "percolator_withdraw_collateral",
    description:
      "Withdraw collateral from a user account in a Percolator market. Requires wallet.",
    inputSchema: {
      type: "object" as const,
      required: ["slab", "userIndex", "amount"],
      properties: {
        slab: { type: "string", description: "Slab account address (base58)" },
        userIndex: { type: "number", description: "User account index" },
        amount: { type: "string", description: "Amount in lamports/minor units" },
        walletPrivateKey: { type: "string", description: "Wallet private key (optional)" },
      },
    },
  },
  {
    name: "percolator_trade",
    description:
      "Open or adjust a position in a Percolator market. Positive size = long, negative = short. Requires wallet.",
    inputSchema: {
      type: "object" as const,
      required: ["slab", "lpIndex", "userIndex", "size"],
      properties: {
        slab: { type: "string", description: "Slab account address (base58)" },
        lpIndex: { type: "number", description: "LP account index" },
        userIndex: { type: "number", description: "User account index" },
        size: { type: "string", description: "Position size change (positive=long, negative=short)" },
        walletPrivateKey: { type: "string", description: "Wallet private key (optional)" },
      },
    },
  },
];

export async function handlePercolatorTool(name: string, args: Args): Promise<ToolResponse> {
  const client = new PercolatorClient();

  switch (name) {
    case "percolator_list_markets": {
      const markets = await client.listMarkets(args.programId as string | undefined);
      return jsonContent({ markets, count: markets.length });
    }

    case "percolator_get_market": {
      const result = await client.getMarket(args.slab as string);
      return jsonContent(result);
    }

    case "percolator_get_user_position": {
      const position = await client.getUserPosition(
        args.slab as string,
        args.userIndex as number,
      );
      return jsonContent(position);
    }

    case "percolator_deposit_collateral": {
      const result = await client.depositCollateral(
        args.slab as string,
        args.userIndex as number,
        args.amount as string,
        args.walletPrivateKey as string | undefined,
      );
      return jsonContent(result);
    }

    case "percolator_withdraw_collateral": {
      const result = await client.withdrawCollateral(
        args.slab as string,
        args.userIndex as number,
        args.amount as string,
        args.walletPrivateKey as string | undefined,
      );
      return jsonContent(result);
    }

    case "percolator_trade": {
      const result = await client.trade(
        args.slab as string,
        args.lpIndex as number,
        args.userIndex as number,
        args.size as string,
        args.walletPrivateKey as string | undefined,
      );
      return jsonContent(result);
    }

    default:
      return errorContent(`Unknown percolator tool: ${name}`);
  }
}
