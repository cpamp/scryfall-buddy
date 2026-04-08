import { DEFAULT_OTAG_ITEMS, OTAG_ITEMS } from "./items.js";
import {
  compactSearchText,
  getAliasMatchScore,
  normalizeSearchQuery,
} from "../shared/search/text-match.js";

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

export function filterOtagItems(query, items = OTAG_ITEMS) {
  const normalizedNeedle = normalizeSearchQuery(query);
  if (!normalizedNeedle) {
    return DEFAULT_OTAG_ITEMS.slice();
  }

  const compactNeedle = compactSearchText(normalizedNeedle);

  return items
    .map((item) => ({
      item,
      score: getAliasMatchScore(
        item.searchAliases,
        normalizedNeedle,
        compactNeedle,
        {
          contains: 1,
          exact: 3,
          prefix: 2,
        },
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort(compareMatches)
    .slice(0, MAX_MATCHES)
    .map(({ item }) => item);
}
