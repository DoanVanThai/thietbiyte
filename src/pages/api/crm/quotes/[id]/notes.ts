import type { APIRoute } from "astro";
import { errorJson, isResponse, json, readJson, requirePermission } from "@/server/auth/http";
import { crmRepository } from "@/server/repositories/crm-repository";

export const POST: APIRoute = async (context) => {
  const actor = requirePermission(context, "quote.edit");
  if (isResponse(actor)) return actor;
  const quote = await crmRepository.getQuote(String(context.params.id), actor);
  if (!quote) return errorJson(404, "NOT_FOUND", "Không tìm thấy quote.");
  const body = await readJson<{ content?: string }>(context.request);
  if (!body?.content?.trim() || body.content.length > 4000) return errorJson(422, "INVALID_NOTE", "Ghi chú không hợp lệ.");
  const note = await crmRepository.addInternalNote({ quoteId: quote.id }, body.content.trim(), actor);
  return json({ ok: true, note }, 201);
};
