import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cssUrl = new URL("../../src/styles/crm.css", import.meta.url);
const scriptUrl = new URL("../../src/scripts/crm.ts", import.meta.url);
const pageUrl = new URL("../../src/pages/admin/crm/quotes/index.astro", import.meta.url);

test("CRM quote list keeps semantic table cells and hides inactive states", async () => {
  const css = await readFile(cssUrl, "utf8");
  assert.doesNotMatch(css, /\.crm-table td:has\(> strong\)\s*\{\s*display:\s*grid/);
  assert.match(css, /\.crm-table td > strong\s*\{\s*display:\s*block/);
  assert.match(css, /\.crm-empty-state\[hidden\][^{]*\{\s*display:\s*none\s*!important/);
  assert.match(css, /\.quote-request-table\s*\{[^}]*table-layout:\s*fixed/);
});

test("CRM quote filters initialize on pages without CRM navigation", async () => {
  const [script, page] = await Promise.all([readFile(scriptUrl, "utf8"), readFile(pageUrl, "utf8")]);
  assert.match(script, /querySelector<HTMLElement>\("\.admin-main"\)/);
  assert.match(script, /applyFilters\(\);/);
  assert.match(page, /<th scope="col">Liên hệ<\/th>/);
});
