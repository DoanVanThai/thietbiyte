import type { APIRoute } from "astro";
import { getSettings, saveSettings } from "@/lib/content-repository";
import { isResponse, requirePermission } from "@/server/auth/http";
export const GET: APIRoute = (context) => { const actor = requirePermission(context, "settings.view"); return isResponse(actor) ? actor : Response.json(getSettings(), { headers: { "Cache-Control": "no-store" } }); };
export const PATCH: APIRoute = async (context) => { const actor = requirePermission(context, "settings.manage"); return isResponse(actor) ? actor : Response.json(saveSettings(await context.request.json()), { headers: { "Cache-Control": "no-store" } }); };
