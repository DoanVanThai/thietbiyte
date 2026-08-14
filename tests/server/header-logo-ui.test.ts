import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public header renders the company logo prominently without crowding navigation", async () => {
  const header = await readFile(new URL("../../src/components/Header.astro", import.meta.url), "utf8");
  const styles = await readFile(new URL("../../src/styles/global.css", import.meta.url), "utf8");
  assert.match(header, /wordmark-with-logo/);
  assert.match(styles, /\.site-header \.wordmark-with-logo \{[\s\S]*?width: 116px;/);
  assert.match(styles, /\.site-header \.wordmark-with-logo \.wordmark-logo \{[\s\S]*?max-width: none;/);
});
