import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { db } from "@/server/db";
import type { ProductInput, ProductPatchInput } from "@/server/validation/product";

export const productRelations = {
  brand: true,
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  features: { orderBy: { sortOrder: "asc" as const } },
  configurations: { orderBy: { sortOrder: "asc" as const } },
  specificationGroups: {
    orderBy: { sortOrder: "asc" as const },
    include: { specifications: { orderBy: { sortOrder: "asc" as const } } },
  },
  specialties: { include: { specialty: true } },
  applications: { include: { application: true } },
  documents: { orderBy: { sortOrder: "asc" as const } },
};

export const productCatalogRelations = {
  brand: true,
  category: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 2 },
  features: { orderBy: { sortOrder: "asc" as const }, take: 3 },
  specialties: { include: { specialty: true } },
  applications: { include: { application: true } },
};

export const productAdminListRelations = {
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  images: { where: { isCover: true }, orderBy: { sortOrder: "asc" as const }, take: 1 },
  specialties: { include: { specialty: { select: { name: true, slug: true } } } },
  applications: { include: { application: { select: { name: true, slug: true } } } },
} satisfies Prisma.ProductInclude;

export type AdminProductListFilters = {
  search?: string;
  category?: string;
  brand?: string;
  specialty?: string;
  group?: "medical" | "veterinary";
  status?: "published" | "draft" | "archived";
  priceMode?: "SHOW_PRICE" | "CONTACT" | "REQUEST_QUOTE";
  featured?: boolean;
};

export class ProductRepository {
  constructor(private readonly client: PrismaClient = db) {}

  listPublished(limit = 100) {
    return this.client.product.findMany({
      where: { status: "PUBLISHED" },
      include: productCatalogRelations,
      orderBy: [{ featured: "desc" }, { featuredOrder: "desc" }, { createdAt: "desc" }],
      take: Math.min(100, Math.max(1, limit)),
    });
  }

  async listPublishedPage(page = 1, pageSize = 24) {
    const take = Math.min(100, Math.max(1, pageSize));
    const current = Math.max(1, page);
    const where = { status: "PUBLISHED" as const };
    const [records, total] = await this.client.$transaction([
      this.client.product.findMany({ where, include: productCatalogRelations, orderBy: [{ featured: "desc" }, { featuredOrder: "desc" }, { createdAt: "desc" }], take, skip: (current - 1) * take }),
      this.client.product.count({ where }),
    ]);
    return { records, pagination: { page: current, pageSize: take, total, totalPages: Math.max(1, Math.ceil(total / take)) } };
  }

  listAll() {
    return this.client.product.findMany({ include: productRelations, orderBy: { updatedAt: "desc" } });
  }

  async listAdminPage(page = 1, pageSize = 50, filters: AdminProductListFilters = {}) {
    const take = Math.min(100, Math.max(1, Math.trunc(pageSize)));
    const current = Math.max(1, Math.trunc(page));
    const search = filters.search?.trim();
    const where: Prisma.ProductWhereInput = {
      ...(search ? { OR: ["name", "model", "sku"].map((field) => ({ [field]: { contains: search, mode: "insensitive" as const } })) } : {}),
      ...(filters.category ? { category: { name: filters.category } } : {}),
      ...(filters.brand ? { brand: { name: filters.brand } } : {}),
      ...(filters.specialty ? { specialties: { some: { specialty: { name: filters.specialty } } } } : {}),
      ...(filters.group ? { type: filters.group === "veterinary" ? "VETERINARY" : "MEDICAL" } : {}),
      ...(filters.status ? { status: filters.status.toUpperCase() as "PUBLISHED" | "DRAFT" | "ARCHIVED" } : {}),
      ...(filters.priceMode ? { priceMode: filters.priceMode } : {}),
      ...(filters.featured ? { featured: true } : {}),
    };
    const [records, total] = await this.client.$transaction([
      this.client.product.findMany({ where, include: productAdminListRelations, orderBy: { updatedAt: "desc" }, take, skip: (current - 1) * take }),
      this.client.product.count({ where }),
    ]);
    return { records, pagination: { page: current, pageSize: take, total, totalPages: Math.max(1, Math.ceil(total / take)) } };
  }

  async adminFilterOptions() {
    const [categories, brands, specialties] = await Promise.all([
      this.client.category.findMany({ where: { status: { not: "ARCHIVED" } }, select: { name: true }, orderBy: { name: "asc" } }),
      this.client.brand.findMany({ where: { status: { not: "ARCHIVED" } }, select: { name: true }, orderBy: { name: "asc" } }),
      this.client.specialty.findMany({ where: { status: { not: "ARCHIVED" } }, select: { name: true }, orderBy: { name: "asc" } }),
    ]);
    return { categories: categories.map(({ name }) => name), brands: brands.map(({ name }) => name), specialties: specialties.map(({ name }) => name) };
  }

