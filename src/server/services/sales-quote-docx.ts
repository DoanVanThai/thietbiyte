import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlignTable,
  WidthType,
} from "docx";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import type { SalesQuotePdfInput } from "@/server/validation/sales-quote";
import type { QuoteCompanyDetails, ResolvedQuoteImage, ResolvedQuoteItem } from "@/server/services/sales-quote-document";
import { numberToVietnameseMoney } from "@/server/services/vietnamese-money";
import { findPublicUploadPath } from "@/server/uploads/public-upload-storage";

const primary = "075AA8";
const pale = "EAF3FA";
const ink = "111827";
const muted = "4B5563";
const line = "64748B";
const pageWidth = 11_906;
const pageHeight = 16_838;
const margin = 760;
const contentWidth = pageWidth - margin * 2;
const columnWidths = [600, contentWidth - 2_600, 2_000];
const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value);
type PreparedQuoteImage = ResolvedQuoteImage & { data: Buffer; width: number; height: number };
type PreparedQuoteItem = Omit<ResolvedQuoteItem, "images"> & { images: PreparedQuoteImage[] };

const assetFile = (folder: "images", name: string) => {
  const candidates = [
    resolve(process.cwd(), "public", folder, name),
    resolve(process.cwd(), "dist/client", folder, name),
    resolve(process.cwd(), "client", folder, name),
  ];
  const match = candidates.find(existsSync);
  if (!match) throw new Error(`Missing quote asset: ${name}`);
  return match;
};

const clean = (value: string) => value
  .replace(/[\u2010-\u2015\u2212]/g, "-")
  .replace(/[•●▪✓✔]/g, "-")
  .replace(/\u00a0/g, " ")
  .replace(/[ \t]+\n/g, "\n")
  .trim();

const thinBorders = (color = line) => ({
  top: { style: BorderStyle.SINGLE, size: 5, color },
  bottom: { style: BorderStyle.SINGLE, size: 5, color },
  left: { style: BorderStyle.SINGLE, size: 5, color },
  right: { style: BorderStyle.SINGLE, size: 5, color },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 5, color },
  insideVertical: { style: BorderStyle.SINGLE, size: 5, color },
});

const text = (copy: string, options: { bold?: boolean; italics?: boolean; size?: number; color?: string } = {}) => new TextRun({
  text: clean(copy),
  font: "Times New Roman",
  size: options.size ?? 19,
  bold: options.bold,
  italics: options.italics,
  color: options.color ?? ink,
});

const paragraph = (copy: string, options: { bold?: boolean; italics?: boolean; size?: number; color?: string; alignment?: typeof AlignmentType[keyof typeof AlignmentType]; before?: number; after?: number; line?: number } = {}) => new Paragraph({
  alignment: options.alignment,
  spacing: { before: options.before ?? 0, after: options.after ?? 80, line: options.line ?? 260 },
  children: [text(copy, options)],
});

const dateCopy = (isoDate: string, city: string) => {
  const [year, month, day] = isoDate.split("-");
  return `${city}, ngày ${day} tháng ${month} năm ${year}`;
};

