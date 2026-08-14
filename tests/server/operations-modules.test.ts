import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const testRoot = mkdtempSync(join(tmpdir(), "tlm-operations-"));
process.env.CONTENT_DB_PATH = join(testRoot, "content.sqlite");
process.env.DATABASE_URL = "";
after(() => rmSync(testRoot, { recursive: true, force: true }));

test("published operations content is connected to the public search index", async () => {
  const repository = await import("../../src/server/repositories/operations-repository");
  const { searchIndex } = await import("../../src/lib/public-content");
  const draft = repository.saveArticle({ title: "Nội dung vận hành kiểm thử", status: "draft", type: "knowledge", category: "Vận hành", excerpt: "Kiểm thử kết nối nội dung." }, "Admin");
  assert.equal(repository.listPublishedArticles().some(({ id }) => id === draft.id), false);
  const published = repository.saveArticle({ ...draft, status: "published" }, "Admin");
  assert.equal(repository.listPublishedArticles().some(({ id }) => id === published.id), true);
  assert.equal((await searchIndex()).some(({ id }) => id === `knowledge-${published.id}`), true);
  assert.equal(repository.deleteArticle(published.id), true);
});

test("document and media repositories support create, update and delete", async () => {
  const repository = await import("../../src/server/repositories/operations-repository");
  const content = await import("../../src/lib/content-repository");
  const { productService } = await import("../../src/server/services/product-service");
  const product = content.saveProduct({ id: "operations-product", name: "Thiết bị vận hành", slug: "thiet-bi-van-hanh", sku: "OPS-001", model: "OPS", group: "medical", category: "Kiểm thử", categorySlug: "kiem-thu", brand: "Thiên Lộc", brandSlug: "thien-loc", origin: "Việt Nam", warranty: "12 tháng", description: "Thiết bị kiểm thử liên kết tài liệu.", priceBand: "Liên hệ", priceMode: "CONTACT", featured: 0, availability: "contact", image: "/images/project-handover-placeholder.webp", imagePosition: "center", specialties: [], specialtySlugs: [], applications: [], applicationSlugs: [], specs: [], publishStatus: "published" }, true);
  const document = repository.saveDocument({ name: "Catalogue kiểm thử", url: "/uploads/catalogue-test.pdf", type: "catalogue", access: "public", productId: product.id, productName: product.name, fileSize: 2048 });
  assert.equal(repository.getDocument(document.id)?.name, "Catalogue kiểm thử");
  assert.equal(repository.saveDocument({ ...document, version: "1.1" }).version, "1.1");
  assert.equal((await productService.getPublicDetail(product.slug))?.documents.some(({ href }) => href === document.url), true, "library document must appear on the linked public product");
  assert.equal(repository.deleteDocument(document.id), true);

  const media = repository.saveMedia({ name: "media-test.webp", url: "/uploads/media-test.webp", source: "upload", alt: "Ảnh kiểm thử" });
  assert.equal(repository.getMedia(media.id)?.alt, "Ảnh kiểm thử");
  assert.equal(repository.saveMedia({ ...media, caption: "Chú thích mới" }).caption, "Chú thích mới");
  assert.equal(repository.deleteMedia(media.id), true);
});
