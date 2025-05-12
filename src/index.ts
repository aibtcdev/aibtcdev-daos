import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("AI-powered Bitcoin DAOs");
});

app.mount("/sse", AIBTC_MCP_DO.serveSSE("/sse").fetch, {
  replaceRequest: false,
});
app.mount("/mcp", AIBTC_MCP_DO.serve("/mcp").fetch, { replaceRequest: false });

export default app;
