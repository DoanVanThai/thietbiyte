import { databaseConfigured } from "@/server/db";
import { crmRepository } from "@/server/repositories/crm-repository";
import type { AuthPrincipal } from "@/server/auth/permissions";
import { crmActivities, crmCustomers, crmFollowUps, crmLeads, crmQuotes, salesPeople, type ActivityType, type CrmActivity, type CrmFollowUp, type CrmLead, type CrmQuote, type LeadStatus, type QuoteStatus } from "@/data/crm";

const date = (value: Date | string | null | undefined, withTime = false) => value ? new Intl.DateTimeFormat("vi-VN", withTime ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" }).format(new Date(value)) : "Chưa có";
const typeLabels: Record<string, string> = { INDIVIDUAL: "Bác sĩ/Cá nhân", CLINIC: "Phòng khám", HOSPITAL: "Bệnh viện", LABORATORY: "Phòng xét nghiệm", DEALER: "Đại lý", VETERINARY_CLINIC: "Phòng khám thú y", VETERINARY_HOSPITAL: "Bệnh viện thú y" };
const leadStatuses: Record<string, LeadStatus> = { NEW: "new", CONTACTED: "contacted", QUALIFIED: "qualified", QUOTE_SENT: "quote-sent", NEGOTIATING: "negotiating", WON: "won", LOST: "lost" };
const quoteStatuses: Record<string, QuoteStatus> = { RECEIVED: "draft", CONSULTING: "review", QUOTE_SENT: "sent", NEGOTIATING: "sent", COMPLETED: "accepted", CANCELLED: "expired" };
const activityTypes: Record<string, ActivityType> = { CALL: "call", EMAIL: "email", ZALO: "zalo", MEETING: "meeting", QUOTE: "quote", NOTE: "note", STATUS_CHANGE: "status" };

type QuoteNotificationSummary = {
  count: number;
  items: Array<{ id: string; customer: string; phone: string; created: string }>;
};
const notificationCache = new Map<string, { expiresAt: number; value: Promise<QuoteNotificationSummary> }>();
const notificationCacheTtl = 10_000;

export async function crmViewQuoteNotifications(actor: AuthPrincipal): Promise<QuoteNotificationSummary> {
  if (!databaseConfigured) {
    const drafts = crmQuotes.filter((quote) => quote.status === "draft");
    return {
      count: drafts.length,
      items: drafts.slice(0, 5).map((quote) => ({ id: quote.id, customer: quote.customer, phone: crmLeads.find((lead) => lead.id === quote.leadId)?.phone || "", created: quote.created })),
    };
  }

  const key = `${actor.id}:${actor.roleIds.slice().sort().join(",")}`;
  const cached = notificationCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const value = crmRepository.quoteNotificationSummary(actor).then((summary) => ({
    count: summary.count,
    items: summary.items.map((item) => ({ id: item.quoteNumber, customer: item.customer.name, phone: item.customer.phone, created: date(item.createdAt, true) })),
  }));
  notificationCache.set(key, { expiresAt: Date.now() + notificationCacheTtl, value });
  if (notificationCache.size > 100) notificationCache.delete(notificationCache.keys().next().value!);
  value.catch(() => notificationCache.delete(key));
  return value;
}

export async function crmViewLeads(actor: AuthPrincipal) {
  if (!databaseConfigured) return crmLeads;
  const rows = await crmRepository.listLeads(actor);
  return rows.map((lead): CrmLead => ({
    id: lead.leadNumber, name: lead.customer.name, organization: lead.customer.organization?.name || "—", phone: lead.customer.phone, email: lead.customer.email || "", customerType: typeLabels[lead.customer.type] || lead.customer.type,
    productInterest: lead.quoteRequest?.items.map((item) => `${item.product.name} · ${item.product.model}`).join(", ") || "Cần xác nhận", source: lead.source, assignedSales: lead.assignedTo?.name || "Chưa phân công", status: leadStatuses[lead.status], lastContact: date(lead.updatedAt), nextFollowUp: date(lead.followUps[0]?.dueAt, true), created: date(lead.createdAt), location: lead.customer.city || "", requirement: lead.quoteRequest?.need || "", activities: [], followUps: [], notes: [], documents: [],
  }));
}

export async function crmViewQuotes(actor: AuthPrincipal) {
  if (!databaseConfigured) return crmQuotes.map((quote) => ({ ...quote, phone: crmLeads.find((lead) => lead.id === quote.leadId)?.phone || "" }));
  const rows = await crmRepository.listQuotes(actor);
  return rows.map((quote): CrmQuote => ({ id: quote.quoteNumber, leadId: "", customer: quote.customer.name, phone: quote.customer.phone, organization: quote.customer.organization?.name || "—", products: quote.items.map((item) => ({ name: item.product.name, model: item.product.model, quantity: item.quantity })), sales: quote.assignedTo?.name || "Chưa phân công", status: quoteStatuses[quote.status], created: date(quote.createdAt), updated: date(quote.updatedAt, true), requirement: quote.need || "", attachments: [], internalNotes: [], history: [] }));
}

export async function crmViewQuotePage(actor: AuthPrincipal, page = 1, pageSize = 50) {
  const current = Math.max(1, Math.trunc(page));
  const size = Math.min(100, Math.max(1, Math.trunc(pageSize)));
  if (!databaseConfigured) {
    const rows = await crmViewQuotes(actor);
    return { requests: rows.slice((current - 1) * size, current * size), pagination: { page: current, pageSize: size, total: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / size)) } };
  }
  const result = await crmRepository.listQuotesPage(actor, current, size);
  const requests = result.records.map((quote): CrmQuote => ({ id: quote.quoteNumber, leadId: "", customer: quote.customer.name, phone: quote.customer.phone, organization: quote.customer.organization?.name || "—", products: quote.items.map((item) => ({ name: item.product.name, model: item.product.model, quantity: item.quantity })), sales: quote.assignedTo?.name || "Chưa phân công", status: quoteStatuses[quote.status], created: date(quote.createdAt), updated: date(quote.updatedAt, true), requirement: quote.need || "", attachments: [], internalNotes: [], history: [] }));
  return { requests, pagination: result.pagination };
}

