import { getTokenRangeAtCursor } from "./token-range.js";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getOperatorContext(input, operatorName) {
  const tokenRange = getTokenRangeAtCursor(input);
  if (!tokenRange) {
    return null;
  }

  const pattern = new RegExp(`^(-?)${escapeRegExp(operatorName)}:(.*)$`, "i");
  const match = tokenRange.token.match(pattern);
  if (!match) {
    return null;
  }

  return {
    ...tokenRange,
    operatorName,
    negation: match[1],
    rawQuery: match[2] || "",
  };
}
