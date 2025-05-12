import { DurableObjectNamespace } from "@cloudflare/workers-types";

declare namespace Cloudflare {
  interface Env {
    AIBTC_MCP_DO: DurableObjectNamespace /* AIBTC-MCP-DO */;
  }
}

interface CloudflareBindings extends Cloudflare.Env {}

export { CloudflareBindings, Cloudflare };
