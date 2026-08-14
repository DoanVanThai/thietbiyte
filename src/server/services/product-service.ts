import type { CatalogProduct } from "@/data/catalog";
import { getProductDetail, type ProductDetail } from "@/data/product-details";
import { getProductBySlug, getProducts, type CmsProduct } from "@/lib/content-repository";
import { databaseConfigured } from "@/server/db";
import { ProductRepository, type AdminProductListFilters } from "@/server/repositories/product-repository";
import { productInput, productPatchInput } from "@/server/validation/product";
import { listDocuments as listOperationsDocuments } from "@/server/repositories/operations-repository";

type ProductRecord = Awaited<ReturnType<ProductRepository["listPublished"]>>[number];
type AdminProductRecord = Awaited<ReturnType<ProductRepository["listAll"]>>[number];
type AdminProductListRecord = Awaited<ReturnType<ProductRepository["listAdminPage"]>>["records"][number];

export const databaseProductToCatalog = (record: ProductRecord): CatalogProduct => ({
  id: record.id,
  slug: record.slug,
  group: record.type === "VETERINARY" ? "veterinary" : "medical",
  category: record.category.name,
  categorySlug: record.category.slug,
  specialties: record.specialties.map(({ specialty }) => specialty.name),
  specialtySlugs: record.specialties.map(({ specialty }) => specialty.slug),
  brand: record.brand.name,
  brandSlug: record.brand.slug,
  model: record.model,
  origin: record.origin ?? "Đang cập nhật",
  priceBand: record.price ? "Có giá niêm yết" : "Liên hệ",
  warranty: record.warranty ?? "Theo cấu hình",
  applications: record.applications.map(({ application }) => application.name),
  applicationSlugs: record.applications.map(({ application }) => application.slug),
  name: record.name,
  specs: record.features.map((feature) => feature.title),
  image: record.images.find((image) => image.isCover)?.url ?? record.images[0]?.url ?? "/images/project-handover-placeholder.webp",
  imagePosition: "center",
  availability: record.priceMode === "SHOW_PRICE" ? "available" : "contact",
  featured: record.featured ? Math.max(1, record.featuredOrder) : 0,
  createdOrder: Math.floor(record.createdAt.getTime() / 1000),
});

export const databaseProductToCms = (record: AdminProductRecord): CmsProduct => ({
  ...databaseProductToCatalog(record),
  sku: record.sku,
  manufacturingYear: record.manufacturingYear ? String(record.manufacturingYear) : undefined,
  description: record.description || "",
  priceMode: record.priceMode,
  priceVnd: record.price ? Number(record.price) : undefined,
  publishStatus: record.status.toLocaleLowerCase("en-US") as CmsProduct["publishStatus"],
  updatedAt: record.updatedAt.toISOString(),
  detail: {
    gallery: record.images.map((image) => ({ type: "image", src: image.url, alt: image.alt, quoteEnabled: image.quoteEnabled, quoteCaption: image.quoteCaption || undefined, quoteAfterText: image.quoteAfterText || undefined })),
    features: record.features.map((feature) => ({ title: feature.title, description: feature.description || "" })),
    configurations: Object.entries(Object.groupBy(record.configurations, (item) => item.groupName)).map(([title, items]) => ({
      title, items: (items || []).map((item) => ({ name: item.name, detail: item.description || undefined, quantity: item.quantity, imageUrl: item.imageUrl || undefined })),
    })),
    specificationGroups: record.specificationGroups.map((group) => ({ title: group.name, items: group.specifications.map((item) => ({ label: item.label, value: item.value })) })),
    documents: record.documents.map((document) => ({
      title: document.name, type: document.type, format: document.type, size: document.fileSize ? `${document.fileSize} B` : undefined,
      access: document.access === "PUBLIC" ? "public" : document.access === "REGISTERED" ? "login" : "restricted", href: document.url,
    })),
    shortDescription: record.shortDescription || undefined,
    seo: { title: record.seoTitle || undefined, description: record.seoDescription || undefined },
    warranty: record.warranty ? { period: record.warranty } : undefined,
  },
});

