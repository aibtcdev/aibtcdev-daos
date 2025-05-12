import { DurableObjectNamespace } from "@cloudflare/workers-types";

declare namespace Cloudflare {
  interface Env {
    AIBTC_MCP_DO: DurableObjectNamespace;
  }
}

interface CloudflareBindings extends Cloudflare.Env {}

export { CloudflareBindings, Cloudflare };
