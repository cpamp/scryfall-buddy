export function setInputValue(input, value, options = {}) {
  if (!input) {
    return null;
  }

  const nextValue = String(value ?? "");
  input.value = nextValue;

  if (typeof input.setSelectionRange === "function") {
    const caret = Math.max(0, Math.min(nextValue.length, options.caret ?? nextValue.length));

    try {
      input.setSelectionRange(caret, caret);
    } catch {
      // Ignore selection failures on unsupported input types.
    }
  }

  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));

  return nextValue;
}
