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
