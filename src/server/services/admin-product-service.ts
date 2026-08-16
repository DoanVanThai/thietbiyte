import { db } from "@/server/db";
import { ProductRepository } from "@/server/repositories/product-repository";
import { databaseProductToCms, productService } from "@/server/services/product-service";
import { invalidateContentCache } from "@/lib/content-repository";

type CmsPayload = Record<string, any>;
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const documentType = (value: string) => ["CATALOGUE", "DATASHEET", "MANUAL", "CERTIFICATE", "WARRANTY"].includes(value.toUpperCase()) ? value.toUpperCase() : "OTHER";
const documentAccess = (value: string) => {
  const normalized = value.toUpperCase();
  if (["PUBLIC", "REGISTERED", "STAFF", "ADMIN"].includes(normalized)) return normalized;
  if (normalized === "LOGIN") return "REGISTERED";
  if (normalized === "RESTRICTED") return "STAFF";
  return "PUBLIC";
};

export class AdminProductService {
  constructor(private readonly repository = new ProductRepository()) {}

  private async normalize(raw: CmsPayload, currentId?: string) {
    const name = String(raw.name || "").trim();
    const brandSlug = String(raw.brandSlug || slugify(raw.brand || "chua-cap-nhat"));
    const categorySlug = String(raw.categorySlug || slugify(raw.category || "chua-phan-loai"));
    const group = raw.group === "veterinary" ? "VETERINARY" : "MEDICAL";
    const brand = await db.brand.upsert({ where: { slug: brandSlug }, create: { slug: brandSlug, name: String(raw.brand || "Chưa cập nhật"), status: "PUBLISHED" }, update: { name: String(raw.brand || "Chưa cập nhật") } });
    const rootSlug = group === "VETERINARY" ? "thu-y" : "y-te";
    const root = await db.category.upsert({ where: { slug: rootSlug }, create: { slug: rootSlug, name: group === "VETERINARY" ? "Thú y" : "Y tế", type: group, status: "PUBLISHED" }, update: {} });
    const category = await db.category.upsert({ where: { slug: categorySlug }, create: { slug: categorySlug, name: String(raw.category || "Chưa phân loại"), type: group, parentId: root.id, status: "PUBLISHED" }, update: { name: String(raw.category || "Chưa phân loại"), type: group } });
    const specialtyIds = await Promise.all((raw.specialtySlugs || []).map(async (slug: string, index: number) => (await db.specialty.upsert({ where: { slug }, create: { slug, name: raw.specialties?.[index] || slug, status: "PUBLISHED" }, update: { name: raw.specialties?.[index] || slug } })).id));
    const applicationIds = await Promise.all((raw.applicationSlugs || []).map(async (slug: string, index: number) => (await db.application.upsert({ where: { slug }, create: { slug, name: raw.applications?.[index] || slug, type: group, status: "PUBLISHED" }, update: { name: raw.applications?.[index] || slug } })).id));
    const detail = raw.detail || {};
    const status = raw.action === "publish" ? "PUBLISHED" : raw.action === "archived" ? "ARCHIVED" : String(raw.publishStatus || "draft").toUpperCase();
    return {
      name, slug: String(raw.slug || slugify(name)), sku: String(raw.sku || currentId || `SKU-${Date.now()}`), model: String(raw.model || "Đang cập nhật"),
      brandId: brand.id, categoryId: category.id, type: group, origin: raw.origin || undefined, manufacturingYear: raw.manufacturingYear ? Number(raw.manufacturingYear) : undefined,
      warranty: raw.warranty || detail.warranty?.period || undefined, shortDescription: raw.shortDescription || detail.shortDescription || undefined, description: raw.description || undefined,
      price: raw.priceVnd, priceMode: raw.priceMode || "CONTACT", featured: Number(raw.featured || 0) > 0, featuredOrder: Number(raw.featured || 0),
      status, seoTitle: raw.seoTitle || detail.seo?.title, seoDescription: raw.seoDescription || detail.seo?.description, specialtyIds, applicationIds,
      images: (detail.gallery || []).filter((item: CmsPayload) => item.type === "image" && item.src).map((item: CmsPayload, index: number) => ({ url: item.src, alt: item.alt || name, quoteEnabled: Boolean(item.quoteEnabled), quoteCaption: item.quoteCaption || undefined, quoteAfterText: item.quoteAfterText || undefined, sortOrder: index, isCover: typeof item.isCover === "boolean" ? item.isCover : index === 0 })),
      features: (detail.features || []).map((item: CmsPayload, index: number) => ({ title: item.title, description: item.description, sortOrder: index })),
      configurations: (detail.configurations || []).flatMap((groupItem: CmsPayload, groupIndex: number) => (groupItem.items || []).map((item: CmsPayload, index: number) => ({ groupName: groupItem.title, name: item.name, description: item.detail, imageUrl: item.imageUrl || undefined, quantity: item.quantity || 1, sortOrder: groupIndex * 100 + index }))),
      specificationGroups: (detail.specificationGroups || []).map((groupItem: CmsPayload, groupIndex: number) => ({ name: groupItem.title, sortOrder: groupIndex, specifications: (groupItem.items || []).map((item: CmsPayload, index: number) => ({ label: item.label, value: item.value, sortOrder: index })) })),
      documents: (detail.documents || []).filter((item: CmsPayload) => item.href).map((item: CmsPayload, index: number) => ({ name: item.title, type: documentType(item.type || item.format), url: item.href, access: documentAccess(item.access || "PUBLIC"), fileSize: typeof item.fileSize === "number" ? item.fileSize : undefined, sortOrder: index })),
    };
  }

  async save(raw: CmsPayload, id?: string) {
    const normalized = await this.normalize(raw, id);
    const product = id ? await productService.update(id, normalized) : await productService.create(normalized);
    invalidateContentCache("products");
    return product;
  }

  async get(id: string) { const record = await this.repository.findById(id); return record ? databaseProductToCms(record) : null; }
  async archive(id: string) { const product = databaseProductToCms(await this.repository.archive(id)); invalidateContentCache("products"); return product; }
  async delete(id: string) { await this.repository.delete(id); invalidateContentCache("products"); }
  async duplicate(id: string) {
    const existing = await this.get(id); if (!existing) return null;
    return this.save({ ...existing, id: undefined, name: `${existing.name} — Bản sao`, slug: `${existing.slug}-ban-sao-${Date.now().toString().slice(-4)}`, sku: `${existing.sku}-COPY-${Date.now().toString().slice(-4)}`, publishStatus: "draft", action: "draft" });
  }
}

export const adminProductService = new AdminProductService();
