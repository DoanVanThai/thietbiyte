import type { APIRoute } from "astro";
import { errorJson, isResponse, json, readJson, requirePermission } from "@/server/auth/http";
import { crmRepository } from "@/server/repositories/crm-repository";
const statuses = new Set(["RECEIVED", "CONSULTING", "QUOTE_SENT", "NEGOTIATING", "COMPLETED", "CANCELLED"]);
export const GET: APIRoute = async (context) => { const actor = requirePermission(context, "quote.view"); if (isResponse(actor)) return actor; const quote = await crmRepository.getQuote(String(context.params.id), actor); return quote ? json({ quote }) : errorJson(404, "NOT_FOUND", "Không tìm thấy quote được phép truy cập."); };
export const PATCH: APIRoute = async (context) => {
  const body = await readJson<{ status?: string; assignedToId?: string }>(context.request); if (!body) return errorJson(400, "INVALID_INPUT", "Dữ liệu không hợp lệ.");
  const permission = body.assignedToId ? "quote.assign" : "quote.edit"; const actor = requirePermission(context, permission); if (isResponse(actor)) return actor;
  const quote = await crmRepository.getQuote(String(context.params.id), actor); if (!quote) return errorJson(404, "NOT_FOUND", "Không tìm thấy quote được phép truy cập.");
  if (body.assignedToId) return json({ ok: true, quote: await crmRepository.assignQuote(quote.id, body.assignedToId, actor) });
  if (!body.status || !statuses.has(body.status)) return errorJson(422, "INVALID_STATUS", "Trạng thái quote không hợp lệ.");
  return json({ ok: true, quote: await crmRepository.updateQuoteStatus(quote.id, body.status as never, actor) });
};
