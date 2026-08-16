import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import JSZip from "jszip";
import { createSalesQuoteDocx } from "../../src/server/services/sales-quote-docx";
import { buildProductQuoteDescription, quoteContentDisposition, quoteFileName } from "../../src/server/services/sales-quote-document";
import { createSalesQuotePdf } from "../../src/server/services/sales-quote-pdf";
import { numberToVietnameseMoney } from "../../src/server/services/vietnamese-money";

test("Vietnamese money words cover zero, inner groups and quote-sized totals", () => {
  assert.equal(numberToVietnameseMoney(0), "Không đồng");
  assert.equal(numberToVietnameseMoney(15), "Mười lăm đồng chẵn");
  assert.equal(numberToVietnameseMoney(21_004), "Hai mươi mốt nghìn không trăm lẻ bốn đồng chẵn");
  assert.equal(numberToVietnameseMoney(430_000_000), "Bốn trăm ba mươi triệu đồng chẵn");
  assert.equal(numberToVietnameseMoney(1_000_000_005), "Một tỷ không trăm lẻ năm đồng chẵn");
});

test("sales quote downloads use the company name and preserve the quote number", () => {
  assert.equal(quoteFileName("5021/BG/2026"), "Thiên Lộc Group | 5021／BG／2026");
  assert.match(quoteContentDisposition("5021/BG/2026", "pdf"), /filename\*=UTF-8''Thi%C3%AAn%20L%E1%BB%99c%20Group%20%7C%205021%EF%BC%8FBG%EF%BC%8F2026\.pdf/);
});

test("technical specifications omit repetitive affirmative values in quote descriptions", () => {
  const description = buildProductQuoteDescription({
    id: "compact-specs", slug: "compact-specs", sku: "COMPACT-01", group: "medical", category: "", categorySlug: "", specialties: [], specialtySlugs: [],
    brand: "Thiên Lộc", brandSlug: "thien-loc", model: "C-01", origin: "Việt Nam", priceBand: "", warranty: "", applications: [], applicationSlugs: [],
    name: "Thiết bị kiểm thử", specs: [], image: "", imagePosition: "", availability: "contact", featured: 0, createdOrder: 0,
    description: "", priceMode: "CONTACT", publishStatus: "draft",
    detail: {
      gallery: [], features: [], configurations: [], documents: [],
      specificationGroups: [{ title: "Vận hành", items: [
        { label: "Bàn phím ảo", value: "Có" },
        { label: "Khả năng QC", value: "Có; Mean, SD và CV" },
        { label: "Cổng kết nối", value: "Có cổng USB" },
      ] }],
    },
  });
  assert.match(description, /- Bàn phím ảo\n/);
  assert.match(description, /- Khả năng QC: Mean, SD và CV/);
  assert.match(description, /- Cổng kết nối: cổng USB/);
  assert.doesNotMatch(description, /Bàn phím ảo: Có/);
});

test("quote exports use a 12 point base font for primary content", async () => {
  const [pdfSource, docxSource] = await Promise.all([
    readFile(new URL("../../src/server/services/sales-quote-pdf.ts", import.meta.url), "utf8"),
    readFile(new URL("../../src/server/services/sales-quote-docx.ts", import.meta.url), "utf8"),
  ]);
  assert.match(pdfSource, /const bodyFontSize = 12;/);
  assert.match(pdfSource, /size: bodyFontSize/);
  assert.match(docxSource, /const bodyHalfPoints = 24;/);
  assert.match(docxSource, /size: bodyHalfPoints/);
});

test("sales quote PDF supports Vietnamese and long product descriptions", async () => {
  const input = {
    quoteNumber: "1368/BG/2026",
    quoteDate: "2026-08-14",
    city: "Hà Nội",
    customer: { name: "Phòng khám Minh Tâm", organization: "", address: "Hà Nội", phone: "0902 137 158", email: "an@example.com" },
    companyTagline: "Chuyên kinh doanh trang thiết bị y tế, hóa chất và vật tư tiêu hao.",
    companyAddress: "Hà Nội và Thành phố Hồ Chí Minh",
    website: "thienlocgroup.com",
    introduction: "Công ty trân trọng gửi đến Quý khách bảng báo giá thiết bị với cấu hình chi tiết như sau:",
    items: [{ productId: "product-test", quantity: 1, unitPrice: 430_000_000, description: "MÁY SIÊU ÂM CAO CẤP\nModel: SonoPort 8\nBẢO HÀNH 24 THÁNG\n- Màn hình độ phân giải cao\n- Cấu hình đầu dò theo nhu cầu", descriptionRich: { version: 1 as const, paragraphs: [
      { runs: [{ text: "MÁY SIÊU ÂM CAO CẤP", bold: true }] },
      { runs: [{ text: "Model: SonoPort 8" }] },
      { runs: [{ text: "BẢO HÀNH 24 THÁNG", bold: true, color: "red" as const }] },
      { runs: [{ text: "- Màn hình độ phân giải cao", underline: true }] },
      { runs: [{ text: "- Cấu hình đầu dò theo nhu cầu" }] },
    ] }, images: [{ url: "/images/project-handover-placeholder.webp", caption: "Màn hình độ phân giải cao", afterText: "- Màn hình độ phân giải cao" }] }],
    vatIncluded: true,
    delivery: "Vận chuyển và lắp đặt tại nơi sử dụng.",
    payment: "Đặt cọc 50%, thanh toán phần còn lại sau bàn giao.",
    validity: "Có hiệu lực 30 ngày.",
    additionalTerms: "Hướng dẫn sử dụng tại cơ sở.",
  };
  const pdf = await createSalesQuotePdf(input, { name: "THIÊN LỘC GROUP", hotline: "0902 137 158", email: "tuvan@thienlocgroup.com" }, [{
    ...input.items[0], name: "Máy siêu âm cao cấp", sku: "US-001", model: "SonoPort 8", brand: "CHISON", origin: "Trung Quốc", manufacturingYear: "2026", warranty: "24 tháng",
    images: [{ url: "/images/project-handover-placeholder.webp", caption: "Màn hình độ phân giải cao", afterText: "- Màn hình độ phân giải cao" }],
  }]);
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  assert.ok(pdf.byteLength > 5_000);
});

