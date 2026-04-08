import operatorDefinitions from "../../data/operators.json";
import { createSearchAliases } from "../shared/search/text-match.js";

function createAliases(item) {
  return createSearchAliases([item.token, item.display, `${item.display} ${item.token}`]);
}

export const OPERATOR_ITEMS = operatorDefinitions.map((definition, index) => ({
  ...definition,
  index,
  searchAliases: createAliases(definition),
}));

export const DEFAULT_OPERATOR_ITEMS = OPERATOR_ITEMS.slice(0, 50);
