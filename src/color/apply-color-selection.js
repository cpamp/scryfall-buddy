function getColorItemCode(item) {
  return typeof item === "string" ? item : item.code;
}

function isColorCodeQuery(query = "") {
  return /^[wubrgc]+$/i.test(query.trim().replace(/^"+|"+$/g, ""));
}

function completeColorCodeQuery(query, item) {
  const normalizedQuery = query.trim().toLowerCase();
  const itemCode = getColorItemCode(item);
  const querySymbols = new Set(normalizedQuery.split(""));
  const missingSymbols = itemCode
    .split("")
    .filter((symbol) => !querySymbols.has(symbol))
    .join("");

  return `${normalizedQuery}${missingSymbols}`;
}

export function formatColorSelection(item, context) {
  return `${context.negation}${context.matchedOperatorName}${context.separator}${getColorItemCode(item)}`;
}

export function formatColorTabSelection(item, context) {
  const value = isColorCodeQuery(context.rawQuery)
    ? completeColorCodeQuery(context.rawQuery, item)
    : item.name;
  return `${context.negation}${context.matchedOperatorName}${context.separator}${value}`;
}
