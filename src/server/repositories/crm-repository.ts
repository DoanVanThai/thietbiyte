import { db } from "@/server/db";
import type { AuthPrincipal } from "@/server/auth/permissions";
import type { LeadStatus, QuoteRequestStatus, CRMActivityType, CRMVisibility, FollowUpType } from "@/generated/prisma/enums";

const broadRoles = new Set(["super-admin", "admin", "sales-manager"]);
const scopedSales = (actor: AuthPrincipal) => actor.roleIds.includes("sales-staff") && !actor.roleIds.some((role) => broadRoles.has(role));
const leadScope = (actor: AuthPrincipal) => scopedSales(actor) ? { assignedToId: actor.id } : {};
const quoteScope = (actor: AuthPrincipal) => scopedSales(actor) ? { assignedToId: actor.id } : {};

const leadInclude = {
  customer: { include: { organization: true } }, assignedTo: { select: { id: true, name: true, email: true } },
  quoteRequest: { include: { items: { include: { product: { select: { id: true, name: true, model: true } } } } } },
} as const;

export class CrmRepository {
  listLeads(actor: AuthPrincipal) {
    return db.lead.findMany({ where: leadScope(actor), orderBy: { createdAt: "desc" }, include: { ...leadInclude, followUps: { where: { completedAt: null }, orderBy: { dueAt: "asc" }, take: 1 } } });
  }

  listQuotes(actor: AuthPrincipal) {
    return db.quoteRequest.findMany({ where: quoteScope(actor), orderBy: { createdAt: "desc" }, include: { customer: { include: { organization: true } }, assignedTo: { select: { id: true, name: true } }, items: { include: { product: { select: { id: true, name: true, model: true } } } } } });
  }

  async listQuotesPage(actor: AuthPrincipal, page = 1, pageSize = 50) {
    const take = Math.min(100, Math.max(1, Math.trunc(pageSize)));
    const current = Math.max(1, Math.trunc(page));
    const where = quoteScope(actor);
    const [records, total] = await Promise.all([
      db.quoteRequest.findMany({ where, orderBy: { createdAt: "desc" }, take, skip: (current - 1) * take, include: { customer: { include: { organization: true } }, assignedTo: { select: { id: true, name: true } }, items: { include: { product: { select: { id: true, name: true, model: true } } } } } }),
      db.quoteRequest.count({ where }),
    ]);
    return { records, pagination: { page: current, pageSize: take, total, totalPages: Math.max(1, Math.ceil(total / take)) } };
  }

