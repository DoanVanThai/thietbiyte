import "dotenv/config";
import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  site: process.env.SITE_URL || "https://thienloc.haynuoitoi.online",
  output: "server",
  adapter: node({ mode: "standalone" }),
  compressHTML: true,
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },
});
