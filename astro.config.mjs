import "dotenv/config";
import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  site: process.env.SITE_URL || "https://thienloc.haynuoitoi.online",
  output: "server",
  adapter: node({ mode: "standalone" }),
  // Multipart requests arrive through HTTPS Cloudflare/Nginx while Astro's
  // internal URL is HTTP. Our middleware performs a forwarded-aware check.
  security: { checkOrigin: false },
  compressHTML: true,
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },
});
