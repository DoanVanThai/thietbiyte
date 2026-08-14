import "dotenv/config";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type ConfigurationItem = {
  name?: string;
  detail?: string;
  quantity?: number;
  imageUrl?: string;
  priceVnd?: number | null;
};

type ProductSample = {
  name?: string;
  slug?: string;
  sku?: string;
  model?: string;
  brand?: string;
  brandSlug?: string;
  category?: string;
  categorySlug?: string;
  origin?: string;
  manufacturingYear?: number | null;
  warranty?: string;
  shortDescription?: string;
  description?: string;
  priceMode?: string;
  priceVnd?: number | null;
  featured?: boolean | null;
  publishStatus?: string;
  seoTitle?: string;
  seoDescription?: string;
  detail?: {
    features?: Array<{ title?: string; description?: string }>;
    configurations?: Array<{
      title?: string;
      items?: ConfigurationItem[];
    }>;
    specificationGroups?: Array<{
      title?: string;
      items?: Array<{ label?: string; value?: string }>;
    }>;
  };
};

type ProductManifest = {
  productFiles?: string[];
};

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const samplesDirectory = resolve(scriptDirectory, "../src/data/product-samples");
const manifestPath = resolve(samplesDirectory, "medical-equipment-quote-1368-2026.json");
const demoImageUrl = "/images/project-handover-placeholder.webp";
const isDryRun = process.argv.includes("--dry-run");
const replaceRequested = process.argv.includes("--replace");
const confirmation = process.argv.find((argument) => argument.startsWith("--confirm="))?.split("=")[1];

const asText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "khong-co-du-lieu";

const nullableText = (value: unknown) => asText(value) || null;

const formatVnd = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

const configurationDescription = (item: ConfigurationItem) => {
  const parts: string[] = [];
  const detail = asText(item.detail);
  if (detail) parts.push(detail);
  if (typeof item.priceVnd === "number" && Number.isFinite(item.priceVnd)) {
    parts.push(`Giá: ${formatVnd(item.priceVnd)} VNĐ`);
  }
  return parts.join("\n") || null;
};

const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as ProductManifest;
if (!Array.isArray(manifest.productFiles) || manifest.productFiles.length === 0) {
  throw new Error("Manifest không có danh sách productFiles.");
}

const products = await Promise.all(
  manifest.productFiles.map(async (fileName) => {
    const safeFileName = fileName.split("/").pop();
    if (!safeFileName || safeFileName !== fileName || !safeFileName.endsWith(".json")) {
      throw new Error(`Tên file sản phẩm không hợp lệ: ${fileName}`);
    }
    const product = JSON.parse(await readFile(resolve(samplesDirectory, safeFileName), "utf8")) as ProductSample;
    return { fileName: safeFileName, product };
  }),
);

const usedSlugs = new Set<string>();
const usedSkus = new Set<string>();
const normalizedProducts = products.map(({ fileName, product }) => {
  const name = asText(product.name);
  const model = asText(product.model);
  const brand = asText(product.brand);
  if (!name || !model || !brand) {
    throw new Error(`${fileName}: name, model và brand là các trường bắt buộc.`);
  }

  const initialSlug = asText(product.slug) || slugify(`${name}-${model}`);
  let slug = initialSlug;
  for (let suffix = 2; usedSlugs.has(slug); suffix += 1) slug = `${initialSlug}-${suffix}`;
  usedSlugs.add(slug);

  const explicitSku = asText(product.sku);
  const skuBase = explicitSku || `TL-${slugify(model).replace(/-/g, "_").toUpperCase()}`;
  let sku = skuBase;
  for (let suffix = 2; usedSkus.has(sku); suffix += 1) sku = `${skuBase}_${suffix}`;
  usedSkus.add(sku);

  const price = product.priceVnd;
  if (price !== null && price !== undefined && (!Number.isFinite(price) || price < 0)) {
    throw new Error(`${fileName}: priceVnd không hợp lệ.`);
  }

  return { fileName, product, name, model, brand, slug, sku };
});

console.log(`Đã kiểm tra ${normalizedProducts.length} sản phẩm từ JSON.`);
for (const item of normalizedProducts) {
  console.log(`- ${item.model}: ${item.product.priceVnd ?? "để trống"} VND (${item.fileName})`);
}

if (isDryRun) process.exit(0);
if (!replaceRequested || confirmation !== "DELETE_OLD_PRODUCTS") {
  throw new Error(
    "Từ chối thay đổi DB. Cần dùng --replace --confirm=DELETE_OLD_PRODUCTS (hoặc --dry-run để chỉ kiểm tra).",
  );
}

const { db } = await import("../src/server/db");

