import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { ProductRepository } from "@/server/repositories/product-repository";
import { QuoteRepository } from "@/server/repositories/quote-repository";
import { quoteRequestInput } from "@/server/validation/quote";

const hashAccess = (value: string) => createHash("sha256").update(value).digest("hex");
const safeHashMatch = (left: string, right: string) => {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};
type QuoteRecord = NonNullable<Awaited<ReturnType<QuoteRepository["findPublicByNumber"]>>>;

export class QuoteService {
  constructor(private readonly quotes = new QuoteRepository(), private readonly products = new ProductRepository()) {}

  async create(raw: unknown, context: { actorUserId?: string; actorIsCustomer?: boolean } = {}) {
    const input = quoteRequestInput.parse(raw);
    const productIds = [...new Set(input.items.map((item) => item.productId))];
    if (productIds.length !== input.items.length) throw new Error("DUPLICATE_PRODUCT");
    if (productIds.length && await this.products.countExistingPublished(productIds) !== productIds.length) throw new Error("INVALID_PRODUCT");
    const accessToken = randomBytes(24).toString("base64url");
    const result = await this.quotes.create(input, { ...context, publicAccessHash: hashAccess(accessToken) });
    return {
      quote: this.toPublicQuote(result.quote), quoteNumber: result.quoteNumber, leadNumber: result.leadNumber,
      accessToken, customerLink: result.customerLink, status: result.quote.status,
      url: `/yeu-cau-bao-gia/chi-tiet?number=${encodeURIComponent(result.quoteNumber)}&access=${encodeURIComponent(accessToken)}`,
    };
  }

  async getPublic(quoteNumber: string, accessToken?: string | null, customerUserId?: string | null) {
    const quote = await this.quotes.findPublicByNumber(quoteNumber);
    if (!quote) return { state: "not-found" as const };
    const guestAllowed = Boolean(accessToken && safeHashMatch(hashAccess(accessToken), quote.publicAccessHash));
    const accountAllowed = Boolean(customerUserId && quote.customer.userId === customerUserId);
    return guestAllowed || accountAllowed ? { state: "allowed" as const, quote: this.toPublicQuote(quote) } : { state: "forbidden" as const };
  }

  async listPortal(userId: string) {
    const quotes = await this.quotes.listForCustomerUser(userId);
    return quotes.map((quote) => ({
      id: quote.id, number: quote.quoteNumber, date: quote.createdAt.toISOString(), status: quote.status,
      products: quote.items.map((item) => ({ name: item.product.name, model: item.product.model, quantity: item.quantity, note: item.note || "" })),
      updates: quote.customerUpdates.map((update) => ({ status: update.status, title: update.title, detail: update.detail, date: update.createdAt.toISOString() })),
    }));
  }

  private toPublicQuote(quote: QuoteRecord) {
    return {
      number: quote.quoteNumber, date: quote.createdAt.toISOString(), status: quote.status,
      customer: { name: quote.customer.name, email: quote.customer.email || "", phone: quote.customer.phone, organization: quote.customer.organization?.name || "", customerType: quote.customer.type, province: quote.customer.city || "" },
      need: quote.need || "", note: quote.note || "",
      items: quote.items.map((item) => ({ product_id: item.productId, quantity: item.quantity, product_name: item.product.name, model: item.product.model, note: item.note || "" })),
      attachments: quote.documents.map((document) => ({ id: document.id, original_name: document.name, mime_type: document.mimeType || "application/octet-stream", size: document.fileSize || 0 })),
      updates: quote.customerUpdates.map((update) => ({ status: update.status, title: update.title, detail: update.detail, created_at: update.createdAt.toISOString() })),
    };
  }
}

export const quoteService = new QuoteService();
