const COLOR_DEFINITIONS = [
  ["Colorless", "c"],
  ["White", "w"],
  ["Black", "b"],
  ["Blue", "u"],
  ["Red", "r"],
  ["Green", "g"],
  ["Azorius", "wu"],
  ["Dimir", "ub"],
  ["Rakdos", "br"],
  ["Gruul", "rg"],
  ["Selesnya", "gw"],
  ["Orzhov", "wb"],
  ["Izzet", "ur"],
  ["Golgari", "gb"],
  ["Boros", "rw"],
  ["Simic", "gu"],
  ["Esper", "wub"],
  ["Grixis", "ubr"],
  ["Jund", "brg"],
  ["Naya", "rgw"],
  ["Bant", "gwu"],
  ["Abzan", "wbg"],
  ["Jeskai", "urw"],
  ["Sultai", "bgu"],
  ["Mardu", "rwb"],
  ["Temur", "gur"],
  ["Yore-Tiller", "wubr"],
  ["Glint-Eye", "ubrg"],
  ["Dune-Brood", "brgw"],
  ["Ink-Treader", "rgwu"],
  ["Witch-Maw", "gwub"],
  ["5 Color", "wubrg"],
];

const COLOR_CODE_ORDER = ["w", "u", "b", "r", "g", "c"];
const COLOR_CODE_ORDER_MAP = new Map(
  COLOR_CODE_ORDER.map((symbol, index) => [symbol, index]),
);

function normalizeName(text = "") {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function compactName(text = "") {
  return normalizeName(text).replace(/\s+/g, "");
}

export function canonicalizeColorCode(text = "") {
  const symbols = new Set();

  for (const character of text.toLowerCase()) {
    if (COLOR_CODE_ORDER_MAP.has(character)) {
      symbols.add(character);
    }
  }

  return Array.from(symbols).sort(
    (left, right) =>
      COLOR_CODE_ORDER_MAP.get(left) - COLOR_CODE_ORDER_MAP.get(right),
  ).join("");
}

function createAliases(name, code) {
  const aliases = [name];

  if (name === "5 Color") {
    aliases.push("5-color", "5color", "five color", "five-color", "fivecolor");
  }

  return aliases.map((alias) => ({
    compact: compactName(alias),
    normalized: normalizeName(alias),
  }));
}

export const COLOR_ITEMS = COLOR_DEFINITIONS.map(([name, code], index) => ({
  code,
  codeKey: canonicalizeColorCode(code),
  colorCount: code.length,
  index,
  name,
  searchAliases: createAliases(name, code),
}));

export const DEFAULT_COLOR_ITEMS = COLOR_ITEMS.slice();
