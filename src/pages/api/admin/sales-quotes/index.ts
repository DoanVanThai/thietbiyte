import type { APIRoute } from "astro";
import { ZodError, flattenError } from "zod";
import { isResponse, json, requestIp, requirePermission } from "@/server/auth/http";
import { audit } from "@/server/auth/service";
import { salesQuoteStorage } from "@/server/services/sales-quote-storage";
import { salesQuotePdfInput } from "@/server/validation/sales-quote";

export const GET: APIRoute = async (context) => {
  const actor = requirePermission(context, "quote.view");
  if (isResponse(actor)) return actor;
  return json({ quotes: await salesQuoteStorage.list(Number(context.url.searchParams.get("limit")) || 100) });
};

export const POST: APIRoute = async (context) => {
  const actor = requirePermission(context, "quote.edit");
  if (isResponse(actor)) return actor;
  try {
    const input = salesQuotePdfInput.parse(await context.request.json());
    const quote = await salesQuoteStorage.create(input, actor.id);
    await audit("sales_quote.create", actor.id, quote.id, "sales-quote", "success", { quoteNumber: quote.quoteNumber, version: quote.version }, { ip: requestIp(context.request), userAgent: context.request.headers.get("user-agent") });
    return json({ quote, message: "Đã lưu bản báo giá." }, 201);
  } catch (error) {
    if (error instanceof ZodError) return json({ error: "Dữ liệu báo giá chưa hợp lệ.", fields: flattenError(error).fieldErrors }, 422);
    if (error instanceof Error && /unique|quoteNumber/i.test(error.message)) return json({ error: "Số báo giá đã tồn tại. Hãy mở bản cũ để cập nhật hoặc đổi số báo giá." }, 409);
    console.error("Could not save sales quote.", error);
    return json({ error: "Không thể lưu bản báo giá." }, 500);
  }
};
