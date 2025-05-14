import { DurableObjectNamespace, Fetcher } from "@cloudflare/workers-types";

declare namespace Cloudflare {
  interface Env {
    AIBTC_MCP_DO: DurableObjectNamespace;
    AIBTC_ASSETS: Fetcher;
  }
}

interface CloudflareBindings extends Cloudflare.Env {}

export type { CloudflareBindings, Cloudflare };
