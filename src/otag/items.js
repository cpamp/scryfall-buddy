import rawOtagItems from "../../data/oracle-card-tags.json";
import { createSearchAliases } from "../shared/search/text-match.js";

const DEFAULT_EMPTY_QUERY_LIMIT = 20;

function compareByPopularityThenName(a, b) {
  if (b.taggingCount !== a.taggingCount) {
    return b.taggingCount - a.taggingCount;
  }

  return a.name.localeCompare(b.name);
}

export const OTAG_ITEMS = rawOtagItems.map((item) => ({
  name: item.name,
  slug: item.slug,
  taggingCount: Number.isFinite(item.taggingCount) ? item.taggingCount : 0,
  searchAliases: createSearchAliases([item.name, item.slug]),
}));

export const DEFAULT_OTAG_ITEMS = OTAG_ITEMS.slice()
  .sort(compareByPopularityThenName)
  .slice(0, DEFAULT_EMPTY_QUERY_LIMIT);
