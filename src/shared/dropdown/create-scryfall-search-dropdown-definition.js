import {
  SCRYFALL_SEARCH_INPUT_SELECTOR,
  getScryfallSearchInputs,
} from "../../platform/scryfall/search-inputs.js";

export function createScryfallSearchDropdownDefinition({
  config,
  handleName,
  key,
  routeOperators = [],
}) {
  return {
    config: {
      dropdownKey: key,
      getInputs: getScryfallSearchInputs,
      inputSelector: SCRYFALL_SEARCH_INPUT_SELECTOR,
      ...config,
    },
    handleName,
    key,
    routeOperators: routeOperators.map((operator) => operator.toLowerCase()),
  };
}