export const databaseProductToAdminSummary = (record: AdminProductListRecord): CmsProduct => ({
  id: record.id,
  slug: record.slug,
  sku: record.sku,
  group: record.type === "VETERINARY" ? "veterinary" : "medical",
  category: record.category.name,
  categorySlug: record.category.slug,
  specialties: record.specialties.map(({ specialty }) => specialty.name),
  specialtySlugs: record.specialties.map(({ specialty }) => specialty.slug),
  brand: record.brand.name,
  brandSlug: record.brand.slug,
  model: record.model,
  origin: record.origin ?? "Đang cập nhật",
  manufacturingYear: record.manufacturingYear ? String(record.manufacturingYear) : undefined,
  warranty: record.warranty ?? "Theo cấu hình",
  name: record.name,
  image: record.images[0]?.url ?? "/images/project-handover-placeholder.webp",
  imagePosition: "center",
  applications: record.applications.map(({ application }) => application.name),
  applicationSlugs: record.applications.map(({ application }) => application.slug),
  specs: [],
  priceBand: record.price ? "Có giá niêm yết" : "Liên hệ",
  priceMode: record.priceMode,
  priceVnd: record.price ? Number(record.price) : undefined,
  availability: record.priceMode === "SHOW_PRICE" ? "available" : "contact",
  featured: record.featured ? Math.max(1, record.featuredOrder) : 0,
  createdOrder: Math.floor(record.createdAt.getTime() / 1000),
  publishStatus: record.status.toLocaleLowerCase("en-US") as CmsProduct["publishStatus"],
  description: record.description || "",
  updatedAt: record.updatedAt.toISOString(),
  detail: {
    gallery: record.images.map((image) => ({ type: "image", src: image.url, alt: image.alt })),
    features: [], configurations: [], specificationGroups: [], documents: [],
    shortDescription: record.shortDescription || undefined,
    seo: { title: record.seoTitle || undefined, description: record.seoDescription || undefined },
    warranty: record.warranty ? { period: record.warranty } : undefined,
  },
});

export class ProductService {
  constructor(private readonly repository = new ProductRepository()) {}

  async listPublicCatalog() {
    if (!databaseConfigured) return getProducts(true);
    try { return (await this.repository.listPublished()).map(databaseProductToCatalog); }
    catch (error) { console.error("Product catalog database unavailable; using the local content store.", error); return getProducts(true); }
  }

  async listPublicCatalogPage(page = 1, pageSize = 24) {
    const current = Math.max(1, Math.trunc(page));
    const size = Math.min(100, Math.max(1, Math.trunc(pageSize)));
    if (!databaseConfigured) {
      const products = getProducts(true);
      return { products: products.slice((current - 1) * size, current * size), pagination: { page: current, pageSize: size, total: products.length, totalPages: Math.max(1, Math.ceil(products.length / size)) } };
    }
    const result = await this.repository.listPublishedPage(current, size);
    return { products: result.records.map(databaseProductToCatalog), pagination: result.pagination };
  }

  async listAdminCatalog(): Promise<CmsProduct[]> {
    if (!databaseConfigured) return getProducts(false);
    try { return (await this.repository.listAll()).map(databaseProductToCms); }
    catch (error) { console.error("Admin product database unavailable; using the local content store.", error); return getProducts(false); }
  }

  async listAdminPage(page = 1, pageSize = 50, filters: AdminProductListFilters = {}) {
    const current = Math.max(1, Math.trunc(page));
    const size = Math.min(100, Math.max(1, Math.trunc(pageSize)));
    if (!databaseConfigured) {
      const products = this.filterAdminProducts(getProducts(false), filters);
      return { products: products.slice((current - 1) * size, current * size), pagination: { page: current, pageSize: size, total: products.length, totalPages: Math.max(1, Math.ceil(products.length / size)) } };
    }
    try {
      const result = await this.repository.listAdminPage(current, size, filters);
      return { products: result.records.map(databaseProductToAdminSummary), pagination: result.pagination };
    } catch (error) {
      console.error("Admin product page unavailable; using the local content store.", error);
      const products = this.filterAdminProducts(getProducts(false), filters);
      return { products: products.slice((current - 1) * size, current * size), pagination: { page: current, pageSize: size, total: products.length, totalPages: Math.max(1, Math.ceil(products.length / size)) } };
    }
  }

  async getAdminFilterOptions() {
    if (!databaseConfigured) {
      const products = getProducts(false);
      return { categories: [...new Set(products.map((product) => product.category))].sort(), brands: [...new Set(products.map((product) => product.brand))].sort(), specialties: [...new Set(products.flatMap((product) => product.specialties))].sort() };
    }
    return this.repository.adminFilterOptions();
  }

