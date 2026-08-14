import type { PrismaClient } from "../src/generated/prisma/client";
import { catalogProducts } from "../src/data/catalog";
import { getProductDetail } from "../src/data/product-details";

const key = (type: string, slug: string) => `${type}-${slug}`;

export async function seedProductionData(db: PrismaClient) {
  for (const root of [
    { id: key("category", "y-te"), name: "Y tế", slug: "y-te", type: "MEDICAL" as const, sortOrder: 0 },
    { id: key("category", "thu-y"), name: "Thú y", slug: "thu-y", type: "VETERINARY" as const, sortOrder: 1 },
  ]) await db.category.upsert({ where: { id: root.id }, create: { ...root, status: "PUBLISHED" }, update: { ...root, status: "PUBLISHED" } });

  const categories = new Map<string, { name: string; groups: Set<string>; image: string }>();
  const brands = new Map<string, { name: string; country: string }>();
  const specialties = new Map<string, string>();
  const applications = new Map<string, { name: string; groups: Set<string> }>();
  catalogProducts.forEach((product) => {
    const category = categories.get(product.categorySlug) ?? { name: product.category, groups: new Set(), image: product.image };
    category.groups.add(product.group); categories.set(product.categorySlug, category);
    brands.set(product.brandSlug, { name: product.brand, country: product.origin });
    product.specialtySlugs.forEach((slug, index) => specialties.set(slug, product.specialties[index]));
    product.applicationSlugs.forEach((slug, index) => {
      const application = applications.get(slug) ?? { name: product.applications[index], groups: new Set() };
      application.groups.add(product.group); applications.set(slug, application);
    });
  });

  let sortOrder = 0;
  for (const [slug, item] of categories) {
    const type: "BOTH" | "VETERINARY" | "MEDICAL" = item.groups.size > 1 ? "BOTH" : item.groups.has("veterinary") ? "VETERINARY" : "MEDICAL";
    const parentId = type === "VETERINARY" ? key("category", "thu-y") : type === "MEDICAL" ? key("category", "y-te") : null;
    const data = { name: item.name, image: item.image, type, parentId, status: "PUBLISHED" as const, sortOrder: sortOrder++ };
    await db.category.upsert({ where: { slug }, create: { id: key("category", slug), slug, ...data }, update: data });
  }
  sortOrder = 0;
  for (const [slug, item] of brands) {
    const data = { name: item.name, country: item.country, status: "PUBLISHED" as const, sortOrder: sortOrder++ };
    await db.brand.upsert({ where: { slug }, create: { id: key("brand", slug), slug, ...data }, update: data });
  }
  sortOrder = 0;
  for (const [slug, name] of specialties) {
    const data = { name, status: "PUBLISHED" as const, sortOrder: sortOrder++ };
    await db.specialty.upsert({ where: { slug }, create: { id: key("specialty", slug), slug, ...data }, update: data });
  }
  sortOrder = 0;
  for (const [slug, item] of applications) {
    const type: "BOTH" | "VETERINARY" | "MEDICAL" = item.groups.size > 1 ? "BOTH" : item.groups.has("veterinary") ? "VETERINARY" : "MEDICAL";
    const data = { name: item.name, type, status: "PUBLISHED" as const, sortOrder: sortOrder++ };
    await db.application.upsert({ where: { slug }, create: { id: key("application", slug), slug, ...data }, update: data });
  }

  for (const product of catalogProducts) {
    const detail = getProductDetail(product);
    const base = {
      name: product.name, slug: product.slug, model: product.model, brandId: key("brand", product.brandSlug), categoryId: key("category", product.categorySlug),
      type: product.group === "veterinary" ? "VETERINARY" as const : "MEDICAL" as const, origin: product.origin,
      warranty: detail.warranty?.period || product.warranty, shortDescription: detail.descriptor, description: detail.overview.join("\n\n"),
      price: detail.priceVnd, priceMode: detail.priceMode, featured: product.featured > 0, featuredOrder: product.featured,
      status: product.availability === "unavailable" ? "ARCHIVED" as const : "PUBLISHED" as const,
    };
    await db.product.upsert({
      where: { id: product.id },
      create: { id: product.id, sku: product.id.toUpperCase(), ...base, publishedAt: product.availability === "unavailable" ? null : new Date() },
      update: base,
    });
    await db.$transaction([
      db.productImage.deleteMany({ where: { productId: product.id } }), db.productFeature.deleteMany({ where: { productId: product.id } }),
      db.productConfiguration.deleteMany({ where: { productId: product.id } }), db.productSpecificationGroup.deleteMany({ where: { productId: product.id } }),
      db.productSpecialty.deleteMany({ where: { productId: product.id } }), db.productApplication.deleteMany({ where: { productId: product.id } }),
      db.productDocument.deleteMany({ where: { productId: product.id } }),
    ]);
    await db.product.update({ where: { id: product.id }, data: {
      images: { create: detail.gallery.filter((item) => item.type === "image").map((item, index) => ({ url: item.src, alt: item.alt, sortOrder: index, isCover: index === 0 })) },
      features: { create: detail.features.map((item, index) => ({ ...item, sortOrder: index })) },
      configurations: { create: detail.configurations.flatMap((group, groupIndex) => group.items.map((item, index) => ({ groupName: group.title, name: item.name, description: item.detail, sortOrder: groupIndex * 100 + index }))) },
      specificationGroups: { create: detail.specificationGroups.map((group, index) => ({ name: group.title, sortOrder: index, specifications: { create: group.items.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex })) } })) },
      specialties: { create: product.specialtySlugs.map((slug) => ({ specialtyId: key("specialty", slug) })) },
      applications: { create: product.applicationSlugs.map((slug) => ({ applicationId: key("application", slug) })) },
      documents: { create: detail.documents.filter((item) => item.href).map((item, index) => ({ name: item.title, type: "OTHER", url: item.href!, access: item.access === "public" ? "PUBLIC" : item.access === "login" ? "REGISTERED" : "STAFF", sortOrder: index })) },
    } });
  }

  const settings = { companyName: "THIÊN LỘC GROUP", hotline: "0902 137 158", email: "tuvan@thienlocgroup.com", address: "Đang cập nhật", zalo: "https://zalo.me/0902137158", facebook: "", logo: "/images/tl-group-logo.png" };
  for (const [settingKey, value] of Object.entries(settings)) await db.siteSetting.upsert({ where: { key: settingKey }, create: { key: settingKey, value, isPublic: true }, update: { value, isPublic: true } });
}
