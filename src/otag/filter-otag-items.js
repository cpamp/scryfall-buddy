import { TEST_OTAG_ITEMS } from "./constants.js";

function normalize(text) {
  return text.trim().toLowerCase();
}

export function filterOtagItems(query, items = TEST_OTAG_ITEMS) {
  const needle = normalize(query).replace(/^"+|"+$/g, "");
  if (!needle) {
    return items.slice();
  }

  return items.filter((item) => normalize(item).includes(needle));
}
