export { SOVEREIGN_TOOLS, handleSovereignTool } from "./sovereign.js";
export { PERCOLATOR_TOOLS, handlePercolatorTool } from "./percolator.js";
export { SIGMA_TOOLS, handleSigmaTool } from "./sigma.js";
export { EXODUS_TOOLS, handleExodusTool } from "./exodus.js";
export { VEIL_TOOLS, handleVeilTool } from "./veil.js";
export { STRATUM_TOOLS, handleStratumTool } from "./stratum.js";

import { SOVEREIGN_TOOLS } from "./sovereign.js";
import { PERCOLATOR_TOOLS } from "./percolator.js";
import { SIGMA_TOOLS } from "./sigma.js";
import { EXODUS_TOOLS } from "./exodus.js";
import { VEIL_TOOLS } from "./veil.js";
import { STRATUM_TOOLS } from "./stratum.js";

export const ALL_TOOLS = [
  ...SOVEREIGN_TOOLS,
  ...PERCOLATOR_TOOLS,
  ...SIGMA_TOOLS,
  ...EXODUS_TOOLS,
  ...VEIL_TOOLS,
  ...STRATUM_TOOLS,
];
