import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  type IParagraphOptions,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
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
const ink = "000000";
const line = "64748B";
const pageWidth = 11_906;
const pageHeight = 16_838;
const margin = 760;
const contentWidth = pageWidth - margin * 2;
const columnWidths = [600, contentWidth - 2_600, 2_000];
const bodyHalfPoints = 24;
const bodyHeadingHalfPoints = 26;
const secondaryHalfPoints = 20;
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

const cleanInline = (value: string) => value
  .replace(/[\u2010-\u2015\u2212]/g, "-")
  .replace(/[•●▪✓✔]/g, "-")
  .replace(/\u00a0/g, " ");

const thinBorders = (color = line) => ({
  top: { style: BorderStyle.SINGLE, size: 5, color },
  bottom: { style: BorderStyle.SINGLE, size: 5, color },
  left: { style: BorderStyle.SINGLE, size: 5, color },
  right: { style: BorderStyle.SINGLE, size: 5, color },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 5, color },
  insideVertical: { style: BorderStyle.SINGLE, size: 5, color },
});

const text = (copy: string, options: { bold?: boolean; italics?: boolean; underline?: boolean; size?: number } = {}) => new TextRun({
  text: clean(copy),
  font: "Times New Roman",
  size: options.size ?? bodyHalfPoints,
  bold: options.bold,
  italics: options.italics,
  underline: options.underline ? { type: UnderlineType.SINGLE } : undefined,
  color: ink,
});

const paragraph = (copy: string, options: { bold?: boolean; italics?: boolean; size?: number; alignment?: typeof AlignmentType[keyof typeof AlignmentType]; before?: number; after?: number; line?: number; border?: IParagraphOptions["border"]; indent?: IParagraphOptions["indent"] } = {}) => new Paragraph({
  alignment: options.alignment,
  border: options.border,
  indent: options.indent,
  spacing: { before: options.before ?? 0, after: options.after ?? 80, line: options.line ?? 300 },
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
    ...(image.caption ? [paragraph(image.caption, { italics: true, size: secondaryHalfPoints, after: 60, line: 260 })] : []),
  ];
};

const productContent = (item: PreparedQuoteItem) => {
  const rendered = new Set<string>();
  const children: Paragraph[] = [];
  const richText = item.descriptionRich;
  const paragraphs = richText?.paragraphs?.length
    ? richText.paragraphs.map((value) => ({
      copy: cleanInline(value.runs.map((run) => run.text).join("")).trim(),
      runs: value.runs.map((run) => ({ ...run, text: cleanInline(run.text) })),
    }))
    : clean(item.description).split("\n").map((copy, index) => {
      const value = copy.trim();
      const heading = value === value.toLocaleUpperCase("vi") && value.length < 90;
      return { copy: value, runs: value ? [{ text: value, bold: index === 0 || heading, underline: false, color: "default" as const }] : [] };
    });
  paragraphs.forEach((value, index) => {
    const copy = value.copy;
    if (!copy) {
      children.push(new Paragraph({ spacing: { after: 40 } }));
      return;
    }
    const heading = copy === copy.toLocaleUpperCase("vi") && copy.length < 90;
    children.push(new Paragraph({
      spacing: { after: index === 0 || heading ? 60 : 40, line: 300 },
      children: value.runs.map((run) => new TextRun({
        text: run.text,
        font: "Times New Roman",
        size: index === 0 ? 27 : bodyHalfPoints,
        bold: run.bold,
        italics: !richText && index > 0 && heading,
        underline: run.underline ? { type: UnderlineType.SINGLE } : undefined,
        color: ink,
      })),
    }));
    item.images.filter((image) => !rendered.has(image.url) && clean(image.afterText) === copy).forEach((image) => {
      children.push(...imageParagraphs(image));
      rendered.add(image.url);
    });
  });
  item.images.filter((image) => !rendered.has(image.url)).forEach((image) => children.push(...imageParagraphs(image)));
  return children;
};

const cell = (children: Paragraph[], width: number, options: { fill?: string; align?: typeof VerticalAlignTable[keyof typeof VerticalAlignTable]; columnSpan?: number } = {}) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  columnSpan: options.columnSpan,
  verticalAlign: options.align ?? VerticalAlignTable.CENTER,
  shading: options.fill ? { type: ShadingType.CLEAR, fill: options.fill, color: "auto" } : undefined,
  margins: { top: 100, bottom: 100, left: 120, right: 120 },
  children,
});

