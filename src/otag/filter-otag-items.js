import { DEFAULT_OTAG_ITEMS, OTAG_ITEMS } from "./tag-data.js";

function normalize(text) {
  return text.trim().toLowerCase();
}

const MAX_MATCHES = 50;

function compareMatches(a, b) {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  if (b.item.taggingCount !== a.item.taggingCount) {
    return b.item.taggingCount - a.item.taggingCount;
  }

  return a.item.name.localeCompare(b.item.name);
}

function getMatchScore(item, needle) {
  if (item.normalizedName === needle || item.normalizedSlug === needle) {
    return 3;
  }

  if (
    item.normalizedName.startsWith(needle) ||
    item.normalizedSlug.startsWith(needle)
  ) {
    return 2;
  }

  if (
    item.normalizedName.includes(needle) ||
    item.normalizedSlug.includes(needle)
  ) {
    return 1;
  }

  return 0;
}

export function filterOtagItems(query, items = OTAG_ITEMS) {
  const needle = normalize(query).replace(/^"+|"+$/g, "");
  if (!needle) {
    return DEFAULT_OTAG_ITEMS.slice();
  }

  return items
    .map((item) => ({
      item,
      score: getMatchScore(item, needle),
    }))
    .filter(({ score }) => score > 0)
    .sort(compareMatches)
    .slice(0, MAX_MATCHES)
    .map(({ item }) => item);
}
