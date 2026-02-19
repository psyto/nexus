import { StratumClient } from "@nexus/core";
import { jsonContent, errorContent } from "@nexus/core";
import type { ToolResponse } from "@nexus/core";

type Args = Record<string, unknown>;

export const STRATUM_TOOLS = [
  {
    name: "stratum_get_orderbook",
    description: "Get Stratum order book state: best bid/ask, volumes, epoch info.",
    inputSchema: {
      type: "object" as const,
      required: ["authority", "baseMint", "quoteMint"],
      properties: {
        authority: { type: "string", description: "Order book authority address" },
        baseMint: { type: "string", description: "Base token mint address" },
        quoteMint: { type: "string", description: "Quote token mint address" },
      },
    },
  },
  {
    name: "stratum_get_epoch",
    description: "Get epoch info: merkle root, order count, finalization status.",
    inputSchema: {
      type: "object" as const,
      required: ["orderBookPda", "epochIndex"],
      properties: {
        orderBookPda: { type: "string", description: "Order book PDA address" },
        epochIndex: { type: "number", description: "Epoch index number" },
      },
    },
  },
  {
    name: "stratum_derive_orderbook_pda",
    description: "Derive the order book PDA address from authority and mints.",
    inputSchema: {
      type: "object" as const,
      required: ["authority", "baseMint", "quoteMint"],
      properties: {
        authority: { type: "string", description: "Order book authority address" },
        baseMint: { type: "string", description: "Base token mint address" },
        quoteMint: { type: "string", description: "Quote token mint address" },
      },
    },
  },
  {
    name: "stratum_get_merkle_proof",
    description: "Build a merkle proof for settlement of a specific order.",
    inputSchema: {
      type: "object" as const,
      required: ["orders", "targetIndex"],
      properties: {
        orders: {
          type: "array",
          items: {
            type: "object",
            required: ["maker", "orderId", "side", "price", "amount", "epochIndex", "orderIndex", "timestamp"],
            properties: {
              maker: { type: "string" },
              orderId: { type: "string" },
              side: { type: "number", description: "0=Bid, 1=Ask" },
              price: { type: "string" },
              amount: { type: "string" },
              epochIndex: { type: "number" },
              orderIndex: { type: "number" },
              timestamp: { type: "string" },
            },
          },
          description: "Array of orders in the epoch",
        },
        targetIndex: { type: "number", description: "Index of order to prove" },
      },
    },
  },
];

export async function handleStratumTool(name: string, args: Args): Promise<ToolResponse> {
  const client = new StratumClient();

  switch (name) {
    case "stratum_get_orderbook": {
      const book = await client.getOrderBook(
        args.authority as string,
        args.baseMint as string,
        args.quoteMint as string,
      );
      return jsonContent(book);
    }

    case "stratum_get_epoch": {
      const epoch = await client.getEpoch(
        args.orderBookPda as string,
        args.epochIndex as number,
      );
      return jsonContent(epoch);
    }

    case "stratum_derive_orderbook_pda": {
      const [pda, bump] = client.deriveOrderBookPda(
        args.authority as string,
        args.baseMint as string,
        args.quoteMint as string,
      );
      return jsonContent({ pda: pda.toBase58(), bump });
    }

    case "stratum_get_merkle_proof": {
      const rawOrders = args.orders as Array<{
        maker: string;
        orderId: string;
        side: number;
        price: string;
        amount: string;
        epochIndex: number;
        orderIndex: number;
        timestamp: string;
      }>;
      const orders = rawOrders.map((o) => ({
        ...o,
        price: BigInt(o.price),
        amount: BigInt(o.amount),
        timestamp: BigInt(o.timestamp),
      }));
      const proof = client.getMerkleProof(orders, args.targetIndex as number);
      return jsonContent(proof);
    }

    default:
      return errorContent(`Unknown stratum tool: ${name}`);
  }
}
