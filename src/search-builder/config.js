import { OPERATOR_ITEMS } from "../operator/items.js";
import {
  SEARCH_BUILDER_COMPARATORS,
  SEARCH_BUILDER_CONDITION_KIND_TEXT,
} from "./query-language.js";

function uniqueBy(values, getKey = (value) => value) {
  const seen = new Set();
  const result = [];

  values.forEach((value) => {
    const key = getKey(value);
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(value);
  });

  return result;
}

function compareStrings(left, right) {
  return left.localeCompare(right, undefined, { sensitivity: "base" });
}

const PROPERTY_OPTIONS = uniqueBy(
  OPERATOR_ITEMS.map((item) => ({
    display: item.display,
    label: `${item.token} - ${item.display}`,
    value: item.token,
  })).sort((left, right) => compareStrings(left.value, right.value)),
  (item) => item.value,
);
const PROPERTY_LOOKUP = new Map();

PROPERTY_OPTIONS.forEach((option) => {
  PROPERTY_LOOKUP.set(option.value, option);
  PROPERTY_LOOKUP.set(option.label.toLowerCase(), option);
  PROPERTY_LOOKUP.set(`${option.value} - ${option.display}`.toLowerCase(), option);
});

export const SEARCH_BUILDER_TEXT_PROPERTY_VALUE = SEARCH_BUILDER_CONDITION_KIND_TEXT;
export const SEARCH_BUILDER_PROPERTY_SET = new Set(
  PROPERTY_OPTIONS.map((item) => item.value),
);
export const SEARCH_BUILDER_COMPARATOR_OPTIONS = SEARCH_BUILDER_COMPARATORS.map(
  (comparator) => ({
    label: comparator,
    value: comparator,
  }),
);

export function getSearchBuilderPropertyDisplayValue(field) {
  const normalizedField = String(field || "").trim().toLowerCase();
  return PROPERTY_LOOKUP.get(normalizedField)?.value || normalizedField;
}

export function resolveSearchBuilderPropertyValue(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (
    normalizedValue === SEARCH_BUILDER_TEXT_PROPERTY_VALUE ||
    normalizedValue === "text - free text search"
  ) {
    return SEARCH_BUILDER_TEXT_PROPERTY_VALUE;
  }

  return PROPERTY_LOOKUP.get(normalizedValue)?.value || normalizedValue;
}
