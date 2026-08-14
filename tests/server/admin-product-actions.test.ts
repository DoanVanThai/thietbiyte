import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("product bulk actions persist through the product API", async () => {
  const [page, script] = await Promise.all([
    read("src/pages/admin/san-pham.astro"),
    read("src/scripts/admin-products.ts"),
  ]);

  assert.match(page, /data-bulk-action="published"/);
  assert.match(page, /data-bulk-action="unpublish"/);
  assert.match(page, /data-bulk-action="featured"/);
  assert.match(page, /data-bulk-action="archived"/);
  assert.match(page, /data-confirm-category/);
  assert.match(script, /mutateProducts/);
  assert.match(script, /method: "PATCH"/);
  assert.doesNotMatch(script, /đã áp dụng cho.*sản phẩm/);
});

test("product deletion is permission-gated and confirmed in the UI", async () => {
  const [page, script, endpoint] = await Promise.all([
    read("src/pages/admin/san-pham.astro"),
    read("src/scripts/admin-products.ts"),
    read("src/pages/api/admin/products/[id].ts"),
  ]);

  assert.match(page, /canDeleteProduct/);
  assert.match(page, /data-row-delete/);
  assert.match(page, /data-bulk-delete/);
  assert.match(page, /data-delete-dialog/);
  assert.match(script, /method: "DELETE"/);
  assert.match(endpoint, /requirePermission\(context, "product\.delete"\)/);
  assert.match(endpoint, /PRODUCT_IN_USE/);
});
