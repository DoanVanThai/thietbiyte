import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("quote products use a multi-select searchable picker and compact cards", async () => {
  const [page, script] = await Promise.all([
    readFile(new URL("../../src/pages/admin/bao-gia.astro", import.meta.url), "utf8"),
    readFile(new URL("../../src/scripts/admin-quote-pdf.ts", import.meta.url), "utf8"),
  ]);
  assert.match(page, /data-product-picker/);
  assert.match(page, /data-product-picker-search/);
  assert.match(page, /data-quote-line-total/);
  assert.match(page, /data-open-config/);
  assert.match(script, /renderProductPicker/);
  assert.match(script, /pickerSelection/);
});

test("quote builder exposes purposeful loading and entry states", async () => {
  const page = await readFile(new URL("../../src/pages/admin/bao-gia.astro", import.meta.url), "utf8");
  const script = await readFile(new URL("../../src/scripts/admin-quote-pdf.ts", import.meta.url), "utf8");
  const styles = await readFile(new URL("../../src/styles/admin-quote-pdf.css", import.meta.url), "utf8");
  assert.match(page, /data-quote-download-label/);
  assert.match(page, /data-export-format="word"/);
  assert.match(script, /activeButton\.classList\.add\("is-loading"\)/);
  assert.match(script, /item\.classList\.add\("is-entering"\)/);
  assert.match(script, /quote-image-anchor-field/);
  assert.match(styles, /grid-template-areas:/);
  assert.match(styles, /quote-image-anchor-select/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("quote builder V2 keeps long configuration and images in drawers", async () => {
  const [page, script, styles] = await Promise.all([
    readFile(new URL("../../src/pages/admin/bao-gia.astro", import.meta.url), "utf8"),
    readFile(new URL("../../src/scripts/admin-quote-pdf.ts", import.meta.url), "utf8"),
    readFile(new URL("../../src/styles/admin-quote-pdf.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /data-config-drawer/);
  assert.match(page, /data-image-drawer/);
  assert.match(page, /data-quote-accordion-toggle/);
  assert.match(page, /data-quote-save-state/);
  assert.match(page, /data-preview-dialog/);
  assert.match(script, /beforeunload/);
  assert.match(script, /data-move-quote-item/);
  assert.match(script, /data-duplicate-quote-item/);
  assert.match(script, /data-config-include/);
  assert.match(styles, /width: min\(720px, 60vw\)/);
  assert.match(styles, /\.quote-workspace-header \{/);
  assert.match(styles, /\.quote-mobile-bar \{/);
});

test("quote builder formats descriptions and reopens saved quotes", async () => {
  const [page, script, styles, storage] = await Promise.all([
    readFile(new URL("../../src/pages/admin/bao-gia.astro", import.meta.url), "utf8"),
    readFile(new URL("../../src/scripts/admin-quote-pdf.ts", import.meta.url), "utf8"),
    readFile(new URL("../../src/styles/admin-quote-pdf.css", import.meta.url), "utf8"),
    readFile(new URL("../../src/server/services/sales-quote-storage.ts", import.meta.url), "utf8"),
  ]);
  assert.match(page, /data-rich-command="bold"/);
  assert.match(page, /data-rich-command="underline"/);
  assert.match(page, /data-rich-command="red"/);
  assert.match(page, /data-saved-quotes-list/);
  assert.match(page, /<dialog class="quote-saved-dialog"/);
  assert.match(page, /data-saved-quotes-pagination/);
  assert.match(script, /descriptionRich:/);
  assert.match(script, /\/api\/admin\/sales-quotes/);
  assert.match(script, /openSavedQuote/);
  assert.match(script, /savedQuotesPageSize = 9/);
  assert.match(page, /Tìm theo tên sản phẩm/);
  assert.match(script, /savedQuoteTitle/);
  assert.match(storage, /productNames: productNamesOf\(quote\.payload\)/);
  assert.match(styles, /\.quote-file-name-dialog > form \{[\s\S]*display: block;/);
});

test("quote export accepts an optional quote number and confirms the download name", async () => {
  const [page, script, styles] = await Promise.all([
    readFile(new URL("../../src/pages/admin/bao-gia.astro", import.meta.url), "utf8"),
    readFile(new URL("../../src/scripts/admin-quote-pdf.ts", import.meta.url), "utf8"),
    readFile(new URL("../../src/styles/admin-quote-pdf.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /data-quote-file-dialog/);
  assert.doesNotMatch(page, /<input name="quoteNumber"[^>]*\srequired/);
  assert.match(page, /data-default-quote-number/);
  assert.match(script, /requestFileName/);
  assert.match(script, /chosenFileName/);
  assert.match(script, /download\.download = `\$\{chosenFileName\}\.\$\{extension\}`/);
  assert.match(styles, /\.quote-file-name-dialog/);
  assert.match(styles, /\.quote-save-button\s*\{\s*width: calc\(100% - var\(--space-10\)\);\s*margin: 0 var\(--space-5\) var\(--space-2\);/);
});
