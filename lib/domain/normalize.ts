const KATAKANA_START = 0x30a1;
const KATAKANA_END = 0x30f6;
const HIRAGANA_OFFSET = 0x60;

export function normalizeRoomCode(input: string): string {
  return input.trim().normalize("NFKC").toUpperCase().replace(/\s+/g, "");
}

export function normalizeAnswer(input: string): string {
  const normalized = input
    .trim()
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "");

  return katakanaToHiragana(normalized);
}

function katakanaToHiragana(input: string): string {
  return Array.from(input)
    .map((char) => {
      const codePoint = char.codePointAt(0);
      if (
        codePoint !== undefined &&
        codePoint >= KATAKANA_START &&
        codePoint <= KATAKANA_END
      ) {
        return String.fromCodePoint(codePoint - HIRAGANA_OFFSET);
      }

      return char;
    })
    .join("");
}
