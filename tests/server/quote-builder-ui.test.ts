import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("quote product rows keep a native select that remains interactive after cloning", async () => {
  const page = await readFile(new URL("../../src/pages/admin/bao-gia.astro", import.meta.url), "utf8");
  assert.match(page, /<select name="productId" data-quote-product data-native-select>/);
});

test("quote builder exposes purposeful loading and entry states", async () => {
  const page = await readFile(new URL("../../src/pages/admin/bao-gia.astro", import.meta.url), "utf8");
  const script = await readFile(new URL("../../src/scripts/admin-quote-pdf.ts", import.meta.url), "utf8");
  const styles = await readFile(new URL("../../src/styles/admin-quote-pdf.css", import.meta.url), "utf8");
  assert.match(page, /data-quote-download-label/);
  assert.match(script, /button\.classList\.add\("is-loading"\)/);
  assert.match(script, /clone\.classList\.add\("is-entering"\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
