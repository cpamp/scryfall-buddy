import {
  SYMBOL_CATEGORY_DEFINITIONS,
} from "./constants.js";
import { createSearchAliases } from "../shared/search/text-match.js";

const SYMBOL_DEFINITIONS = [
  ["basic", "{T}", "tap this permanent"],
  ["basic", "{W}", "one white mana"],
  ["basic", "{U}", "one blue mana"],
  ["basic", "{B}", "one black mana"],
  ["basic", "{R}", "one red mana"],
  ["basic", "{G}", "one green mana"],
  ["basic", "{C}", "one colorless mana"],
  ["basic", "{Q}", "untap this permanent"],
  ["basic", "{S}", "one snow mana"],
  ["basic", "{X}", "X generic mana"],
  ["generic", "{0}", "zero mana"],
  ["generic", "{1}", "one generic mana"],
  ["generic", "{2}", "two generic mana"],
  ["generic", "{3}", "three generic mana"],
  ["generic", "{4}", "four generic mana"],
  ["generic", "{5}", "five generic mana"],
  ["generic", "{6}", "six generic mana"],
  ["generic", "{7}", "seven generic mana"],
  ["generic", "{8}", "eight generic mana"],
  ["generic", "{9}", "nine generic mana"],
  ["generic", "{10}", "ten generic mana"],
  ["generic", "{11}", "eleven generic mana"],
  ["generic", "{12}", "twelve generic mana"],
  ["generic", "{13}", "thirteen generic mana"],
  ["generic", "{14}", "fourteen generic mana"],
  ["generic", "{15}", "fifteen generic mana"],
  ["generic", "{16}", "sixteen generic mana"],
  ["generic", "{17}", "seventeen generic mana"],
  ["generic", "{18}", "eighteen generic mana"],
  ["generic", "{19}", "nineteen generic mana"],
  ["generic", "{20}", "twenty generic mana"],
  ["hybrid", "{W/U}", "one white or blue mana"],
  ["hybrid", "{W/B}", "one white or black mana"],
  ["hybrid", "{B/R}", "one black or red mana"],
  ["hybrid", "{B/G}", "one black or green mana"],
  ["hybrid", "{U/B}", "one blue or black mana"],
  ["hybrid", "{U/R}", "one blue or red mana"],
  ["hybrid", "{R/G}", "one red or green mana"],
  ["hybrid", "{R/W}", "one red or white mana"],
  ["hybrid", "{G/W}", "one green or white mana"],
  ["hybrid", "{G/U}", "one green or blue mana"],
  ["phyrexian", "{B/G/P}", "one black mana, one green mana, or 2 life"],
  ["phyrexian", "{B/R/P}", "one black mana, one red mana, or 2 life"],
  ["phyrexian", "{G/U/P}", "one green mana, one blue mana, or 2 life"],
  ["phyrexian", "{G/W/P}", "one green mana, one white mana, or 2 life"],
  ["phyrexian", "{R/G/P}", "one red mana, one green mana, or 2 life"],
  ["phyrexian", "{R/W/P}", "one red mana, one white mana, or 2 life"],
  ["phyrexian", "{U/B/P}", "one blue mana, one black mana, or 2 life"],
  ["phyrexian", "{U/R/P}", "one blue mana, one red mana, or 2 life"],
  ["phyrexian", "{W/B/P}", "one white mana, one black mana, or 2 life"],
  ["phyrexian", "{W/U/P}", "one white mana, one blue mana, or 2 life"],
  ["phyrexian", "{W/P}", "one white mana or two life"],
  ["phyrexian", "{U/P}", "one blue mana or two life"],
  ["phyrexian", "{B/P}", "one black mana or two life"],
  ["phyrexian", "{R/P}", "one red mana or two life"],
  ["phyrexian", "{G/P}", "one green mana or two life"],
  ["alternate", "{C/W}", "one colorless mana or one white mana"],
  ["alternate", "{C/U}", "one colorless mana or one blue mana"],
  ["alternate", "{C/B}", "one colorless mana or one black mana"],
  ["alternate", "{C/R}", "one colorless mana or one red mana"],
  ["alternate", "{C/G}", "one colorless mana or one green mana"],
  ["alternate", "{2/W}", "two generic mana or one white mana"],
  ["alternate", "{2/U}", "two generic mana or one blue mana"],
  ["alternate", "{2/B}", "two generic mana or one black mana"],
  ["alternate", "{2/R}", "two generic mana or one red mana"],
  ["alternate", "{2/G}", "two generic mana or one green mana"],
  ["special", "{E}", "an energy counter"],
  ["special", "{P}", "modal budget pawprint"],
  ["special", "{PW}", "planeswalker"],
  ["special", "{CHAOS}", "chaos"],
  ["special", "{TK}", "a ticket counter"],
  ["special", "{H}", "one colored mana or two life"],
];

function compactToken(token) {
  return token.replace(/[{}]/g, "").replace(/[^A-Za-z0-9]/g, "");
}

function createAliases(token, description, categoryLabel) {
  return createSearchAliases([
    token,
    compactToken(token),
    `${token} ${description}`,
    `${description} ${token}`,
    categoryLabel,
    `${categoryLabel} ${description}`,
  ]);
}

export const SYMBOL_CATEGORY_ITEMS = SYMBOL_CATEGORY_DEFINITIONS.map(
  (category, index) => ({
    ...category,
    index,
    kind: "category",
  }),
);

const CATEGORY_INDEX_BY_KEY = new Map(
  SYMBOL_CATEGORY_ITEMS.map((item, index) => [item.key, index]),
);

export const SYMBOL_ITEMS = SYMBOL_DEFINITIONS.map(
  ([categoryKey, token, description], index) => ({
    categoryIndex: CATEGORY_INDEX_BY_KEY.get(categoryKey) ?? Number.MAX_SAFE_INTEGER,
    categoryKey,
    description,
    index,
    kind: "symbol",
    searchAliases: createAliases(
      token,
      description,
      SYMBOL_CATEGORY_ITEMS[CATEGORY_INDEX_BY_KEY.get(categoryKey)]?.label || "",
    ),
    token,
  }),
);

const SYMBOLS_BY_CATEGORY = new Map();
for (const item of SYMBOL_ITEMS) {
  const items = SYMBOLS_BY_CATEGORY.get(item.categoryKey) || [];
  items.push(item);
  SYMBOLS_BY_CATEGORY.set(item.categoryKey, items);
}

export function getCategoryItem(categoryKey) {
  return SYMBOL_CATEGORY_ITEMS.find((item) => item.key === categoryKey) || null;
}

export function getSymbolItemsForCategory(categoryKey) {
  return (SYMBOLS_BY_CATEGORY.get(categoryKey) || []).slice();
}
