import { replaceInputToken } from "../shared/text-input/replace-input-token.js";
import { OTAG_OPERATOR } from "./constants.js";
import { getOtagContext } from "./get-otag-context.js";

export function formatOtagSlugSelection(slug, negation = "") {
  return `${negation}${OTAG_OPERATOR}:${slug}`;
}

function insertTextAtSelection(input, text) {
  const value = input.value;
  const isFocused = document.activeElement === input;
  const start =
    isFocused && typeof input.selectionStart === "number"
      ? input.selectionStart
      : value.length;
  const end =
    isFocused && typeof input.selectionEnd === "number"
      ? input.selectionEnd
      : start;
  const needsLeadingSpace = start > 0 && !/\s/.test(value[start - 1]);
  const needsTrailingSpace = end < value.length && !/\s/.test(value[end]);
  const replacement = `${needsLeadingSpace ? " " : ""}${text}${needsTrailingSpace ? " " : ""}`;
  const nextValue = value.slice(0, start) + replacement + value.slice(end);
  const caret = start + replacement.length;

  input.focus();
  input.value = nextValue;
  input.setSelectionRange(caret, caret);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export function applyOtagSlugSelection({ input, slug }) {
  const context = document.activeElement === input ? getOtagContext(input) : null;
  const replacement = formatOtagSlugSelection(slug, context?.negation || "");

  if (context) {
    replaceInputToken(input, context, replacement);
    return;
  }

  insertTextAtSelection(input, replacement);
}
