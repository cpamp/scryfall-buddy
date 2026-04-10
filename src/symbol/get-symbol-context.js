import { getOperatorContext } from "../shared/text-input/operator-token.js";
import { SYMBOL_TRIGGER_OPERATORS } from "./constants.js";

function findBraceFragmentEnd(rawQuery, startIndex) {
  for (let index = startIndex; index < rawQuery.length; index += 1) {
    const character = rawQuery[index];
    if (character === "}" || character === "{" || character === '"' || /\s/.test(character)) {
      return index;
    }
  }

  return rawQuery.length;
}

function findBraceRange(rawQuery, caretInRawQuery, rawQueryStart) {
  let openIndex = -1;

  for (let index = 0; index < Math.min(caretInRawQuery, rawQuery.length); index += 1) {
    const character = rawQuery[index];
    if (character === "{") {
      openIndex = index;
      continue;
    }

    if (character === "}") {
      openIndex = -1;
    }
  }

  if (openIndex < 0 || caretInRawQuery <= openIndex) {
    return null;
  }

  const closeIndex = rawQuery.indexOf("}", openIndex + 1);
  const contentEnd = closeIndex >= 0
    ? closeIndex
    : findBraceFragmentEnd(rawQuery, openIndex + 1);
  const replaceEnd = closeIndex >= 0 ? closeIndex + 1 : contentEnd;
  if (caretInRawQuery > replaceEnd) {
    return null;
  }

  return {
    absoluteEnd: rawQueryStart + replaceEnd,
    absoluteStart: rawQueryStart + openIndex,
    end: replaceEnd,
    query: rawQuery.slice(openIndex + 1, contentEnd),
    start: openIndex,
  };
}

export function getSymbolContext(input) {
  const context = getOperatorContext(input, SYMBOL_TRIGGER_OPERATORS);
  if (!context) {
    return null;
  }

  const rawQueryStart =
    context.start +
    context.negation.length +
    context.matchedOperatorName.length +
    context.separator.length;
  const caretInRawQuery = Math.max(
    0,
    Math.min(context.rawQuery.length, context.caret - rawQueryStart),
  );
  const braceRange = findBraceRange(context.rawQuery, caretInRawQuery, rawQueryStart);

  return {
    ...context,
    braceRange,
    caretInRawQuery,
    rawQueryStart,
    symbolQuery: braceRange?.query || "",
  };
}
