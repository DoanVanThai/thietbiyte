import type { APIRoute } from "astro";
import { errorJson, isResponse, json, requireCustomer } from "@/server/auth/http";
import { quoteService } from "@/server/services/quote-service";

export const GET: APIRoute = async (context) => {
  const actor = requireCustomer(context); if (isResponse(actor)) return actor;
  return json({ quotes: await quoteService.listPortal(actor.id) });
};

export const POST: APIRoute = () => errorJson(405, "USE_QUOTE_WORKFLOW", "Vui lòng dùng form yêu cầu báo giá đầy đủ.");
