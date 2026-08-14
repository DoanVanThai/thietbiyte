import type { APIRoute } from "astro";
import { ZodError, flattenError } from "zod";
import { getSettings } from "@/lib/content-repository";
import { isResponse, requestIp, requirePermission } from "@/server/auth/http";
import { audit } from "@/server/auth/service";
import { createSalesQuoteDocx } from "@/server/services/sales-quote-docx";
import { quoteFileName, resolveQuoteItems } from "@/server/services/sales-quote-document";
import { salesQuotePdfInput } from "@/server/validation/sales-quote";

export const POST: APIRoute = async (context) => {
  const actor = requirePermission(context, "quote.edit");
  if (isResponse(actor)) return actor;
  try {
    const input = salesQuotePdfInput.parse(await context.request.json());
    const items = await resolveQuoteItems(input);
    if (!items) return Response.json({ error: "Có sản phẩm không còn tồn tại." }, { status: 404 });
    const settings = getSettings();
    const word = await createSalesQuoteDocx(input, { name: settings.company, hotline: settings.hotline, email: settings.email }, items);
    await audit("quote.word_generated", actor.id, null, "sales-quote", "success", {
      quoteNumber: input.quoteNumber,
      productIds: items.map((item) => item.productId),
      customer: input.customer.organization || input.customer.name,
      total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    }, { ip: requestIp(context.request), userAgent: context.request.headers.get("user-agent") }).catch((error) => console.error("Could not write quote Word audit event.", error));
    const body = new Uint8Array(word.byteLength);
    body.set(word);
    return new Response(body.buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${quoteFileName(input.quoteNumber)}.docx"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) return Response.json({ error: "Dữ liệu báo giá chưa hợp lệ.", fields: flattenError(error).fieldErrors }, { status: 422 });
    console.error("Quote Word generation failed.", error);
    return Response.json({ error: "Không thể tạo file Word báo giá." }, { status: 500 });
  }
};
