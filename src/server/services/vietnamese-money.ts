const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
const groupUnits = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

const readThreeDigits = (value: number, readHundreds: boolean) => {
  const hundreds = Math.floor(value / 100);
  const tens = Math.floor((value % 100) / 10);
  const units = value % 10;
  const words: string[] = [];

  if (hundreds > 0 || readHundreds) {
    words.push(digits[hundreds], "trăm");
  }

  if (tens > 1) {
    words.push(digits[tens], "mươi");
  } else if (tens === 1) {
    words.push("mười");
  } else if (units > 0 && (hundreds > 0 || readHundreds)) {
    words.push("lẻ");
  }

  if (units > 0) {
    if (units === 1 && tens > 1) words.push("mốt");
    else if (units === 4 && tens > 1) words.push("tư");
    else if (units === 5 && tens > 0) words.push("lăm");
    else words.push(digits[units]);
  }

  return words.join(" ");
};

export const numberToVietnameseMoney = (rawValue: number) => {
  if (!Number.isFinite(rawValue)) throw new Error("Số tiền không hợp lệ.");
  const value = Math.round(Math.abs(rawValue));
  if (value === 0) return "Không đồng";

  const groups: number[] = [];
  let remaining = value;
  while (remaining > 0) {
    groups.push(remaining % 1_000);
    remaining = Math.floor(remaining / 1_000);
  }
  if (groups.length > groupUnits.length) throw new Error("Số tiền vượt quá giới hạn hỗ trợ.");

  const words: string[] = [];
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const group = groups[index];
    if (group === 0) continue;
    const readHundreds = index < groups.length - 1 && group < 100;
    words.push(readThreeDigits(group, readHundreds));
    if (groupUnits[index]) words.push(groupUnits[index]);
  }

  const result = words.join(" ").replace(/\s+/g, " ").trim();
  return `${result.charAt(0).toLocaleUpperCase("vi")}${result.slice(1)} đồng chẵn`;
};
