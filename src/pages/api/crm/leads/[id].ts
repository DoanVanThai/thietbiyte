import type { APIRoute } from "astro";
import { errorJson, isResponse, json, readJson, requirePermission } from "@/server/auth/http";
import { crmRepository } from "@/server/repositories/crm-repository";
const statuses = new Set(["NEW", "CONTACTED", "QUALIFIED", "QUOTE_SENT", "NEGOTIATING", "WON", "LOST"]);
export const GET: APIRoute = async (context) => { const actor = requirePermission(context, "lead.view"); if (isResponse(actor)) return actor; const lead = await crmRepository.getLead(String(context.params.id), actor); return lead ? json({ lead }) : errorJson(404, "NOT_FOUND", "Không tìm thấy lead được phép truy cập."); };
export const PATCH: APIRoute = async (context) => {
  const body = await readJson<{ status?: string; assignedToId?: string }>(context.request); if (!body) return errorJson(400, "INVALID_INPUT", "Dữ liệu không hợp lệ.");
  const permission = body.assignedToId ? "lead.assign" : "lead.edit"; const actor = requirePermission(context, permission); if (isResponse(actor)) return actor;
  const lead = await crmRepository.getLead(String(context.params.id), actor); if (!lead) return errorJson(404, "NOT_FOUND", "Không tìm thấy lead được phép truy cập.");
  if (body.assignedToId) return json({ ok: true, lead: await crmRepository.assignLead(lead.id, body.assignedToId, actor) });
  if (!body.status || !statuses.has(body.status)) return errorJson(422, "INVALID_STATUS", "Trạng thái lead không hợp lệ.");
  return json({ ok: true, lead: await crmRepository.updateLeadStatus(lead.id, body.status as never, actor) });
};
