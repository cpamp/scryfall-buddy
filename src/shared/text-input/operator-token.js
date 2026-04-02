import { getTokenRangeAtCursor } from "./token-range.js";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getOperatorContext(input, operatorNames) {
  const tokenRange = getTokenRangeAtCursor(input);
  if (!tokenRange) {
    return null;
  }

  const names = Array.isArray(operatorNames) ? operatorNames : [operatorNames];
  const canonicalOperatorName = names[0];
  const pattern = new RegExp(
    `^(-?)(${names.map(escapeRegExp).join("|")}):(.*)$`,
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
    rawQuery: match[3] || "",
  };
}
