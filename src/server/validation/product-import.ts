import { z } from "zod";

export const PRODUCT_IMPORT_SCHEMA_VERSION = "product-import-v1" as const;
export const PRODUCT_IMPORT_MAX_PRODUCTS = 100;
export const PRODUCT_IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024;

const slug = z.string().trim().min(1, "Không được để trống.").max(240, "Tối đa 240 ký tự.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Chỉ dùng chữ thường không dấu, số và dấu gạch ngang.");
const text = (maximum: number) => z.string().trim().max(maximum, `Tối đa ${maximum} ký tự.`);
const requiredText = (maximum: number) => text(maximum).min(1, "Không được để trống.");
const assetUrl = z.string().trim().max(2048, "Đường dẫn tối đa 2.048 ký tự.").refine(
  (value) => value === "" || value.startsWith("/") || /^https:\/\//i.test(value),
  "Chỉ chấp nhận đường dẫn nội bộ bắt đầu bằng / hoặc URL https://.",
);

const taxonomyItem = z.object({
  name: requiredText(160),
  slug,
}).strict();

const importImage = z.object({
  url: assetUrl,
  alt: text(240),
  isCover: z.boolean(),
  quoteEnabled: z.boolean(),
  quoteCaption: text(240),
  quoteAfterText: text(1200),
}).strict().refine((image) => image.url !== "", { path: ["url"], message: "Ảnh phải có đường dẫn." });

const importFeature = z.object({
  title: requiredText(160),
  description: text(1200),
}).strict();

const importConfigurationItem = z.object({
  name: requiredText(200),
  detail: text(1200),
  quantity: z.number().int("Số lượng phải là số nguyên.").min(1, "Số lượng tối thiểu là 1.").max(999, "Số lượng tối đa là 999."),
  imageUrl: assetUrl,
}).strict();

const importConfigurationGroup = z.object({
  title: requiredText(120),
  items: z.array(importConfigurationItem).max(200, "Tối đa 200 mục cấu hình trong một nhóm."),
}).strict();

const importSpecification = z.object({
  label: requiredText(160),
  value: requiredText(1200),
}).strict();

const importSpecificationGroup = z.object({
  title: requiredText(120),
  items: z.array(importSpecification).max(200, "Tối đa 200 thông số trong một nhóm."),
}).strict();

const importDocument = z.object({
  title: requiredText(240),
  type: z.enum(["CATALOGUE", "DATASHEET", "MANUAL", "CERTIFICATE", "WARRANTY", "OTHER"]),
  url: assetUrl.refine((value) => value !== "", "Tài liệu phải có đường dẫn."),
  access: z.enum(["PUBLIC", "REGISTERED", "STAFF"]),
  fileSize: z.number().int("Dung lượng phải là số nguyên byte.").min(0, "Dung lượng không được âm.").nullable(),
}).strict();

export const productImportItemSchema = z.object({
  name: requiredText(240),
  slug,
  sku: requiredText(100),
  model: requiredText(160),
  brand: taxonomyItem,
  category: taxonomyItem,
  group: z.enum(["medical", "veterinary"]),
  origin: text(120),
  manufacturingYear: z.number().int("Năm sản xuất phải là số nguyên.").min(1900).max(2100).nullable(),
  warranty: text(1200),
  shortDescription: text(600),
  description: text(50000),
  priceMode: z.enum(["SHOW_PRICE", "CONTACT", "REQUEST_QUOTE"]),
  priceVnd: z.number().min(0, "Giá không được âm.").max(9_999_999_999_999).nullable(),
  featured: z.boolean(),
  specialties: z.array(taxonomyItem).max(50, "Tối đa 50 chuyên khoa."),
  applications: z.array(taxonomyItem).max(50, "Tối đa 50 ứng dụng."),
  images: z.array(importImage).max(30, "Tối đa 30 ảnh."),
  features: z.array(importFeature).max(100, "Tối đa 100 tính năng."),
  configurations: z.array(importConfigurationGroup).max(50, "Tối đa 50 nhóm cấu hình."),
  specificationGroups: z.array(importSpecificationGroup).max(50, "Tối đa 50 nhóm thông số."),
  documents: z.array(importDocument).max(100, "Tối đa 100 tài liệu."),
  seo: z.object({
    title: text(70),
    description: text(180),
  }).strict(),
}).strict().superRefine((product, context) => {
  const covers = product.images.filter((image) => image.isCover);
  if (covers.length > 1) context.addIssue({ code: "custom", path: ["images"], message: "Mỗi sản phẩm chỉ được có một ảnh bìa." });
  if (product.priceMode === "SHOW_PRICE" && product.priceVnd === null) context.addIssue({ code: "custom", path: ["priceVnd"], message: "Chế độ SHOW_PRICE bắt buộc có giá." });
});

