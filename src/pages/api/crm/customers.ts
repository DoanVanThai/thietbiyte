import type { APIRoute } from "astro";
import { isResponse, json, requirePermission } from "@/server/auth/http";
import { crmRepository } from "@/server/repositories/crm-repository";
export const GET: APIRoute = async (context) => { const actor = requirePermission(context, "customer.view"); return isResponse(actor) ? actor : json({ customers: await crmRepository.listCustomers(actor) }); };
