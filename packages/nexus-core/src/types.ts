export interface TxResult {
  signature: string;
  success: boolean;
  error?: string;
}

export type ToolResponse = {
  content: Array<{ type: "text"; text: string }>;
  isError?: true;
};
