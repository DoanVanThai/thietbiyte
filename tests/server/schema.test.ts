import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schema = await readFile(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");

test("production schema includes required Phase 21 entities", () => {
  const entities = [
    "User", "Role", "Permission", "UserRole", "RolePermission", "Product", "ProductImage", "ProductFeature",
    "ProductConfiguration", "ProductSpecificationGroup", "ProductSpecification", "Category", "Brand", "Specialty",
    "Application", "ProductDocument", "QuoteRequest", "QuoteRequestItem", "Lead", "Customer", "CRMActivity",
    "Project", "Article", "SiteSetting", "AuditLog",
  ];
  entities.forEach((entity) => assert.match(schema, new RegExp(`model ${entity} \\{`)));
});

test("product search and relation indexes are declared", () => {
  ["@@index([status])", "@@index([brandId])", "@@index([categoryId])", "@@index([type])", "@@index([featured])", "@@index([createdAt])"]
    .forEach((index) => assert.ok(schema.includes(index), index));
});

test("category supports parent and child hierarchy", () => {
  assert.match(schema, /parentId\s+String\?/);
  assert.match(schema, /children\s+Category\[\]/);
});

test("sales quotes keep editable snapshots and immutable revisions", () => {
  assert.match(schema, /model SalesQuote \{/);
  assert.match(schema, /payload\s+Json/);
  assert.match(schema, /version\s+Int\s+@default\(1\)/);
  assert.match(schema, /model SalesQuoteRevision \{/);
  assert.match(schema, /@@unique\(\[salesQuoteId, version\]\)/);
});
