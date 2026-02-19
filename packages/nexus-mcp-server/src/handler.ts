import { errorContent } from "@nexus/core";
import type { ToolResponse } from "@nexus/core";
import { handleSovereignTool } from "./tools/sovereign.js";
import { handlePercolatorTool } from "./tools/percolator.js";
import { handleSigmaTool } from "./tools/sigma.js";
import { handleExodusTool } from "./tools/exodus.js";
import { handleVeilTool } from "./tools/veil.js";
import { handleStratumTool } from "./tools/stratum.js";

type Args = Record<string, unknown>;

const PREFIX_HANDLERS: Record<string, (name: string, args: Args) => Promise<ToolResponse>> = {
  sovereign: handleSovereignTool,
  percolator: handlePercolatorTool,
  sigma: handleSigmaTool,
  exodus: handleExodusTool,
  veil: handleVeilTool,
  stratum: handleStratumTool,
};

export async function handleTool(name: string, args: Args): Promise<ToolResponse> {
  const prefix = name.split("_")[0];
  const handler = PREFIX_HANDLERS[prefix];
  if (!handler) {
    return errorContent(`Unknown tool prefix: ${prefix} (tool: ${name})`);
  }
  return handler(name, args);
}
