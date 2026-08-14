import type { APIRoute } from "astro";
import { isResponse, json, requirePermission } from "@/server/auth/http";
import { crmRepository } from "@/server/repositories/crm-repository";
export const GET: APIRoute = async (context) => { const actor = requirePermission(context, "lead.view"); return isResponse(actor) ? actor : json({ leads: await crmRepository.listLeads(actor) }); };
