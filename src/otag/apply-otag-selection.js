import { replaceInputToken } from "../shared/text-input/replace-input-token.js";
import { OTAG_OPERATOR } from "./constants.js";

export function formatOtagSelection(item, context) {
  return `${context.negation}${OTAG_OPERATOR}:"${item}"`;
}

export function applyOtagSelection({ context, input, item }) {
  replaceInputToken(input, context, formatOtagSelection(item, context));
}