export async function crmViewCustomers(actor: AuthPrincipal) {
  if (!databaseConfigured) return crmCustomers;
  const rows = await crmRepository.listCustomers(actor);
  return rows.map((customer) => ({ id: customer.id, leadId: "", name: customer.name, organization: customer.organization?.name || "—", phone: customer.phone, email: customer.email || "", type: typeLabels[customer.type] || customer.type, salesOwner: "Theo lead được phân công", location: customer.city || "", products: Array.from({ length: customer._count.leads }, (_, index) => `Nhu cầu ${index + 1}`), quoteIds: Array.from({ length: customer._count.quoteRequests }, (_, index) => `Quote ${index + 1}`), activities: [] as CrmActivity[], notes: [], documents: [] }));
}

export async function crmViewActivities(actor: AuthPrincipal) {
  if (!databaseConfigured) return crmActivities;
  const rows = await crmRepository.listActivities(actor);
  return rows.map((activity) => ({ id: activity.id, type: activityTypes[activity.type], title: activity.type === "STATUS_CHANGE" ? "Status Change" : activity.type[0] + activity.type.slice(1).toLowerCase(), detail: activity.content, actor: activity.createdBy?.name || "Hệ thống", date: date(activity.createdAt, true), visibility: activity.visibility === "CUSTOMER" ? "customer" : "internal", leadId: activity.lead.leadNumber, leadName: activity.lead.customer.name, organization: activity.lead.customer.organization?.name || "—" }));
}

export async function crmViewFollowUps(actor: AuthPrincipal) {
  if (!databaseConfigured) return crmFollowUps;
  const rows = await crmRepository.listFollowUps(actor); const start = new Date(); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1);
  return rows.map((item) => ({ id: item.id, date: date(item.dueAt), time: new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(item.dueAt), type: item.type[0] + item.type.slice(1).toLowerCase() as CrmFollowUp["type"], note: item.note, assigned: item.assignedTo.name, state: item.completedAt ? "done" : item.dueAt < start ? "overdue" : item.dueAt < end ? "today" : "upcoming", leadId: item.lead.leadNumber, leadName: item.lead.customer.name, organization: item.lead.customer.organization?.name || "—" }));
}

export async function crmViewSales() {
  if (!databaseConfigured) return salesPeople;
  return (await crmRepository.listSalesUsers()).map((sales) => sales.name);
}

export async function crmViewSalesOptions() {
  if (!databaseConfigured) return salesPeople.map((name) => ({ id: name, name }));
  return (await crmRepository.listSalesUsers()).map(({ id, name }) => ({ id, name }));
}

