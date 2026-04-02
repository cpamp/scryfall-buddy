import { OTAG_OPERATOR } from "./constants.js";

function getOtagItemName(item) {
  return typeof item === "string" ? item : item.name;
}

export function formatOtagSelection(item, context) {
  const operatorName = context?.matchedOperatorName || OTAG_OPERATOR;

  return `${context.negation}${operatorName}:"${getOtagItemName(item)}"`;
}
