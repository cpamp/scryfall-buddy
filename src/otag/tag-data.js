import rawOtagItems from "../../data/oracle-card-tags.json";

const DEFAULT_EMPTY_QUERY_LIMIT = 20;

function normalize(text = "") {
  return text.trim().toLowerCase();
}

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
  normalizedName: normalize(item.name),
  normalizedSlug: normalize(item.slug),
}));

export const DEFAULT_OTAG_ITEMS = OTAG_ITEMS.slice()
  .sort(compareByPopularityThenName)
  .slice(0, DEFAULT_EMPTY_QUERY_LIMIT);

