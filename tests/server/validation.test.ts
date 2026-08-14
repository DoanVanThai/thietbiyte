import assert from "node:assert/strict";
import test from "node:test";
import { productInput, productPatchInput } from "../../src/server/validation/product";
import { quoteRequestInput } from "../../src/server/validation/quote";
import { salesQuotePdfInput } from "../../src/server/validation/sales-quote";

const product = {
  name: "Monitor bệnh nhân", slug: "monitor-benh-nhan", sku: "MON-001", model: "M1",
  brandId: "brand-1", categoryId: "category-1", type: "MEDICAL", status: "DRAFT",
  specificationGroups: [{ name: "Màn hình", sortOrder: 0, specifications: [{ label: "Màn hình chính", value: "23.8 inch", sortOrder: 0 }] }],
};

test("product input keeps specifications normalized by group", () => {
  const result = productInput.parse(product);
  assert.equal(result.specificationGroups[0].specifications[0].label, "Màn hình chính");
  assert.deepEqual(result.images, []);
});

test("product patch rejects empty updates", () => {
  assert.equal(productPatchInput.safeParse({}).success, false);
});

test("product image keeps its automatic quote placement settings", () => {
  const result = productInput.parse({
    ...product,
    images: [{
      url: "/uploads/1234567890-abcd1234.webp", alt: "Tấm cảm biến DR", sortOrder: 0, isCover: false,
      quoteEnabled: true, quoteCaption: "Tấm cảm biến DR", quoteAfterText: "- Tấm cảm biến DR",
    }],
  });
  assert.equal(result.images[0].quoteEnabled, true);
  assert.equal(result.images[0].quoteAfterText, "- Tấm cảm biến DR");
});

test("quote input validates server-side product quantity and customer", () => {
  const valid = quoteRequestInput.safeParse({
    customer: { name: "Nguyễn An", phone: "0902137158", email: "an@example.com", type: "CLINIC" },
    need: "Cần thiết bị cho phòng khám tổng quát.", items: [{ productId: "p-001", quantity: 1 }], documents: [],
  });
  assert.equal(valid.success, true);
  const invalid = quoteRequestInput.safeParse({
    customer: { name: "A", phone: "1", email: "bad", type: "CLINIC" }, need: "ngắn", items: [{ productId: "p-001", quantity: 0 }],
  });
  assert.equal(invalid.success, false);
});

test("quote input accepts the compact consultation form without email, customer type or product", () => {
  const result = quoteRequestInput.parse({
    customer: { name: "Nguyễn An", phone: "0902137158", city: "Đà Nẵng" },
    need: "Cần tư vấn thiết bị phù hợp cho phòng khám.",
  });
  assert.equal(result.customer.type, "INDIVIDUAL");
  assert.deepEqual(result.items, []);
});

test("sales quote accepts editable inline images with a target paragraph", () => {
  const result = salesQuotePdfInput.parse({
    quoteNumber: "BG-001", quoteDate: "2026-08-14", city: "Hà Nội",
    customer: { name: "Nguyễn An" }, introduction: "Nội dung giới thiệu báo giá hợp lệ.",
    items: [{
      productId: "p-001", quantity: 1, unitPrice: 1_000_000,
      description: "THIẾT BỊ\n- Tấm cảm biến DR",
      images: [{ url: "/uploads/1234567890-abcd1234.webp", caption: "Tấm cảm biến DR", afterText: "- Tấm cảm biến DR" }],
    }],
  });
  assert.equal(result.items[0].images?.[0].afterText, "- Tấm cảm biến DR");
});
