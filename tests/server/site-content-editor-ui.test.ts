import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("homepage solutions use a visual editor instead of pipe-delimited text", async () => {
  const page = await readFile(new URL("../../src/pages/admin/cai-dat-noi-dung.astro", import.meta.url), "utf8");
  assert.match(page, /data-solutions-editor/);
  assert.match(page, /data-solution-preview/);
  assert.match(page, /data-solution-upload/);
  assert.match(page, /data-solution-up/);
  assert.doesNotMatch(page, /name="homepage\.solutions"/);
});

test("solution image upload updates the item and registers the media asset", async () => {
  const script = await readFile(new URL("../../src/scripts/admin-site-content.ts", import.meta.url), "utf8");
  assert.match(script, /registerUploadedMedia/);
  assert.match(script, /imageValue\.value = result\.url/);
  assert.match(script, /activeSolutionUploads > 0/);
  assert.match(script, /collectSolutions\(\)/);
});

test("site settings and homepage content are persisted in one atomic request", async () => {
  const script = await readFile(new URL("../../src/scripts/admin-site-content.ts", import.meta.url), "utf8");
  const endpoint = await readFile(new URL("../../src/pages/api/admin/site-content.ts", import.meta.url), "utf8");
  assert.match(script, /fetch\("\/api\/admin\/site-content", \{ method: "PUT"/);
  assert.doesNotMatch(script, /fetch\("\/api\/admin\/settings"/);
  assert.match(script, /readBackMatches/);
  assert.match(endpoint, /saveSiteContentBundle/);
  assert.match(endpoint, /settings\.manage/);
  assert.match(endpoint, /article\.manage/);
});
