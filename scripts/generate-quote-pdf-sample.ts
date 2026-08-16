import { mkdir, writeFile } from "node:fs/promises";
import { createSalesQuoteDocx } from "../src/server/services/sales-quote-docx";
import { createSalesQuotePdf } from "../src/server/services/sales-quote-pdf";

const description = [
  "MÁY SIÊU ÂM CAO CẤP",
  "Model: SonoPort 8",
  "Hãng sản xuất: CHISON",
  "Xuất xứ: Trung Quốc - Công nghệ Đức",
  "Máy mới 100%, năm sản xuất 2026 trở về sau, đầy đủ hồ sơ nguồn gốc.",
  "BẢO HÀNH 24 THÁNG",
  "",
  "CẤU HÌNH MÁY CHÍNH",
  "- Máy chính SonoPort 8",
  "- Màn hình độ phân giải cao 23,8 inch",
  "- Màn hình cảm ứng 15,6 inch",
  "- Đầu dò Convex tổng quát",
  "- Đầu dò Linear",
  "- Đầu dò 4D",
  "",
  "TÍNH NĂNG NÂNG CAO",
  ...Array.from({ length: 45 }, (_, index) => `- Tính năng ${index + 1}: Nội dung mô tả kỹ thuật chi tiết phục vụ tư vấn cấu hình, vận hành và đánh giá thiết bị tại cơ sở y tế.`),
].join("\n");

const descriptionRich = {
  version: 1 as const,
  paragraphs: description.split("\n").map((line, index) => ({
    runs: line ? [{
      text: line,
      bold: index === 0 || line === line.toLocaleUpperCase("vi"),
      underline: line.startsWith("CẤU HÌNH") || line.startsWith("TÍNH NĂNG"),
      color: line.startsWith("BẢO HÀNH") ? "red" as const : "default" as const,
    }] : [],
  })),
};

const input = {
  quoteNumber: "1368/BG/2026",
  quoteDate: "2026-08-14",
  city: "Hà Nội",
  customer: { name: "PHÒNG KHÁM MINH TÂM", organization: "", address: "Hà Nội", phone: "0909 123 456", email: "an@example.com" },
  companyTagline: "Chuyên kinh doanh trang thiết bị y tế, hóa chất và vật tư tiêu hao.",
  companyAddress: "VPGD: Hà Nội | VPHCM: Quận 12, TP. Hồ Chí Minh",
  website: "thienlocgroup.com",
  introduction: "THIÊN LỘC GROUP xin hân hạnh gửi đến Quý khách bảng báo giá thiết bị với cấu hình chi tiết như sau:",
  items: [{ productId: "sample", quantity: 1, unitPrice: 430_000_000, description, descriptionRich, images: [{ url: "/images/project-handover-placeholder.webp", caption: "Màn hình độ phân giải cao 23,8 inch", afterText: "- Màn hình độ phân giải cao 23,8 inch" }] }],
  vatIncluded: true,
  delivery: "Vận chuyển, lắp đặt tại nơi sử dụng; thời gian giao hàng từ 1 đến 8 tuần kể từ khi ký hợp đồng và nhận đặt cọc.",
  payment: "Đặt cọc 50%; giá trị còn lại thanh toán sau khi hai bên ký biên bản bàn giao máy.",
  validity: "Có hiệu lực 30 ngày kể từ ngày phát hành.",
  additionalTerms: "Hướng dẫn vận hành tại cơ sở\nBảo hành theo chính sách của sản phẩm",
};

const company = {
  name: "THIÊN LỘC GROUP",
  hotline: "0902 137 158",
  email: "tuvan@thienlocgroup.com",
};
const items = [{ ...input.items[0], name: "Máy siêu âm cao cấp", sku: "US-001", model: "SonoPort 8", brand: "CHISON", origin: "Trung Quốc", manufacturingYear: "2026", warranty: "24 tháng", images: input.items[0].images }];
const [pdf, word] = await Promise.all([
  createSalesQuotePdf(input, company, items),
  createSalesQuoteDocx(input, company, items),
]);

await mkdir("output/pdf", { recursive: true });
await writeFile("output/pdf/bao-gia-san-pham-mau.pdf", pdf);
await writeFile("output/pdf/bao-gia-san-pham-mau.docx", word);
console.log("Created sample PDF and Word quote files in output/pdf");
