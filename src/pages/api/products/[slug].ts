import type { APIRoute } from "astro";
import { productService } from "@/server/services/product-service";

export const GET: APIRoute = async ({ params }) => {
  const product = await productService.getPublicDetail(params.slug || "");
  return product
    ? Response.json({ product }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } })
    : Response.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });
};
