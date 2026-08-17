export type QuoteRichTextColor = "default" | "red";

export type QuoteRichTextRun = {
  text: string;
  bold?: boolean;
  underline?: boolean;
  color?: QuoteRichTextColor;
};

export type QuoteRichTextParagraph = {
  runs: QuoteRichTextRun[];
};

export type QuoteRichText = {
  version: 1;
  paragraphs: QuoteRichTextParagraph[];
};

const normalizeQuotePlaceholder = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/Đ/g, "D")
  .replace(/^[\s\-*•]+|[\s.!…]+$/gu, "")
  .replace(/\s+/g, " ")
  .toLocaleLowerCase("vi");

export const isQuotePlaceholderValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return true;
  const normalized = normalizeQuotePlaceholder(String(value));
  if (!normalized) return true;
  return /^(?:chua cap nhat(?:\s+.*)?|dang cap nhat|chua co thong tin|khong co thong tin|chua xac dinh|chua phan loai|chua nhap|chua chon|n\/?a|none|null|undefined|-+|\.{2,})$/u.test(normalized);
};

export const isQuotePlaceholderLine = (value: string) => {
  const copy = value.trim().replace(/^[\-*•]+\s*/u, "");
  if (isQuotePlaceholderValue(copy)) return true;
  const labelledValue = copy.match(/^[^:\n]{1,100}:\s*(.+)$/u)?.[1];
  return labelledValue ? isQuotePlaceholderValue(labelledValue) : false;
};

export const sanitizeQuotePlainText = (value: string) => {
  const lines = value.replace(/\r\n?/g, "\n").split("\n")
    .filter((line) => !isQuotePlaceholderLine(line));
  while (lines[0]?.trim() === "") lines.shift();
  while (lines.at(-1)?.trim() === "") lines.pop();
  return lines.filter((line, index) => line.trim() || lines[index - 1]?.trim()).join("\n");
};

export const sanitizeQuoteRichText = (value: QuoteRichText | undefined): QuoteRichText | undefined => {
  if (!value) return undefined;
  const paragraphs = value.paragraphs.filter((paragraph) => {
    const copy = paragraph.runs.map((run) => run.text).join("");
    return !isQuotePlaceholderLine(copy);
  });
  while (paragraphs[0] && !paragraphs[0].runs.some((run) => run.text.trim())) paragraphs.shift();
  while (paragraphs.at(-1) && !paragraphs.at(-1)!.runs.some((run) => run.text.trim())) paragraphs.pop();
  return {
    version: 1,
    paragraphs: paragraphs.filter((paragraph, index) => paragraph.runs.some((run) => run.text.trim())
      || paragraphs[index - 1]?.runs.some((run) => run.text.trim())),
  };
};

export const quoteRichTextToPlainText = (value: QuoteRichText | undefined, fallback = "") => {
  if (!value?.paragraphs?.length) return fallback;
  return value.paragraphs.map((paragraph) => paragraph.runs.map((run) => run.text).join("")).join("\n");
};

export const plainTextToQuoteRichText = (value: string, smartDefaults = false): QuoteRichText => ({
  version: 1,
  paragraphs: value.replace(/\r\n?/g, "\n").split("\n").map((line, index) => {
    const heading = line.length > 0 && line === line.toLocaleUpperCase("vi") && line.length < 90;
    return { runs: line ? [{ text: line, bold: smartDefaults && (index === 0 || heading) }] : [] };
  }),
});