export const productImportSchema = z.object({
  schemaVersion: z.literal(PRODUCT_IMPORT_SCHEMA_VERSION),
  _instructions: z.object({
    rule: z.string(),
    emptyValues: z.string(),
    assetUrls: z.string(),
    allowedValues: z.object({
      group: z.string(),
      priceMode: z.string(),
      documentType: z.string(),
      documentAccess: z.string(),
    }).strict(),
  }).strict(),
  products: z.array(productImportItemSchema)
    .min(1, "File phải có ít nhất một sản phẩm.")
    .max(PRODUCT_IMPORT_MAX_PRODUCTS, `Mỗi lần chỉ nhập tối đa ${PRODUCT_IMPORT_MAX_PRODUCTS} sản phẩm.`),
}).strict();

export type ProductImportDocument = z.infer<typeof productImportSchema>;
export type ProductImportItem = z.infer<typeof productImportItemSchema>;

export const productImportTemplate: ProductImportDocument = {
  schemaVersion: PRODUCT_IMPORT_SCHEMA_VERSION,
  _instructions: {
    rule: "Giữ nguyên tên và đầy đủ các trường; không thêm trường ngoài mẫu. Có thể nhân bản phần tử trong products để nhập nhiều sản phẩm.",
    emptyValues: "Không có dữ liệu: dùng chuỗi rỗng, mảng rỗng hoặc null đúng như kiểu thể hiện trong mẫu; không tự suy diễn thông tin.",
    assetUrls: "Ảnh và tài liệu dùng URL https:// hoặc đường dẫn nội bộ bắt đầu bằng /. Không nhúng base64 vào file JSON.",
    allowedValues: {
      group: "medical | veterinary",
      priceMode: "SHOW_PRICE | CONTACT | REQUEST_QUOTE",
      documentType: "CATALOGUE | DATASHEET | MANUAL | CERTIFICATE | WARRANTY | OTHER",
      documentAccess: "PUBLIC | REGISTERED | STAFF",
    },
  },
  products: [{
    name: "TÊN SẢN PHẨM",
    slug: "ten-san-pham",
    sku: "SKU-MAU-001",
    model: "MODEL-MAU",
    brand: { name: "Tên hãng sản xuất", slug: "ten-hang-san-xuat" },
    category: { name: "Tên danh mục", slug: "ten-danh-muc" },
    group: "medical",
    origin: "Quốc gia sản xuất",
    manufacturingYear: 2026,
    warranty: "Thời hạn hoặc nội dung bảo hành ngắn gọn",
    shortDescription: "Mô tả ngắn dùng trên danh sách sản phẩm.",
    description: "Mô tả đầy đủ của sản phẩm.",
    priceMode: "CONTACT",
    priceVnd: null,
    featured: false,
    specialties: [{ name: "Chẩn đoán hình ảnh", slug: "chan-doan-hinh-anh" }],
    applications: [{ name: "Ứng dụng mẫu", slug: "ung-dung-mau" }],
    images: [{
      url: "https://example.com/images/san-pham.webp",
      alt: "Tên sản phẩm",
      isCover: true,
      quoteEnabled: true,
      quoteCaption: "Ảnh minh họa sản phẩm",
      quoteAfterText: "",
    }],
    features: [{ title: "Tính năng nổi bật", description: "Mô tả tính năng." }],
    configurations: [{
      title: "Cấu hình cung cấp",
      items: [{ name: "Máy chính", detail: "Kèm phụ kiện tiêu chuẩn", quantity: 1, imageUrl: "" }],
    }],
    specificationGroups: [{
      title: "THÔNG SỐ KỸ THUẬT",
      items: [{ label: "Thông số mẫu", value: "Giá trị mẫu" }],
    }],
    documents: [{
      title: "Catalogue sản phẩm",
      type: "CATALOGUE",
      url: "https://example.com/documents/catalogue.pdf",
      access: "PUBLIC",
      fileSize: null,
    }],
    seo: { title: "", description: "" },
  }],
};

