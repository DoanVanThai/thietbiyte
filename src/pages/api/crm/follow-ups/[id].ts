import type { APIRoute } from "astro";
import { isResponse, json, requirePermission } from "@/server/auth/http";
import { crmRepository } from "@/server/repositories/crm-repository";
export const PATCH: APIRoute = async (context) => { const actor = requirePermission(context, "lead.edit"); return isResponse(actor) ? actor : json({ ok: true, followUp: await crmRepository.completeFollowUp(String(context.params.id)) }); };
