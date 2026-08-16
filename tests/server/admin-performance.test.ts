import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ProductRepository } from "../../src/server/repositories/product-repository";

const read = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("Admin uses client navigation, persistent sidebar and bounded prefetch", async () => {
  const [layout, sidebar, config, navigation] = await Promise.all([
    read("src/layouts/AdminLayout.astro"),
    read("src/components/AdminSidebar.astro"),
    read("astro.config.mjs"),
    read("src/scripts/admin-navigation.ts"),
  ]);
  assert.match(layout, /<ClientRouter fallback="swap"/);
  assert.match(sidebar, /transition:persist="admin-sidebar"/);
  assert.match(sidebar, /data-astro-prefetch=/);
  assert.match(config, /prefetchAll:\s*false/);
  assert.match(navigation, /astro:before-preparation/);
  assert.match(navigation, /astro:page-load/);
});

test("Admin hot lists use bounded server pagination and compact notifications", async () => {
  const [products, crm, topbar] = await Promise.all([
    read("src/server/repositories/product-repository.ts"),
    read("src/server/repositories/crm-repository.ts"),
    read("src/components/AdminTopbar.astro"),
  ]);
  assert.match(products, /listAdminPage/);
  assert.match(products, /take:\s*Math\.min\(100/);
  assert.match(crm, /listQuotesPage/);
  assert.match(crm, /quoteNotificationSummary/);
  assert.doesNotMatch(topbar, /crmViewQuotes/);
});

test("Admin mutations refresh through the client router instead of location.reload", async () => {
  const [taxonomy, crm, access] = await Promise.all([
    read("src/scripts/admin-taxonomy.ts"),
    read("src/scripts/crm.ts"),
    read("src/scripts/admin-access.ts"),
  ]);
  assert.doesNotMatch(`${taxonomy}\n${crm}\n${access}`, /location\.reload\(\)/);
  assert.match(taxonomy, /admin:refresh/);
  assert.match(crm, /admin:refresh/);
  assert.match(access, /admin:refresh/);
});

test("Admin shell toast stays out of the layout until feedback is shown", async () => {
  const [layout, styles] = await Promise.all([
    read("src/layouts/AdminLayout.astro"),
    read("src/styles/admin.css"),
  ]);
  assert.match(layout, /data-admin-shell-toast hidden/);
  assert.match(styles, /\.admin-toast\[hidden\]\s*\{\s*display:\s*none;\s*\}/);
});

test("new product editor starts clean and keeps checkbox controls compact", async () => {
  const [page, styles, script] = await Promise.all([
    read("src/pages/admin/san-pham.astro"),
    read("src/styles/admin-products.css"),
    read("src/scripts/admin-products.ts"),
  ]);
  assert.match(page, /const editorProduct = isCreating \? blankProduct/);
  assert.match(page, /gallery: \[\], features: \[\], configurations: \[\]/);
  assert.match(page, /value=\{isCreating \? "" : editorProduct\.sku\}/);
  assert.match(styles, /input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\):not\(\[type="file"\]\)/);
  assert.match(styles, /\.admin-featured-toggle > input:checked \+ span/);
  assert.match(script, /!isNewProduct&&selectedProduct\?\.brand===brand/);
  assert.match(page, /data-generate-slug/);
  assert.match(page, /data-generate-sku/);
  assert.match(script, /slugFollowsName/);
  assert.match(script, /crypto\.getRandomValues/);
  assert.match(page, /Giá dùng cho báo giá/);
  assert.doesNotMatch(page, /data-price-input hidden=/);
  assert.match(script, /priceVnd:quotePrice\?Number\(quotePrice\):undefined/);
});

test("product listing stays bounded at 50 rows for 10 through 10,000 records", async () => {
  for (const total of [10, 100, 1_000, 10_000]) {
    let query: Record<string, unknown> = {};
    const client = {
      product: {
        findMany: (options: Record<string, unknown>) => { query = options; return Promise.resolve(Array.from({ length: Math.min(50, total) }, (_, id) => ({ id }))); },
        count: () => Promise.resolve(total),
      },
      $transaction: (operations: Array<Promise<unknown>>) => Promise.all(operations),
    };
    const repository = new ProductRepository(client as never);
    const result = await repository.listAdminPage(1, 50, { search: "Sono", status: "published" });
    assert.equal(query.take, 50);
    assert.equal(query.skip, 0);
    assert.equal(result.records.length, Math.min(50, total));
    assert.equal(result.pagination.totalPages, Math.max(1, Math.ceil(total / 50)));
    assert.deepEqual((query.where as { status: string }).status, "PUBLISHED");
  }
});
