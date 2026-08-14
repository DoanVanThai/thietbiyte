import { z } from "zod";

export const customerTypeInput = z.enum([
  "INDIVIDUAL", "CLINIC", "HOSPITAL", "LABORATORY", "DEALER", "VETERINARY_CLINIC", "VETERINARY_HOSPITAL",
]);

export const quoteRequestInput = z.object({
  source: z.string().trim().min(1).max(80).default("GLOBAL"),
  customer: z.object({
    name: z.string().trim().min(2).max(160),
    phone: z.string().trim().regex(/^[0-9+ ()-]{9,16}$/),
    email: z.email().optional().or(z.literal("")),
    organization: z.string().trim().max(240).optional(),
    type: customerTypeInput.default("INDIVIDUAL"),
    city: z.string().trim().max(120).optional(),
  }),
  need: z.string().trim().min(10).max(5000),
  note: z.string().trim().max(5000).optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.coerce.number().int().min(1).max(99),
    note: z.string().trim().max(1000).optional(),
  })).max(50).default([]),
  documents: z.array(z.object({
    name: z.string().trim().min(1).max(240),
    size: z.coerce.number().int().min(0).max(10 * 1024 * 1024),
    url: z.string().trim().max(2048).optional(),
    storedName: z.string().trim().min(1).max(240).optional(),
    mimeType: z.string().trim().min(1).max(160).optional(),
  })).max(3).default([]),
});

export type QuoteRequestInput = z.infer<typeof quoteRequestInput>;