export async function crmViewLead(id: string, actor: AuthPrincipal) {
  if (!databaseConfigured) {
    const lead = crmLeads.find((item) => item.id === id); return lead ? { lead, quotes: crmQuotes.filter((quote) => quote.leadId === lead.id) } : null;
  }
  const record = await crmRepository.getLead(id, actor); if (!record) return null;
  const start = new Date(); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1);
  const lead: CrmLead = {
    id: record.leadNumber, name: record.customer.name, organization: record.customer.organization?.name || "—", phone: record.customer.phone, email: record.customer.email || "", customerType: typeLabels[record.customer.type] || record.customer.type,
    productInterest: record.quoteRequest?.items.map((item) => `${item.product.name} · ${item.product.model}`).join(", ") || "Cần xác nhận", source: record.source, assignedSales: record.assignedTo?.name || "Chưa phân công", status: leadStatuses[record.status], lastContact: date(record.updatedAt), nextFollowUp: date(record.nextFollowUp, true), created: date(record.createdAt), location: record.customer.city || "", requirement: record.quoteRequest?.need || "",
    activities: record.activities.map((activity) => ({ id: activity.id, type: activityTypes[activity.type], title: activity.type === "STATUS_CHANGE" ? "Status Change" : activity.type[0] + activity.type.slice(1).toLowerCase(), detail: activity.content, actor: activity.createdBy?.name || "Hệ thống", date: date(activity.createdAt, true), visibility: activity.visibility === "CUSTOMER" ? "customer" : "internal" })),
    followUps: record.followUps.map((item) => ({ id: item.id, date: date(item.dueAt), time: new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(item.dueAt), type: item.type[0] + item.type.slice(1).toLowerCase() as CrmFollowUp["type"], note: item.note, assigned: item.assignedTo.name, state: item.completedAt ? "done" : item.dueAt < start ? "overdue" : item.dueAt < end ? "today" : "upcoming" })),
    notes: record.internalNotes.map((note) => ({ id: note.id, content: note.content, author: note.author?.name || "Hệ thống", date: date(note.createdAt, true), visibility: "internal" })), documents: [],
  };
  const quotes = record.quoteRequest ? [{ id: record.quoteRequest.id, leadId: record.leadNumber, customer: lead.name, organization: lead.organization, products: record.quoteRequest.items.map((item) => ({ name: item.product.name, model: item.product.model, quantity: item.quantity })), sales: lead.assignedSales, status: quoteStatuses[record.quoteRequest.status], created: date(record.quoteRequest.createdAt), updated: date(record.quoteRequest.updatedAt), requirement: record.quoteRequest.need || "", attachments: [], internalNotes: [], history: [] }] : [];
  return { lead, quotes, recordId: record.id };
}

export async function crmViewQuote(id: string, actor: AuthPrincipal) {
  if (!databaseConfigured) return crmQuotes.find((item) => item.id === id) || null;
  const record = await crmRepository.getQuote(id, actor); if (!record) return null;
  const lead = record.leads[0];
  const quote: CrmQuote = { id: record.quoteNumber, leadId: lead?.leadNumber || "", customer: record.customer.name, phone: record.customer.phone, organization: record.customer.organization?.name || "—", products: record.items.map((item) => ({ name: item.product.name, model: item.product.model, quantity: item.quantity })), sales: record.assignedTo?.name || "Chưa phân công", status: quoteStatuses[record.status], created: date(record.createdAt), updated: date(record.updatedAt, true), requirement: record.need || "", attachments: record.documents.map((file) => ({ name: file.name, meta: `${file.mimeType || "File"} · ${file.fileSize || 0} bytes`, visibility: file.access === "INTERNAL" ? "internal" : "customer" })), internalNotes: record.internalNotes.map((note) => note.content), history: lead?.activities.map((activity) => ({ id: activity.id, type: activityTypes[activity.type], title: activity.type === "STATUS_CHANGE" ? "Status Change" : activity.type, detail: activity.content, actor: activity.createdBy?.name || "Hệ thống", date: date(activity.createdAt, true), visibility: activity.visibility === "CUSTOMER" ? "customer" : "internal" })) || [] };
  return { quote, recordId: record.id, status: record.status, assignedToId: record.assignedToId };
}

export async function crmViewCustomer(id: string, actor: AuthPrincipal) {
  if (!databaseConfigured) return crmCustomers.find((item) => item.id === id) || null;
  const record = await crmRepository.getCustomer(id, actor); if (!record) return null;
  const activities = await crmRepository.listActivities(actor);
  return { id: record.id, leadId: record.leads[0]?.leadNumber || "", name: record.name, organization: record.organization?.name || "—", phone: record.phone, email: record.email || "", type: typeLabels[record.type] || record.type, salesOwner: "Theo lead được phân công", location: record.city || "", products: record.quoteRequests.flatMap((quote) => quote.items.map((item) => item.product.name)), quoteIds: record.quoteRequests.map((quote) => quote.quoteNumber), activities: activities.filter((activity) => activity.lead.customerId === record.id).map((activity) => ({ id: activity.id, type: activityTypes[activity.type], title: activity.type, detail: activity.content, actor: activity.createdBy?.name || "Hệ thống", date: date(activity.createdAt, true), visibility: (activity.visibility === "CUSTOMER" ? "customer" : "internal") as "customer" | "internal" })), notes: record.internalNotes.map((note) => ({ id: note.id, content: note.content, author: note.author?.name || "Hệ thống", date: date(note.createdAt, true), visibility: "internal" as const })), documents: [] };
}

export const crmDate = date;
export const crmTypeLabel = (type: string) => typeLabels[type] || type;
export const crmLeadStatus = (status: string) => leadStatuses[status] || "new";
export const crmQuoteStatus = (status: string) => quoteStatuses[status] || "draft";
export const crmActivityType = (type: string) => activityTypes[type] || "note";
