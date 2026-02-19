import { Connection, Keypair } from "@solana/web3.js";
import type { NexusConfig } from "./config.js";

function base58Decode(str: string): Uint8Array {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const bytes: number[] = [];
  for (const char of str) {
    const idx = ALPHABET.indexOf(char);
    if (idx < 0) throw new Error(`Invalid base58 character: ${char}`);
    let carry = idx;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // Leading zeros
  for (const char of str) {
    if (char !== "1") break;
    bytes.push(0);
  }
  return Uint8Array.from(bytes.reverse());
}

let _connection: Connection | null = null;

export function createConnection(config: NexusConfig): Connection {
  if (!_connection || _connection.rpcEndpoint !== config.rpcUrl) {
    _connection = new Connection(config.rpcUrl, "confirmed");
  }
  return _connection;
}

export function getConnection(rpcUrl?: string): Connection {
  const url = rpcUrl || process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  if (!_connection || _connection.rpcEndpoint !== url) {
    _connection = new Connection(url, "confirmed");
  }
  return _connection;
}

export function loadWallet(privateKey?: string): Keypair | null {
  const key = privateKey || process.env.SOLANA_PRIVATE_KEY;
  if (!key) return null;
  try {
    // Try base58 first
    const decoded = base58Decode(key);
    return Keypair.fromSecretKey(decoded);
  } catch {
    // Try JSON array format
    try {
      const arr = JSON.parse(key) as number[];
      return Keypair.fromSecretKey(Uint8Array.from(arr));
    } catch {
      return null;
    }
  }
}
