import rawPropertyDefinitions from "../../data/properties.json";
import { createSearchAliases } from "../shared/search/text-match.js";

function createAliases(item) {
  return createSearchAliases([item.token, item.display, `${item.display} ${item.token}`]);
}

export const PROPERTY_ITEMS = rawPropertyDefinitions.map((definition, index) => ({
  ...definition,
  index,
  searchAliases: createAliases(definition),
}));

export const DEFAULT_PROPERTY_ITEMS = PROPERTY_ITEMS.slice(0, 50);
