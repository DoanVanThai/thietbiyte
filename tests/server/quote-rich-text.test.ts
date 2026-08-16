import assert from "node:assert/strict";
import test from "node:test";
import { plainTextToQuoteRichText, quoteRichTextToPlainText } from "../../src/lib/quote-rich-text";
import { salesQuotePdfInput } from "../../src/server/validation/sales-quote";

test("quote rich text preserves content without storing HTML", () => {
  const rich = plainTextToQuoteRichText("MÁY SIÊU ÂM\nBẢO HÀNH 24 THÁNG\nNội dung thường", true);
  assert.equal(quoteRichTextToPlainText(rich), "MÁY SIÊU ÂM\nBẢO HÀNH 24 THÁNG\nNội dung thường");
  assert.equal(rich.paragraphs[0]?.runs[0]?.bold, true);
  assert.equal(JSON.stringify(rich).includes("<"), false);
});

test("sales quote validation accepts bold, underline and red runs", () => {
  const result = salesQuotePdfInput.safeParse({
    quoteNumber: "1608/BG/2026",
    quoteDate: "2026-08-16",
    city: "Hà Nội",
    customer: { name: "Khách hàng", organization: "", address: "", phone: "", email: "" },
    introduction: "Kính gửi Quý khách",
    items: [{
      productId: "product-1",
      quantity: 1,
      unitPrice: 1_000_000,
      description: "BẢO HÀNH 24 THÁNG",
      descriptionRich: { version: 1, paragraphs: [{ runs: [{ text: "BẢO HÀNH 24 THÁNG", bold: true, underline: true, color: "red" }] }] },
      images: [],
    }],
    vatIncluded: true,
    delivery: "Theo thỏa thuận",
    payment: "Theo thỏa thuận",
    validity: "30 ngày",
    additionalTerms: "",
  });
  assert.equal(result.success, true);
});
