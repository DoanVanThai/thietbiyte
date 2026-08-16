import { z } from "zod";

const optionalLine = z.string().trim().max(2_000).default("");

export const quoteRichTextSchema = z.object({
  version: z.literal(1),
  paragraphs: z.array(z.object({
    runs: z.array(z.object({
      text: z.string().max(20_000),
      bold: z.boolean().optional(),
      underline: z.boolean().optional(),
      color: z.enum(["default", "red"]).optional(),
    })).max(500),
  })).max(2_000),
}).superRefine((value, context) => {
  const length = value.paragraphs.reduce((total, paragraph) => total + paragraph.runs.reduce((sum, run) => sum + run.text.length, 0), 0);
  if (length > 100_000) context.addIssue({ code: "custom", message: "Nội dung định dạng vượt quá 100.000 ký tự." });
});

export const salesQuotePdfInput = z.object({
  quoteNumber: z.string().trim().min(1).max(80),
  quoteDate: z.iso.date(),
  city: z.string().trim().min(2).max(120).default("Hà Nội"),
  customer: z.object({
    name: z.string().trim().min(2).max(200),
    organization: z.string().trim().max(240).default(""),
    address: z.string().trim().max(500).default(""),
    phone: z.string().trim().max(40).default(""),
    email: z.union([z.literal(""), z.email()]).default(""),
  }),
  companyTagline: z.string().trim().max(300).default("Chuyên kinh doanh trang thiết bị y tế, hóa chất và vật tư tiêu hao."),
  companyAddress: z.string().trim().max(800).default(""),
  website: z.string().trim().max(200).default("thienlocgroup.com"),
  introduction: z.string().trim().min(10).max(2_000),
  items: z.array(z.object({
    productId: z.string().trim().min(1).max(200),
    productSnapshot: z.object({
      name: z.string().trim().min(1).max(500),
      sku: z.string().trim().max(200).default(""),
      model: z.string().trim().max(300).default(""),
      brand: z.string().trim().max(300).default(""),
      origin: z.string().trim().max(300).default(""),
      manufacturingYear: z.string().trim().max(40).optional(),
      warranty: z.string().trim().max(300).default(""),
    }).optional(),
    quantity: z.coerce.number().int().min(1).max(999),
    unitPrice: z.coerce.number().int().nonnegative().max(99_999_999_999_999),
    description: z.string().trim().min(10).max(100_000),
    descriptionRich: quoteRichTextSchema.optional(),
    imageUrls: z.array(z.string().trim().min(1).max(2048)).max(30).optional(),
    images: z.array(z.object({
      url: z.string().trim().min(1).max(2048),
      caption: z.string().trim().max(240).default(""),
      afterText: z.string().trim().max(1_200).default(""),
    })).max(30).optional(),
  })).min(1).max(20),
  vatIncluded: z.boolean().default(true),
  delivery: optionalLine,
  payment: optionalLine,
  validity: optionalLine,
  additionalTerms: z.string().trim().max(5_000).default(""),
});

export type SalesQuotePdfInput = z.infer<typeof salesQuotePdfInput>;
