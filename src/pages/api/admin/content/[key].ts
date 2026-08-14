import type { APIRoute } from "astro";
import { getContent, saveContent } from "@/lib/content-repository";
import { isResponse, requirePermission } from "@/server/auth/http";
export const GET: APIRoute = (context) => { const actor = requirePermission(context, "article.view"); return isResponse(actor) ? actor : Response.json({ value: getContent(context.params.key || "", null) }, { headers: { "Cache-Control": "no-store" } }); };
export const PUT: APIRoute = async (context) => { const actor = requirePermission(context, "article.manage"); return isResponse(actor) ? actor : Response.json({ value: saveContent(context.params.key || "", (await context.request.json()).value) }, { headers: { "Cache-Control": "no-store" } }); };