test("sales quote Word export creates a valid OOXML document", async () => {
  const input = {
    quoteNumber: "1368/BG/2026",
    quoteDate: "2026-08-14",
    city: "Hà Nội",
    customer: { name: "Phòng khám Minh Tâm", organization: "", address: "Hà Nội", phone: "0902 137 158", email: "an@example.com" },
    companyTagline: "Chuyên kinh doanh trang thiết bị y tế, hóa chất và vật tư tiêu hao.",
    companyAddress: "Hà Nội và Thành phố Hồ Chí Minh",
    website: "thienlocgroup.com",
    introduction: "Công ty trân trọng gửi đến Quý khách bảng báo giá thiết bị với cấu hình chi tiết như sau:",
    items: [{ productId: "product-test", quantity: 2, unitPrice: 430_000_000, description: "MÁY SIÊU ÂM CAO CẤP\nModel: SonoPort 8\nBẢO HÀNH 24 THÁNG\n- Màn hình độ phân giải cao", descriptionRich: { version: 1 as const, paragraphs: [
      { runs: [{ text: "MÁY SIÊU ÂM CAO CẤP", bold: true }] },
      { runs: [{ text: "Model: SonoPort 8" }] },
      { runs: [{ text: "BẢO HÀNH 24 THÁNG", bold: true, color: "red" as const }] },
      { runs: [{ text: "- Màn hình độ phân giải cao", underline: true }] },
    ] }, images: [] }],
    vatIncluded: true,
    delivery: "Vận chuyển và lắp đặt tại nơi sử dụng.",
    payment: "Đặt cọc 50%, thanh toán phần còn lại sau bàn giao.",
    validity: "Có hiệu lực 30 ngày.",
    additionalTerms: "Hướng dẫn sử dụng tại cơ sở.",
  };
  const word = await createSalesQuoteDocx(input, { name: "THIÊN LỘC GROUP", hotline: "0902 137 158", email: "tuvan@thienlocgroup.com" }, [{
    ...input.items[0], name: "Máy siêu âm cao cấp", sku: "US-001", model: "SonoPort 8", brand: "CHISON", origin: "Trung Quốc", manufacturingYear: "2026", warranty: "24 tháng",
  }]);
  assert.equal(word.subarray(0, 2).toString(), "PK");
  assert.ok(word.byteLength > 5_000);

  const archive = await JSZip.loadAsync(word);
  const documentXml = await archive.file("word/document.xml")?.async("string");
  const footerXml = await archive.file("word/footer1.xml")?.async("string");
  assert.ok(documentXml);
  assert.ok(footerXml);

  const runColors = [...`${documentXml}${footerXml}`.matchAll(/<w:rPr>[\s\S]*?<w:color w:val="([^"]+)"\/>[\s\S]*?<\/w:rPr>/g)].map((match) => match[1]);
  assert.ok(runColors.length > 0);
  assert.deepEqual([...new Set(runColors)], ["000000"]);
  assert.equal(documentXml.match(/<w:tbl>/g)?.length, 3);
  assert.match(documentXml, /<w:gridSpan w:val="2"\/>[\s\S]*?<w:t[^>]*>TỔNG GIÁ TRỊ<\/w:t>/);
  assert.match(documentXml, /<w:keepNext\/>[\s\S]*?<w:t[^>]*>ĐIỀU KHOẢN THƯƠNG MẠI<\/w:t>[\s\S]*?<w:bottom w:val="single" w:color="000000" w:sz="10" w:space="1"\/>[\s\S]*?<w:ind w:right="6986"\/>/);
  assert.match(documentXml, /<w:b\/>[\s\S]*?<w:i\/>[\s\S]*?<w:t[^>]*>ĐIỀU KHOẢN THƯƠNG MẠI<\/w:t>/);
  assert.match(documentXml, /<w:keepNext\/>[\s\S]*?<w:keepLines\/>[\s\S]*?<w:i\/>[\s\S]*?<w:t[^>]*>- Giá trên đã bao gồm thuế GTGT\.<\/w:t>/);
  assert.match(documentXml, /<w:cantSplit\/>[\s\S]*?<w:t[^>]*>ĐẠI DIỆN KHÁCH HÀNG<\/w:t>/);
  assert.doesNotMatch(documentXml, /Người liên hệ:/);
});
