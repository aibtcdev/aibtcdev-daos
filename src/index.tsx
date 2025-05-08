import { Hono } from "hono";
import { renderer } from "./renderer";

const app = new Hono();

app.use(renderer);

app.get("/", (c) => c.text("Hello Cloudflare Workers!"));

app.get("/contracts", (c) => c.text("Let's generate some contracts!"));

export default app;
