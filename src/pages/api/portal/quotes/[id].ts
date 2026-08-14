import type { APIRoute } from "astro";
import { db } from "@/server/db";
import { errorJson, isResponse, json, requireCustomer } from "@/server/auth/http";

export const GET: APIRoute = async (context) => {
  const actor = requireCustomer(context); if (isResponse(actor)) return actor;
  const quote = await db.quoteRequest.findFirst({
    where: { OR: [{ id: String(context.params.id) }, { quoteNumber: String(context.params.id) }], customer: { userId: actor.id } },
    include: { items: { include: { product: true } }, customerUpdates: { orderBy: { createdAt: "asc" } }, documents: { where: { access: "CUSTOMER" } } },
  });
  if (!quote) return errorJson(404, "NOT_FOUND", "Không tìm thấy yêu cầu báo giá.");
  return json({ quote: {
    number: quote.quoteNumber, date: quote.createdAt, status: quote.status,
    products: quote.items.map((item) => ({ name: item.product.name, model: item.product.model, quantity: item.quantity, note: item.note || "" })),
    updates: quote.customerUpdates.map((update) => ({ status: update.status, title: update.title, detail: update.detail, createdAt: update.createdAt })),
    attachments: quote.documents.map((file) => ({ name: file.name, size: file.fileSize })),
  } });
};
