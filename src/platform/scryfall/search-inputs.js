export const SCRYFALL_SEARCH_INPUT_SELECTOR =
  '#header-search-field, #q[data-component="homepage-search"]';

export function getScryfallSearchInputs() {
  return Array.from(document.querySelectorAll(SCRYFALL_SEARCH_INPUT_SELECTOR));
}
