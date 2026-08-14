import { brandRoutes, categoryRoutes, specialtyRoutes, type CatalogRouteConfig } from "@/data/catalog";
import { getProductDetail, type ProductDetail } from "@/data/product-details";
import { categories as fallbackCategories, projects as fallbackProjects, reasons as fallbackReasons, solutions as fallbackSolutions, trustItems as fallbackTrustItems } from "@/data/homepage";
import { getContent, type CmsProduct } from "@/lib/content-repository";
import { productService } from "@/server/services/product-service";
import { taxonomyService } from "@/server/services/taxonomy-service";
import { siteSettingService } from "@/server/services/site-setting-service";
import { listPublishedArticles } from "@/server/repositories/operations-repository";

export const publicProducts = () => productService.listPublicCatalog();

export const productDetailFromCms = (product: CmsProduct): ProductDetail => {
  const fallback = getProductDetail(product);
  const content = product.detail;
  return {
    ...fallback,
    product,
    manufacturingYear: product.manufacturingYear,
    priceMode: product.priceMode,
    priceVnd: product.priceVnd,
    overview: product.description ? product.description.split(/\n\s*\n/).filter(Boolean) : fallback.overview,
    gallery: content?.gallery?.length ? content.gallery : [{ type: "image", src: product.image || "/images/project-handover-placeholder.webp", alt: `Ảnh ${product.name}` }],
    features: content?.features || [],
    configurations: content?.configurations || [],
    specificationGroups: content?.specificationGroups || [],
    documents: content?.documents || [],
    warranty: content?.warranty || (product.warranty ? { period: product.warranty } : undefined),
    seo: content?.seo,
    applications: [...product.applications],
    dataNotice: undefined,
  };
};

export const routeConfig = async (kind: "category" | "brand" | "specialty", slug: string): Promise<CatalogRouteConfig | undefined> => {
  const entity = await taxonomyService.get(kind, slug);
  if (!entity) {
    const fallbacks = { category: categoryRoutes, brand: brandRoutes, specialty: specialtyRoutes } as const;
    return fallbacks[kind].find((item) => item.slug === slug);
  }
  if (entity.status !== "active") return undefined;
  const labels = { category: "Danh mục", brand: "Thương hiệu", specialty: "Chuyên khoa" } as const;
  return {
    slug: entity.slug,
    title: kind === "specialty" ? `Thiết bị ${entity.name}` : entity.name,
    description: entity.description,
    kind,
    presetKey: kind,
    presetValue: entity.slug,
    parentLabel: labels[kind],
    parentHref: "/san-pham",
    note: kind === "brand" ? entity.description : undefined,
  };
};

export const searchIndex = async () => {
  const products = await publicProducts();
  const [categories, brands, specialties] = await Promise.all([taxonomyService.list("category"), taxonomyService.list("brand"), taxonomyService.list("specialty")]);
  const knowledge = listPublishedArticles();
  return [
    ...products.map((p) => ({ id:`product-${p.id}`,group:"products" as const,label:p.name,meta:`${p.brand} · ${p.model} · ${p.category}`,href:`/san-pham/${p.slug}`,keywords:[p.name,p.model,p.brand,p.category,...p.specialties,...p.applications,...p.specs].join(" "),image:p.image,productId:p.id })),
    ...categories.map((x) => ({ id:`category-${x.id}`,group:"categories" as const,label:x.name,meta:`${products.filter(p=>p.categorySlug===x.slug).length} sản phẩm`,href:`/danh-muc/${x.slug}`,keywords:`${x.name} ${x.description}` })),
    ...brands.map((x) => ({ id:`brand-${x.id}`,group:"brands" as const,label:x.name,meta:`${products.filter(p=>p.brandSlug===x.slug).length} sản phẩm`,href:`/thuong-hieu/${x.slug}`,keywords:`${x.name} ${x.description}` })),
    ...specialties.map((x) => ({ id:`specialty-${x.id}`,group:"specialties" as const,label:x.name,meta:"Chuyên khoa",href:`/chuyen-khoa/${x.slug}`,keywords:`${x.name} ${x.description}` })),
    ...knowledge.map((item) => ({ id:`knowledge-${item.id}`,group:"knowledge" as const,label:item.title,meta:item.category,href:`/?article=${encodeURIComponent(item.title)}#knowledge`,keywords:`${item.title} ${item.category} ${item.excerpt} ${item.content}` })),
  ];
};

export const catalogOptions = async () => {
  const products = await publicProducts();
  const [categories, brands, specialties] = await Promise.all([taxonomyService.list("category"), taxonomyService.list("brand"), taxonomyService.list("specialty")]);
  const pairs = (values: {slug:string;name:string}[]) => values.map(x => [x.slug,x.name] as const);
  return {
    groups: [["medical","Y tế"],["veterinary","Thú y"]] as const,
    categories: pairs(categories), specialties: pairs(specialties), brands: pairs(brands),
    origins: [...new Set(products.map(p=>p.origin).filter(Boolean))], priceBands: [...new Set(products.map(p=>p.priceBand).filter(Boolean))],
    statuses: [["available","Có thể tư vấn"],["contact","Liên hệ cấu hình"]] as const,
    warranties: [...new Set(products.map(p=>p.warranty).filter(Boolean))],
    applications: [...new Map(products.flatMap(p=>p.applicationSlugs.map((slug,i)=>[slug,[slug,p.applications[i]]] as const))).values()],
  };
};

export const homepageContent = async () => {
  const products = await publicProducts();
  const [categories, brands, specialties, settings] = await Promise.all([taxonomyService.list("category"), taxonomyService.list("brand"), taxonomyService.list("specialty"), siteSettingService.publicValues()]);
  const homepageCategories = categories.slice(0, 6).map((entity) => {
    const fallback = fallbackCategories.find((item) => item.query === entity.slug);
    return { name: entity.name, description: entity.description, image: entity.image || fallback?.image || "/images/project-handover-placeholder.webp", imagePosition: fallback?.imagePosition || "center", className: fallback?.className || "category-small", query: entity.slug };
  });
  return {
    hero: getContent("homepage.hero", { eyebrow:"THIÊN LỘC GROUP", title:"Giải pháp thiết bị y tế dành cho chăm sóc sức khỏe hiện đại", description:"Cung cấp thiết bị, giải pháp và dịch vụ kỹ thuật cho bệnh viện, phòng khám, phòng xét nghiệm và cơ sở thú y.", image:"/images/hero-ultrasound-lab.webp", primaryCta:{label:"Khám phá thiết bị",href:"#categories"},secondaryCta:{label:"Nhận tư vấn chuyên sâu",href:"#contact"} }),
    categories: homepageCategories.length ? homepageCategories : fallbackCategories, featuredProducts: products.filter(p=>p.featured>0).slice(0,4), brands, specialties,
    solutions:getContent("homepage.solutions",fallbackSolutions),projects:getContent("homepage.projects",fallbackProjects),knowledge:listPublishedArticles(8).map((item) => [item.category || "Kiến thức", item.title, item.excerpt] as const),trust:getContent("homepage.trust",fallbackTrustItems),reasons:getContent("homepage.reasons",fallbackReasons),settings,
  };
};
