function getPropertyItemToken(item) {
  return typeof item === "string" ? item : item.token;
}

export function formatPropertySelection(item, context) {
  return `${context.negation}${context.matchedOperatorName}${context.separator}${getPropertyItemToken(item)}`;
}
