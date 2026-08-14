import type { APIRoute } from "astro";
import { errorJson, isResponse, json, requirePermission } from "@/server/auth/http";
import { crmRepository } from "@/server/repositories/crm-repository";
export const GET: APIRoute = async (context) => { const actor = requirePermission(context, "customer.view"); if (isResponse(actor)) return actor; const customer = await crmRepository.getCustomer(String(context.params.id), actor); return customer ? json({ customer }) : errorJson(404, "NOT_FOUND", "Không tìm thấy khách hàng."); };