  private filterAdminProducts(products: CmsProduct[], filters: AdminProductListFilters) {
    const search = filters.search?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi").trim();
    return products.filter((product) => {
      const haystack = `${product.name} ${product.model} ${product.sku}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi");
      return (!search || haystack.includes(search))
        && (!filters.category || product.category === filters.category)
        && (!filters.brand || product.brand === filters.brand)
        && (!filters.specialty || product.specialties.includes(filters.specialty))
        && (!filters.group || product.group === filters.group)
        && (!filters.status || product.publishStatus === filters.status)
        && (!filters.priceMode || product.priceMode === filters.priceMode)
        && (!filters.featured || product.featured > 0);
    });
  }

  async getAdminMetrics() {
    if (!databaseConfigured) {
      const products = getProducts(false);
      return { products: products.length, categories: new Set(products.map((product) => product.categorySlug)).size, brands: new Set(products.map((product) => product.brandSlug)).size };
    }
    return this.repository.adminMetrics();
  }

  async getAdminProduct(id: string): Promise<CmsProduct | null> {
    if (!databaseConfigured) return getProducts(false).find((product) => product.id === id) || null;
    const record = await this.repository.findById(id);
    return record ? databaseProductToCms(record) : null;
  }

  async getPublicDetail(slug: string): Promise<ProductDetail | null> {
    const legacy = getProductBySlug(slug, true);
    const libraryDocuments = (productId: string) => listOperationsDocuments().filter((document) => document.productId === productId).map((document) => ({
      title: document.name,
      type: document.type,
      format: document.mimeType.includes("pdf") ? "PDF" : document.originalName.split(".").pop()?.toUpperCase() || "FILE",
      size: document.fileSize ? `${document.fileSize} B` : undefined,
      access: document.access === "public" ? "public" as const : document.access === "registered" ? "login" as const : "restricted" as const,
      href: document.url,
    }));
    const mergeDocuments = (productId: string, current: ProductDetail["documents"]) => [...new Map([...current, ...libraryDocuments(productId)].map((document) => [document.href || `${document.title}-${document.format}`, document])).values()];
    const fallback = () => legacy ? (() => {
      const base = getProductDetail(legacy);
      return {
        ...base,
        product: legacy,
        manufacturingYear: legacy.manufacturingYear,
        priceMode: legacy.priceMode,
        priceVnd: legacy.priceVnd,
        overview: legacy.description ? legacy.description.split(/\n\s*\n/).filter(Boolean) : base.overview,
        gallery: legacy.detail?.gallery?.length ? legacy.detail.gallery : [{ type: "image" as const, src: legacy.image, alt: `Ảnh ${legacy.name}` }],
        features: legacy.detail?.features || [],
        configurations: legacy.detail?.configurations || [],
        specificationGroups: legacy.detail?.specificationGroups || [],
        documents: mergeDocuments(legacy.id, legacy.detail?.documents || []),
        applications: [...legacy.applications],
      };
    })() : null;
    if (!databaseConfigured) return fallback();
    const record = await this.repository.findPublishedBySlug(slug);
    if (!record) return null;
    const product = databaseProductToCatalog(record);
    const base = getProductDetail(product);
    return {
      ...base,
      product,
      descriptor: record.shortDescription || product.category,
      manufacturingYear: record.manufacturingYear ? String(record.manufacturingYear) : undefined,
      priceMode: record.priceMode,
      priceVnd: record.price ? Number(record.price) : undefined,
      gallery: record.images.length ? record.images.map((image) => ({ type: "image" as const, src: image.url, alt: image.alt })) : [{ type: "image" as const, src: product.image, alt: `Ảnh ${product.name}` }],
      overview: record.description ? [record.description] : record.shortDescription ? [record.shortDescription] : [],
      features: record.features.map((feature) => ({ title: feature.title, description: feature.description || "" })),
      configurations: Object.entries(Object.groupBy(record.configurations, (item) => item.groupName)).map(([title, items]) => ({ title, items: (items || []).map((item) => ({ name: item.name, detail: item.description || undefined, quantity: item.quantity, imageUrl: item.imageUrl || undefined })) })),
      specificationGroups: record.specificationGroups.map((group) => ({ title: group.name, items: group.specifications.map((item) => ({ label: item.label, value: item.value })) })),
      applications: record.applications.map(({ application }) => application.name),
      documents: mergeDocuments(record.id, record.documents.map((document) => ({ title: document.name, format: document.type, size: document.fileSize ? `${document.fileSize} B` : undefined, access: document.access === "PUBLIC" ? "public" as const : document.access === "REGISTERED" ? "login" as const : "restricted" as const, href: document.url }))),
      warranty: record.warranty ? { period: record.warranty } : undefined,
      seo: { title: record.seoTitle || undefined, description: record.seoDescription || undefined },
      dataNotice: undefined,
    };
  }

  async resolveOldSlug(slug: string) {
    if (!databaseConfigured) {
      const { resolveOldSlug } = await import("@/lib/content-repository");
      return resolveOldSlug(slug) || null;
    }
    return this.repository.resolvePublishedSlug(slug);
  }

  async create(raw: unknown) {
    const input = productInput.parse(raw);
    const validTaxonomy = await this.repository.assertTaxonomy(input.brandId, input.categoryId, input.specialtyIds, input.applicationIds);
    if (!validTaxonomy) throw new Error("INVALID_TAXONOMY");
    return this.repository.create(input);
  }

  async update(id: string, raw: unknown) {
    const input = productPatchInput.parse(raw);
    const existing = await this.repository.findById(id);
    if (!existing) return null;
    const validTaxonomy = await this.repository.assertTaxonomy(
      input.brandId ?? existing.brandId, input.categoryId ?? existing.categoryId,
      input.specialtyIds ?? existing.specialties.map((item) => item.specialtyId),
      input.applicationIds ?? existing.applications.map((item) => item.applicationId),
    );
    if (!validTaxonomy) throw new Error("INVALID_TAXONOMY");
    return this.repository.update(id, input);
  }

  archive(id: string) { return this.repository.archive(id); }
}

export const productService = new ProductService();
