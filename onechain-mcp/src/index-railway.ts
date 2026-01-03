#!/usr/bin/env node
/**
 * OneChain MCP Server - Railway Edition
 * Menggunakan SSE transport untuk remote deployment
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getFullnodeUrl, SuiClient } from "@onelabs/sui/client";
import http from "http";

// Network configuration
type Network = "mainnet" | "testnet" | "devnet" | "localnet";
const DEFAULT_NETWORK: Network = (process.env.ONECHAIN_NETWORK as Network) || "testnet";
const PORT = parseInt(process.env.PORT || "3000", 10);

const FAUCET_URLS: Record<Network, string | null> = {
  localnet: "http://127.0.0.1:9123/gas",
  devnet: null,
  testnet: "https://faucet-testnet.onelabs.cc:443/gas",
  mainnet: null,
};

// Cache clients per network
const clientCache = new Map<Network, SuiClient>();

function getClient(network?: string): SuiClient {
  const net = (network as Network) || DEFAULT_NETWORK;
  
  if (!clientCache.has(net)) {
    const url = net === "localnet" 
      ? "http://127.0.0.1:9000"
      : getFullnodeUrl(net);
    clientCache.set(net, new SuiClient({ url }));
  }
  
  return clientCache.get(net)!;
}

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

function validateAddress(address: string, field = "address"): void {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid ${field}: must be 0x followed by 64 hex characters`);
  }
}

// Create MCP server
const server = new Server(
  { name: "onechain-mcp", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_balance",
      description: "Get OCT balance for an address",
      inputSchema: {
        type: "object",
        properties: {
          address: { type: "string", description: "OneChain address (0x...)" },
          network: { type: "string", enum: ["mainnet", "testnet", "devnet", "localnet"], description: "Network (default: testnet)" },
        },
        required: ["address"],
      },
    },
    {
      name: "get_all_balances",
      description: "Get all coin balances for an address",
      inputSchema: {
        type: "object",
        properties: {
          address: { type: "string", description: "OneChain address (0x...)" },
          network: { type: "string", enum: ["mainnet", "testnet", "devnet", "localnet"] },
        },
        required: ["address"],
      },
    },
    {
      name: "get_object",
      description: "Get object details by ID",
      inputSchema: {
        type: "object",
        properties: {
          objectId: { type: "string", description: "Object ID (0x...)" },
          network: { type: "string", enum: ["mainnet", "testnet", "devnet", "localnet"] },
        },
        required: ["objectId"],
      },
    },
    {
      name: "get_owned_objects",
      description: "Get objects owned by an address",
      inputSchema: {
        type: "object",
        properties: {
          address: { type: "string", description: "Owner address (0x...)" },
          limit: { type: "number", description: "Max results (default: 50)" },
          network: { type: "string", enum: ["mainnet", "testnet", "devnet", "localnet"] },
        },
        required: ["address"],
      },
    },
    {
      name: "get_transaction",
      description: "Get transaction details by digest",
      inputSchema: {
        type: "object",
        properties: {
          digest: { type: "string", description: "Transaction digest" },
          network: { type: "string", enum: ["mainnet", "testnet", "devnet", "localnet"] },
        },
        required: ["digest"],
      },
    },
    {
      name: "get_coins",
      description: "Get coin objects for an address",
      inputSchema: {
        type: "object",
        properties: {
          address: { type: "string", description: "Owner address (0x...)" },
          coinType: { type: "string", description: "Coin type (default: 0x2::sui::SUI)" },
          limit: { type: "number", description: "Max results (default: 50)" },
          network: { type: "string", enum: ["mainnet", "testnet", "devnet", "localnet"] },
        },
        required: ["address"],
      },
    },
    {
      name: "get_latest_checkpoint",
      description: "Get the latest checkpoint sequence number",
      inputSchema: {
        type: "object",
        properties: {
          network: { type: "string", enum: ["mainnet", "testnet", "devnet", "localnet"] },
        },
      },
    },
    {
      name: "get_chain_id",
      description: "Get the chain identifier",
      inputSchema: {
        type: "object",
        properties: {
          network: { type: "string", enum: ["mainnet", "testnet", "devnet", "localnet"] },
        },
      },
    },
    {
      name: "get_reference_gas_price",
      description: "Get current reference gas price",
      inputSchema: {
        type: "object",
        properties: {
          network: { type: "string", enum: ["mainnet", "testnet", "devnet", "localnet"] },
        },
      },
    },
    {
      name: "get_validators",
      description: "Get validator APY information",
      inputSchema: {
        type: "object",
        properties: {
          network: { type: "string", enum: ["mainnet", "testnet", "devnet", "localnet"] },
        },
      },
    },
    {
      name: "get_stakes",
      description: "Get staking information for an address",
      inputSchema: {
        type: "object",
        properties: {
          address: { type: "string", description: "Owner address (0x...)" },
          network: { type: "string", enum: ["mainnet", "testnet", "devnet", "localnet"] },
        },
        required: ["address"],
      },
    },
    {
      name: "query_events",
      description: "Query events by type or sender",
      inputSchema: {
        type: "object",
        properties: {
          query: { 
            type: "object", 
            description: "Event query filter",
            properties: {
              MoveEventType: { type: "string" },
              Sender: { type: "string" },
              Transaction: { type: "string" },
            },
          },
          limit: { type: "number", description: "Max results (default: 50)" },
          network: { type: "string", enum: ["mainnet", "testnet", "devnet", "localnet"] },
        },
        required: ["query"],
      },
    },
    {
      name: "get_move_function",
      description: "Get Move function signature",
      inputSchema: {
        type: "object",
        properties: {
          packageId: { type: "string", description: "Package ID (0x...)" },
          moduleName: { type: "string", description: "Module name" },
          functionName: { type: "string", description: "Function name" },
          network: { type: "string", enum: ["mainnet", "testnet", "devnet", "localnet"] },
        },
        required: ["packageId", "moduleName", "functionName"],
      },
    },
    {
      name: "dry_run_transaction",
      description: "Dry run a transaction to estimate gas",
      inputSchema: {
        type: "object",
        properties: {
          txBytes: { type: "string", description: "Base64 encoded transaction bytes" },
          network: { type: "string", enum: ["mainnet", "testnet", "devnet", "localnet"] },
        },
        required: ["txBytes"],
      },
    },
    {
      name: "request_faucet",
      description: "Request test tokens from faucet (testnet/localnet only)",
      inputSchema: {
        type: "object",
        properties: {
          address: { type: "string", description: "Recipient address (0x...)" },
          network: { type: "string", enum: ["testnet", "localnet"], description: "Network with faucet (default: testnet)" },
        },
        required: ["address"],
      },
    },
    {
      name: "get_transaction_history",
      description: "Get transaction history for an address",
      inputSchema: {
        type: "object",
        properties: {
          address: { type: "string", description: "Address to get transaction history for (0x...)" },
          filter: { type: "string", enum: ["from", "to", "both"], description: "Filter by sender/recipient (default: both)" },
          limit: { type: "number", description: "Max results (default: 50)" },
          cursor: { type: "string", description: "Pagination cursor" },
          order: { type: "string", enum: ["ascending", "descending"], description: "Sort order (default: descending)" },
          network: { type: "string", enum: ["mainnet", "testnet", "devnet", "localnet"] },
        },
        required: ["address"],
      },
    },
    {
      name: "get_transaction_signatures",
      description: "Get signatures for a transaction by digest",
      inputSchema: {
        type: "object",
        properties: {
          digest: { type: "string", description: "Transaction digest" },
          network: { type: "string", enum: ["mainnet", "testnet", "devnet", "localnet"] },
        },
        required: ["digest"],
      },
    },
  ],
}));


// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_balance": {
        const address = args?.address as string;
        validateAddress(address);
        const client = getClient(args?.network as string);
        const balance = await client.getBalance({ owner: address });
        return { content: [{ type: "text", text: JSON.stringify(balance, null, 2) }] };
      }

      case "get_all_balances": {
        const address = args?.address as string;
        validateAddress(address);
        const client = getClient(args?.network as string);
        const balances = await client.getAllBalances({ owner: address });
        return { content: [{ type: "text", text: JSON.stringify(balances, null, 2) }] };
      }

      case "get_object": {
        const objectId = args?.objectId as string;
        validateAddress(objectId, "objectId");
        const client = getClient(args?.network as string);
        const object = await client.getObject({
          id: objectId,
          options: { showType: true, showOwner: true, showContent: true, showDisplay: true, showStorageRebate: true },
        });
        return { content: [{ type: "text", text: JSON.stringify(object, null, 2) }] };
      }

      case "get_owned_objects": {
        const address = args?.address as string;
        validateAddress(address);
        const client = getClient(args?.network as string);
        const objects = await client.getOwnedObjects({
          owner: address,
          limit: (args?.limit as number) || 50,
          options: { showType: true, showOwner: true, showContent: true },
        });
        return { content: [{ type: "text", text: JSON.stringify(objects, null, 2) }] };
      }

      case "get_transaction": {
        const client = getClient(args?.network as string);
        const tx = await client.getTransactionBlock({
          digest: args?.digest as string,
          options: { showInput: true, showEffects: true, showEvents: true, showObjectChanges: true, showBalanceChanges: true },
        });
        return { content: [{ type: "text", text: JSON.stringify(tx, null, 2) }] };
      }

      case "get_coins": {
        const address = args?.address as string;
        validateAddress(address);
        const client = getClient(args?.network as string);
        const coins = await client.getCoins({
          owner: address,
          coinType: args?.coinType as string,
          limit: (args?.limit as number) || 50,
        });
        return { content: [{ type: "text", text: JSON.stringify(coins, null, 2) }] };
      }

      case "get_latest_checkpoint": {
        const client = getClient(args?.network as string);
        const checkpoint = await client.getLatestCheckpointSequenceNumber();
        return { content: [{ type: "text", text: JSON.stringify({ latestCheckpoint: checkpoint }, null, 2) }] };
      }

      case "get_chain_id": {
        const client = getClient(args?.network as string);
        const chainId = await client.getChainIdentifier();
        return { content: [{ type: "text", text: JSON.stringify({ chainId }, null, 2) }] };
      }

      case "get_reference_gas_price": {
        const client = getClient(args?.network as string);
        const gasPrice = await client.getReferenceGasPrice();
        return { content: [{ type: "text", text: JSON.stringify({ referenceGasPrice: gasPrice.toString() }, null, 2) }] };
      }

      case "get_validators": {
        const client = getClient(args?.network as string);
        const validators = await client.getValidatorsApy();
        return { content: [{ type: "text", text: JSON.stringify(validators, null, 2) }] };
      }

      case "get_stakes": {
        const client = getClient(args?.network as string);
        const stakes = await client.getStakes({ owner: args?.address as string });
        return { content: [{ type: "text", text: JSON.stringify(stakes, null, 2) }] };
      }

      case "query_events": {
        const client = getClient(args?.network as string);
        const queryArg = args?.query as Record<string, string>;
        let query: { MoveEventType: string } | { Sender: string } | { Transaction: string };
        if (queryArg?.MoveEventType) {
          query = { MoveEventType: queryArg.MoveEventType };
        } else if (queryArg?.Sender) {
          query = { Sender: queryArg.Sender };
        } else if (queryArg?.Transaction) {
          query = { Transaction: queryArg.Transaction };
        } else {
          throw new Error("query must have MoveEventType, Sender, or Transaction");
        }
        const events = await client.queryEvents({ query, limit: (args?.limit as number) || 50 });
        return { content: [{ type: "text", text: JSON.stringify(events, null, 2) }] };
      }

      case "get_move_function": {
        const client = getClient(args?.network as string);
        const func = await client.getNormalizedMoveFunction({
          package: args?.packageId as string,
          module: args?.moduleName as string,
          function: args?.functionName as string,
        });
        return { content: [{ type: "text", text: JSON.stringify(func, null, 2) }] };
      }

      case "dry_run_transaction": {
        const client = getClient(args?.network as string);
        const result = await client.dryRunTransactionBlock({ transactionBlock: args?.txBytes as string });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "request_faucet": {
        const address = args?.address as string;
        validateAddress(address);
        const net = (args?.network as Network) || DEFAULT_NETWORK;
        const faucetUrl = FAUCET_URLS[net];
        if (!faucetUrl) throw new Error(`Faucet not available for ${net}`);
        const response = await fetch(faucetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ FixedAmountRequest: { recipient: address } }),
        });
        const result = await response.json();
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_transaction_history": {
        const address = args?.address as string;
        validateAddress(address);
        const client = getClient(args?.network as string);
        const filter = (args?.filter as string) || "both";
        let queryFilter: { FromAddress: string } | { ToAddress: string } | { FromOrToAddress: { addr: string } };
        if (filter === "from") queryFilter = { FromAddress: address };
        else if (filter === "to") queryFilter = { ToAddress: address };
        else queryFilter = { FromOrToAddress: { addr: address } };
        const txs = await client.queryTransactionBlocks({
          filter: queryFilter,
          options: { showInput: true, showEffects: true, showEvents: true, showBalanceChanges: true },
          limit: (args?.limit as number) || 50,
          cursor: args?.cursor as string | undefined,
          order: (args?.order as "ascending" | "descending") || "descending",
        });
        return { content: [{ type: "text", text: JSON.stringify(txs, null, 2) }] };
      }

      case "get_transaction_signatures": {
        const digest = args?.digest as string;
        const client = getClient(args?.network as string);
        const tx = await client.getTransactionBlock({ digest, options: { showInput: true, showRawInput: true } });
        const signatures = {
          digest: tx.digest,
          signatures: tx.transaction?.txSignatures || [],
          sender: tx.transaction?.data?.sender,
          gasData: tx.transaction?.data?.gasData,
        };
        return { content: [{ type: "text", text: JSON.stringify(signatures, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
  }
});


// Resources - network info
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "onechain://networks",
      name: "OneChain Networks",
      description: "Available network endpoints",
      mimeType: "application/json",
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "onechain://networks") {
    const networks = {
      localnet: { rpc: "http://127.0.0.1:9000", faucet: "http://127.0.0.1:9123/gas" },
      testnet: { rpc: "https://rpc-testnet.onelabs.cc:443", faucet: "https://faucet-testnet.onelabs.cc:443" },
      mainnet: { rpc: "https://rpc.mainnet.onelabs.cc:443", faucet: null },
    };
    return {
      contents: [{ uri: request.params.uri, mimeType: "application/json", text: JSON.stringify(networks, null, 2) }],
    };
  }
  throw new Error(`Unknown resource: ${request.params.uri}`);
});

// Store active transports for cleanup
const transports = new Map<string, SSEServerTransport>();

// HTTP Server untuk Railway dengan SSE transport
async function main() {
  const httpServer = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://localhost:${PORT}`);

    // Health check endpoint
    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", server: "onechain-mcp", version: "1.0.0" }));
      return;
    }

    // SSE endpoint untuk MCP
    if (url.pathname === "/sse") {
      console.log("New SSE connection");
      const transport = new SSEServerTransport("/message", res);
      const sessionId = crypto.randomUUID();
      transports.set(sessionId, transport);
      
      res.on("close", () => {
        console.log("SSE connection closed");
        transports.delete(sessionId);
      });

      await server.connect(transport);
      return;
    }

    // Message endpoint untuk MCP
    if (url.pathname === "/message" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          // Find active transport and handle message
          const sessionId = url.searchParams.get("sessionId");
          if (sessionId && transports.has(sessionId)) {
            const transport = transports.get(sessionId)!;
            await transport.handlePostMessage(req, res, body);
          } else {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid or missing session" }));
          }
        } catch (error) {
          console.error("Message handling error:", error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      });
      return;
    }

    // Root endpoint - info
    if (url.pathname === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        name: "onechain-mcp",
        version: "1.0.0",
        description: "OneChain MCP Server",
        endpoints: {
          sse: "/sse",
          message: "/message",
          health: "/health",
        },
        network: DEFAULT_NETWORK,
      }));
      return;
    }

    // 404
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  httpServer.listen(PORT, () => {
    console.log(`OneChain MCP Server running on http://0.0.0.0:${PORT}`);
    console.log(`Default network: ${DEFAULT_NETWORK}`);
    console.log(`SSE endpoint: http://0.0.0.0:${PORT}/sse`);
  });
}

main().catch(console.error);
