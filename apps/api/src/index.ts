import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (context) => context.json({ status: "ok" }));

if (import.meta.url === `file://${process.argv[1]}`) {
  serve({ fetch: app.fetch, port: 3001 });
}

export { app };
