import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");
export const articleOperationInput = z.object({
  id: z.string().trim().max(80).optional(), title: z.string().trim().min(2, "Tiêu đề cần ít nhất 2 ký tự.").max(180),
  slug: optionalText(180), excerpt: optionalText(360), content: optionalText(100_000),
  type: z.enum(["knowledge", "blog", "page"]).default("knowledge"), category: optionalText(120),
  status: z.enum(["draft", "review", "scheduled", "published", "archived"]).default("draft"),
  coverUrl: optionalText(500), coverAlt: optionalText(240), seoTitle: optionalText(180), seoDescription: optionalText(360),
});
export const documentOperationInput = z.object({
  id: z.string().trim().max(80).optional(), name: z.string().trim().min(2).max(180), url: z.string().trim().min(1).max(500),
  originalName: optionalText(255), mimeType: optionalText(120), type: z.enum(["catalogue", "datasheet", "manual", "certificate", "warranty", "other"]).default("other"),
  access: z.enum(["public", "registered", "staff", "admin"]).default("public"), productId: optionalText(100), productName: optionalText(180),
  fileSize: z.number().int().nonnegative().max(20 * 1024 * 1024).default(0), version: z.string().trim().max(30).default("1.0"),
});
export const mediaOperationInput = z.object({
  id: z.string().trim().max(80).optional(), name: z.string().trim().min(1).max(255), url: z.string().trim().min(1).max(500),
  mimeType: optionalText(120), alt: optionalText(240), caption: optionalText(500), fileSize: z.number().int().nonnegative().max(20 * 1024 * 1024).default(0),
  width: z.number().int().nonnegative().max(20_000).default(0), height: z.number().int().nonnegative().max(20_000).default(0), source: z.enum(["public", "upload"]).default("upload"),
});

export const validationMessage = (error: z.ZodError) => error.issues[0]?.message || "Dữ liệu chưa hợp lệ.";
