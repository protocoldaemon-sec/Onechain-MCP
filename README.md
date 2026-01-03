<p align="center">
  <img src="logo-onechain.png" alt="OneChain Logo" width="120">
</p>

<h1 align="center">OneChain MCP Server</h1>

<p align="center">
  Model Context Protocol server for OneChain blockchain interactions
</p>

<p align="center">
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  </a>
  <a href="https://modelcontextprotocol.io/">
    <img src="https://img.shields.io/badge/MCP-1.0-blueviolet?style=flat-square" alt="MCP">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License">
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> |
  <a href="#configuration">Configuration</a> |
  <a href="#available-tools">Tools</a> |
  <a href="#deployment">Deployment</a>
</p>

---

## Overview

OneChain MCP Server provides a standardized interface for AI assistants to interact with the OneChain blockchain through the Model Context Protocol. It enables seamless blockchain operations including balance queries, transaction management, staking information, and Move smart contract interactions.

## Features

| Feature | Description |
|---------|-------------|
| Multi-Network Support | Connect to mainnet, testnet, devnet, or localnet |
| Account Management | Query balances, owned objects, and coin information |
| Transaction Operations | Fetch transaction details, history, and dry-run simulations |
| Staking Integration | Access validator APY and staking positions |
| Move Support | Query Move function signatures and blockchain events |
| Faucet Access | Request test tokens on testnet |

## Installation

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Setup

```bash
cd onechain-mcp
npm install
npm run build
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ONECHAIN_NETWORK` | Target network (`mainnet`, `testnet`, `devnet`, `localnet`) | `testnet` |
| `PORT` | HTTP server port (Railway deployment only) | `3000` |

### MCP Client Configuration

Add to your MCP configuration file:

**Kiro** (`~/.kiro/settings/mcp.json` or `.kiro/settings/mcp.json`):

```json
{
  "mcpServers": {
    "onechain": {
      "command": "node",
      "args": ["/path/to/onechain-mcp/dist/index.js"],
      "env": {
        "ONECHAIN_NETWORK": "testnet"
      }
    }
  }
}
```

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "onechain": {
      "command": "node",
      "args": ["/path/to/onechain-mcp/dist/index.js"],
      "env": {
        "ONECHAIN_NETWORK": "testnet"
      }
    }
  }
}
```

## Available Tools

### Account and Balance

| Tool | Description |
|------|-------------|
| `get_balance` | Get OCT balance for an address |
| `get_all_balances` | Get all coin balances for an address |
| `get_coins` | Get coin objects owned by an address |

### Objects

| Tool | Description |
|------|-------------|
| `get_object` | Get detailed object information by ID |
| `get_owned_objects` | List all objects owned by an address |

### Transactions

| Tool | Description |
|------|-------------|
| `get_transaction` | Get transaction details by digest |
| `get_transaction_history` | Query transaction history for an address |
| `get_transaction_signatures` | Get signature information for a transaction |
| `dry_run_transaction` | Simulate transaction execution and estimate gas |

### Network Information

| Tool | Description |
|------|-------------|
| `get_chain_id` | Get the chain identifier |
| `get_latest_checkpoint` | Get the latest checkpoint sequence number |
| `get_reference_gas_price` | Get current reference gas price |

### Staking and Governance

| Tool | Description |
|------|-------------|
| `get_validators` | Get validator APY information |
| `get_stakes` | Get staking positions for an address |

### Move Smart Contracts

| Tool | Description |
|------|-------------|
| `get_move_function` | Get Move function signature and parameters |
| `query_events` | Query blockchain events by type, sender, or transaction |

### Utilities

| Tool | Description |
|------|-------------|
| `request_faucet` | Request test tokens (testnet/localnet only) |

## Usage Examples

### Query Account Balance

```json
{
  "name": "get_balance",
  "arguments": {
    "address": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "network": "testnet"
  }
}
```

### Get Transaction Details

```json
{
  "name": "get_transaction",
  "arguments": {
    "digest": "ABC123...",
    "network": "mainnet"
  }
}
```

### Query Move Events

```json
{
  "name": "query_events",
  "arguments": {
    "query": {
      "MoveEventType": "0x2::coin::CoinEvent"
    },
    "limit": 10,
    "network": "testnet"
  }
}
```

### Request Faucet Tokens

```json
{
  "name": "request_faucet",
  "arguments": {
    "address": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "network": "testnet"
  }
}
```

## Network Endpoints

| Network | RPC Endpoint | Faucet |
|---------|--------------|--------|
| mainnet | `https://rpc.mainnet.onelabs.cc:443` | - |
| testnet | `https://rpc-testnet.onelabs.cc:443` | `https://faucet-testnet.onelabs.cc:443` |
| devnet | Auto-configured | - |
| localnet | `http://127.0.0.1:9000` | `http://127.0.0.1:9123/gas` |

## Deployment

### Docker (Local)

**Build and Run:**

```bash
docker build -t onechain-mcp .
docker run -it --rm -e ONECHAIN_NETWORK=testnet onechain-mcp
```

**Docker Compose:**

```bash
docker-compose up -d

# With custom network
ONECHAIN_NETWORK=mainnet docker-compose up -d
```

**MCP Configuration with Docker:**

```json
{
  "mcpServers": {
    "onechain": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "onechain-mcp"],
      "env": {
        "ONECHAIN_NETWORK": "testnet"
      }
    }
  }
}
```

### Railway (Cloud)

Deploy to Railway for remote MCP server access via SSE transport.

**1. Deploy to Railway:**

```bash
# Push to GitHub, then connect repo in Railway dashboard
# Railway will auto-detect railway.json configuration
```

**2. Set Environment Variables:**

| Variable | Value |
|----------|-------|
| `ONECHAIN_NETWORK` | `testnet` or `mainnet` |

**3. Connect MCP Client:**

```json
{
  "mcpServers": {
    "onechain": {
      "url": "https://your-app.railway.app/sse"
    }
  }
}
```

**Available Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Server information |
| `/health` | GET | Health check |
| `/sse` | GET | SSE connection for MCP |
| `/message` | POST | Message handler |

## Development

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Railway-specific commands
npm run dev:railway    # Development with SSE transport
npm run build:railway  # Build for Railway deployment
```

## Project Structure

```
onechain-mcp/
├── src/
│   ├── index.ts           # Main server (stdio transport)
│   └── index-railway.ts   # Railway server (SSE transport)
├── dist/                  # Compiled JavaScript
├── Dockerfile             # Local Docker build
├── Dockerfile.railway     # Railway deployment
├── docker-compose.yml     # Docker Compose config
├── railway.json           # Railway configuration
├── package.json
└── tsconfig.json
```

## Requirements

| Dependency | Version |
|------------|---------|
| Node.js | >= 20.0.0 |
| TypeScript | >= 5.8.0 |
| @modelcontextprotocol/sdk | ^1.0.0 |
| @onelabs/sui | ^1.0.0 |

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built for the OneChain ecosystem
</p>
