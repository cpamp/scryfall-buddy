const DEFAULT_ALIAS_MATCH_SCORES = {
  contains: 2,
  exact: 4,
  prefix: 3,
};

export function stripSurroundingQuotes(text = "") {
  return text.replace(/^"+|"+$/g, "");
}

export function normalizeSearchText(text = "") {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function compactSearchText(text = "") {
  return normalizeSearchText(text).replace(/\s+/g, "");
}

export function normalizeSearchQuery(text = "") {
  return normalizeSearchText(stripSurroundingQuotes(text.trim()));
}

export function createSearchAliases(values) {
  return values.map((value) => ({
    compact: compactSearchText(value),
    normalized: normalizeSearchText(value),
  }));
}

export function getAliasMatchScore(
  aliases,
  normalizedNeedle,
  compactNeedle,
  scores = DEFAULT_ALIAS_MATCH_SCORES,
) {
  let score = 0;
  const hasNormalizedNeedle = normalizedNeedle.length > 0;
  const hasCompactNeedle = compactNeedle.length > 0;

  for (const alias of aliases) {
    if (
      (hasNormalizedNeedle && alias.normalized === normalizedNeedle) ||
      (hasCompactNeedle && alias.compact === compactNeedle)
    ) {
      score = Math.max(score, scores.exact);
      continue;
    }

    if (
      (hasNormalizedNeedle && alias.normalized.startsWith(normalizedNeedle)) ||
      (hasCompactNeedle && alias.compact.startsWith(compactNeedle))
    ) {
      score = Math.max(score, scores.prefix);
      continue;
    }

    if (
      (hasNormalizedNeedle && alias.normalized.includes(normalizedNeedle)) ||
      (hasCompactNeedle && alias.compact.includes(compactNeedle))
    ) {
      score = Math.max(score, scores.contains);
    }
  }

  return score;
}
