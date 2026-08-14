import { z } from "zod";

const orderedItem = z.object({ sortOrder: z.coerce.number().int().min(0).default(0) });

export const productImageInput = orderedItem.extend({
  url: z.string().trim().min(1).max(2048),
  alt: z.string().trim().min(1).max(240),
  quoteEnabled: z.boolean().default(false),
  quoteCaption: z.string().trim().max(240).optional(),
  quoteAfterText: z.string().trim().max(1_200).optional(),
  isCover: z.boolean().default(false),
});

export const productFeatureInput = orderedItem.extend({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1200).optional(),
});

export const productConfigurationInput = orderedItem.extend({
  groupName: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1200).optional(),
  imageUrl: z.string().trim().max(2048).optional(),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
});

export const productSpecificationGroupInput = orderedItem.extend({
  name: z.string().trim().min(1).max(120),
  specifications: z.array(orderedItem.extend({
    label: z.string().trim().min(1).max(160),
    value: z.string().trim().min(1).max(1200),
  })).max(200).default([]),
});

export const productDocumentInput = orderedItem.extend({
  name: z.string().trim().min(1).max(240),
  type: z.enum(["CATALOGUE", "DATASHEET", "MANUAL", "CERTIFICATE", "WARRANTY", "OTHER"]),
  url: z.string().trim().min(1).max(2048),
  access: z.enum(["PUBLIC", "REGISTERED", "STAFF", "ADMIN"]).default("PUBLIC"),
  fileSize: z.coerce.number().int().min(0).optional(),
});

const productFields = {
  name: z.string().trim().min(2).max(240),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(240),
  sku: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(160),
  brandId: z.string().min(1),
  categoryId: z.string().min(1),
  type: z.enum(["MEDICAL", "VETERINARY", "BOTH"]),
  origin: z.string().trim().max(120).optional(),
  manufacturingYear: z.coerce.number().int().min(1900).max(2100).optional(),
  warranty: z.string().trim().max(120).optional(),
  shortDescription: z.string().trim().max(600).optional(),
  description: z.string().trim().max(50000).optional(),
  price: z.coerce.number().nonnegative().max(9999999999999).optional(),
  priceMode: z.enum(["SHOW_PRICE", "CONTACT", "REQUEST_QUOTE"]),
  featured: z.boolean(),
  featuredOrder: z.coerce.number().int().min(0),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(180).optional(),
  specialtyIds: z.array(z.string().min(1)).max(50),
  applicationIds: z.array(z.string().min(1)).max(50),
  images: z.array(productImageInput).max(30),
  features: z.array(productFeatureInput).max(100),
  configurations: z.array(productConfigurationInput).max(200),
  specificationGroups: z.array(productSpecificationGroupInput).max(50),
  documents: z.array(productDocumentInput).max(100),
};

export const productInput = z.object({
  ...productFields,
  priceMode: productFields.priceMode.default("CONTACT"),
  featured: productFields.featured.default(false),
  featuredOrder: productFields.featuredOrder.default(0),
  status: productFields.status.default("DRAFT"),
  specialtyIds: productFields.specialtyIds.default([]),
  applicationIds: productFields.applicationIds.default([]),
  images: productFields.images.default([]),
  features: productFields.features.default([]),
  configurations: productFields.configurations.default([]),
  specificationGroups: productFields.specificationGroups.default([]),
  documents: productFields.documents.default([]),
});

export const productPatchInput = z.object(productFields).partial().strict()
  .refine((value) => Object.keys(value).length > 0, "Không có dữ liệu cập nhật.");
export type ProductInput = z.infer<typeof productInput>;
export type ProductPatchInput = z.infer<typeof productPatchInput>;
