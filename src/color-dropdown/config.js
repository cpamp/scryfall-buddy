import {
  formatColorTabSelection,
} from "../color/format-color-selection.js";
import { filterColorItems } from "../color/filter-color-items.js";
import { COLOR_TRIGGER_OPERATORS } from "../color/constants.js";
import { getColorContext } from "../color/get-color-context.js";
import { createScryfallSearchDropdownDefinition } from "../shared/dropdown/create-scryfall-search-dropdown-definition.js";

export const COLOR_DROPDOWN_HANDLE_NAME = "__scryfallColorDropdownExtension";
export const COLOR_DROPDOWN_KEY = "color";
export const COLOR_DROPDOWN_POPUP_ID = "scryfall-color-extension-dropdown";
export const COLOR_DROPDOWN_POPUP_TITLE = "colors";

const MANA_SYMBOL_TITLES = {
  b: "one black mana",
  c: "one colorless mana",
  g: "one green mana",
  r: "one red mana",
  u: "one blue mana",
  w: "one white mana",
};

function createManaSymbol(symbol) {
  const token = symbol.toUpperCase();
  const element = document.createElement("abbr");
  element.className = `card-symbol card-symbol-${token}`;
  element.title = MANA_SYMBOL_TITLES[symbol];
  element.textContent = `{${token}}`;
  return element;
}

export function renderColorItemContent(option, item) {
  const content = document.createElement("span");
  content.className = "scryfall-otag-dropdown-popup__item-content";

  const label = document.createElement("span");
  label.className = "scryfall-otag-dropdown-popup__item-label";
  label.textContent = item.name;

  const symbols = document.createElement("span");
  symbols.className = "scryfall-otag-dropdown-popup__item-meta";
  for (const symbol of item.code) {
    symbols.append(createManaSymbol(symbol));
  }

  content.append(label, symbols);
  option.append(content);
}

export const colorDropdownConfig = {
  getItemLabel: (item) => item.name,
  getItems: ({ context }) => filterColorItems(context.rawQuery),
  getPopupTitle: () => COLOR_DROPDOWN_POPUP_TITLE,
  getReplacement: ({ context, item }) => formatColorTabSelection(item, context),
  popupId: COLOR_DROPDOWN_POPUP_ID,
  popupTitle: COLOR_DROPDOWN_POPUP_TITLE,
  renderItemContent: renderColorItemContent,
  resolveContext: getColorContext,
};

export const colorDropdownDefinition = createScryfallSearchDropdownDefinition({
  config: colorDropdownConfig,
  handleName: COLOR_DROPDOWN_HANDLE_NAME,
  key: COLOR_DROPDOWN_KEY,
  routeOperators: COLOR_TRIGGER_OPERATORS,
});