  async adminMetrics() {
    const [products, categories, brands] = await Promise.all([
      this.client.product.count(),
      this.client.category.count(),
      this.client.brand.count(),
    ]);
    return { products, categories, brands };
  }

  findById(id: string) {
    return this.client.product.findUnique({ where: { id }, include: productRelations });
  }

  findPublishedBySlug(slug: string) {
    return this.client.product.findFirst({ where: { slug, status: "PUBLISHED" }, include: productRelations });
  }

  async resolvePublishedSlug(oldSlug: string) {
    const history = await this.client.productSlugHistory.findUnique({ where: { oldSlug }, include: { product: { select: { slug: true, status: true } } } });
    return history?.product.status === "PUBLISHED" ? history.product.slug : null;
  }

  countExistingPublished(ids: string[]) {
    return this.client.product.count({ where: { id: { in: ids }, status: "PUBLISHED" } });
  }

  async assertTaxonomy(brandId: string, categoryId: string, specialtyIds: string[], applicationIds: string[]) {
    const [brand, category, specialties, applications] = await Promise.all([
      this.client.brand.findUnique({ where: { id: brandId }, select: { id: true } }),
      this.client.category.findUnique({ where: { id: categoryId }, select: { id: true } }),
      this.client.specialty.count({ where: { id: { in: specialtyIds } } }),
      this.client.application.count({ where: { id: { in: applicationIds } } }),
    ]);
    return Boolean(brand && category && specialties === specialtyIds.length && applications === applicationIds.length);
  }

  create(input: ProductInput) {
    const publishedAt = input.status === "PUBLISHED" ? new Date() : null;
    return this.client.product.create({
      data: {
        name: input.name, slug: input.slug, sku: input.sku, model: input.model,
        brandId: input.brandId, categoryId: input.categoryId, type: input.type,
        origin: input.origin, manufacturingYear: input.manufacturingYear, warranty: input.warranty,
        shortDescription: input.shortDescription, description: input.description, price: input.price,
        priceMode: input.priceMode, featured: input.featured, featuredOrder: input.featuredOrder,
        status: input.status, seoTitle: input.seoTitle, seoDescription: input.seoDescription, publishedAt,
        images: { create: input.images },
        features: { create: input.features },
        configurations: { create: input.configurations },
        specificationGroups: { create: input.specificationGroups.map((group) => ({
          name: group.name, sortOrder: group.sortOrder,
          specifications: { create: group.specifications },
        })) },
        specialties: { create: input.specialtyIds.map((specialtyId) => ({ specialtyId })) },
        applications: { create: input.applicationIds.map((applicationId) => ({ applicationId })) },
        documents: { create: input.documents },
      },
      include: productRelations,
    });
  }

  async update(id: string, patch: ProductPatchInput) {
    const existing = await this.findById(id);
    if (!existing) return null;
    return this.client.$transaction(async (tx) => {
      if (patch.slug && patch.slug !== existing.slug) await tx.productSlugHistory.upsert({ where: { oldSlug: existing.slug }, create: { oldSlug: existing.slug, productId: id }, update: { productId: id } });
      if (patch.images) await tx.productImage.deleteMany({ where: { productId: id } });
      if (patch.features) await tx.productFeature.deleteMany({ where: { productId: id } });
      if (patch.configurations) await tx.productConfiguration.deleteMany({ where: { productId: id } });
      if (patch.specificationGroups) await tx.productSpecificationGroup.deleteMany({ where: { productId: id } });
      if (patch.specialtyIds) await tx.productSpecialty.deleteMany({ where: { productId: id } });
      if (patch.applicationIds) await tx.productApplication.deleteMany({ where: { productId: id } });
      if (patch.documents) await tx.productDocument.deleteMany({ where: { productId: id } });

      const { images, features, configurations, specificationGroups, specialtyIds, applicationIds, documents, ...scalar } = patch;
      return tx.product.update({
        where: { id },
        data: {
          ...scalar,
          publishedAt: patch.status === "PUBLISHED" && !existing.publishedAt ? new Date() : patch.status === "DRAFT" ? null : undefined,
          images: images ? { create: images } : undefined,
          features: features ? { create: features } : undefined,
          configurations: configurations ? { create: configurations } : undefined,
          specificationGroups: specificationGroups ? { create: specificationGroups.map((group) => ({
            name: group.name, sortOrder: group.sortOrder, specifications: { create: group.specifications },
          })) } : undefined,
          specialties: specialtyIds ? { create: specialtyIds.map((specialtyId) => ({ specialtyId })) } : undefined,
          applications: applicationIds ? { create: applicationIds.map((applicationId) => ({ applicationId })) } : undefined,
          documents: documents ? { create: documents } : undefined,
        },
        include: productRelations,
      });
    });
  }

  archive(id: string) {
    return this.client.product.update({ where: { id }, data: { status: "ARCHIVED" }, include: productRelations });
  }

  delete(id: string) {
    return this.client.product.delete({ where: { id } });
  }
}
