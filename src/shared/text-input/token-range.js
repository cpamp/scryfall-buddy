export function findTokenRange(value, caret) {
  let start = caret;
  let end = caret;

  while (start > 0 && !/\s/.test(value[start - 1])) {
    start -= 1;
  }

  while (end < value.length && !/\s/.test(value[end])) {
    end += 1;
  }

  return { start, end, token: value.slice(start, end) };
}

export function getTokenRangeAtCursor(input) {
  if (!input || typeof input.selectionStart !== "number") {
    return null;
  }

  const caret = input.selectionStart;
  return {
    caret,
    ...findTokenRange(input.value, caret),
  };
}