const headerParagraph = (copy: string) => paragraph(copy, { bold: true, size: bodyHalfPoints, alignment: AlignmentType.CENTER, after: 0, line: 280 });

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
        ...(item.quantity > 1 ? [paragraph(`SL: ${item.quantity}`, { italics: true, size: secondaryHalfPoints, alignment: AlignmentType.CENTER, after: 0 })] : []),
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
          run: { font: "Times New Roman", size: bodyHalfPoints, color: ink },
          paragraph: { spacing: { after: 80, line: 300 } },
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
            children: [text(company.name, { italics: true, size: 15 }), text("  ·  Trang ", { size: 15 }), new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: 15, color: ink })],
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
              paragraph([company.hotline && `Hotline: ${company.hotline}`, company.email && `Email: ${company.email}`, input.website && `Website: ${input.website}`].filter(Boolean).join("  |  "), { bold: true, size: 16, alignment: AlignmentType.CENTER, after: 0 }),
            ], contentWidth - 2_500),
          ] })],
        }),
        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: primary, space: 4 } }, spacing: { after: 160 } }),
        paragraph("BẢNG BÁO GIÁ THIẾT BỊ Y TẾ", { bold: true, size: 34, alignment: AlignmentType.CENTER, after: 40, line: 300 }),
        paragraph(`Số: ${input.quoteNumber}`, { bold: true, size: bodyHalfPoints, alignment: AlignmentType.CENTER, after: 120 }),
        paragraph(dateCopy(input.quoteDate, input.city), { italics: true, size: bodyHalfPoints, alignment: AlignmentType.RIGHT, after: 120 }),
        paragraph(`Kính gửi: ${clean(input.customer.organization || input.customer.name).toLocaleUpperCase("vi")}`, { bold: true, size: bodyHeadingHalfPoints, after: 40 }),
        ...(input.customer.address ? [paragraph(`Địa chỉ: ${input.customer.address}`, { size: bodyHalfPoints, after: 20 })] : []),
        ...((input.customer.phone || input.customer.email) ? [paragraph([input.customer.phone && `Điện thoại: ${input.customer.phone}`, input.customer.email && `Email: ${input.customer.email}`].filter(Boolean).join("  |  "), { size: bodyHalfPoints, after: 60 })] : []),
        paragraph(input.introduction, { italics: true, size: bodyHalfPoints, after: 120, line: 300 }),
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
            new TableRow({ children: [
              cell([paragraph("TỔNG GIÁ TRỊ", { bold: true, size: bodyHeadingHalfPoints, after: 0 })], columnWidths[0] + columnWidths[1], { fill: pale, columnSpan: 2 }),
              cell([paragraph(`${money(total)} VNĐ`, { bold: true, size: 28, alignment: AlignmentType.RIGHT, after: 0 })], columnWidths[2], { fill: pale }),
            ] }),
          ],
        }),
        paragraph(`(Bằng chữ: ${numberToVietnameseMoney(total)}.)`, { italics: true, size: bodyHalfPoints, after: 180, before: 60 }),
        paragraph("ĐIỀU KHOẢN THƯƠNG MẠI", {
          bold: true,
          italics: true,
          size: bodyHeadingHalfPoints,
          after: 55,
          border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: ink, space: 1 } },
          indent: { right: contentWidth - 2_840 },
        }),
        ...terms.map((term) => paragraph(term, { italics: true, size: bodyHalfPoints, after: 55, line: 300 })),
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
            cell([paragraph("ĐẠI DIỆN KHÁCH HÀNG", { bold: true, alignment: AlignmentType.CENTER, after: 40 }), paragraph("(Ký và ghi rõ họ tên)", { italics: true, size: secondaryHalfPoints, alignment: AlignmentType.CENTER, after: 0 })], contentWidth / 2, { align: VerticalAlignTable.TOP }),
            cell([paragraph(company.name.toLocaleUpperCase("vi"), { bold: true, alignment: AlignmentType.CENTER, after: 40 }), paragraph("(Ký tên, đóng dấu)", { italics: true, size: secondaryHalfPoints, alignment: AlignmentType.CENTER, after: 0 })], contentWidth / 2, { align: VerticalAlignTable.TOP }),
          ] })],
        }),
      ],
    }],
  });

  return Packer.toBuffer(document);
};