export const productImportToCmsPayload = (product: ProductImportItem) => {
  const cover = product.images.find((image) => image.isCover) || product.images[0];
  const gallery = cover ? [cover, ...product.images.filter((image) => image !== cover)] : [];
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    model: product.model,
    brand: product.brand.name,
    brandSlug: product.brand.slug,
    category: product.category.name,
    categorySlug: product.category.slug,
    group: product.group,
    origin: product.origin,
    manufacturingYear: product.manufacturingYear === null ? undefined : String(product.manufacturingYear),
    warranty: product.warranty,
    shortDescription: product.shortDescription,
    description: product.description,
    priceMode: product.priceMode,
    priceVnd: product.priceVnd ?? undefined,
    priceBand: "",
    featured: product.featured ? 10 : 0,
    availability: product.priceMode === "SHOW_PRICE" ? "available" as const : "contact" as const,
    image: cover?.url || "/images/project-handover-placeholder.webp",
    imagePosition: "center",
    specialties: product.specialties.map((item) => item.name),
    specialtySlugs: product.specialties.map((item) => item.slug),
    applications: product.applications.map((item) => item.name),
    applicationSlugs: product.applications.map((item) => item.slug),
    specs: product.features.map((item) => item.title),
    publishStatus: "draft" as const,
    action: "draft" as const,
    seoTitle: product.seo.title,
    seoDescription: product.seo.description,
    detail: {
      gallery: gallery.map((image) => ({
        type: "image" as const,
        src: image.url,
        alt: image.alt || product.name,
        isCover: image === cover,
        quoteEnabled: image.quoteEnabled,
        quoteCaption: image.quoteCaption,
        quoteAfterText: image.quoteAfterText,
      })),
      features: product.features,
      configurations: product.configurations,
      specificationGroups: product.specificationGroups,
      applications: product.applications.map((item) => item.name),
      documents: product.documents.map((document) => ({
        title: document.title,
        type: document.type,
        format: document.type,
        fileSize: document.fileSize ?? undefined,
        size: document.fileSize === null ? undefined : `${document.fileSize} B`,
        access: document.access === "PUBLIC" ? "public" as const : document.access === "REGISTERED" ? "login" as const : "restricted" as const,
        href: document.url,
      })),
      shortDescription: product.shortDescription,
      warranty: { period: product.warranty },
      seo: { title: product.seo.title, description: product.seo.description },
    },
  };
};

export type ProductImportError = { path: string; message: string };

export const formatProductImportIssues = (error: z.ZodError): ProductImportError[] => error.issues.map((issue) => ({
  path: issue.path.length ? issue.path.map((part) => typeof part === "number" ? `[${part}]` : part).join(".").replace(/\.\[/g, "[") : "file",
  message: issue.code === "unrecognized_keys"
    ? `Có trường không được phép: ${issue.keys.join(", ")}.`
    : issue.code === "invalid_type"
      ? "Thiếu trường hoặc sai kiểu dữ liệu."
      : issue.message,
}));
