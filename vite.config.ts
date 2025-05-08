import { defineConfig } from "vite";
import build from "@hono/vite-build/cloudflare-workers";

export default defineConfig(({ command, isSsrBuild }) => {
  if (command === "serve") {
    // Use a simple development server without Miniflare integration
    return {
      server: {
        port: 3000
      }
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
