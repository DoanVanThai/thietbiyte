import assert from "node:assert/strict";
import test from "node:test";

test("PostgreSQL supports normalized product CRUD and the quote transaction", async () => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for the database integration test");

  const [{ db }, { ProductService }, { QuoteService }] = await Promise.all([
    import("../../src/server/db"),
    import("../../src/server/services/product-service"),
    import("../../src/server/services/quote-service"),
  ]);
  const productService = new ProductService();
  const quoteService = new QuoteService();
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const slug = `phase21-integration-${suffix}`;
  const nextSlug = `${slug}-updated`;
  const email = `phase21-${suffix}@example.com`;
  const organizationName = `Phòng khám Phase 21 ${suffix}`;
  let productId: string | undefined;
  let quoteId: string | undefined;
  let customerId: string | undefined;
  let organizationId: string | undefined;

  try {
    const [brand, category, specialty, application] = await Promise.all([
      db.brand.findFirstOrThrow({ where: { status: "PUBLISHED" } }),
      db.category.findFirstOrThrow({ where: { status: "PUBLISHED", parentId: { not: null } } }),
      db.specialty.findFirstOrThrow({ where: { status: "PUBLISHED" } }),
      db.application.findFirstOrThrow({ where: { status: "PUBLISHED" } }),
    ]);

    const created = await productService.create({
      name: "Thiết bị kiểm thử Phase 21",
      slug,
      sku: `PH21-${suffix}`,
      model: "DB-CRUD-01",
      brandId: brand.id,
      categoryId: category.id,
      type: "MEDICAL",
      origin: "Việt Nam",
      manufacturingYear: 2026,
      warranty: "24 tháng",
      shortDescription: "Bản ghi kiểm thử tích hợp PostgreSQL.",
      description: "Bản ghi tạm dùng để kiểm chứng CRUD và các quan hệ chuẩn hóa.",
      price: 125000000,
      priceMode: "REQUEST_QUOTE",
      featured: false,
      featuredOrder: 0,
      status: "PUBLISHED",
      specialtyIds: [specialty.id],
      applicationIds: [application.id],
      images: [{ url: "/images/project-handover-placeholder.webp", alt: "Thiết bị kiểm thử", sortOrder: 0, isCover: true }],
      features: [{ title: "Tích hợp dữ liệu", description: "Kiểm thử feature con.", sortOrder: 0 }],
      configurations: [{ groupName: "Cấu hình chuẩn", name: "Máy chính", quantity: 1, sortOrder: 0 }],
      specificationGroups: [{ name: "Thông số chung", sortOrder: 0, specifications: [{ label: "Nguồn điện", value: "220 V", sortOrder: 0 }] }],
      documents: [{ name: "Datasheet kiểm thử", type: "DATASHEET", url: "/uploads/phase21-test.pdf", access: "REGISTERED", fileSize: 1024, sortOrder: 0 }],
    });
    productId = created.id;
    assert.equal(created.images.length, 1);
    assert.equal(created.specificationGroups[0]?.specifications[0]?.value, "220 V");
    assert.equal(created.documents[0]?.access, "REGISTERED");
    assert.equal(created.specialties.length, 1);

    const updated = await productService.update(created.id, {
      slug: nextSlug,
      name: "Thiết bị kiểm thử Phase 21 — đã cập nhật",
      images: [{ url: "/images/project-handover-placeholder.webp", alt: "Ảnh sau cập nhật", sortOrder: 0, isCover: true }],
      specificationGroups: [{ name: "Thông số chung", sortOrder: 0, specifications: [{ label: "Nguồn điện", value: "220–240 V", sortOrder: 0 }] }],
    });
    assert.equal(updated?.slug, nextSlug);
    assert.equal(updated?.specificationGroups[0]?.specifications[0]?.value, "220–240 V");
    assert.equal(await productService.resolveOldSlug(slug), nextSlug);

    const quoteResult = await quoteService.create({
      source: "PHASE21_DATABASE_TEST",
      customer: {
        name: "Khách kiểm thử Phase 21",
        phone: "0909123456",
        email,
        organization: organizationName,
        type: "CLINIC",
        city: "TP. Hồ Chí Minh",
      },
      need: "Kiểm thử giao dịch yêu cầu báo giá trên PostgreSQL.",
      note: "Bản ghi sẽ được dọn sau khi test.",
      items: [{ productId: created.id, quantity: 2, note: "Cấu hình chuẩn" }],
      documents: [{ name: "yeu-cau-ky-thuat.pdf", size: 2048, mimeType: "application/pdf", storedName: `phase21-${suffix}.pdf` }],
    });
    assert.match(quoteResult.quoteNumber, /^QT-\d{4}-\d{6}$/);
    assert.match(quoteResult.leadNumber, /^LD-\d{4}-\d{6}$/);
    assert.equal(quoteResult.quote.items[0]?.quantity, 2);
    assert.equal(quoteResult.quote.attachments[0]?.original_name, "yeu-cau-ky-thuat.pdf");

    const persistedQuote = await db.quoteRequest.findUniqueOrThrow({
      where: { quoteNumber: quoteResult.quoteNumber },
      include: { customer: true, leads: true, items: true, documents: true },
    });
    quoteId = persistedQuote.id;
    customerId = persistedQuote.customerId;
    organizationId = persistedQuote.customer.organizationId ?? undefined;
    assert.equal(persistedQuote.leads.length, 1);
    assert.equal(persistedQuote.items.length, 1);
    assert.equal(persistedQuote.documents.length, 1);
    assert.equal((await quoteService.getPublic(quoteResult.quoteNumber, "wrong-token")).state, "forbidden");
    assert.equal((await quoteService.getPublic(quoteResult.quoteNumber, quoteResult.accessToken)).state, "allowed");

    const archived = await productService.archive(created.id);
    assert.equal(archived.status, "ARCHIVED");
  } finally {
    if (quoteId) {
      await db.lead.deleteMany({ where: { quoteRequestId: quoteId } });
      await db.quoteRequest.deleteMany({ where: { id: quoteId } });
      await db.auditLog.deleteMany({ where: { resource: "quote", subjectId: quoteId } });
    }
    if (customerId) await db.customer.deleteMany({ where: { id: customerId } });
    if (organizationId) await db.organization.deleteMany({ where: { id: organizationId, customers: { none: {} }, projects: { none: {} } } });
    if (productId) await db.product.deleteMany({ where: { id: productId } });
    await db.$disconnect();
  }
});
