import {
  canonicalizeColorCode,
  COLOR_ITEMS,
  DEFAULT_COLOR_ITEMS,
} from "./items.js";

const MAX_MATCHES = 50;

function normalizeQuery(text = "") {
  return text.trim().toLowerCase().replace(/^"+|"+$/g, "");
}

function compactQuery(text = "") {
  return text.replace(/[^a-z0-9]+/g, "");
}

function isColorCodeQuery(text = "") {
  return /^[wubrgc]+$/.test(text);
}

function isSubsetCode(needle, haystack) {
  return needle.split("").every((symbol) => haystack.includes(symbol));
}

function getNameScore(item, normalizedNeedle, compactNeedle) {
  let score = 0;
  const hasNormalizedNeedle = normalizedNeedle.length > 0;
  const hasCompactNeedle = compactNeedle.length > 0;

  for (const alias of item.searchAliases) {
    if (
      (hasNormalizedNeedle && alias.normalized === normalizedNeedle) ||
      (hasCompactNeedle && alias.compact === compactNeedle)
    ) {
      score = Math.max(score, 4);
      continue;
    }

    if (
      (hasNormalizedNeedle && alias.normalized.startsWith(normalizedNeedle)) ||
      (hasCompactNeedle && alias.compact.startsWith(compactNeedle))
    ) {
      score = Math.max(score, 3);
      continue;
    }

    if (
      (hasNormalizedNeedle && alias.normalized.includes(normalizedNeedle)) ||
      (hasCompactNeedle && alias.compact.includes(compactNeedle))
    ) {
      score = Math.max(score, 2);
    }
  }

  return score;
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
  const normalizedNeedle = normalizeQuery(query);
  if (!normalizedNeedle) {
    return DEFAULT_COLOR_ITEMS.slice();
  }

  const compactNeedle = compactQuery(normalizedNeedle);
  const codeNeedle = isColorCodeQuery(compactNeedle)
    ? canonicalizeColorCode(compactNeedle)
    : "";

  return items
    .map((item) => ({
      item,
      score: Math.max(
        getNameScore(item, normalizedNeedle, compactNeedle),
        getCodeScore(item, codeNeedle),
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort(compareMatches)
    .slice(0, MAX_MATCHES)
    .map(({ item }) => item);
}
