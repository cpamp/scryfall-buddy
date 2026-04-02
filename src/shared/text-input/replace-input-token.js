export function replaceInputToken(input, context, replacement) {
  const nextValue =
    input.value.slice(0, context.start) +
    replacement +
    input.value.slice(context.end);

  const caret = context.start + replacement.length;
  input.value = nextValue;
  input.setSelectionRange(caret, caret);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));

  return caret;
}
