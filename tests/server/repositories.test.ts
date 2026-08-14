import assert from "node:assert/strict";
import test from "node:test";
import { ProductRepository } from "../../src/server/repositories/product-repository";
import { QuoteService } from "../../src/server/services/quote-service";

test("product repository exposes CRUD, archive and delete operations", () => {
  assert.equal(typeof ProductRepository.prototype.create, "function");
  assert.equal(typeof ProductRepository.prototype.findById, "function");
  assert.equal(typeof ProductRepository.prototype.update, "function");
  assert.equal(typeof ProductRepository.prototype.archive, "function");
  assert.equal(typeof ProductRepository.prototype.delete, "function");
});

test("quote service rejects duplicate product lines before persistence", async () => {
  const quotes = { create: async () => { throw new Error("should not persist"); } } as never;
  const products = { countExistingPublished: async () => 1 } as never;
  const service = new QuoteService(quotes, products);
  await assert.rejects(() => service.create({
    customer: { name: "Nguyễn An", phone: "0902137158", email: "an@example.com", type: "CLINIC" },
    need: "Cần thiết bị cho phòng khám tổng quát.",
    items: [{ productId: "p-001", quantity: 1 }, { productId: "p-001", quantity: 2 }], documents: [],
  }), /DUPLICATE_PRODUCT/);
});
