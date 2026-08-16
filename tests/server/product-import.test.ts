import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  PRODUCT_IMPORT_SCHEMA_VERSION,
  productImportSchema,
  productImportTemplate,
  productImportToCmsPayload,
} from "../../src/server/validation/product-import";

const read = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");
const cloneTemplate = () => structuredClone(productImportTemplate) as Record<string, any>;

test("product import template follows the strict v1 contract", () => {
  const parsed = productImportSchema.parse(productImportTemplate);
  assert.equal(parsed.schemaVersion, PRODUCT_IMPORT_SCHEMA_VERSION);
  assert.equal(parsed.products.length, 1);
  assert.equal(parsed.products[0].sku, "SKU-MAU-001");
});

test("product import rejects missing and unknown fields", () => {
  const missing = cloneTemplate();
  delete missing.products[0].model;
  assert.equal(productImportSchema.safeParse(missing).success, false);

  const unknown = cloneTemplate();
  unknown.products[0].unapprovedField = "không được phép";
  const result = productImportSchema.safeParse(unknown);
  assert.equal(result.success, false);
  if (!result.success) assert.ok(result.error.issues.some((issue) => issue.code === "unrecognized_keys"));
});

test("product import rejects invalid URLs and multiple cover images", () => {
  const invalid = cloneTemplate();
  invalid.products[0].images[0].url = "http://insecure.example/image.jpg";
  invalid.products[0].images.push({ ...invalid.products[0].images[0], url: "/images/second.webp", isCover: true });
  const result = productImportSchema.safeParse(invalid);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.error.issues.some((issue) => issue.path.join(".").includes("images.0.url")));
    assert.ok(result.error.issues.some((issue) => issue.message.includes("một ảnh bìa")));
  }
});

test("product import maps to the existing CMS draft payload", () => {
  const product = productImportSchema.parse(productImportTemplate).products[0];
  const payload = productImportToCmsPayload(product);
  assert.equal(payload.action, "draft");
  assert.equal(payload.publishStatus, "draft");
  assert.equal(payload.brand, product.brand.name);
  assert.equal(payload.image, product.images[0].url);
  assert.equal(payload.detail.specificationGroups[0].items[0].label, "Thông số mẫu");
});

test("product admin exposes template download, strict validation and preview import UI", async () => {
  const [page, script, endpoint, templateEndpoint, validation] = await Promise.all([
    read("src/pages/admin/san-pham.astro"),
    read("src/scripts/admin-products.ts"),
    read("src/pages/api/admin/products/import.ts"),
    read("src/pages/api/admin/products/import-template.ts"),
    read("src/server/validation/product-import.ts"),
  ]);
  assert.match(page, /data-open-product-import/);
  assert.match(page, /data-product-import-dialog/);
  assert.match(page, /Tải JSON mẫu/);
  assert.match(script, /action: \"validate\" \| \"import\"/);
  assert.match(script, /data-product-import-preview-list/);
  assert.match(endpoint, /requirePermission\(context, "product\.create"\)/);
  assert.match(endpoint, /productImportSchema\.safeParse/);
  assert.match(validation, /publishStatus: "draft"/);
  assert.match(templateEndpoint, /Content-Disposition/);
});
