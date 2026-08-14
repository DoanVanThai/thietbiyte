import assert from "node:assert/strict";
import test from "node:test";
import { createSalesQuoteDocx } from "../../src/server/services/sales-quote-docx";
import { createSalesQuotePdf } from "../../src/server/services/sales-quote-pdf";
import { numberToVietnameseMoney } from "../../src/server/services/vietnamese-money";

test("Vietnamese money words cover zero, inner groups and quote-sized totals", () => {
  assert.equal(numberToVietnameseMoney(0), "Không đồng");
  assert.equal(numberToVietnameseMoney(15), "Mười lăm đồng chẵn");
  assert.equal(numberToVietnameseMoney(21_004), "Hai mươi mốt nghìn không trăm lẻ bốn đồng chẵn");
  assert.equal(numberToVietnameseMoney(430_000_000), "Bốn trăm ba mươi triệu đồng chẵn");
  assert.equal(numberToVietnameseMoney(1_000_000_005), "Một tỷ không trăm lẻ năm đồng chẵn");
});

test("sales quote PDF supports Vietnamese and long product descriptions", async () => {
  const input = {
    quoteNumber: "1368/BG/2026",
    quoteDate: "2026-08-14",
    city: "Hà Nội",
    customer: { name: "Nguyễn Văn An", organization: "Phòng khám Minh Tâm", address: "Hà Nội", phone: "0902 137 158", email: "an@example.com" },
    companyTagline: "Chuyên kinh doanh trang thiết bị y tế, hóa chất và vật tư tiêu hao.",
    companyAddress: "Hà Nội và Thành phố Hồ Chí Minh",
    website: "thienlocgroup.com",
    introduction: "Công ty trân trọng gửi đến Quý khách bảng báo giá thiết bị với cấu hình chi tiết như sau:",
    items: [{ productId: "product-test", quantity: 1, unitPrice: 430_000_000, description: "MÁY SIÊU ÂM CAO CẤP\nModel: SonoPort 8\n- Màn hình độ phân giải cao\n- Cấu hình đầu dò theo nhu cầu", images: [{ url: "/images/project-handover-placeholder.webp", caption: "Màn hình độ phân giải cao", afterText: "- Màn hình độ phân giải cao" }] }],
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
    customer: { name: "Nguyễn Văn An", organization: "Phòng khám Minh Tâm", address: "Hà Nội", phone: "0902 137 158", email: "an@example.com" },
    companyTagline: "Chuyên kinh doanh trang thiết bị y tế, hóa chất và vật tư tiêu hao.",
    companyAddress: "Hà Nội và Thành phố Hồ Chí Minh",
    website: "thienlocgroup.com",
    introduction: "Công ty trân trọng gửi đến Quý khách bảng báo giá thiết bị với cấu hình chi tiết như sau:",
    items: [{ productId: "product-test", quantity: 2, unitPrice: 430_000_000, description: "MÁY SIÊU ÂM CAO CẤP\nModel: SonoPort 8\n- Màn hình độ phân giải cao", images: [] }],
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
});
