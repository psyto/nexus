import { ExodusClient } from "@nexus/core";
import { jsonContent, errorContent } from "@nexus/core";
import type { ToolResponse } from "@nexus/core";

type Args = Record<string, unknown>;

export const EXODUS_TOOLS = [
  {
    name: "exodus_get_protocol_config",
    description: "Get Exodus protocol config: mints (JPY/USDC), vaults, fees, totals.",
    inputSchema: {
      type: "object" as const,
      properties: {
        programId: { type: "string", description: "Override program ID (optional)" },
      },
    },
  },
  {
    name: "exodus_get_user_position",
    description: "Get a user's Exodus position: deposits, shares, yield, Sovereign tier.",
    inputSchema: {
      type: "object" as const,
      required: ["owner"],
      properties: {
        owner: { type: "string", description: "User wallet address (base58)" },
      },
    },
  },
  {
    name: "exodus_get_yield_sources",
    description: "Get available yield sources: APY, NAV per share, allocation weights.",
    inputSchema: {
      type: "object" as const,
      required: ["tokenMint"],
      properties: {
        tokenMint: { type: "string", description: "Token mint address for the yield source" },
      },
    },
  },
  {
    name: "exodus_deposit_jpy",
    description: "Deposit JPY for USDC yield conversion. Write operation — deferred.",
    inputSchema: {
      type: "object" as const,
      required: ["jpyAmount", "minUsdcOut"],
      properties: {
        jpyAmount: { type: "string", description: "JPY amount in minor units" },
        minUsdcOut: { type: "string", description: "Minimum USDC output" },
      },
    },
  },
  {
    name: "exodus_get_portfolio_value",
    description: "Get total portfolio value (USDC + JPY equivalent) for a user.",
    inputSchema: {
      type: "object" as const,
      required: ["owner"],
      properties: {
        owner: { type: "string", description: "User wallet address (base58)" },
      },
    },
  },
];

export async function handleExodusTool(name: string, args: Args): Promise<ToolResponse> {
  const client = new ExodusClient();

  switch (name) {
    case "exodus_get_protocol_config": {
      const config = await client.getProtocolConfig(args.programId as string | undefined);
      return jsonContent(config);
    }

    case "exodus_get_user_position": {
      const position = await client.getUserPosition(args.owner as string);
      return jsonContent(position);
    }

    case "exodus_get_yield_sources": {
      const source = await client.getYieldSources(args.tokenMint as string);
      return jsonContent(source);
    }

    case "exodus_deposit_jpy":
      return errorContent("exodus_deposit_jpy: Write operation deferred — requires wallet integration.");

    case "exodus_get_portfolio_value": {
      const portfolio = await client.getPortfolioValue(args.owner as string);
      return jsonContent(portfolio);
    }

    default:
      return errorContent(`Unknown exodus tool: ${name}`);
  }
}
