import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { flattenError, ZodError } from "zod";
import { databaseConfigured } from "@/server/db";
import { isCustomer } from "@/server/auth/permissions";
import { rateLimit } from "@/server/auth/rate-limit";
import { requestIp } from "@/server/auth/http";
import { quoteService } from "@/server/services/quote-service";
import { hasExecutableMagic } from "@/server/validation/attachment";

const uploadRoot = resolve(process.env.QUOTE_UPLOAD_DIR || "var/uploads/quotes");
const extensions = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"]);
const mimes = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/jpeg", "image/png", "application/octet-stream"]);
const customerTypes: Record<string, string> = {
  "Bác sĩ/Cá nhân": "INDIVIDUAL", "Phòng khám tư nhân": "CLINIC", "Phòng khám": "CLINIC", "Bệnh viện / Trung tâm y tế": "HOSPITAL", "Bệnh viện": "HOSPITAL",
  "Phòng xét nghiệm": "LABORATORY", "Đơn vị phân phối": "DEALER", "Đại lý": "DEALER", "Phòng khám thú y": "VETERINARY_CLINIC", "Bệnh viện thú y": "VETERINARY_HOSPITAL",
  "Trường học / Viện nghiên cứu": "INDIVIDUAL", "Khác": "INDIVIDUAL",
};

export const POST: APIRoute = async (context) => {
  if (!databaseConfigured) return Response.json({ error: "DATABASE_NOT_CONFIGURED" }, { status: 503 });
  const limiter = rateLimit(`guest-quote:${requestIp(context.request) || "unknown"}`, 5, 60_000);
  if (!limiter.allowed) return Response.json({ error: "RATE_LIMITED", retryAfter: limiter.retryAfter }, { status: 429 });
  const storedFiles: string[] = [];
  try {
    const contentType = context.request.headers.get("content-type") || "";
    let raw: unknown;
    if (contentType.includes("multipart/form-data")) {
      const form = await context.request.formData();
      if (String(form.get("website") || "")) return Response.json({ error: "INVALID_FORM" }, { status: 400 });
      let items: unknown;
      try { items = JSON.parse(String(form.get("items") || "[]")); } catch { return Response.json({ error: "INVALID_ITEMS" }, { status: 422 }); }
      const files = form.getAll("attachments").filter((entry): entry is File => entry instanceof File && entry.size > 0);
      if (files.length > 3) return Response.json({ error: "TOO_MANY_FILES" }, { status: 422 });
      await mkdir(uploadRoot, { recursive: true, mode: 0o700 });
      const documents = [];
      for (const file of files) {
        const extension = extname(file.name).toLowerCase();
        if (!extensions.has(extension) || file.size > 10 * 1024 * 1024 || !file.size || file.type && !mimes.has(file.type)) return Response.json({ error: "INVALID_ATTACHMENT", file: file.name }, { status: 422 });
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (hasExecutableMagic(bytes)) return Response.json({ error: "EXECUTABLE_ATTACHMENT_REJECTED", file: file.name }, { status: 422 });
        const storedName = `${randomUUID()}${extension}`;
        const filePath = resolve(uploadRoot, storedName);
        await writeFile(filePath, bytes, { flag: "wx", mode: 0o600 });
        storedFiles.push(filePath);
        documents.push({ name: file.name.replace(/[^\p{L}\p{N}_. -]/gu, "_"), size: file.size, url: `private://quotes/${storedName}`, storedName, mimeType: file.type || "application/octet-stream" });
      }
      const typeValue = String(form.get("customerType") || form.get("facility") || "INDIVIDUAL");
      raw = {
        source: String(form.get("source") || "GLOBAL"),
        customer: { name: form.get("name"), phone: form.get("phone"), email: form.get("email") || "", organization: form.get("organization") || form.get("unit") || undefined, type: customerTypes[typeValue] || typeValue, city: form.get("province") || form.get("city") },
        need: String(form.get("need") || ""), note: String(form.get("note") || ""), items, documents,
      };
    } else {
      raw = await context.request.json();
    }
    const actor = context.locals.auth;
    const result = await quoteService.create(raw, { actorUserId: actor?.id, actorIsCustomer: isCustomer(actor) });
    return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    await Promise.all(storedFiles.map((file) => unlink(file).catch(() => undefined)));
    if (error instanceof ZodError) return Response.json({ error: "VALIDATION_ERROR", fields: flattenError(error).fieldErrors }, { status: 422 });
    if (error instanceof Error && ["DUPLICATE_PRODUCT", "INVALID_PRODUCT"].includes(error.message)) return Response.json({ error: error.message }, { status: 422 });
    console.error("Quote creation failed.", error);
    return Response.json({ error: "QUOTE_CREATE_FAILED" }, { status: 500 });
  }
};
