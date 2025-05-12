import { Hono } from "hono";
import { CloudflareBindings } from "./cf-types";
import { setupFullContractRegistry } from "../utilities/contract-registry";
import { AIBTC_MCP_DO } from "../durable-objects/aibtc-mcp-do";
import { createApiRouter } from "./api";

export { AIBTC_MCP_DO };

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Create a shared registry instance
const registry = setupFullContractRegistry();

app.get("/", (c) => {
  return c.text("AI-powered Bitcoin DAOs");
});

// Mount the API router
app.route("/api", createApiRouter(registry));

// Mount durable object endpoints
app.mount(
  "/sse",
  (req, env) => {
    return env.AIBTC_MCP_DO.serveSSE("/sse").fetch(req);
  },
  {
    replaceRequest: false,
  }
);

app.mount(
  "/mcp",
  (req, env) => {
    return env.AIBTC_MCP_DO.serve("/mcp").fetch(req);
  },
  {
    replaceRequest: false,
  }
);

export default app;
