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
  assert.match(styles, /\.admin-toast\[hidden\],\s*\.admin-shell-toast:empty\s*\{\s*display:\s*none\s*!important;\s*\}/);
});

test("new product editor starts clean and keeps checkbox controls compact", async () => {
  const [page, styles, script] = await Promise.all([
    read("src/pages/admin/san-pham.astro"),
    read("src/styles/admin-products.css"),
    read("src/scripts/admin-products.ts"),
  ]);
  assert.match(page, /const editorProduct = isCreating \? blankProduct/);
  assert.match(page, /requestedProduct \|\| catalogProducts\[0\] \|\| blankProduct/);
  assert.match(page, /hidden=\{catalogProducts\.length === 0\}/);
  assert.match(page, /data-table-empty hidden=\{catalogProducts\.length > 0\}/);
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

test("product search initializes reliably and searches the real SKU", async () => {
  const [page, script] = await Promise.all([
    read("src/pages/admin/san-pham.astro"),
    read("src/scripts/admin-products.ts"),
  ]);
  assert.match(script, /lifecycleRoot\.dataset\.productsInitialized/);
  assert.match(script, /document\.addEventListener\("astro:page-load", initAdminProducts\);\s*initAdminProducts\(\);/);
  assert.match(script, /if \(requestServer && !editorActive\)[\s\S]*?else history\.replaceState/);
  assert.doesNotMatch(script, /history\.replaceState[\s\S]*?if \(requestServer && !editorActive\)/);
  assert.match(page, /<form class="admin-product-search-form" action="\/admin\/san-pham" method="get" role="search"/);
  assert.match(page, /name="q" type="search"/);
  assert.match(page, /<script is:inline data-astro-rerun>/);
  assert.match(page, /search\.dataset\.autoSearchBound/);
  assert.match(page, /search\.addEventListener\("input", scheduleSearch\)/);
  assert.match(page, /search\.addEventListener\("compositionstart"/);
  assert.match(page, /search\.addEventListener\("compositionend"/);
  assert.match(page, /window\.setTimeout\(loadServerResults, 280\)/);
  assert.match(page, /window\.location\.replace\(target\)/);
  assert.doesNotMatch(page, /oninput=/);
  const searchForm = page.match(/<form class="admin-product-search-form"[\s\S]*?<\/form>/)?.[0] || "";
  assert.doesNotMatch(searchForm, /<button/);
  assert.match(page, /data-search=\{`\$\{product\.name\} \$\{product\.model\} \$\{product\.sku\} \$\{product\.id\}`/);
  assert.match(page, /SKU: \{product\.sku \|\| product\.id\.toUpperCase\(\)\}/);
});

test("product list groups related fields into a readable responsive table", async () => {
  const [page, styles] = await Promise.all([
    read("src/pages/admin/san-pham.astro"),
    read("src/styles/admin-products.css"),
  ]);
  assert.match(page, /Model & thương hiệu/);
  assert.match(page, /class="admin-product-identity"/);
  assert.match(page, /class="admin-product-details"/);
  assert.match(page, /class="admin-product-classification"/);
  assert.doesNotMatch(page, /class="admin-image-column"/);
  assert.match(styles, /\.admin-products-table \{[^}]*min-width: 1040px;[^}]*font-size: \.875rem;[^}]*line-height: 1\.5;/);
  assert.match(styles, /\.admin-product-identity \{[^}]*grid-template-columns: 56px minmax\(0, 1fr\);/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.admin-products-table tbody tr \{[\s\S]*grid-template-columns: 28px minmax\(0, 1fr\) 44px;/);
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
