import type { PrismaClient } from "@/generated/prisma/client";
import { db } from "@/server/db";
import type { QuoteRequestInput } from "@/server/validation/quote";

type CreateContext = { publicAccessHash: string; actorUserId?: string; actorIsCustomer?: boolean };

export class QuoteRepository {
  constructor(private readonly client: PrismaClient = db) {}

  create(input: QuoteRequestInput, context: CreateContext) {
    return this.client.$transaction(async (tx) => {
      const sequenceRows = await tx.$queryRawUnsafe<Array<{ value: bigint }>>("SELECT nextval('quote_public_number_seq') AS value");
      const sequence = Number(sequenceRows[0]?.value || 0);
      const year = new Date().getFullYear();
      const quoteNumber = `QT-${year}-${String(sequence).padStart(6, "0")}`;
      const leadNumber = `LD-${year}-${String(sequence).padStart(6, "0")}`;
      const organizationName = input.customer.organization?.trim();
      const organization = organizationName
        ? await tx.organization.findFirst({ where: { name: { equals: organizationName, mode: "insensitive" } } })
          ?? await tx.organization.create({ data: { name: organizationName, email: input.customer.email || undefined, phone: input.customer.phone, city: input.customer.city } })
        : null;

      const emailMatches = input.customer.email
        ? await tx.customer.findMany({ where: { email: { equals: input.customer.email, mode: "insensitive" } }, take: 2 })
        : [];
      const phoneMatches = emailMatches.length === 1
        ? []
        : await tx.customer.findMany({ where: { phone: input.customer.phone, ...(organization ? { organizationId: organization.id } : {}) }, take: 2 });
      const matched = emailMatches.length === 1 ? emailMatches[0] : phoneMatches.length === 1 ? phoneMatches[0] : null;
      const customerLink = emailMatches.length === 1 ? "exact-email" : phoneMatches.length === 1 ? organization ? "phone+organization" : "exact-phone" : emailMatches.length > 1 || phoneMatches.length > 1 ? "ambiguous-review" : "new";
      const customer = matched
        ? context.actorIsCustomer && context.actorUserId && !matched.userId
          ? await tx.customer.update({ where: { id: matched.id }, data: { userId: context.actorUserId, updatedAt: new Date() } })
          : matched
        : await tx.customer.create({ data: {
          name: input.customer.name, phone: input.customer.phone, email: input.customer.email, type: input.customer.type,
          city: input.customer.city, organizationId: organization?.id,
          userId: context.actorIsCustomer ? context.actorUserId : undefined,
          note: customerLink === "ambiguous-review" ? "Có nhiều hồ sơ gần giống; cần staff review trước khi merge." : undefined,
        } });

      const quote = await tx.quoteRequest.create({
        data: {
          quoteNumber, publicAccessHash: context.publicAccessHash, source: input.source, customerId: customer.id, need: input.need, note: input.note,
          ...(input.items.length ? { items: { create: input.items.map((item) => ({ productId: item.productId, quantity: item.quantity, note: item.note })) } } : {}),
          documents: { create: input.documents.map((document) => ({ name: document.name, fileSize: document.size, url: document.url, storedName: document.storedName, mimeType: document.mimeType, access: "CUSTOMER" })) },
          customerUpdates: { create: { status: "RECEIVED", title: "Đã tiếp nhận", detail: "Yêu cầu đã được ghi nhận và chờ Sales tiếp nhận." } },
          notifications: { create: { eventType: "QUOTE_RECEIVED", channel: "UNCONFIGURED", status: "PENDING", payload: { quoteNumber } } },
          leads: { create: {
            leadNumber, customerId: customer.id, source: "WEBSITE", status: "NEW",
            activities: { create: { type: "QUOTE", content: `${quoteNumber} được tạo từ ${input.source}.`, visibility: "INTERNAL" } },
            notifications: { create: { eventType: "LEAD_CREATED", channel: "UNCONFIGURED", status: "PENDING", payload: { leadNumber, quoteNumber } } },
          } },
        },
        include: {
          customer: { include: { organization: true } }, assignedTo: true,
          items: { include: { product: { include: { brand: true, images: { where: { isCover: true }, take: 1 } } } } },
          documents: true, leads: true, customerUpdates: { orderBy: { createdAt: "asc" } },
        },
      });
      await tx.auditLog.create({ data: { action: "quote.create", subjectId: quote.id, resource: "quote", metadata: { quoteNumber, leadNumber, source: input.source, customerLink } } });
      return { quote, quoteNumber, leadNumber, customerLink };
    });
  }

  findPublicByNumber(quoteNumber: string) {
    return this.client.quoteRequest.findUnique({
      where: { quoteNumber },
      include: {
        customer: { include: { organization: true } },
        items: { include: { product: { include: { brand: true, images: { where: { isCover: true }, take: 1 } } } } },
        documents: { where: { access: "CUSTOMER" } }, customerUpdates: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  listForCustomerUser(userId: string) {
    return this.client.quoteRequest.findMany({
      where: { customer: { userId } }, orderBy: { createdAt: "desc" },
      include: { items: { include: { product: true } }, customerUpdates: { orderBy: { createdAt: "asc" } } },
    });
  }
}
