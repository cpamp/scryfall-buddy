import {
  canonicalizeColorCode,
  COLOR_ITEMS,
  DEFAULT_COLOR_ITEMS,
} from "./items.js";
import {
  compactSearchText,
  getAliasMatchScore,
  normalizeSearchQuery,
} from "../shared/search/text-match.js";

const MAX_MATCHES = 50;

function isColorCodeQuery(text = "") {
  return /^[wubrgc]+$/.test(text);
}

function isSubsetCode(needle, haystack) {
  return needle.split("").every((symbol) => haystack.includes(symbol));
}

function getCodeScore(item, codeNeedle) {
  if (!codeNeedle) {
    return 0;
  }

  if (item.codeKey === codeNeedle) {
    return 5;
  }

  if (isSubsetCode(codeNeedle, item.codeKey)) {
    return 1;
  }

  return 0;
}

function compareMatches(left, right) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  if (left.item.colorCount !== right.item.colorCount) {
    return left.item.colorCount - right.item.colorCount;
  }

  if (left.item.index !== right.item.index) {
    return left.item.index - right.item.index;
  }

  return left.item.name.localeCompare(right.item.name);
}

export function filterColorItems(query, items = COLOR_ITEMS) {
  const normalizedNeedle = normalizeSearchQuery(query);
  if (!normalizedNeedle) {
    return DEFAULT_COLOR_ITEMS.slice();
  }

  const compactNeedle = compactSearchText(normalizedNeedle);
  const codeNeedle = isColorCodeQuery(compactNeedle)
    ? canonicalizeColorCode(compactNeedle)
    : "";

  return items
    .map((item) => ({
      item,
      score: Math.max(
        getAliasMatchScore(item.searchAliases, normalizedNeedle, compactNeedle),
        getCodeScore(item, codeNeedle),
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort(compareMatches)
    .slice(0, MAX_MATCHES)
    .map(({ item }) => item);
}
