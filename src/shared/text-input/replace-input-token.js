export function replaceInputToken(input, context, replacement, options = {}) {
  const shouldAppendTrailingSpace =
    options.appendSpaceIfAtEnd === true &&
    context.end === input.value.length &&
    !replacement.endsWith(" ");
  const nextReplacement = shouldAppendTrailingSpace ? `${replacement} ` : replacement;
  const nextValue =
    input.value.slice(0, context.start) +
    nextReplacement +
    input.value.slice(context.end);

  const caret = context.start + nextReplacement.length;
  input.value = nextValue;
  input.setSelectionRange(caret, caret);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));

  return caret;
}
