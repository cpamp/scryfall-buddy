import { DEFAULT_OPERATOR_ITEMS, OPERATOR_ITEMS } from "./items.js";
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

  return left.item.index - right.item.index;
}

export function filterOperatorItems(query, items = OPERATOR_ITEMS) {
  const normalizedNeedle = normalizeSearchQuery(query);
  if (!normalizedNeedle) {
    return DEFAULT_OPERATOR_ITEMS.slice();
  }

  const compactNeedle = compactSearchText(normalizedNeedle);

  return items
    .map((item) => ({
      item,
      score: getAliasMatchScore(
        item.searchAliases,
        normalizedNeedle,
        compactNeedle,
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort(compareMatches)
    .slice(0, MAX_MATCHES)
    .map(({ item }) => item);
}