try {
  const result = await db.$transaction(
    async (transaction) => {
      const oldProductCount = await transaction.product.count();
      const removedQuoteItemCount = await transaction.quoteRequestItem.count();

      // QuoteRequestItem dùng khóa ngoại Restrict. Chỉ bỏ dòng liên kết sản phẩm;
      // QuoteRequest, Customer và các dữ liệu lịch sử còn lại được giữ nguyên.
      await transaction.quoteRequestItem.deleteMany();
      await transaction.product.deleteMany();

      const medicalRoot = await transaction.category.upsert({
        where: { slug: "y-te" },
        update: {},
        create: {
          name: "Y tế",
          slug: "y-te",
          type: "MEDICAL",
          status: "DRAFT",
        },
      });

      const uncategorized = await transaction.category.upsert({
        where: { slug: "chua-phan-loai" },
        update: {},
        create: {
          name: "Chưa phân loại",
          slug: "chua-phan-loai",
          type: "MEDICAL",
          status: "DRAFT",
          parentId: medicalRoot.id,
        },
      });

      const createdProducts: Array<{ id: string; model: string; slug: string }> = [];

      for (const item of normalizedProducts) {
        const { product } = item;
        const brandSlug = asText(product.brandSlug) || slugify(item.brand);
        const brand = await transaction.brand.upsert({
          where: { slug: brandSlug },
          update: {},
          create: {
            name: item.brand,
            slug: brandSlug,
            country: nullableText(product.origin),
            status: "DRAFT",
          },
        });

        let category = uncategorized;
        const categoryName = asText(product.category);
        if (categoryName) {
          const categorySlug = asText(product.categorySlug) || slugify(categoryName);
          category = await transaction.category.upsert({
            where: { slug: categorySlug },
            update: {},
            create: {
              name: categoryName,
              slug: categorySlug,
              type: "MEDICAL",
              status: "DRAFT",
              parentId: medicalRoot.id,
            },
          });
        }

        const features = (product.detail?.features ?? [])
          .filter((feature) => asText(feature.title))
          .map((feature, sortOrder) => ({
            title: asText(feature.title),
            description: nullableText(feature.description),
            sortOrder,
          }));

        const configurations = (product.detail?.configurations ?? []).flatMap((group, groupIndex) =>
          (group.items ?? [])
            .filter((configuration) => asText(configuration.name))
            .map((configuration, itemIndex) => ({
              groupName: asText(group.title),
              name: asText(configuration.name),
              description: configurationDescription(configuration),
              imageUrl: nullableText(configuration.imageUrl),
              quantity:
                typeof configuration.quantity === "number" && Number.isInteger(configuration.quantity)
                  ? Math.max(1, configuration.quantity)
                  : 1,
              sortOrder: groupIndex * 1000 + itemIndex,
            })),
        );

        const specificationGroups = (product.detail?.specificationGroups ?? [])
          .filter((group) => asText(group.title))
          .map((group, groupIndex) => ({
            name: asText(group.title),
            sortOrder: groupIndex,
            specifications: {
              create: (group.items ?? [])
                .filter((specification) => asText(specification.label) || asText(specification.value))
                .map((specification, sortOrder) => ({
                  label: asText(specification.label),
                  value: asText(specification.value),
                  sortOrder,
                })),
            },
          }));

        const created = await transaction.product.create({
          data: {
            name: item.name,
            slug: item.slug,
            sku: item.sku,
            model: item.model,
            brandId: brand.id,
            categoryId: category.id,
            type: "MEDICAL",
            origin: nullableText(product.origin),
            manufacturingYear:
              typeof product.manufacturingYear === "number" && Number.isInteger(product.manufacturingYear)
                ? product.manufacturingYear
                : null,
            warranty: nullableText(product.warranty),
            shortDescription: nullableText(product.shortDescription),
            description: nullableText(product.description),
            price: product.priceVnd ?? null,
            priceMode: product.priceMode === "REQUEST_QUOTE" ? "REQUEST_QUOTE" : "CONTACT",
            featured: product.featured === true,
            status: "DRAFT",
            seoTitle: nullableText(product.seoTitle),
            seoDescription: nullableText(product.seoDescription),
            images: {
              create: {
                url: demoImageUrl,
                alt: `Ảnh minh họa - ${item.name}`,
                quoteEnabled: false,
                sortOrder: 0,
                isCover: true,
              },
            },
            features: features.length ? { create: features } : undefined,
            configurations: configurations.length ? { create: configurations } : undefined,
            specificationGroups: specificationGroups.length ? { create: specificationGroups } : undefined,
          },
          select: { id: true, model: true, slug: true },
        });
        createdProducts.push(created);
      }

      return { oldProductCount, removedQuoteItemCount, createdProducts };
    },
    { maxWait: 10_000, timeout: 60_000 },
  );

  console.log(
    JSON.stringify(
      {
        deletedProducts: result.oldProductCount,
        removedQuoteItems: result.removedQuoteItemCount,
        createdProducts: result.createdProducts,
        demoImageUrl,
      },
      null,
      2,
    ),
  );
} finally {
  await db.$disconnect();
}
