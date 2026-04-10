import {
  getTokenRangeAtCursor,
  isCaretOutsideClosingQuote,
} from "../shared/text-input/token-range.js";

const OPERATOR_TOKEN_PATTERN = /^(-?)([^"':<>=\s]+)$/i;

export function getOperatorDropdownContext(input) {
  const tokenRange = getTokenRangeAtCursor(input);
  if (!tokenRange || isCaretOutsideClosingQuote(tokenRange)) {
    return null;
  }

  const match = tokenRange.token.match(OPERATOR_TOKEN_PATTERN);
  if (!match || !match[2]) {
    return null;
  }

  return {
    ...tokenRange,
    negation: match[1],
    rawQuery: match[2].toLowerCase(),
  };
}
