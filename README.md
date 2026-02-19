# NEXUS

MCP Server + Agent Kit for Solana DeFi Protocols.

Exposes Solana DeFi infrastructure — Percolator perpetuals, Sigma derivatives, Exodus yield vaults, Veil privacy swaps, Stratum orderbooks, and Sovereign identity — to AI agents via the [Model Context Protocol](https://modelcontextprotocol.io/).

## Packages

| Package | Description |
|---------|-------------|
| `@nexus/core` | Protocol client wrappers (read + write operations) |
| `@nexus/mcp-server` | MCP server exposing 31 DeFi tools |

## MCP Tools (31 total)

### Sovereign (3 tools)

| Tool | Description |
|------|-------------|
| `sovereign_get_identity` | Get wallet's identity: dimension scores, composite, tier |
| `sovereign_get_dimension_score` | Get specific dimension score (trading, civic, developer, infra, creator) |
| `sovereign_assess_confidence` | Map tier to trust confidence level (high/medium/low/none) |

### Percolator (6 tools)

| Tool | Description |
|------|-------------|
| `percolator_list_markets` | List all markets with OI, insurance, risk params |
| `percolator_get_market` | Full market state (header + config + engine + risk) |
| `percolator_get_user_position` | User's capital, PnL, position, entry, funding |
| `percolator_deposit_collateral` | Deposit collateral to user account |
| `percolator_withdraw_collateral` | Withdraw collateral |
| `percolator_trade` | Open/adjust position (+long / -short) |

### Sigma (8 tools)

| Tool | Description |
|------|-------------|
| `sigma_get_volatility_index` | Current vol index level and SVI parameters |
| `sigma_get_variance_pool` | Variance swap pool state |
| `sigma_get_position` | User's variance swap position |
| `sigma_open_long` | Long variance (profit when vol > strike) |
| `sigma_open_short` | Short variance |
| `sigma_close_position` | Close variance swap early |
| `sigma_get_funding_rate` | Latest funding rate for a symbol |
| `sigma_get_funding_pool` | Funding swap pool state |

### Exodus (5 tools)

| Tool | Description |
|------|-------------|
| `exodus_get_protocol_config` | Protocol config: mints, fees, totals |
| `exodus_get_user_position` | User deposits, shares, yield, tier |
| `exodus_get_yield_sources` | Available yields: APY, NAV, allocation |
| `exodus_deposit_jpy` | Deposit JPY for USDC yield conversion |
| `exodus_get_portfolio_value` | Total portfolio value (USDC + JPY equiv) |

### Veil CSR (5 tools)

| Tool | Description |
|------|-------------|
| `veil_get_solver_config` | CSR solver config: fees, volume |
| `veil_get_order` | Get specific encrypted order |
| `veil_get_orders_by_owner` | All orders for a wallet |
| `veil_submit_encrypted_order` | Submit encrypted swap order |
| `veil_cancel_order` | Cancel pending encrypted order |

### Stratum (4 tools)

| Tool | Description |
|------|-------------|
| `stratum_get_orderbook` | Order book state |
| `stratum_get_epoch` | Epoch info: merkle root, finalization |
| `stratum_derive_orderbook_pda` | Derive PDA address |
| `stratum_get_merkle_proof` | Build merkle proof for settlement |

## Setup

```bash
# Install dependencies
yarn install

# Build
yarn build

# Configure
cp .env.example .env
# Edit .env with your RPC URL and program IDs
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.devnet.solana.com` |
| `SOLANA_PRIVATE_KEY` | Wallet private key (base58 or JSON array) | — |
| `PERCOLATOR_PROGRAM_ID` | Percolator program ID | `F1uxb9kqJg7jv1FoYCjqBm12RYDsTEPnHUbpTopsNVAg` |
| `SOVEREIGN_PROGRAM_ID` | Sovereign program ID | `2UAZc1jj4QTSkgrC8U9d4a7EM9AQunxMvW5g7rX7Af9T` |
| `SIGMA_PROGRAM_ID` | Sigma program ID | — |
| `EXODUS_PROGRAM_ID` | Exodus program ID | — |
| `VEIL_CSR_PROGRAM_ID` | Veil CSR program ID | — |
| `STRATUM_PROGRAM_ID` | Stratum program ID | — |

## Usage

### With Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "nexus": {
      "command": "node",
      "args": ["/path/to/nexus/packages/nexus-mcp-server/dist/index.js"],
      "env": {
        "SOLANA_RPC_URL": "https://api.devnet.solana.com"
      }
    }
  }
}
```

### With MCP Inspector

```bash
npx @modelcontextprotocol/inspector node packages/nexus-mcp-server/dist/index.js
```

## Architecture

```
nexus/
├── packages/
│   ├── nexus-core/          # Protocol client wrappers
│   │   └── src/
│   │       ├── config.ts         # NexusConfig + loadConfigFromEnv()
│   │       ├── connection.ts     # createConnection, loadWallet
│   │       ├── types.ts          # TxResult, ToolResponse
│   │       ├── helpers.ts        # jsonContent, errorContent, serializeBigInts
│   │       └── protocols/
│   │           ├── sovereign/    # Raw buffer parsing for identity PDA
│   │           ├── percolator/   # Slab parsing, binary encoding, instructions
│   │           ├── sigma/        # Variance pools, funding swaps, vol indices
│   │           ├── exodus/       # JPY/USDC yield vaults
│   │           ├── veil/         # Encrypted order management
│   │           └── stratum/      # Epoch-based orderbook, merkle proofs
│   └── nexus-mcp-server/   # MCP server
│       └── src/
│           ├── index.ts          # Server + StdioServerTransport entry
│           ├── handler.ts        # Prefix-based dispatch
│           └── tools/            # Per-protocol tool definitions + handlers
```

## License

MIT
