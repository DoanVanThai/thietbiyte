import type { APIRoute } from "astro";
import { z } from "zod";
import { deleteProduct, getProducts, saveProduct } from "@/lib/content-repository";
import { isResponse, requirePermission } from "@/server/auth/http";
import { databaseConfigured } from "@/server/db";
import { adminProductService } from "@/server/services/admin-product-service";
import { productService } from "@/server/services/product-service";
import {
  formatProductImportIssues,
  productImportSchema,
  productImportToCmsPayload,
  type ProductImportDocument,
  type ProductImportError,
} from "@/server/validation/product-import";

const requestSchema = z.object({
  action: z.enum(["validate", "import"]),
  document: z.unknown(),
}).strict();

const normalizedKey = (value: string) => value.trim().toLocaleLowerCase("vi");

const duplicateErrors = async (document: ProductImportDocument): Promise<ProductImportError[]> => {
  const errors: ProductImportError[] = [];
  const seenSlugs = new Map<string, number>();
  const seenSkus = new Map<string, number>();

  document.products.forEach((product, index) => {
    const slug = normalizedKey(product.slug);
    const sku = normalizedKey(product.sku);
    const slugIndex = seenSlugs.get(slug);
    const skuIndex = seenSkus.get(sku);
    if (slugIndex !== undefined) errors.push({ path: `products[${index}].slug`, message: `Trùng với sản phẩm ${slugIndex + 1} trong cùng file.` });
    if (skuIndex !== undefined) errors.push({ path: `products[${index}].sku`, message: `Trùng với sản phẩm ${skuIndex + 1} trong cùng file.` });
    seenSlugs.set(slug, index);
    seenSkus.set(sku, index);
  });

  const existing = databaseConfigured ? await productService.listAdminCatalog() : getProducts(false);
  const existingSlugs = new Set(existing.map((product) => normalizedKey(product.slug)));
  const existingSkus = new Set(existing.map((product) => normalizedKey(product.sku)));
  document.products.forEach((product, index) => {
    if (existingSlugs.has(normalizedKey(product.slug))) errors.push({ path: `products[${index}].slug`, message: "Slug đã tồn tại trong hệ thống." });
    if (existingSkus.has(normalizedKey(product.sku))) errors.push({ path: `products[${index}].sku`, message: "SKU đã tồn tại trong hệ thống." });
  });

  return errors;
};

const previewFor = (document: ProductImportDocument) => document.products.map((product, index) => ({
  index,
  name: product.name,
  sku: product.sku,
  model: product.model,
  brand: product.brand.name,
  category: product.category.name,
  imageCount: product.images.length,
  configurationCount: product.configurations.reduce((total, group) => total + group.items.length, 0),
  specificationCount: product.specificationGroups.reduce((total, group) => total + group.items.length, 0),
}));

export const POST: APIRoute = async (context) => {
  const actor = requirePermission(context, "product.create");
  if (isResponse(actor)) return actor;
  const contentLength = Number(context.request.headers.get("content-length") || 0);
  if (contentLength > 12 * 1024 * 1024) return Response.json({ ok: false, errors: [{ path: "file", message: "File vượt quá dung lượng tối đa 5 MB." }] }, { status: 413 });

  let raw: unknown;
  try { raw = await context.request.json(); }
  catch { return Response.json({ ok: false, errors: [{ path: "file", message: "Không đọc được nội dung JSON." }] }, { status: 400 }); }

  const requestResult = requestSchema.safeParse(raw);
  if (!requestResult.success) return Response.json({ ok: false, errors: formatProductImportIssues(requestResult.error) }, { status: 400 });

  const documentResult = productImportSchema.safeParse(requestResult.data.document);
  if (!documentResult.success) return Response.json({ ok: false, errors: formatProductImportIssues(documentResult.error) }, { status: 422 });

  const duplicates = await duplicateErrors(documentResult.data);
  if (duplicates.length) return Response.json({ ok: false, errors: duplicates }, { status: 409 });

  const preview = previewFor(documentResult.data);
  if (requestResult.data.action === "validate") return Response.json({ ok: true, preview }, { headers: { "Cache-Control": "no-store" } });

  const created: Array<{ id: string; name: string; slug: string }> = [];
  try {
    for (const product of documentResult.data.products) {
      const payload = productImportToCmsPayload(product);
      const saved = databaseConfigured ? await adminProductService.save(payload) : saveProduct(payload, false);
      if (!saved) throw new Error("Không thể tạo sản phẩm.");
      created.push({ id: saved.id, name: saved.name, slug: saved.slug });
    }
  } catch (error) {
    const retained: typeof created = [];
    for (const product of [...created].reverse()) {
      try {
        if (databaseConfigured) await adminProductService.delete(product.id);
        else deleteProduct(product.id);
      } catch { retained.push(product); }
    }
    const duplicate = error instanceof Error && /unique|duplicate/i.test(error.message);
    return Response.json({
      ok: false,
      created: retained,
      errors: [{ path: "products", message: duplicate ? "Slug hoặc SKU đã tồn tại trong hệ thống." : retained.length ? "Không thể tạo toàn bộ sản phẩm và còn bản nháp chưa hoàn tác. Vui lòng kiểm tra danh sách." : "Không thể tạo toàn bộ sản phẩm. Không có bản nháp nào được giữ lại." }],
    }, { status: 409 });
  }

  return Response.json({
    ok: true,
    created,
    message: `Đã nhập ${created.length} sản phẩm ở trạng thái bản nháp.`,
  }, { status: 201, headers: { "Cache-Control": "no-store" } });
};
