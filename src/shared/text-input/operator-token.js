import { getTokenRangeAtCursor } from "./token-range.js";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeList(value) {
  return Array.isArray(value) ? value : [value];
}

function buildAlternationPattern(values) {
  return values
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");
}

export function getOperatorContext(input, operatorNames, separators = ":") {
  const tokenRange = getTokenRangeAtCursor(input);
  if (!tokenRange) {
    return null;
  }

  const names = normalizeList(operatorNames);
  const operatorSeparators = normalizeList(separators);
  const canonicalOperatorName = names[0];
  const pattern = new RegExp(
    `^(-?)(${buildAlternationPattern(names)})(${buildAlternationPattern(operatorSeparators)})(.*)$`,
    "i",
  );
  const match = tokenRange.token.match(pattern);
  if (!match) {
    return null;
  }

  return {
    ...tokenRange,
    matchedOperatorName: match[2].toLowerCase(),
    operatorName: canonicalOperatorName,
    negation: match[1],
    separator: match[3],
    rawQuery: match[4] || "",
  };
}
