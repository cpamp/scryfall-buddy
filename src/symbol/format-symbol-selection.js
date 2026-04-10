import { setInputValue } from "../shared/text-input/set-input-value.js";

function replaceInputRange(input, start, end, replacement) {
  const nextValue =
    input.value.slice(0, start) +
    replacement +
    input.value.slice(end);

  setInputValue(input, nextValue, {
    caret: start + replacement.length,
  });
}

export function formatSymbolSelection(item, context) {
  if (item.kind === "category") {
    return {
      keepOpen: true,
      nextState: {
        categoryKey: item.key,
      },
      selectedIndex: 0,
    };
  }

  if (item.kind === "back") {
    return {
      keepOpen: true,
      nextState: null,
      selectedIndex: 0,
    };
  }

  return {
    apply: ({ input }) => {
      const start = context.braceRange?.absoluteStart ?? context.caret;
      const end = context.braceRange?.absoluteEnd ?? context.caret;
      replaceInputRange(input, start, end, item.token);
    },
  };
}