  async quoteNotificationSummary(actor: AuthPrincipal, take = 5) {
    const where = { ...quoteScope(actor), status: "RECEIVED" as const };
    const [count, items] = await Promise.all([
      db.quoteRequest.count({ where }),
      db.quoteRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Math.min(10, Math.max(1, take)),
        select: {
          id: true,
          quoteNumber: true,
          createdAt: true,
          customer: { select: { name: true, phone: true } },
        },
      }),
    ]);
    return { count, items };
  }

  getLead(id: string, actor: AuthPrincipal) {
    return db.lead.findFirst({ where: { OR: [{ id }, { leadNumber: id }], ...leadScope(actor) }, include: { ...leadInclude, activities: { include: { createdBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } }, followUps: { include: { assignedTo: { select: { id: true, name: true } } }, orderBy: { dueAt: "asc" } }, internalNotes: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } } } });
  }

  getQuote(id: string, actor: AuthPrincipal) {
    return db.quoteRequest.findFirst({ where: { OR: [{ id }, { quoteNumber: id }], ...quoteScope(actor) }, include: { customer: { include: { organization: true } }, assignedTo: { select: { id: true, name: true } }, items: { include: { product: { include: { brand: true } } } }, documents: true, internalNotes: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } }, customerUpdates: { orderBy: { createdAt: "asc" } }, leads: { include: { activities: { include: { createdBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } } } } } });
  }

  async assignQuote(id: string, assignedToId: string, actor: AuthPrincipal) {
    return db.$transaction(async (tx) => {
      const quote = await tx.quoteRequest.update({ where: { id }, data: { assignedToId }, select: { id: true, quoteNumber: true } });
      await tx.lead.updateMany({ where: { quoteRequestId: id }, data: { assignedToId } });
      await tx.notificationOutbox.create({ data: { eventType: "QUOTE_ASSIGNED", quoteId: id, recipientUserId: assignedToId, channel: "UNCONFIGURED", status: "PENDING", payload: { quoteNumber: quote.quoteNumber } } });
      await tx.auditLog.create({ data: { action: "quote.assign", actorId: actor.id, subjectId: assignedToId, resource: `quote:${id}` } });
      return quote;
    });
  }

  async assignLead(id: string, assignedToId: string, actor: AuthPrincipal) {
    return db.$transaction(async (tx) => {
      const lead = await tx.lead.update({ where: { id }, data: { assignedToId } });
      if (lead.quoteRequestId) await tx.quoteRequest.update({ where: { id: lead.quoteRequestId }, data: { assignedToId } });
      await tx.notificationOutbox.create({ data: { eventType: "QUOTE_ASSIGNED", leadId: id, quoteId: lead.quoteRequestId, recipientUserId: assignedToId, channel: "UNCONFIGURED", status: "PENDING", payload: { leadNumber: lead.leadNumber } } });
      await tx.auditLog.create({ data: { action: "lead.assign", actorId: actor.id, subjectId: assignedToId, resource: `lead:${id}` } });
      return lead;
    });
  }

  async updateQuoteStatus(id: string, status: QuoteRequestStatus, actor: AuthPrincipal) {
    const leadStatus: Partial<Record<QuoteRequestStatus, LeadStatus>> = { CONSULTING: "CONTACTED", QUOTE_SENT: "QUOTE_SENT", NEGOTIATING: "NEGOTIATING", COMPLETED: "WON", CANCELLED: "LOST" };
    const timeline: Partial<Record<QuoteRequestStatus, [string, string]>> = { CONSULTING: ["Đang tư vấn", "Sales đang xác nhận nhu cầu và cấu hình."], QUOTE_SENT: ["Đã gửi báo giá", "Báo giá đã được chuẩn bị và gửi tới khách hàng."], NEGOTIATING: ["Đang trao đổi", "Hai bên đang trao đổi để thống nhất phương án."], COMPLETED: ["Hoàn tất", "Quy trình tư vấn và báo giá đã hoàn tất."], CANCELLED: ["Đã kết thúc", "Yêu cầu đã được đóng."] };
    return db.$transaction(async (tx) => {
      const quote = await tx.quoteRequest.update({ where: { id }, data: { status }, include: { leads: true } });
      if (leadStatus[status]) await tx.lead.updateMany({ where: { quoteRequestId: id }, data: { status: leadStatus[status] } });
      for (const lead of quote.leads) await tx.cRMActivity.create({ data: { leadId: lead.id, type: "STATUS_CHANGE", content: `Quote ${quote.quoteNumber} → ${status}`, createdById: actor.id, visibility: "INTERNAL" } });
      const publicUpdate = timeline[status];
      if (publicUpdate) await tx.customerUpdate.create({ data: { quoteId: id, status, title: publicUpdate[0], detail: publicUpdate[1] } });
      await tx.notificationOutbox.create({ data: { eventType: "QUOTE_STATUS_CHANGED", quoteId: id, channel: "UNCONFIGURED", status: "PENDING", payload: { quoteNumber: quote.quoteNumber, status } } });
      await tx.auditLog.create({ data: { action: "quote.edit", actorId: actor.id, resource: `quote:${id}`, metadata: { status } } });
      return quote;
    });
  }

  async updateLeadStatus(id: string, status: LeadStatus, actor: AuthPrincipal) {
    return db.$transaction(async (tx) => {
      const lead = await tx.lead.update({ where: { id }, data: { status } });
      await tx.cRMActivity.create({ data: { leadId: id, type: "STATUS_CHANGE", content: `Lead ${lead.leadNumber} → ${status}`, createdById: actor.id, visibility: "INTERNAL" } });
      await tx.auditLog.create({ data: { action: "lead.edit", actorId: actor.id, resource: `lead:${id}`, metadata: { status } } });
      return lead;
    });
  }

  async addActivity(leadId: string, input: { type: CRMActivityType; content: string; visibility: CRMVisibility }, actor: AuthPrincipal) {
    return db.$transaction(async (tx) => {
      const activity = await tx.cRMActivity.create({ data: { leadId, type: input.type, content: input.content, visibility: input.visibility, createdById: actor.id } });
      if (["CALL", "EMAIL", "ZALO", "MEETING"].includes(input.type)) await tx.lead.update({ where: { id: leadId }, data: {} });
      if (input.visibility === "CUSTOMER") {
        const lead = await tx.lead.findUnique({ where: { id: leadId }, select: { quoteRequestId: true } });
        if (lead?.quoteRequestId) {
          const quote = await tx.quoteRequest.findUnique({ where: { id: lead.quoteRequestId }, select: { status: true } });
          if (quote) await tx.customerUpdate.create({ data: { quoteId: lead.quoteRequestId, status: quote.status, title: "Cập nhật từ đội ngũ tư vấn", detail: input.content } });
        }
      }
      return activity;
    });
  }

  addInternalNote(target: { leadId?: string; quoteId?: string; customerId?: string }, content: string, actor: AuthPrincipal) {
    return db.internalNote.create({ data: { ...target, content, authorId: actor.id } });
  }

  async addFollowUp(leadId: string, input: { assignedToId: string; dueAt: Date; type: FollowUpType; note: string }, actor: AuthPrincipal) {
    return db.$transaction(async (tx) => {
      const followUp = await tx.followUp.create({ data: { leadId, ...input } });
      await tx.lead.update({ where: { id: leadId }, data: { nextFollowUp: input.dueAt } });
      await tx.notificationOutbox.create({ data: { eventType: "FOLLOW_UP_DUE", leadId, recipientUserId: input.assignedToId, channel: "UNCONFIGURED", status: "PENDING", payload: { dueAt: input.dueAt.toISOString(), createdBy: actor.id } } });
      return followUp;
    });
  }

  completeFollowUp(id: string) { return db.followUp.update({ where: { id }, data: { completedAt: new Date() } }); }

  listCustomers(actor: AuthPrincipal) {
    return db.customer.findMany({ where: scopedSales(actor) ? { leads: { some: { assignedToId: actor.id } } } : {}, orderBy: { updatedAt: "desc" }, include: { organization: true, _count: { select: { quoteRequests: true, leads: true } } } });
  }

  getCustomer(id: string, actor: AuthPrincipal) {
    return db.customer.findFirst({ where: { id, ...(scopedSales(actor) ? { leads: { some: { assignedToId: actor.id } } } : {}) }, include: { organization: true, quoteRequests: { orderBy: { createdAt: "desc" }, include: { items: { include: { product: true } } } }, leads: { orderBy: { createdAt: "desc" } }, internalNotes: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } } } });
  }

  listActivities(actor: AuthPrincipal) {
    return db.cRMActivity.findMany({ where: scopedSales(actor) ? { lead: { assignedToId: actor.id } } : {}, orderBy: { createdAt: "desc" }, include: { lead: { include: { customer: { include: { organization: true } } } }, createdBy: { select: { name: true } } } });
  }

  listFollowUps(actor: AuthPrincipal) {
    return db.followUp.findMany({ where: scopedSales(actor) ? { assignedToId: actor.id } : {}, orderBy: { dueAt: "asc" }, include: { lead: { include: { customer: { include: { organization: true } } } }, assignedTo: { select: { id: true, name: true } } } });
  }

  listSalesUsers() {
    return db.user.findMany({ where: { status: "ACTIVE", roles: { some: { roleId: { in: ["sales-manager", "sales-staff"] } } } }, select: { id: true, name: true, email: true, roles: { select: { roleId: true } } }, orderBy: { name: "asc" } });
  }
}

export const crmRepository = new CrmRepository();
