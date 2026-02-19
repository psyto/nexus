import { VeilClient } from "@nexus/core";
import { jsonContent, errorContent } from "@nexus/core";
import type { ToolResponse } from "@nexus/core";

type Args = Record<string, unknown>;

export const VEIL_TOOLS = [
  {
    name: "veil_get_solver_config",
    description: "Get the Veil CSR solver configuration: fees, volume, activity status.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "veil_get_order",
    description: "Get a specific encrypted order by owner and order ID.",
    inputSchema: {
      type: "object" as const,
      required: ["owner", "orderId"],
      properties: {
        owner: { type: "string", description: "Order owner wallet address" },
        orderId: { type: "string", description: "Order ID string" },
      },
    },
  },
  {
    name: "veil_get_orders_by_owner",
    description: "Get all encrypted orders for a wallet.",
    inputSchema: {
      type: "object" as const,
      required: ["owner"],
      properties: {
        owner: { type: "string", description: "Wallet address (base58)" },
      },
    },
  },
  {
    name: "veil_submit_encrypted_order",
    description: "Submit an encrypted swap order to the Veil CSR solver. Write operation — deferred.",
    inputSchema: {
      type: "object" as const,
      required: ["orderId", "inputMint", "outputMint", "inputAmount", "minOutputAmount", "slippageBps", "deadlineSeconds"],
      properties: {
        orderId: { type: "string", description: "Unique order ID" },
        inputMint: { type: "string", description: "Input token mint address" },
        outputMint: { type: "string", description: "Output token mint address" },
        inputAmount: { type: "string", description: "Input amount in minor units" },
        minOutputAmount: { type: "string", description: "Minimum output amount" },
        slippageBps: { type: "number", description: "Slippage tolerance in basis points" },
        deadlineSeconds: { type: "number", description: "Order deadline in seconds from now" },
      },
    },
  },
  {
    name: "veil_cancel_order",
    description: "Cancel a pending encrypted order. Write operation — deferred.",
    inputSchema: {
      type: "object" as const,
      required: ["orderId", "inputMint"],
      properties: {
        orderId: { type: "string", description: "Order ID to cancel" },
        inputMint: { type: "string", description: "Input token mint (for refund)" },
      },
    },
  },
];

export async function handleVeilTool(name: string, args: Args): Promise<ToolResponse> {
  const client = new VeilClient();

  switch (name) {
    case "veil_get_solver_config": {
      const config = await client.getSolverConfig();
      return jsonContent(config);
    }

    case "veil_get_order": {
      const order = await client.getOrder(
        args.owner as string,
        args.orderId as string,
      );
      return jsonContent(order);
    }

    case "veil_get_orders_by_owner": {
      const orders = await client.getOrdersByOwner(args.owner as string);
      return jsonContent({ orders, count: orders.length });
    }

    case "veil_submit_encrypted_order":
      return errorContent("veil_submit_encrypted_order: Write operation deferred — requires wallet + encryption integration.");

    case "veil_cancel_order":
      return errorContent("veil_cancel_order: Write operation deferred — requires wallet integration.");

    default:
      return errorContent(`Unknown veil tool: ${name}`);
  }
}
