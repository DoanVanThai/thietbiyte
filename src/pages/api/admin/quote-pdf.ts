import type { APIRoute } from "astro";
import { ZodError, flattenError } from "zod";
import { getSettings } from "@/lib/content-repository";
import { isResponse, requestIp, requirePermission } from "@/server/auth/http";
import { audit } from "@/server/auth/service";
import { buildProductQuoteDescription, createSalesQuotePdf, type ResolvedQuoteItem } from "@/server/services/sales-quote-pdf";
import { productService } from "@/server/services/product-service";
import { salesQuotePdfInput } from "@/server/validation/sales-quote";

const fileName = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/Đ/g, "D")
  .replace(/[^a-zA-Z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .toLocaleLowerCase("en-US") || "bao-gia";

export const POST: APIRoute = async (context) => {
  const actor = requirePermission(context, "quote.edit");
  if (isResponse(actor)) return actor;
  try {
    const input = salesQuotePdfInput.parse(await context.request.json());
    const products = await Promise.all(input.items.map((item) => productService.getAdminProduct(item.productId)));
    if (products.some((product) => !product)) return Response.json({ error: "Có sản phẩm không còn tồn tại." }, { status: 404 });
    const items: ResolvedQuoteItem[] = input.items.map((item, index) => {
      const product = products[index]!;
      const mediaImages = (product.detail?.gallery || []).filter((media) => media.type === "image" && media.quoteEnabled && media.src).map((media) => ({
        url: media.src,
        caption: media.quoteCaption || media.alt || "Ảnh minh họa",
        afterText: media.quoteAfterText || "",
      }));
      const configurationImages = (product.detail?.configurations || []).flatMap((group) => group.items
        .filter((configuration) => configuration.imageUrl)
        .map((configuration) => ({
          url: configuration.imageUrl!,
          caption: configuration.name,
          afterText: `- ${configuration.name}${configuration.detail ? `: ${configuration.detail}` : ""}`,
        })));
      const configuredImages = [...new Map([...mediaImages, ...configurationImages].map((image) => [`${image.url}\u0000${image.afterText}`, image])).values()];
      const configuredByUrl = new Map(configuredImages.map((image) => [image.url, image]));
      const requestedImages = item.images || (item.imageUrls || []).map((url) => configuredByUrl.get(url)).filter((image): image is NonNullable<typeof image> => Boolean(image));
      const seenImages = new Set<string>();
      const selectedImages = requestedImages.flatMap((requested) => {
        const configured = configuredByUrl.get(requested.url);
        const quoteUpload = /^\/uploads\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:png|jpe?g|webp)$/i.test(requested.url);
        if (!configured && !quoteUpload) return [];
        const key = `${requested.url}\u0000${requested.afterText || configured?.afterText || ""}`;
        if (seenImages.has(key)) return [];
        seenImages.add(key);
        return [{
          url: requested.url,
          caption: requested.caption || configured?.caption || "Ảnh minh họa",
          afterText: requested.afterText || configured?.afterText || "",
        }];
      });
      return {
        ...item,
        description: item.description || buildProductQuoteDescription(product),
        name: product.name,
        sku: product.sku,
        model: product.model,
        brand: product.brand,
        origin: product.origin,
        manufacturingYear: product.manufacturingYear,
        warranty: product.warranty,
        images: selectedImages,
      };
    });
    const settings = getSettings();
    const pdf = await createSalesQuotePdf(input, { name: settings.company, hotline: settings.hotline, email: settings.email }, items);
    await audit("quote.pdf_generated", actor.id, null, "sales-quote", "success", {
      quoteNumber: input.quoteNumber,
      productIds: items.map((item) => item.productId),
      customer: input.customer.organization || input.customer.name,
      total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    }, { ip: requestIp(context.request), userAgent: context.request.headers.get("user-agent") }).catch((error) => console.error("Could not write quote PDF audit event.", error));
    const body = new Uint8Array(pdf.byteLength);
    body.set(pdf);
    return new Response(body.buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName(input.quoteNumber)}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) return Response.json({ error: "Dữ liệu báo giá chưa hợp lệ.", fields: flattenError(error).fieldErrors }, { status: 422 });
    console.error("Quote PDF generation failed.", error);
    return Response.json({ error: "Không thể tạo PDF báo giá." }, { status: 500 });
  }
};
