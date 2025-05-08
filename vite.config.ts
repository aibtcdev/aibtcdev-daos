import { cloudflare } from "@cloudflare/vite-plugin";
import build from "@hono/vite-build/cloudflare-workers";
import { defineConfig } from "vite";
import ssrHotReload from "vite-plugin-ssr-hot-reload";

export default defineConfig(({ command, isSsrBuild }) => {
  if (command === "serve") {
    return { 
      plugins: [
        ssrHotReload(), 
        cloudflare({
          wrangler: {
            configPath: './wrangler.toml',
          }
        })
      ] 
    };
  }
  return {
    plugins: [
      build({
        outputDir: "dist-server",
        entryContentAfterHooks: [],
        entryContentDefaultExportHook: () => "",
      }),
    ],
  };
});
