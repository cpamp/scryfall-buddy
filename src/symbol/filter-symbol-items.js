import { SYMBOL_ITEMS } from "./items.js";
import {
  compactSearchText,
  getAliasMatchScore,
  normalizeSearchQuery,
} from "../shared/search/text-match.js";

const MAX_MATCHES = 50;

function compareMatches(left, right) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  if (left.item.categoryIndex !== right.item.categoryIndex) {
    return left.item.categoryIndex - right.item.categoryIndex;
  }

  return left.item.index - right.item.index;
}

export function filterSymbolItems(query, items = SYMBOL_ITEMS) {
  const normalizedNeedle = normalizeSearchQuery(query);
  if (!normalizedNeedle) {
    return items.slice(0, MAX_MATCHES);
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
          exact: 4,
          prefix: 3,
        },
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort(compareMatches)
    .slice(0, MAX_MATCHES)
    .map(({ item }) => item);
}
