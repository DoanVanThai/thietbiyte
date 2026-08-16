import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import type { SalesQuotePdfInput } from "@/server/validation/sales-quote";

const totalOf = (input: SalesQuotePdfInput) => input.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
const jsonPayload = (input: SalesQuotePdfInput) => input as unknown as Prisma.InputJsonValue;

const summary = (quote: {
  id: string;
  quoteNumber: string;
  quoteDate: Date;
  customerName: string;
  customerOrganization: string | null;
  total: Prisma.Decimal;
  status: "DRAFT" | "EXPORTED" | "ARCHIVED";
  version: number;
  lastExportedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: quote.id,
  quoteNumber: quote.quoteNumber,
  quoteDate: quote.quoteDate.toISOString().slice(0, 10),
  customerName: quote.customerName,
  customerOrganization: quote.customerOrganization || "",
  total: Number(quote.total),
  status: quote.status,
  version: quote.version,
  lastExportedAt: quote.lastExportedAt?.toISOString() || null,
  createdAt: quote.createdAt.toISOString(),
  updatedAt: quote.updatedAt.toISOString(),
});

export const salesQuoteStorage = {
  async list(limit = 100) {
    const quotes = await db.salesQuote.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { updatedAt: "desc" },
      take: Math.min(200, Math.max(1, limit)),
    });
    return quotes.map(summary);
  },

  async find(id: string) {
    const quote = await db.salesQuote.findUnique({
      where: { id },
      include: { revisions: { select: { id: true, version: true, createdAt: true, createdBy: { select: { name: true } } }, orderBy: { version: "desc" } } },
    });
    if (!quote) return null;
    return {
      ...summary(quote),
      payload: quote.payload as unknown as SalesQuotePdfInput,
      revisions: quote.revisions.map((revision) => ({
        id: revision.id,
        version: revision.version,
        createdAt: revision.createdAt.toISOString(),
        createdBy: revision.createdBy?.name || "Hệ thống",
      })),
    };
  },

  create(input: SalesQuotePdfInput, actorId: string) {
    const quoteDate = new Date(`${input.quoteDate}T00:00:00.000Z`);
    return db.$transaction(async (transaction) => {
      const quote = await transaction.salesQuote.create({
        data: {
          quoteNumber: input.quoteNumber,
          quoteDate,
          customerName: input.customer.name,
          customerOrganization: input.customer.organization || null,
          total: totalOf(input),
          payload: jsonPayload(input),
          createdById: actorId,
          revisions: { create: { version: 1, payload: jsonPayload(input), createdById: actorId } },
        },
      });
      return summary(quote);
    });
  },

  async update(id: string, input: SalesQuotePdfInput, actorId: string) {
    const quoteDate = new Date(`${input.quoteDate}T00:00:00.000Z`);
    return db.$transaction(async (transaction) => {
      const existing = await transaction.salesQuote.findUnique({ where: { id }, select: { id: true, version: true } });
      if (!existing) return null;
      const version = existing.version + 1;
      const quote = await transaction.salesQuote.update({
        where: { id },
        data: {
          quoteNumber: input.quoteNumber,
          quoteDate,
          customerName: input.customer.name,
          customerOrganization: input.customer.organization || null,
          total: totalOf(input),
          payload: jsonPayload(input),
          version,
          revisions: { create: { version, payload: jsonPayload(input), createdById: actorId } },
        },
      });
      return summary(quote);
    });
  },

  async markExported(id: string) {
    const quote = await db.salesQuote.update({ where: { id }, data: { status: "EXPORTED", lastExportedAt: new Date() } });
    return summary(quote);
  },
};
