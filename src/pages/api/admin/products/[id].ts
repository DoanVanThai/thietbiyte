import type { APIRoute } from "astro";
import { deleteProduct, duplicateProduct, getProductById, saveProduct, setProductStatus, type PublishStatus } from "@/lib/content-repository";
import { isResponse, requirePermission } from "@/server/auth/http";
import { databaseConfigured } from "@/server/db";
import { adminProductService } from "@/server/services/admin-product-service";

export const GET: APIRoute = async (context) => {
  const actor = requirePermission(context, "product.view");
  if (isResponse(actor)) return actor;
  const product = databaseConfigured ? await adminProductService.get(context.params.id || "") : getProductById(context.params.id || "");
  return product ? Response.json({ product }, { headers: { "Cache-Control": "no-store" } }) : Response.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
};

export const PATCH: APIRoute = async (context) => {
  const body = await context.request.json();
  const permission = body.action === "duplicate" ? "product.create" : ["published", "publish", "unpublish"].includes(body.action) ? "product.publish" : "product.edit";
  const actor = requirePermission(context, permission);
  if (isResponse(actor)) return actor;
  const id = context.params.id || "";
  const existing = databaseConfigured ? await adminProductService.get(id) : getProductById(id);
  if (!existing) return Response.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
  if (body.action === "duplicate") return Response.json({ product: databaseConfigured ? await adminProductService.duplicate(id) : duplicateProduct(id) }, { headers: { "Cache-Control": "no-store" } });
  // Status-only actions intentionally carry no product payload. Editor saves may
  // also target draft/published, but must persist the edited content first.
  if (body.action === "unpublish") return Response.json({ product: databaseConfigured ? await adminProductService.save({ ...existing, action: "draft", publishStatus: "draft" }, id) : setProductStatus(id, "draft") }, { headers: { "Cache-Control": "no-store" } });
  if (["draft", "published", "archived"].includes(body.action) && !body.name) return Response.json({ product: databaseConfigured ? body.action === "archived" ? await adminProductService.archive(id) : await adminProductService.save({ ...existing, action: body.action, publishStatus: body.action }, id) : setProductStatus(id, body.action as PublishStatus) }, { headers: { "Cache-Control": "no-store" } });
  try { return Response.json({ product: databaseConfigured ? await adminProductService.save({ ...existing, ...body }, id) : saveProduct({ ...existing, ...body, id }, body.action === "publish") }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return Response.json({ error: error instanceof Error && error.message.includes("UNIQUE") ? "Slug hoặc SKU đã tồn tại." : "Không thể cập nhật sản phẩm." }, { status: 409 }); }
};

const removeProduct: APIRoute = async (context) => {
  const actor = requirePermission(context, "product.delete");
  if (isResponse(actor)) return actor;
  const id = context.params.id || "";
  const existing = databaseConfigured ? await adminProductService.get(id) : getProductById(id);
  if (!existing) return Response.json({ error: "Không tìm thấy sản phẩm." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  try {
    if (databaseConfigured) await adminProductService.delete(id);
    else deleteProduct(id);
    return Response.json({ ok: true, id, message: "Đã xóa sản phẩm." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "P2003") return Response.json({ code: "PRODUCT_IN_USE", error: "Sản phẩm đang được dùng trong yêu cầu báo giá. Hãy lưu trữ sản phẩm thay vì xóa." }, { status: 409, headers: { "Cache-Control": "no-store" } });
    return Response.json({ error: "Không thể xóa sản phẩm. Vui lòng thử lại." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
};

export const DELETE = removeProduct;

export const POST: APIRoute = async (context) => {
  const body = await context.request.json().catch(() => null) as { action?: string } | null;
  if (body?.action !== "delete") return Response.json({ error: "Thao tác sản phẩm không hợp lệ." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  return removeProduct(context);
};
