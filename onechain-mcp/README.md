# OneChain MCP Server

MCP (Model Context Protocol) server for interacting with the OneChain blockchain.

## Installation

```bash
cd onechain-mcp
npm install
npm run build
```

## Usage

### With Kiro

Add to your MCP configuration (`~/.kiro/settings/mcp.json` or `.kiro/settings/mcp.json`):

```json
{
  "mcpServers": {
    "onechain": {
      "command": "node",
      "args": ["path/to/onechain-mcp/dist/index.js"],
      "env": {
        "ONECHAIN_NETWORK": "testnet"
      }
    }
  }
}
```

### Environment Variables

- `ONECHAIN_NETWORK` - Default network: `mainnet`, `testnet`, `devnet`, `localnet` (default: `testnet`)

## Available Tools

### Account & Balance
- `get_balance` - Get OCT balance for an address
- `get_all_balances` - Get all coin balances for an address
- `get_coins` - Get coin objects for an address

### Objects
- `get_object` - Get object details by ID
- `get_owned_objects` - Get objects owned by an address

### Transactions
- `get_transaction` - Get transaction details by digest
- `dry_run_transaction` - Dry run a transaction to estimate gas

### Network
- `get_chain_id` - Get the chain identifier
- `get_latest_checkpoint` - Get latest checkpoint sequence number
- `get_reference_gas_price` - Get current reference gas price

### Staking & Governance
- `get_validators` - Get validator APY information
- `get_stakes` - Get staking information for an address

### Move
- `get_move_function` - Get Move function signature
- `query_events` - Query events by type or sender

### Faucet
- `request_faucet` - Request test tokens (testnet only)

## Example Tool Calls

### Get Balance
```json
{
  "name": "get_balance",
  "arguments": {
    "address": "0x123...",
    "network": "testnet"
  }
}
```

### Get Object
```json
{
  "name": "get_object",
  "arguments": {
    "objectId": "0x456...",
    "network": "mainnet"
  }
}
```

### Query Events
```json
{
  "name": "query_events",
  "arguments": {
    "query": { "MoveEventType": "0x2::coin::CoinEvent" },
    "limit": 10
  }
}
```

## Networks

| Network | RPC Endpoint | Faucet |
|---------|-------------|--------|
| localnet | http://127.0.0.1:9000 | http://127.0.0.1:9123/gas |
| testnet | https://rpc-testnet.onelabs.cc:443 | https://faucet-testnet.onelabs.cc:443 |
| mainnet | https://rpc.mainnet.onelabs.cc:443 | N/A |

## Docker

### Build Image

```bash
docker build -t onechain-mcp .
```

### Run Container

```bash
docker run -it --rm -e ONECHAIN_NETWORK=testnet onechain-mcp
```

### Docker Compose

```bash
# Start
docker-compose up -d

# With custom network
ONECHAIN_NETWORK=mainnet docker-compose up -d

# Stop
docker-compose down
```

### MCP Config with Docker

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

## Development

```bash
npm run dev    # Run with tsx (hot reload)
npm run build  # Compile TypeScript
npm start      # Run compiled version
```
