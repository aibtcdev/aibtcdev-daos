import { Hono } from "hono";
import { CloudflareBindings } from "./cf-types";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", (c) => {
  return c.text("AI-powered Bitcoin DAOs");
});

app.mount("/sse", (req, env) => {
  return env.AIBTC_MCP_DO.serveSSE("/sse").fetch(req);
}, {
  replaceRequest: false,
});

app.mount("/mcp", (req, env) => {
  return env.AIBTC_MCP_DO.serve("/mcp").fetch(req);
}, {
  replaceRequest: false,
});

export default app;
