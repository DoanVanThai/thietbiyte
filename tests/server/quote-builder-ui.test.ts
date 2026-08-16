import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("quote product rows use an independent searchable combobox", async () => {
  const [page, script] = await Promise.all([
    readFile(new URL("../../src/pages/admin/bao-gia.astro", import.meta.url), "utf8"),
    readFile(new URL("../../src/scripts/admin-quote-pdf.ts", import.meta.url), "utf8"),
  ]);
  assert.match(page, /data-quote-product-combobox/);
  assert.match(page, /data-quote-product-search/);
  assert.match(script, /renderProductOptions/);
  assert.match(script, /chooseProduct/);
});

test("quote builder exposes purposeful loading and entry states", async () => {
  const page = await readFile(new URL("../../src/pages/admin/bao-gia.astro", import.meta.url), "utf8");
  const script = await readFile(new URL("../../src/scripts/admin-quote-pdf.ts", import.meta.url), "utf8");
  const styles = await readFile(new URL("../../src/styles/admin-quote-pdf.css", import.meta.url), "utf8");
  assert.match(page, /data-quote-download-label/);
  assert.match(page, /data-export-format="word"/);
  assert.match(script, /activeButton\.classList\.add\("is-loading"\)/);
  assert.match(script, /clone\.classList\.add\("is-entering"\)/);
  assert.match(script, /quote-image-anchor-field/);
  assert.match(styles, /grid-template-areas:/);
  assert.match(styles, /quote-image-anchor-select/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("quote builder formats descriptions and reopens saved quotes", async () => {
  const [page, script, styles] = await Promise.all([
    readFile(new URL("../../src/pages/admin/bao-gia.astro", import.meta.url), "utf8"),
    readFile(new URL("../../src/scripts/admin-quote-pdf.ts", import.meta.url), "utf8"),
    readFile(new URL("../../src/styles/admin-quote-pdf.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /data-rich-command="bold"/);
  assert.match(page, /data-rich-command="underline"/);
  assert.match(page, /data-rich-command="red"/);
  assert.match(page, /data-saved-quotes-list/);
  assert.match(script, /descriptionRich:/);
  assert.match(script, /\/api\/admin\/sales-quotes/);
  assert.match(script, /openSavedQuote/);
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
