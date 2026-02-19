import type { ToolResponse } from "./types.js";

export function jsonContent(data: unknown): ToolResponse {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(serializeBigInts(data), null, 2) }],
  };
}

export function errorContent(message: string): ToolResponse {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
    isError: true as const,
  };
}

/**
 * Recursively convert bigint values to strings for JSON serialization.
 */
export function serializeBigInts(obj: unknown): unknown {
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInts);
  }
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = serializeBigInts(value);
    }
    return result;
  }
  return obj;
}
