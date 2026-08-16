import type { APIRoute } from "astro";
import { isResponse, requirePermission } from "@/server/auth/http";
import { productImportTemplate } from "@/server/validation/product-import";

export const GET: APIRoute = async (context) => {
  const actor = requirePermission(context, "product.create");
  if (isResponse(actor)) return actor;

  return new Response(`${JSON.stringify(productImportTemplate, null, 2)}\n`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="thien-loc-product-import-v1.sample.json"',
      "X-Content-Type-Options": "nosniff",
    },
  });
};
