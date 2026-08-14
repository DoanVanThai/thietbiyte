import type { APIRoute } from "astro";
import { siteSettingService } from "@/server/services/site-setting-service";

export const GET: APIRoute = async () => Response.json(
  { settings: await siteSettingService.publicValues() },
  { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } },
);
