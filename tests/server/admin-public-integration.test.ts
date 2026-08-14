import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const testRoot = mkdtempSync(join(tmpdir(), "tlm-phase23-"));
process.env.CONTENT_DB_PATH = join(testRoot, "content.sqlite");
process.env.DATABASE_URL = "";
after(() => rmSync(testRoot, { recursive: true, force: true }));

test("Admin Product A flows through catalog, search, detail, slug history and unpublish", async () => {
  const repository = await import("../../src/lib/content-repository");
  const { productDetailFromCms, searchIndex } = await import("../../src/lib/public-content");

  const draft = repository.saveProduct({
    id: "phase23-product-a",
    name: "Product A",
    slug: "product-a",
    sku: "PH23-PRODUCT-A",
    model: "A-100",
    brand: "Phase 23 Medical",
    brandSlug: "phase-23-medical",
    category: "Thiết bị kiểm thử",
    categorySlug: "thiet-bi-kiem-thu",
    group: "medical",
    origin: "Việt Nam",
    manufacturingYear: "2026",
    warranty: "24 tháng",
    description: "Sản phẩm kiểm thử luồng Admin sang Public.",
    priceMode: "CONTACT",
    featured: 20,
    availability: "contact",
    image: "/images/project-handover-placeholder.webp",
    imagePosition: "center",
    specialties: ["Chẩn đoán hình ảnh"],
    specialtySlugs: ["chan-doan-hinh-anh"],
    applications: ["Kiểm thử tích hợp"],
    applicationSlugs: ["kiem-thu-tich-hop"],
    specs: ["Công suất: 100 W"],
    publishStatus: "draft",
    detail: {
      gallery: [{ type: "image", src: "/images/project-handover-placeholder.webp", alt: "Product A" }],
      features: [{ title: "Tích hợp", description: "Dữ liệu có thứ tự từ CMS." }],
      configurations: [{ title: "Máy chính", items: [{ name: "A-100", quantity: 1 }] }],
      specificationGroups: [{ title: "Thông số điện", items: [{ label: "Công suất", value: "100 W" }] }],
      documents: [{ title: "Catalogue Product A", type: "Catalogue", format: "PDF", access: "public", href: "/uploads/product-a.pdf" }],
    },
  });

  assert.equal(draft.publishStatus, "draft");
  assert.equal(repository.getProducts(true).some(({ id }) => id === draft.id), false, "draft must not leak to public catalog");

  const published = repository.saveProduct({ ...draft, publishStatus: "published" }, true);
  assert.equal(repository.getProducts(true).some(({ id }) => id === published.id), true, "published product must enter catalog");
  assert.equal((await searchIndex()).some(({ id }) => id === `product-${published.id}`), true, "published product must enter search");
  assert.equal(productDetailFromCms(published).specificationGroups[0]?.items[0]?.value, "100 W", "detail must use CMS specifications");

  const edited = repository.saveProduct({
    ...published,
    slug: "product-a-2026",
    detail: { ...published.detail!, specificationGroups: [{ title: "Thông số điện", items: [{ label: "Công suất", value: "120 W" }] }] },
  }, true);
  assert.equal(repository.resolveOldSlug("product-a"), "product-a-2026", "old slug must redirect to the current slug");
  assert.equal(productDetailFromCms(edited).specificationGroups[0]?.items[0]?.value, "120 W", "public detail must reflect edited specifications");

  repository.setProductStatus(edited.id, "draft");
  assert.equal(repository.getProducts(true).some(({ id }) => id === edited.id), false, "unpublished product must leave catalog");
  assert.equal((await searchIndex()).some(({ id }) => id === `product-${edited.id}`), false, "unpublished product must leave search");
});
