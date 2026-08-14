import { z } from "zod";

const optionalLine = z.string().trim().max(2_000).default("");

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
    quantity: z.coerce.number().int().min(1).max(999),
    unitPrice: z.coerce.number().int().nonnegative().max(99_999_999_999_999),
    description: z.string().trim().min(10).max(100_000),
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
