import { SovereignClient } from "@nexus/core";
import { jsonContent, errorContent } from "@nexus/core";
import type { ToolResponse } from "@nexus/core";

type Args = Record<string, unknown>;

export const SOVEREIGN_TOOLS = [
  {
    name: "sovereign_get_identity",
    description:
      "Get a wallet's SOVEREIGN identity: all dimension scores (trading, civic, developer, infra, creator), composite score, and tier (Bronze-Diamond).",
    inputSchema: {
      type: "object" as const,
      required: ["wallet"],
      properties: {
        wallet: { type: "string", description: "Solana wallet address (base58)" },
      },
    },
  },
  {
    name: "sovereign_get_dimension_score",
    description:
      "Get a specific SOVEREIGN dimension score for a wallet. Dimensions: trading, civic, developer, infra, creator.",
    inputSchema: {
      type: "object" as const,
      required: ["wallet", "dimension"],
      properties: {
        wallet: { type: "string", description: "Solana wallet address (base58)" },
        dimension: {
          type: "string",
          enum: ["trading", "civic", "developer", "infra", "creator"],
          description: "SOVEREIGN dimension to query",
        },
      },
    },
  },
  {
    name: "sovereign_assess_confidence",
    description:
      "Assess the trust confidence level for a wallet based on its SOVEREIGN tier. Returns high/medium/low/none.",
    inputSchema: {
      type: "object" as const,
      required: ["wallet"],
      properties: {
        wallet: { type: "string", description: "Solana wallet address (base58)" },
      },
    },
  },
];

export async function handleSovereignTool(name: string, args: Args): Promise<ToolResponse> {
  const client = new SovereignClient();

  switch (name) {
    case "sovereign_get_identity": {
      const identity = await client.getIdentity(args.wallet as string);
      return jsonContent({
        owner: identity.owner,
        tradingScore: identity.tradingScore,
        civicScore: identity.civicScore,
        developerScore: identity.developerScore,
        infraScore: identity.infraScore,
        creatorScore: identity.creatorScore,
        compositeScore: identity.compositeScore,
        tier: identity.tier,
        tierName: identity.tierName,
      });
    }

    case "sovereign_get_dimension_score": {
      const dimension = args.dimension as string;
      if (!SovereignClient.validateDimension(dimension)) {
        return errorContent(`Unknown dimension: ${dimension}. Must be one of: trading, civic, developer, infra, creator`);
      }
      const identity = await client.getIdentity(args.wallet as string);
      const score = client.getDimensionScore(identity, dimension);
      return jsonContent({
        wallet: args.wallet,
        dimension,
        score,
        compositeScore: identity.compositeScore,
        tier: identity.tier,
        tierName: identity.tierName,
      });
    }

    case "sovereign_assess_confidence": {
      const identity = await client.getIdentity(args.wallet as string);
      const confidence = client.assessConfidence(identity.tier);
      return jsonContent({
        wallet: args.wallet,
        tier: identity.tier,
        tierName: identity.tierName,
        confidence,
        compositeScore: identity.compositeScore,
      });
    }

    default:
      return errorContent(`Unknown sovereign tool: ${name}`);
  }
}
