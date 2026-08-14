import type { APIRoute } from "astro";
import { getProductsPage, saveProduct } from "@/lib/content-repository";
import { isResponse, requirePermission } from "@/server/auth/http";
import { databaseConfigured } from "@/server/db";
import { productService } from "@/server/services/product-service";
import { adminProductService } from "@/server/services/admin-product-service";

export const GET: APIRoute = async (context) => {
  const actor = requirePermission(context, "product.view");
  if (isResponse(actor)) return actor;
  const page = Number(context.url.searchParams.get("page")) || 1;
  const pageSize = Number(context.url.searchParams.get("pageSize")) || 24;
  const query = context.url.searchParams.get("q") || "";
  if (!databaseConfigured) return Response.json(getProductsPage({ publicOnly: false, page, pageSize, query }), { headers: { "Cache-Control": "no-store" } });
  const all = (await productService.listAdminCatalog()).filter((product) => !query || `${product.name} ${product.model} ${product.brand} ${product.sku}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")));
  return Response.json({ products: all.slice((page - 1) * pageSize, page * pageSize), pagination: { page, pageSize, total: all.length, totalPages: Math.max(1, Math.ceil(all.length / pageSize)) } }, { headers: { "Cache-Control": "no-store" } });
};

export const POST: APIRoute = async (context) => {
  const actor = requirePermission(context, "product.create");
  if (isResponse(actor)) return actor;
  try {
    const body = await context.request.json();
    if (!body?.name?.trim()) return Response.json({ error: "Tên sản phẩm là bắt buộc." }, { status: 400 });
    if (body.action === "publish") {
      const publisher = requirePermission(context, "product.publish");
      if (isResponse(publisher)) return publisher;
    }
    const product = databaseConfigured ? await adminProductService.save(body) : saveProduct(body, body.action === "publish");
    return Response.json({ product, message: body.action === "publish" ? "Đã xuất bản sản phẩm." : "Đã lưu bản nháp." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("UNIQUE") ? "Slug hoặc SKU đã tồn tại." : "Không thể lưu sản phẩm.";
    return Response.json({ error: message }, { status: 409 });
  }
};
