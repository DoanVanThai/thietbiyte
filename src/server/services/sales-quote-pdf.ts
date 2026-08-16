import PDFDocument from "pdfkit";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import type { SalesQuotePdfInput } from "@/server/validation/sales-quote";
import { findPublicUploadPath } from "@/server/uploads/public-upload-storage";
import type { QuoteCompanyDetails, ResolvedQuoteItem } from "@/server/services/sales-quote-document";
import { numberToVietnameseMoney } from "@/server/services/vietnamese-money";

const assetFile = (folder: "fonts" | "images", name: string) => {
  const candidates = [
    resolve(process.cwd(), "public", folder, name),
    resolve(process.cwd(), "dist/client", folder, name),
    resolve(process.cwd(), "client", folder, name),
  ];
  const match = candidates.find(existsSync);
  if (!match) throw new Error(`Missing PDF asset: ${name}`);
  return match;
};

const regularFont = assetFile("fonts", "TimesNewRoman.ttf");
const boldFont = assetFile("fonts", "TimesNewRoman-Bold.ttf");
const italicFont = assetFile("fonts", "TimesNewRoman-Italic.ttf");
const boldItalicFont = assetFile("fonts", "TimesNewRoman-BoldItalic.ttf");
const companyLogo = assetFile("images", "tl-group-logo.png");
const preparedCompanyLogo = sharp(companyLogo)
  .trim({ background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png({ compressionLevel: 8 })
  .toBuffer();

const prepareQuoteImage = async (image: NonNullable<ResolvedQuoteItem["images"]>[number]) => {
  const pathname = decodeURIComponent(image.url.split(/[?#]/, 1)[0] || "");
  if (!/^\/(?:uploads|images)\/[a-zA-Z0-9._/-]+$/.test(pathname) || pathname.includes("..")) return null;
  const candidates = ["public", "dist/client", "client"].map((root) => resolve(process.cwd(), root, pathname.slice(1)));
  const path = pathname.startsWith("/uploads/") ? findPublicUploadPath(pathname) : candidates.find(existsSync);
  if (!path) return null;
  try {
    const { data, info } = await sharp(path).rotate().flatten({ background: "#FFFFFF" }).png({ compressionLevel: 8 }).toBuffer({ resolveWithObject: true });
    return { ...image, data, width: info.width, height: info.height };
  } catch { return null; }
};

const ink = "#111827";
const muted = "#4B5563";
const line = "#64748B";
const primary = "#075AA8";
const pale = "#EAF3FA";
const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 38;
const contentWidth = pageWidth - margin * 2;
const footerTop = pageHeight - 35;
const indexWidth = 38;
const priceWidth = 108;
const nameWidth = contentWidth - indexWidth - priceWidth;

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

const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

const dateCopy = (isoDate: string, city: string) => {
  const [year, month, day] = isoDate.split("-");
  return `${city}, ngày ${day} tháng ${month} năm ${year}`;
};

const drawFirstPageHeader = (doc: PDFKit.PDFDocument, input: SalesQuotePdfInput, company: QuoteCompanyDetails, logo: Buffer) => {
  const top = 30;
  const logoWidth = 126;
  const headerRowHeight = 66;
  const companyX = margin + logoWidth + 18;
  const companyWidth = contentWidth - logoWidth - 18;
  const contact = [company.hotline && `Hotline: ${company.hotline}`, company.email && `Email: ${company.email}`, input.website && `Website: ${input.website}`].filter(Boolean).join("  |  ");
  const companyLines = [
    { copy: clean(company.name).toLocaleUpperCase("vi"), font: "Bold", size: 11.5, color: ink, gap: 3, lineGap: 0 },
    { copy: clean(input.companyTagline), font: "Italic", size: 9, color: ink, gap: 3, lineGap: 0 },
    input.companyAddress ? { copy: clean(input.companyAddress), font: "Regular", size: 8.4, color: ink, gap: 3, lineGap: 1.5 } : null,
    contact ? { copy: clean(contact), font: "Bold", size: 8.3, color: primary, gap: 0, lineGap: 0 } : null,
  ].filter((line): line is NonNullable<typeof line> => Boolean(line?.copy));
  const measuredLines = companyLines.map((line) => {
    doc.font(line.font).fontSize(line.size);
    return { ...line, height: doc.heightOfString(line.copy, { width: companyWidth, align: "center", lineGap: line.lineGap }) };
  });
  const companyBlockHeight = measuredLines.reduce((height, line) => height + line.height + line.gap, 0);
  let companyY = top + Math.max(0, (headerRowHeight - companyBlockHeight) / 2);

  doc.image(logo, margin, top, { fit: [logoWidth, headerRowHeight], align: "center", valign: "center" });
  measuredLines.forEach((line) => {
    doc.fillColor(line.color).font(line.font).fontSize(line.size).text(line.copy, companyX, companyY, { width: companyWidth, align: "center", lineGap: line.lineGap });
    companyY += line.height + line.gap;
  });

  const dividerY = top + headerRowHeight + 12;
  doc.strokeColor(primary).lineWidth(1.4).moveTo(margin, dividerY).lineTo(pageWidth - margin, dividerY).stroke();
  doc.strokeColor("#7AB6DF").lineWidth(0.5).moveTo(margin, dividerY + 3).lineTo(pageWidth - margin, dividerY + 3).stroke();

  doc.fillColor(ink).font("Bold").fontSize(19).text("BẢNG BÁO GIÁ THIẾT BỊ Y TẾ", margin, dividerY + 18, { width: contentWidth, align: "center" });
  doc.fontSize(10.5).text(`Số: ${clean(input.quoteNumber)}`, { align: "center" });
  doc.fillColor(ink).font("Italic").fontSize(9.5).text(dateCopy(input.quoteDate, input.city), margin, doc.y + 14, { width: contentWidth, align: "right" });
  doc.fillColor(ink).font("Bold").fontSize(10).text(`Kính gửi: ${clean(input.customer.organization || input.customer.name).toLocaleUpperCase("vi")}`, margin, doc.y + 20, { width: contentWidth });
  doc.font("Regular").fontSize(9.2);
  if (input.customer.name && input.customer.organization) doc.text(`Người liên hệ: ${clean(input.customer.name)}`);
  if (input.customer.address) doc.text(`Địa chỉ: ${clean(input.customer.address)}`);
  const customerContact = [input.customer.phone && `Điện thoại: ${input.customer.phone}`, input.customer.email && `Email: ${input.customer.email}`].filter(Boolean).join("  |  ");
  if (customerContact) doc.text(clean(customerContact));
  doc.font("Italic").fontSize(9.2).text(clean(input.introduction), margin, doc.y + 8, { width: contentWidth, align: "justify", lineGap: 1.5 });
  doc.y += 12;
};

const drawTableHeader = (doc: PDFKit.PDFDocument) => {
  const y = doc.y;
  const height = 34;
  doc.rect(margin, y, contentWidth, height).fillAndStroke(pale, primary);
  doc.strokeColor(primary).lineWidth(0.75).moveTo(margin + indexWidth, y).lineTo(margin + indexWidth, y + height).stroke();
  doc.moveTo(margin + indexWidth + nameWidth, y).lineTo(margin + indexWidth + nameWidth, y + height).stroke();
  doc.fillColor(ink).font("Bold").fontSize(9.5);
  doc.text("STT", margin, y + 11, { width: indexWidth, align: "center" });
  doc.text("TÊN SẢN PHẨM VÀ CẤU HÌNH", margin + indexWidth, y + 11, { width: nameWidth, align: "center" });
  doc.text("ĐƠN GIÁ\n(VNĐ)", margin + indexWidth + nameWidth, y + 6, { width: priceWidth, align: "center", lineGap: 0 });
  doc.y = y + height;
};

const drawContinuationHeader = (doc: PDFKit.PDFDocument, input: SalesQuotePdfInput, item: ResolvedQuoteItem) => {
  doc.addPage();
  doc.fillColor(muted).font("Italic").fontSize(8).text(`Báo giá số ${clean(input.quoteNumber)} - ${clean(item.name)} (tiếp theo)`, margin, 27, { width: contentWidth });
  doc.strokeColor("#AAB7C4").lineWidth(0.5).moveTo(margin, 42).lineTo(pageWidth - margin, 42).stroke();
  doc.y = 53;
  drawTableHeader(doc);
};

const paragraphStyle = (copy: string, paragraphIndex: number) => {
  const heading = copy.length > 0 && copy === copy.toLocaleUpperCase("vi") && copy.length < 90;
  if (paragraphIndex === 0) return { font: "Bold", size: 10.2, lineGap: 1.5, indent: 0 };
  if (heading) return { font: "BoldItalic", size: 9.2, lineGap: 1.2, indent: 0 };
  if (copy.startsWith("- ")) return { font: "Regular", size: 9, lineGap: 1.25, indent: 10 };
  return { font: "Regular", size: 9, lineGap: 1.25, indent: 0 };
};

const descriptionParagraphs = (item: ResolvedQuoteItem) => {
  if (item.descriptionRich?.paragraphs?.length) {
    return item.descriptionRich.paragraphs.map((paragraph) => ({
      runs: paragraph.runs.map((run) => ({ ...run, text: cleanInline(run.text) })),
      copy: cleanInline(paragraph.runs.map((run) => run.text).join("")).trim(),
    }));
  }
  return clean(item.description).split("\n").map((copy, index) => {
    const value = copy.trim();
    const style = paragraphStyle(value, index);
    return { copy: value, runs: value ? [{ text: value, bold: style.font.includes("Bold"), underline: false, color: "default" as const }] : [] };
  });
};

const drawRowFrame = (doc: PDFKit.PDFDocument, top: number, bottom: number) => {
  const height = Math.max(28, bottom - top);
  doc.strokeColor(line).lineWidth(0.65).rect(margin, top, contentWidth, height).stroke();
  doc.moveTo(margin + indexWidth, top).lineTo(margin + indexWidth, top + height).stroke();
  doc.moveTo(margin + indexWidth + nameWidth, top).lineTo(margin + indexWidth + nameWidth, top + height).stroke();
};

const drawRowLabels = (doc: PDFKit.PDFDocument, item: ResolvedQuoteItem, index: number, top: number, bottom: number, continued: boolean) => {
  doc.fillColor(ink).font("Bold").fontSize(9.5).text(continued ? `${index + 1}\n(tiếp)` : String(index + 1), margin + 2, top + 9, { width: indexWidth - 4, align: "center", lineGap: 1 });
  const priceBlockHeight = !continued && item.quantity > 1 ? 26 : 12;
  const priceY = top + Math.max(8, (bottom - top - priceBlockHeight) / 2);
  doc.fillColor(ink).font("Bold").fontSize(9.2).text(money(item.unitPrice), margin + indexWidth + nameWidth + 5, priceY, { width: priceWidth - 10, align: "center" });
  if (!continued && item.quantity > 1) doc.fillColor(muted).font("Italic").fontSize(7.8).text(`SL: ${item.quantity}`, margin + indexWidth + nameWidth + 5, priceY + 14, { width: priceWidth - 10, align: "center" });
};

const drawProduct = (doc: PDFKit.PDFDocument, input: SalesQuotePdfInput, item: ResolvedQuoteItem, index: number) => {
  if (doc.y > footerTop - 105) {
    doc.addPage();
    doc.y = 42;
    drawTableHeader(doc);
  }

  const textX = margin + indexWidth + 8;
  const textWidth = nameWidth - 16;
  let segmentTop = doc.y;
  let continued = false;
  let contentY = segmentTop + 8;
  const renderedImages = new Set<string>();

  const continueOnNextPage = () => {
    const bottom = Math.max(contentY + 4, segmentTop + 42);
    drawRowFrame(doc, segmentTop, bottom);
    drawRowLabels(doc, item, index, segmentTop, bottom, continued);
    drawContinuationHeader(doc, input, item);
    segmentTop = doc.y;
    contentY = segmentTop + 8;
    continued = true;
  };

  const drawImage = (image: NonNullable<ResolvedQuoteItem["images"]>[number]) => {
    if (!image.data || !image.width || !image.height) return;
    const maxWidth = Math.min(165, textWidth - 28);
    const maxHeight = 112;
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const width = image.width * scale;
    const height = image.height * scale;
    const captionHeight = image.caption ? 13 : 0;
    if (contentY + height + captionHeight + 12 > footerTop) continueOnNextPage();
    const imageX = textX;
    doc.image(image.data, imageX, contentY + 4, { width, height });
    contentY += height + 7;
    if (image.caption) {
      doc.fillColor(muted).font("Italic").fontSize(7.6).text(clean(image.caption), imageX, contentY, { width, align: "left", lineGap: 1 });
      contentY = doc.y + 5;
    }
    renderedImages.add(image.url);
  };

  const paragraphs = descriptionParagraphs(item);
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const copy = paragraph.copy;
    if (!copy) {
      contentY += 5;
      return;
    }
    const style = item.descriptionRich?.paragraphs?.length
      ? { font: "Regular", size: paragraphIndex === 0 ? 10.2 : 9, lineGap: 1.25, indent: copy.startsWith("- ") ? 10 : 0 }
      : paragraphStyle(copy, paragraphIndex);
    doc.font(style.font).fontSize(style.size);
    const paragraphX = textX + style.indent;
    const paragraphWidth = textWidth - style.indent;
    const height = doc.heightOfString(copy, { width: paragraphWidth, lineGap: style.lineGap });
    if (contentY + height + 8 > footerTop) continueOnNextPage();
    paragraph.runs.forEach((run, runIndex) => {
      const font = run.bold ? (style.font.includes("Italic") ? "BoldItalic" : "Bold") : style.font.includes("Italic") ? "Italic" : "Regular";
      const options = { width: paragraphWidth, lineGap: style.lineGap, align: "left" as const, continued: runIndex < paragraph.runs.length - 1, underline: Boolean(run.underline) };
      doc.fillColor(run.color === "red" ? "#C62828" : ink).font(font).fontSize(style.size);
      if (runIndex === 0) doc.text(run.text, paragraphX, contentY, options);
      else doc.text(run.text, options);
    });
    contentY = doc.y + (style.font.includes("Bold") ? 3 : 2);
    item.images?.filter((image) => !renderedImages.has(image.url) && clean(image.afterText) === copy).forEach(drawImage);
  });

  item.images?.filter((image) => !renderedImages.has(image.url)).forEach(drawImage);

  const segmentBottom = Math.max(contentY + 5, segmentTop + (continued ? 42 : 50));
  drawRowFrame(doc, segmentTop, segmentBottom);
  drawRowLabels(doc, item, index, segmentTop, segmentBottom, continued);
  doc.y = segmentBottom + 9;

  if (item.quantity > 1) {
    const total = item.unitPrice * item.quantity;
    doc.fillColor(muted).font("Italic").fontSize(8.5).text(`Thành tiền: ${item.quantity} x ${money(item.unitPrice)} VNĐ`, margin, doc.y, { width: contentWidth - 145, align: "right", lineBreak: false });
    doc.fillColor(ink).font("Bold").text(`${money(total)} VNĐ`, margin + contentWidth - 138, doc.y, { width: 138, align: "right", lineBreak: false });
    doc.y += 22;
  }
};

const ensureSpace = (doc: PDFKit.PDFDocument, height: number) => {
  if (doc.y + height <= footerTop) return;
  doc.addPage();
  doc.y = 44;
};

const drawTerms = (doc: PDFKit.PDFDocument, input: SalesQuotePdfInput, grandTotal: number, company: QuoteCompanyDetails) => {
  const amountInWords = `(Bằng chữ: ${numberToVietnameseMoney(grandTotal)}.)`;
  doc.font("Italic").fontSize(9.2);
  const amountWordsHeight = doc.heightOfString(amountInWords, { width: contentWidth - 20, lineGap: 1.5 });
  ensureSpace(doc, 54 + amountWordsHeight);
  const grandTotalY = doc.y;
  doc.rect(margin, grandTotalY, contentWidth, 34).fillAndStroke(pale, primary);
  doc.fillColor(primary).font("Bold").fontSize(10.5).text("TỔNG GIÁ TRỊ", margin + 10, grandTotalY + 11, { width: contentWidth - 190, lineBreak: false });
  doc.fillColor(ink).fontSize(12).text(`${money(grandTotal)} VNĐ`, margin + contentWidth - 180, grandTotalY + 9, { width: 170, align: "right", lineBreak: false });
  doc.fillColor(ink).font("Italic").fontSize(9.2).text(amountInWords, margin + 10, grandTotalY + 42, { width: contentWidth - 20, lineGap: 1.5 });
  doc.y += 14;
  const terms = [
    input.vatIncluded ? "- Giá trên đã bao gồm thuế GTGT." : "- Giá trên chưa bao gồm thuế GTGT.",
    input.delivery && `- Giao hàng: ${input.delivery}`,
    input.payment && `- Thanh toán: ${input.payment}`,
    input.validity && `- Hiệu lực báo giá: ${input.validity}`,
    input.additionalTerms && clean(input.additionalTerms).split("\n").map((item) => item.trim() ? `- ${item.replace(/^[-*]\s*/, "")}` : "").join("\n"),
  ].filter(Boolean).join("\n");
  doc.font("Regular").fontSize(9.2);
  const termsHeight = doc.heightOfString(clean(terms), { width: contentWidth, lineGap: 2.2 });
  ensureSpace(doc, termsHeight + 135);
  const termsTitleY = doc.y;
  doc.fillColor(ink).font("BoldItalic").fontSize(10).text("ĐIỀU KHOẢN THƯƠNG MẠI", margin, termsTitleY, { width: contentWidth });
  doc.strokeColor("#000000").lineWidth(0.8).moveTo(margin, termsTitleY + 13).lineTo(margin + 142, termsTitleY + 13).stroke();
  doc.y = termsTitleY + 18;
  doc.font("Italic").fontSize(9.2);
  doc.text(clean(terms), margin, doc.y, { width: contentWidth, lineGap: 2.2 });
  doc.y += 24;
  const signatureY = doc.y;
  doc.font("Bold").fontSize(9.2).fillColor(ink).text("ĐẠI DIỆN KHÁCH HÀNG", margin, signatureY, { width: contentWidth / 2, align: "center" });
  doc.text(clean(company.name).toLocaleUpperCase("vi"), margin + contentWidth / 2, signatureY, { width: contentWidth / 2, align: "center" });
  doc.font("Italic").fontSize(8.2).fillColor(muted).text("(Ký và ghi rõ họ tên)", margin, signatureY + 18, { width: contentWidth / 2, align: "center" });
  doc.text("(Ký tên, đóng dấu)", margin + contentWidth / 2, signatureY + 18, { width: contentWidth / 2, align: "center" });
};

export async function createSalesQuotePdf(input: SalesQuotePdfInput, company: QuoteCompanyDetails, items: ResolvedQuoteItem[]) {
  const [logo, preparedItems] = await Promise.all([
    preparedCompanyLogo,
    Promise.all(items.map(async (item) => ({
      ...item,
      images: (await Promise.all((item.images || []).map(prepareQuoteImage))).filter((image): image is NonNullable<typeof image> => Boolean(image)),
    }))),
  ]);
  const doc = new PDFDocument({ size: "A4", margins: { top: margin, right: margin, bottom: 42, left: margin }, bufferPages: true, info: { Title: `Báo giá ${input.quoteNumber}`, Author: company.name, Subject: "Báo giá thiết bị y tế" } });
  doc.registerFont("Regular", regularFont);
  doc.registerFont("Bold", boldFont);
  doc.registerFont("Italic", italicFont);
  doc.registerFont("BoldItalic", boldItalicFont);
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  drawFirstPageHeader(doc, input, company, logo);
  drawTableHeader(doc);
  preparedItems.forEach((item, index) => drawProduct(doc, input, item, index));
  drawTerms(doc, input, preparedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), company);

  const range = doc.bufferedPageRange();
  for (let pageIndex = 0; pageIndex < range.count; pageIndex += 1) {
    doc.switchToPage(pageIndex);
    doc.page.margins.bottom = 0;
    doc.strokeColor("#AAB7C4").lineWidth(0.5).moveTo(margin, footerTop).lineTo(pageWidth - margin, footerTop).stroke();
    doc.fillColor(muted).font("Italic").fontSize(7.5).text(clean(company.name), margin, footerTop + 7, { width: contentWidth - 100 });
    doc.font("Regular").text(`Trang ${pageIndex + 1}/${range.count}`, pageWidth - margin - 90, footerTop + 7, { width: 90, align: "right" });
  }
  doc.end();
  return completed;
}

export type { ResolvedQuoteItem } from "@/server/services/sales-quote-document";
