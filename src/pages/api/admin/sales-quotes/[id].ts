import type { APIRoute } from "astro";
import { ZodError, flattenError } from "zod";
import { isResponse, json, requestIp, requirePermission } from "@/server/auth/http";
import { audit } from "@/server/auth/service";
import { salesQuoteStorage } from "@/server/services/sales-quote-storage";
import { salesQuotePdfInput } from "@/server/validation/sales-quote";

export const GET: APIRoute = async (context) => {
  const actor = requirePermission(context, "quote.view");
  if (isResponse(actor)) return actor;
  const quote = await salesQuoteStorage.find(context.params.id || "");
  return quote ? json({ quote }) : json({ error: "Không tìm thấy bản báo giá." }, 404);
};

export const PUT: APIRoute = async (context) => {
  const actor = requirePermission(context, "quote.edit");
  if (isResponse(actor)) return actor;
  try {
    const input = salesQuotePdfInput.parse(await context.request.json());
    const quote = await salesQuoteStorage.update(context.params.id || "", input, actor.id);
    if (!quote) return json({ error: "Không tìm thấy bản báo giá." }, 404);
    await audit("sales_quote.update", actor.id, quote.id, "sales-quote", "success", { quoteNumber: quote.quoteNumber, version: quote.version }, { ip: requestIp(context.request), userAgent: context.request.headers.get("user-agent") });
    return json({ quote, message: `Đã cập nhật phiên bản ${quote.version}.` });
  } catch (error) {
    if (error instanceof ZodError) return json({ error: "Dữ liệu báo giá chưa hợp lệ.", fields: flattenError(error).fieldErrors }, 422);
    if (error instanceof Error && /unique|quoteNumber/i.test(error.message)) return json({ error: "Số báo giá đang được dùng bởi một bản khác." }, 409);
    console.error("Could not update sales quote.", error);
    return json({ error: "Không thể cập nhật bản báo giá." }, 500);
  }
};

export const PATCH: APIRoute = async (context) => {
  const actor = requirePermission(context, "quote.edit");
  if (isResponse(actor)) return actor;
  try {
    const quote = await salesQuoteStorage.markExported(context.params.id || "");
    return json({ quote });
  } catch {
    return json({ error: "Không tìm thấy bản báo giá." }, 404);
  }
};
