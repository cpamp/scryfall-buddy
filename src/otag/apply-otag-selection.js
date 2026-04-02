import { replaceInputToken } from "../shared/text-input/replace-input-token.js";
import { OTAG_OPERATOR } from "./constants.js";

function getOtagItemName(item) {
  return typeof item === "string" ? item : item.name;
}

export function formatOtagSelection(item, context) {
  return `${context.negation}${OTAG_OPERATOR}:"${getOtagItemName(item)}"`;
}

export function applyOtagSelection({ context, input, item }) {
  replaceInputToken(input, context, formatOtagSelection(item, context));
}
