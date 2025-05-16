# Durable Objects

This directory contains Cloudflare Durable Objects implementations that provide persistent state management for the AIBTC platform.

## Purpose

Durable Objects provide persistent state and coordination capabilities for the platform, enabling features like real-time updates and stateful blockchain interactions.

## Key Components

- `aibtc-mcp-do.ts` - The main Durable Object implementation for the Multi-Contract Protocol (MCP) agent, which facilitates interaction with the blockchain contracts

## MCP Integration

The AIBTC_MCP_DO Durable Object implements the Model Context Protocol (MCP) interface, providing:

- Server-Sent Events (SSE) for real-time updates via the `/sse` endpoint
- Contract interaction capabilities via the `/mcp` endpoint
- Persistent state management for blockchain operations

## Usage

The Durable Objects are deployed as part of the Cloudflare Workers infrastructure and are accessed through the main API. The main entry point in `src/index.ts` mounts the Durable Object endpoints:

```typescript
// Mount durable object endpoints
app.mount("/sse", (req, env) => {
  return env.AIBTC_MCP_DO.serveSSE("/sse").fetch(req);
});

app.mount("/mcp", (req, env) => {
  return env.AIBTC_MCP_DO.serve("/mcp").fetch(req);
});
```

[Back to main README](/)
