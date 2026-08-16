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
  assert.match(script, /showAllConfigSections/);
  assert.match(styles, /width: min\(720px, 60vw\)/);
  assert.match(styles, /\.quote-image-drawer \{ width: min\(860px, calc\(100vw - 24px\)\); max-width: calc\(100vw - 24px\); \}/);
  assert.match(styles, /\.quote-config-drawer \.quote-rich-editor \{ min-height: min\(560px, calc\(100dvh - 260px\)\);/);
  assert.match(styles, /\.quote-workspace-header \{/);
  assert.match(styles, /\.quote-mobile-bar \{/);
  assert.match(styles, /\.quote-preview-loading\[hidden\]\s*\{\s*display:\s*none\s*!important;\s*\}/);
  assert.match(styles, /\.quote-preview-loading\s*\{[^}]*pointer-events:\s*none;/);
  assert.match(styles, /\.quote-product-picker \{[\s\S]*height: min\(720px, calc\(100dvh - 28px\)\);[\s\S]*overflow: hidden;/);
  assert.match(styles, /\.quote-picker-shell \{ height: 100%; min-height: 0;/);
});

test("quote builder V3 removes duplicate actions and keeps the editing hierarchy compact", async () => {
  const [page, script, styles] = await Promise.all([
    readFile(new URL("../../src/pages/admin/bao-gia.astro", import.meta.url), "utf8"),
    readFile(new URL("../../src/scripts/admin-quote-pdf.ts", import.meta.url), "utf8"),
    readFile(new URL("../../src/styles/admin-quote-pdf.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /class="quote-export-menu"/);
  assert.match(page, /data-export-format="pdf"/);
  assert.match(page, /data-export-format="word"/);
  assert.match(page, /data-duplicate-quote/);
  assert.match(page, /class="quote-item-footer"/);
  assert.match(page, /name="unitPrice" type="text"[^>]+data-quote-price/);
  assert.doesNotMatch(page, /data-save-and-export/);
  assert.doesNotMatch(page, /data-nav-state/);
  assert.doesNotMatch(page, /Quản lý sản phẩm/);
  assert.match(script, /setSectionExpanded/);
  assert.match(script, /Sẵn sàng xuất báo giá/);
  assert.match(script, /parsePrice/);
  assert.match(script, /data-duplicate-quote/);
  assert.match(styles, /--quote-header-height: 60px/);
  assert.match(styles, /--quote-nav-height: 44px/);
  assert.match(styles, /grid-template-columns: minmax\(0, 4fr\) minmax\(240px, 1fr\)/);
  assert.match(styles, /grid-template-columns: minmax\(96px, \.5fr\) minmax\(180px, 1fr\) minmax\(180px, 1fr\)/);
  assert.match(styles, /\.quote-builder-side > \.quote-export-actions \{ margin: 0 16px 16px; \}/);
});

test("quote builder adapts naturally from tablet to small mobile", async () => {
  const [page, script, styles, adminScript, sidebar] = await Promise.all([
    readFile(new URL("../../src/pages/admin/bao-gia.astro", import.meta.url), "utf8"),
    readFile(new URL("../../src/scripts/admin-quote-pdf.ts", import.meta.url), "utf8"),
    readFile(new URL("../../src/styles/admin-quote-pdf.css", import.meta.url), "utf8"),
    readFile(new URL("../../src/scripts/admin.ts", import.meta.url), "utf8"),
    readFile(new URL("../../src/components/AdminSidebar.astro", import.meta.url), "utf8"),
  ]);
  assert.match(page, /quote-mobile-admin-menu[^>]+data-admin-menu-open/);
  assert.match(adminScript, /mobileMenuButtons/);
  assert.match(adminScript, /max-width: 1199px/);
  assert.match(sidebar, /data-sidebar-mobile-icon/);
  assert.match(styles, /@media \(max-width: 1199px\)[\s\S]*\.quote-builder form\[data-quote-form\] \{ grid-template-columns: 1fr; \}/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*\.quote-item-edit-grid \{ grid-template-columns: 1fr;/);
  assert.match(styles, /\.quote-mobile-summary \{ position: fixed; inset: auto 0 0; width: 100%; max-width: none;/);
  assert.match(styles, /env\(safe-area-inset-bottom\)/);
  assert.match(styles, /@media \(max-width: 399px\)/);
  assert.match(script, /quote-mobile-summary-count/);
  assert.match(script, /data-mobile-export="word"/);
  assert.match(script, /descriptionSnapshots = new WeakMap/);
  assert.match(script, /ensureDescriptionEditor/);
});

test("mobile quote dialogs stay attached to the viewport on iOS Safari", async () => {
  const styles = await readFile(new URL("../../src/styles/admin-quote-pdf.css", import.meta.url), "utf8");
  assert.match(styles, /\.quote-builder dialog:not\(\[open\]\) \{[\s\S]*?display: none !important;/);
  assert.match(styles, /\.quote-saved-dialog \{ position: fixed; z-index: var\(--z-modal\); inset: 0; width: 100vw; max-width: none; height: 100dvh;/);
  assert.match(styles, /\.quote-saved-dialog\[open\] \{ display: grid; \}/);
  assert.match(styles, /\.quote-product-picker,[\s\S]*\.quote-preview-dialog \{ position: fixed; inset: 0;/);
  assert.match(styles, /\.quote-drawer \{[\s\S]*position: fixed;[\s\S]*inset: 0 0 0 auto;[\s\S]*max-height: 100dvh;[\s\S]*overflow: hidden;/);
  assert.match(styles, /\.quote-drawer-shell \{[\s\S]*grid-template-rows: auto minmax\(0, 1fr\) auto;[\s\S]*overflow: hidden;/);
  assert.match(styles, /\.quote-image-drawer \.quote-image-fields :is\(input, select\) \{[\s\S]*width: 100%;[\s\S]*min-width: 0;[\s\S]*max-width: 100%;/);
  assert.match(styles, /dialog\[open\]\) \.quote-mobile-bar \{ display: none; \}/);
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
  assert.match(page, /<textarea name="customerAddress" rows="1" data-auto-grow><\/textarea>/);
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
