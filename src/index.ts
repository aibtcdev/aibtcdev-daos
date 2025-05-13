import { Hono } from "hono";
import { CloudflareBindings } from "./cf-types";
import { setupFullContractRegistry } from "../utilities/contract-registry";
import { AIBTC_MCP_DO } from "../durable-objects/aibtc-mcp-do";
import { createApiRouter } from "./api";
import { corsHeaders } from "./utils/response-utils";

export { AIBTC_MCP_DO };

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Create a shared registry instance
const registry = setupFullContractRegistry();

app.options("*", (c) => {
  return c.text("ok", 200, {
    ...corsHeaders(),
    "Content-Type": "text/plain",
  });
});

app.get("/", (c) => {
  return c.json({ message: "AI-powered Bitcoin DAOs" }, 200, {
    ...corsHeaders(),
    "Content-Type": "application/json",
  });
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

// 404
app.all("*", (c) => {
  return c.json({ error: "Not Found" }, 404, {
    ...corsHeaders(),
    "Content-Type": "application/json",
  });
});

export default app;
