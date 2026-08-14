import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ADMIN_IMAGE_ACCEPT, MAX_ADMIN_IMAGE_BYTES, validateAdminImage } from "../../src/lib/admin-image-upload";

const read = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");
const image = (name: string, type: string, size = 1024) => ({ name, type, size }) as File;

test("mobile image validation accepts iPhone and modern image formats up to 15 MB", () => {
  assert.match(ADMIN_IMAGE_ACCEPT, /image\/heic/);
  assert.match(ADMIN_IMAGE_ACCEPT, /\.heif/);
  assert.match(ADMIN_IMAGE_ACCEPT, /image\/avif/);
  assert.equal(MAX_ADMIN_IMAGE_BYTES, 15 * 1024 * 1024);
  assert.equal(validateAdminImage(image("iphone.HEIC", "")), null);
  assert.equal(validateAdminImage(image("photo.avif", "image/avif")), null);
  assert.match(validateAdminImage(image("photo.jpg", "image/jpeg", MAX_ADMIN_IMAGE_BYTES + 1)) || "", /15 MB/);
  assert.match(validateAdminImage(image("payload.exe", "application/octet-stream")) || "", /Chỉ hỗ trợ ảnh/);
});

test("upload API decodes HEIC HEIF and AVIF as images instead of storing raw files", async () => {
  const api = await read("src/pages/api/admin/upload.ts");
  assert.match(api, /"\.heic", "\.heif", "\.avif"/);
  assert.match(api, /imageMimeTypes/);
  assert.match(api, /const isImage =/);
  assert.match(api, /if \(!isImage\)/);
  assert.match(api, /\.webp\(\{ quality: 82/);
});

test("Astro delegates proxied multipart Origin checks to the forwarded-aware middleware", async () => {
  const [config, middleware, quoteUpload] = await Promise.all([
    read("astro.config.mjs"),
    read("src/middleware.ts"),
    read("src/scripts/admin-quote-pdf.ts"),
  ]);
  assert.match(config, /security:\s*\{ checkOrigin: false \}/);
  assert.match(middleware, /isBrowserForm && !origin/);
  assert.match(middleware, /resolveCsrfOrigin/);
  assert.match(quoteUpload, /const raw = await response\.text\(\)/);
  assert.match(quoteUpload, /!response\.ok \|\| !uploaded\.url/);
});

test("admin mobile upload controls use full touch targets and 16px form controls", async () => {
  const [products, quote, operations, siteContent, admin] = await Promise.all([
    read("src/styles/admin-products.css"),
    read("src/styles/admin-quote-pdf.css"),
    read("src/styles/admin-operations.css"),
    read("src/styles/admin-site-content.css"),
    read("src/styles/admin.css"),
  ]);
  const uploadStyles = `${products}\n${quote}\n${operations}\n${siteContent}`;
  assert.match(uploadStyles, /inset: 0; width: 100%; height: 100%/);
  assert.doesNotMatch(uploadStyles, /(?:admin-config-image-button|quote-image-file-action|ops-upload-button)[^}]*width: 1px/);
  assert.match(products, /\.admin-media-thumbnail \{ width: 72px; height: 58px; \}/);
  assert.match(admin, /font-size: 16px !important/);
  assert.match(admin, /min-height: 44px; touch-action: manipulation/);
});

test("all active admin image editors advertise the shared mobile formats", async () => {
  const [products, media, content, quoteScript] = await Promise.all([
    read("src/pages/admin/san-pham.astro"),
    read("src/pages/admin/media.astro"),
    read("src/pages/admin/cai-dat-noi-dung.astro"),
    read("src/scripts/admin-quote-pdf.ts"),
  ]);
  for (const source of [products, media, content, quoteScript]) assert.match(source, /ADMIN_IMAGE_ACCEPT/);
  assert.doesNotMatch(`${products}\n${quoteScript}`, /dưới 10 MB|Tối đa 10 MB/);
});
