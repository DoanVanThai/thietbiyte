import type { CmsProduct } from "@/lib/content-repository";
import { isQuotePlaceholderValue, quoteRichTextToPlainText, sanitizeQuotePlainText, sanitizeQuoteRichText } from "@/lib/quote-rich-text";
import type { SalesQuotePdfInput } from "@/server/validation/sales-quote";
import { productService } from "@/server/services/product-service";

export type QuoteCompanyDetails = {
  name: string;
  hotline: string;
  email: string;
};

export type ResolvedQuoteImage = {
  url: string;
  caption: string;
  afterText: string;
  data?: Buffer;
  width?: number;
  height?: number;
};

export type ResolvedQuoteItem = SalesQuotePdfInput["items"][number] & {
  name: string;
  sku: string;
  model: string;
  brand: string;
  origin: string;
  manufacturingYear?: string;
  warranty: string;
  images?: ResolvedQuoteImage[];
};

const quoteFileStem = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/Đ/g, "D")
  .replace(/[^a-zA-Z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .toLocaleLowerCase("en-US") || "bao-gia";

export const quoteFileName = (value: string) => {
  const quoteNumber = value.trim()
    .replaceAll("/", "／")
    .replace(/[\\:*?"<>]/g, "-") || "Báo giá";
  return `Thiên Lộc Group | ${quoteNumber}`;
};

export const quoteContentDisposition = (quoteNumber: string, extension: "pdf" | "docx") => {
  const displayName = `${quoteFileName(quoteNumber)}.${extension}`;
  const fallbackName = `thien-loc-group-${quoteFileStem(quoteNumber)}.${extension}`;
  return `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(displayName)}`;
};

const cleanQuoteText = (value: string) => value
  .replace(/[\u2010-\u2015\u2212]/g, "-")
  .replace(/[•●▪✓✔]/g, "-")
  .replace(/\u00a0/g, " ")
  .replace(/[ \t]+\n/g, "\n")
  .trim();

const compactSpecificationLine = (label: string, value: string) => {
  const conciseValue = value.trim().replace(/^có(?:$|\s*[,;:]\s*|\s+)/iu, "");
  return `- ${label}${conciseValue ? `: ${conciseValue}` : ""}`;
};

export function buildProductQuoteDescription(product: CmsProduct) {
  const detail = product.detail;
  const sections: string[] = [product.name.toLocaleUpperCase("vi")];
  const addMetadata = (label: string, value: string | number | null | undefined, suffix = "") => {
    if (!isQuotePlaceholderValue(value)) sections.push(`${label}: ${String(value).trim()}${suffix}`);
  };
  addMetadata("Model", product.model);
  addMetadata("Hãng sản xuất", product.brand);
  addMetadata("Xuất xứ", product.origin);
  addMetadata("Năm sản xuất", product.manufacturingYear, " trở về sau");
  addMetadata("Bảo hành", product.warranty);
  const productDescription = sanitizeQuotePlainText(product.description || "");
  if (productDescription) sections.push("", productDescription);

  const features = (detail?.features || []).flatMap((feature) => {
    if (isQuotePlaceholderValue(feature.title)) return [];
    const description = isQuotePlaceholderValue(feature.description) ? "" : feature.description.trim();
    return [`- ${feature.title.trim()}${description ? `: ${description}` : ""}`];
  });
  if (features.length) {
    sections.push("", "TÍNH NĂNG NỔI BẬT");
    sections.push(...features);
  }
  const configurations = (detail?.configurations || []).flatMap((group) => {
    if (isQuotePlaceholderValue(group.title)) return [];
    const items = group.items.flatMap((item) => {
      if (isQuotePlaceholderValue(item.name)) return [];
      const description = isQuotePlaceholderValue(item.detail) ? "" : item.detail?.trim() || "";
      return [`- ${item.name.trim()}${description ? `: ${description}` : ""}`];
    });
    return items.length ? [group.title.toLocaleUpperCase("vi"), ...items] : [];
  });
  if (configurations.length) {
    sections.push("", "CẤU HÌNH CUNG CẤP");
    sections.push(...configurations);
  }
  const specifications = (detail?.specificationGroups || []).flatMap((group) => {
    if (isQuotePlaceholderValue(group.title)) return [];
    const items = group.items.flatMap((item) => {
      if (isQuotePlaceholderValue(item.label) || isQuotePlaceholderValue(item.value)) return [];
      return [compactSpecificationLine(item.label.trim(), item.value.trim())];
    });
    return items.length ? [group.title.toLocaleUpperCase("vi"), ...items] : [];
  });
  if (specifications.length) {
    sections.push("", "THÔNG SỐ KỸ THUẬT");
    sections.push(...specifications);
  }
  return sanitizeQuotePlainText(cleanQuoteText(sections.join("\n")));
}

export const resolveQuoteItems = async (input: SalesQuotePdfInput): Promise<ResolvedQuoteItem[] | null> => {
  const products = await Promise.all(input.items.map((item) => productService.getAdminProduct(item.productId)));
  if (products.some((product, index) => !product && !input.items[index]?.productSnapshot)) return null;

  return input.items.map((item, index) => {
    const product = products[index];
    const snapshot = item.productSnapshot;
    const mediaImages = (product?.detail?.gallery || [])
      .filter((media) => media.type === "image" && media.quoteEnabled && media.src)
      .map((media) => ({ url: media.src, caption: media.quoteCaption || media.alt || "Ảnh minh họa", afterText: media.quoteAfterText || "" }));
    const configurationImages = (product?.detail?.configurations || []).flatMap((group) => group.items
      .filter((configuration) => configuration.imageUrl)
      .map((configuration) => ({
        url: configuration.imageUrl!,
        caption: configuration.name,
        afterText: `- ${configuration.name}${configuration.detail ? `: ${configuration.detail}` : ""}`,
      })));
    const configuredImages = [...new Map([...mediaImages, ...configurationImages]
      .map((image) => [`${image.url}\u0000${image.afterText}`, image])).values()];
    const configuredByUrl = new Map(configuredImages.map((image) => [image.url, image]));
    const requestedImages = item.images || (item.imageUrls || [])
      .map((url) => configuredByUrl.get(url))
      .filter((image): image is NonNullable<typeof image> => Boolean(image));
    const seenImages = new Set<string>();
    const selectedImages = requestedImages.flatMap((requested) => {
      const configured = configuredByUrl.get(requested.url);
      const safeQuoteAsset = /^\/(?:uploads|images)\/[a-zA-Z0-9][a-zA-Z0-9._/-]*\.(?:png|jpe?g|webp)$/i.test(requested.url) && !requested.url.includes("..");
      if (!configured && !safeQuoteAsset) return [];
      const key = `${requested.url}\u0000${requested.afterText || configured?.afterText || ""}`;
      if (seenImages.has(key)) return [];
      seenImages.add(key);
      return [{
        url: requested.url,
        caption: requested.caption || configured?.caption || "Ảnh minh họa",
        afterText: requested.afterText || configured?.afterText || "",
      }];
    });
    const defaultDescription = item.description || (product ? buildProductQuoteDescription(product) : "");
    const descriptionRich = sanitizeQuoteRichText(item.descriptionRich);
    const description = sanitizeQuotePlainText(descriptionRich?.paragraphs.length
      ? quoteRichTextToPlainText(descriptionRich)
      : defaultDescription);
    return {
      ...item,
      description,
      descriptionRich,
      name: snapshot ? snapshot.name : product!.name,
      sku: snapshot ? snapshot.sku : product!.sku,
      model: snapshot ? snapshot.model : product!.model,
      brand: snapshot ? snapshot.brand : product!.brand,
      origin: snapshot ? snapshot.origin : product!.origin,
      manufacturingYear: snapshot ? snapshot.manufacturingYear : product!.manufacturingYear,
      warranty: snapshot ? snapshot.warranty : product!.warranty,
      images: selectedImages,
    };
  });
};
