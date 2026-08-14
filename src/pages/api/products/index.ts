import type { APIRoute } from "astro";
import { productService } from "@/server/services/product-service";

export const GET: APIRoute = async ({ url }) => Response.json(
  await productService.listPublicCatalogPage(Number(url.searchParams.get("page")) || 1, Number(url.searchParams.get("pageSize")) || 24),
  { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
);
