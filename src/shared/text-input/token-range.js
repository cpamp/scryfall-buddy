function isUnescapedQuote(value, index) {
  if (value[index] !== '"') {
    return false;
  }

  let backslashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1) {
    backslashCount += 1;
  }

  return backslashCount % 2 === 0;
}

export function findTokenRange(value, caret) {
  let inQuotes = false;
  let tokenStart = null;

  for (let index = 0; index <= value.length; index += 1) {
    const atEnd = index === value.length;
    const character = value[index];
    const isSeparator = !atEnd && !inQuotes && /\s/.test(character);

    if (atEnd || isSeparator) {
      if (tokenStart !== null) {
        const tokenEnd = index;
        if (caret >= tokenStart && caret <= tokenEnd) {
          return {
            start: tokenStart,
            end: tokenEnd,
            token: value.slice(tokenStart, tokenEnd),
          };
        }

        tokenStart = null;
      }

      continue;
    }

    if (tokenStart === null) {
      tokenStart = index;
    }

    if (isUnescapedQuote(value, index)) {
      inQuotes = !inQuotes;
    }
  }

  return { start: caret, end: caret, token: "" };
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
