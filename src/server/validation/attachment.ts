export const hasExecutableMagic = (bytes: Uint8Array) => {
  if (bytes.length < 4) return false;
  const magic = [bytes[0], bytes[1], bytes[2], bytes[3]].map((value) => value.toString(16).padStart(2, "0")).join("");
  return bytes[0] === 0x4d && bytes[1] === 0x5a
    || magic === "7f454c46"
    || ["feedface", "feedfacf", "cefaedfe", "cffaedfe", "cafebabe", "bebafeca"].includes(magic)
    || bytes[0] === 0x23 && bytes[1] === 0x21;
};
