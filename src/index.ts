import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("AI-powered Bitcoin DAOs");
});

export default app;