const prepareImage = async (image: ResolvedQuoteImage): Promise<PreparedQuoteImage | null> => {
  const pathname = decodeURIComponent(image.url.split(/[?#]/, 1)[0] || "");
  if (!/^\/(?:uploads|images)\/[a-zA-Z0-9._/-]+$/.test(pathname) || pathname.includes("..")) return null;
  const candidates = ["public", "dist/client", "client"].map((root) => resolve(process.cwd(), root, pathname.slice(1)));
  const path = pathname.startsWith("/uploads/") ? findPublicUploadPath(pathname) : candidates.find(existsSync);
  if (!path) return null;
  try {
    const { data, info } = await sharp(path).rotate().flatten({ background: "#FFFFFF" }).png({ compressionLevel: 8 }).toBuffer({ resolveWithObject: true });
    return { ...image, data, width: info.width, height: info.height };
  } catch {
    return null;
  }
};

const imageParagraphs = (image: PreparedQuoteImage) => {
  const scale = Math.min(220 / image.width, 140 / image.height, 1);
  return [
    new Paragraph({
      spacing: { before: 60, after: 30 },
      children: [new ImageRun({
        type: "png",
        data: image.data,
        transformation: { width: Math.max(1, Math.round(image.width * scale)), height: Math.max(1, Math.round(image.height * scale)) },
      })],
    }),
    ...(image.caption ? [paragraph(image.caption, { italics: true, size: 16, color: muted, after: 60, line: 220 })] : []),
  ];
};

const productContent = (item: PreparedQuoteItem) => {
  const rendered = new Set<string>();
  const children: Paragraph[] = [];
  clean(item.description).split("\n").forEach((raw, index) => {
    const copy = raw.trim();
    if (!copy) {
      children.push(new Paragraph({ spacing: { after: 40 } }));
      return;
    }
    const heading = copy === copy.toLocaleUpperCase("vi") && copy.length < 90;
    children.push(paragraph(copy, {
      bold: index === 0 || heading,
      italics: index > 0 && heading,
      size: index === 0 ? 20 : 18,
      after: index === 0 || heading ? 50 : 30,
      line: 250,
    }));
    item.images.filter((image) => !rendered.has(image.url) && clean(image.afterText) === copy).forEach((image) => {
      children.push(...imageParagraphs(image));
      rendered.add(image.url);
    });
  });
  item.images.filter((image) => !rendered.has(image.url)).forEach((image) => children.push(...imageParagraphs(image)));
  return children;
};

const cell = (children: Paragraph[], width: number, options: { fill?: string; align?: typeof VerticalAlignTable[keyof typeof VerticalAlignTable] } = {}) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  verticalAlign: options.align ?? VerticalAlignTable.CENTER,
  shading: options.fill ? { type: ShadingType.CLEAR, fill: options.fill, color: "auto" } : undefined,
  margins: { top: 100, bottom: 100, left: 120, right: 120 },
  children,
});

const headerParagraph = (copy: string) => paragraph(copy, { bold: true, size: 18, alignment: AlignmentType.CENTER, after: 0, line: 220 });

export const createSalesQuoteDocx = async (input: SalesQuotePdfInput, company: QuoteCompanyDetails, items: ResolvedQuoteItem[]) => {
  const preparedItems: PreparedQuoteItem[] = await Promise.all(items.map(async (item) => ({
    ...item,
    images: (await Promise.all((item.images || []).map(prepareImage)))
      .filter((image): image is NonNullable<typeof image> => Boolean(image)),
  })));
  const total = preparedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const logo = readFileSync(assetFile("images", "tl-group-logo.png"));

  const productRows = preparedItems.map((item, index) => new TableRow({
    children: [
      cell([paragraph(String(index + 1), { bold: true, alignment: AlignmentType.CENTER, after: 0 })], columnWidths[0], { align: VerticalAlignTable.TOP }),
      cell(productContent(item), columnWidths[1], { align: VerticalAlignTable.TOP }),
      cell([
        paragraph(money(item.unitPrice), { bold: true, alignment: AlignmentType.CENTER, after: item.quantity > 1 ? 30 : 0 }),
        ...(item.quantity > 1 ? [paragraph(`SL: ${item.quantity}`, { italics: true, size: 16, color: muted, alignment: AlignmentType.CENTER, after: 0 })] : []),
      ], columnWidths[2], { align: VerticalAlignTable.TOP }),
    ],
  }));

  const terms = [
    input.vatIncluded ? "- Giá trên đã bao gồm thuế GTGT." : "- Giá trên chưa bao gồm thuế GTGT.",
    input.delivery && `- Giao hàng: ${input.delivery}`,
    input.payment && `- Thanh toán: ${input.payment}`,
    input.validity && `- Hiệu lực báo giá: ${input.validity}`,
    ...input.additionalTerms.split("\n").filter(Boolean).map((item) => `- ${item.replace(/^[-*]\s*/, "")}`),
  ].filter(Boolean) as string[];

  const document = new Document({
    creator: company.name,
    title: `Báo giá ${input.quoteNumber}`,
    subject: "Báo giá thiết bị y tế",
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman", size: 19, color: ink },
          paragraph: { spacing: { after: 80, line: 260 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: pageWidth, height: pageHeight },
          margin: { top: 600, right: margin, bottom: 680, left: margin, header: 300, footer: 300 },
        },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: "AAB7C4", space: 4 } },
            alignment: AlignmentType.RIGHT,
            spacing: { before: 60 },
            children: [text(company.name, { italics: true, size: 15, color: muted }), text("  ·  Trang ", { size: 15, color: muted }), new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: 15, color: muted })],
          })],
        }),
      },
      children: [
        new Table({
          width: { size: contentWidth, type: WidthType.DXA },
          columnWidths: [2_500, contentWidth - 2_500],
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          },
          rows: [new TableRow({ children: [
            cell([new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new ImageRun({ type: "png", data: logo, transformation: { width: 126, height: 72 } })] })], 2_500),
            cell([
              paragraph(company.name.toLocaleUpperCase("vi"), { bold: true, size: 23, alignment: AlignmentType.CENTER, after: 30 }),
              paragraph(input.companyTagline, { italics: true, size: 18, alignment: AlignmentType.CENTER, after: 30 }),
              ...(input.companyAddress ? [paragraph(input.companyAddress, { size: 17, alignment: AlignmentType.CENTER, after: 25 })] : []),
              paragraph([company.hotline && `Hotline: ${company.hotline}`, company.email && `Email: ${company.email}`, input.website && `Website: ${input.website}`].filter(Boolean).join("  |  "), { bold: true, size: 16, color: primary, alignment: AlignmentType.CENTER, after: 0 }),
            ], contentWidth - 2_500),
          ] })],
        }),
        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: primary, space: 4 } }, spacing: { after: 160 } }),
        paragraph("BẢNG BÁO GIÁ THIẾT BỊ Y TẾ", { bold: true, size: 34, alignment: AlignmentType.CENTER, after: 40, line: 300 }),
        paragraph(`Số: ${input.quoteNumber}`, { bold: true, size: 21, alignment: AlignmentType.CENTER, after: 120 }),
        paragraph(dateCopy(input.quoteDate, input.city), { italics: true, size: 19, alignment: AlignmentType.RIGHT, after: 120 }),
        paragraph(`Kính gửi: ${clean(input.customer.organization || input.customer.name).toLocaleUpperCase("vi")}`, { bold: true, size: 20, after: 40 }),
        ...(input.customer.name && input.customer.organization ? [paragraph(`Người liên hệ: ${input.customer.name}`, { size: 18, after: 20 })] : []),
        ...(input.customer.address ? [paragraph(`Địa chỉ: ${input.customer.address}`, { size: 18, after: 20 })] : []),
        ...((input.customer.phone || input.customer.email) ? [paragraph([input.customer.phone && `Điện thoại: ${input.customer.phone}`, input.customer.email && `Email: ${input.customer.email}`].filter(Boolean).join("  |  "), { size: 18, after: 60 })] : []),
        paragraph(input.introduction, { italics: true, size: 18, after: 120, line: 260 }),
        new Table({
          width: { size: contentWidth, type: WidthType.DXA },
          columnWidths,
          borders: thinBorders(),
          rows: [
            new TableRow({ tableHeader: true, children: [
              cell([headerParagraph("STT")], columnWidths[0], { fill: pale }),
              cell([headerParagraph("TÊN SẢN PHẨM VÀ CẤU HÌNH")], columnWidths[1], { fill: pale }),
              cell([headerParagraph("ĐƠN GIÁ\n(VNĐ)")], columnWidths[2], { fill: pale }),
            ] }),
            ...productRows,
          ],
        }),
        new Paragraph({ spacing: { after: 100 } }),
        new Table({
          width: { size: contentWidth, type: WidthType.DXA },
          columnWidths: [contentWidth - 3_400, 3_400],
          borders: thinBorders(primary),
          rows: [new TableRow({ children: [
            cell([paragraph("TỔNG GIÁ TRỊ", { bold: true, size: 21, color: primary, after: 0 })], contentWidth - 3_400, { fill: pale }),
            cell([paragraph(`${money(total)} VNĐ`, { bold: true, size: 24, alignment: AlignmentType.RIGHT, after: 0 })], 3_400, { fill: pale }),
          ] })],
        }),
        paragraph(`(Bằng chữ: ${numberToVietnameseMoney(total)}.)`, { italics: true, size: 19, after: 180, before: 60 }),
        paragraph("ĐIỀU KHOẢN THƯƠNG MẠI", { bold: true, size: 21, color: primary, after: 80 }),
        ...terms.map((term) => paragraph(term, { size: 18, after: 45, line: 260 })),
        new Paragraph({ spacing: { after: 160 } }),
        new Table({
          width: { size: contentWidth, type: WidthType.DXA },
          columnWidths: [contentWidth / 2, contentWidth / 2],
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          },
          rows: [new TableRow({ children: [
            cell([paragraph("ĐẠI DIỆN KHÁCH HÀNG", { bold: true, alignment: AlignmentType.CENTER, after: 40 }), paragraph("(Ký và ghi rõ họ tên)", { italics: true, size: 16, color: muted, alignment: AlignmentType.CENTER, after: 0 })], contentWidth / 2, { align: VerticalAlignTable.TOP }),
            cell([paragraph(company.name.toLocaleUpperCase("vi"), { bold: true, alignment: AlignmentType.CENTER, after: 40 }), paragraph("(Ký tên, đóng dấu)", { italics: true, size: 16, color: muted, alignment: AlignmentType.CENTER, after: 0 })], contentWidth / 2, { align: VerticalAlignTable.TOP }),
          ] })],
        }),
      ],
    }],
  });

  return Packer.toBuffer(document);
};
