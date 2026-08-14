import { catalogProducts } from "@/data/catalog";
import { articles } from "@/data/homepage";

export type SearchGroup = "products" | "categories" | "brands" | "specialties" | "knowledge";

export interface SearchEntry {
  id: string;
  group: SearchGroup;
  label: string;
  meta: string;
  href: string;
  keywords: string;
  image?: string;
  productId?: string;
}

const uniqueBy = <T>(items: readonly T[], key: (item: T) => string) =>
  [...new Map(items.map((item) => [key(item), item])).values()];

const productEntries: SearchEntry[] = catalogProducts.map((product) => ({
  id: `product-${product.id}`,
  group: "products",
  label: product.name,
  meta: `${product.brand} · ${product.model} · ${product.category}`,
  href: `/san-pham/${product.slug}`,
  keywords: [
    product.name,
    product.model,
    product.brand,
    product.category,
    ...product.specialties,
    ...product.applications,
    ...product.specs,
  ].join(" "),
  image: product.image,
  productId: product.id,
}));

const categoryEntries: SearchEntry[] = uniqueBy(catalogProducts, (product) => product.categorySlug).map((product) => ({
  id: `category-${product.categorySlug}`,
  group: "categories",
  label: product.category,
  meta: `${catalogProducts.filter((item) => item.categorySlug === product.categorySlug).length} sản phẩm`,
  href: `/danh-muc/${product.categorySlug}`,
  keywords: `${product.category} ${product.applications.join(" ")} ${product.specialties.join(" ")}`,
}));

const brandEntries: SearchEntry[] = uniqueBy(catalogProducts, (product) => product.brandSlug).map((product) => ({
  id: `brand-${product.brandSlug}`,
  group: "brands",
  label: product.brand,
  meta: `${catalogProducts.filter((item) => item.brandSlug === product.brandSlug).length} sản phẩm`,
  href: `/thuong-hieu/${product.brandSlug}`,
  keywords: `${product.brand} ${catalogProducts.filter((item) => item.brandSlug === product.brandSlug).map((item) => item.model).join(" ")}`,
}));

const specialtyEntries: SearchEntry[] = uniqueBy(
  catalogProducts.flatMap((product) => product.specialties.map((label, index) => ({
    label,
    slug: product.specialtySlugs[index],
  }))),
  (specialty) => specialty.slug,
).map((specialty) => ({
  id: `specialty-${specialty.slug}`,
  group: "specialties",
  label: specialty.label,
  meta: "Chuyên khoa",
  href: `/chuyen-khoa/${specialty.slug}`,
  keywords: specialty.label,
}));

const knowledgeEntries: SearchEntry[] = articles.map(([category, title, description], index) => ({
  id: `knowledge-${index + 1}`,
  group: "knowledge",
  label: title,
  meta: category,
  href: `/?article=${encodeURIComponent(title)}#knowledge`,
  keywords: `${category} ${title} ${description}`,
}));

export const searchEntries: readonly SearchEntry[] = [
  ...productEntries,
  ...categoryEntries,
  ...brandEntries,
  ...specialtyEntries,
  ...knowledgeEntries,
];

export const searchGroupLabels: Record<SearchGroup, string> = {
  products: "Sản phẩm",
  categories: "Danh mục",
  brands: "Thương hiệu",
  specialties: "Chuyên khoa",
  knowledge: "Bài viết",
};
