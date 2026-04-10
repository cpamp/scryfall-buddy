import { filterSymbolItems } from "../symbol/filter-symbol-items.js";
import { formatSymbolSelection } from "../symbol/format-symbol-selection.js";
import { getSymbolContext } from "../symbol/get-symbol-context.js";
import {
  getCategoryItem,
  getSymbolItemsForCategory,
  SYMBOL_CATEGORY_ITEMS,
} from "../symbol/items.js";
import { SYMBOL_TRIGGER_OPERATORS } from "../symbol/constants.js";
import { createScryfallSearchDropdownDefinition } from "../shared/dropdown/create-scryfall-search-dropdown-definition.js";

export const SYMBOL_DROPDOWN_HANDLE_NAME = "__scryfallSymbolDropdownExtension";
export const SYMBOL_DROPDOWN_KEY = "symbol";
export const SYMBOL_DROPDOWN_POPUP_ID = "scryfall-symbol-extension-dropdown";
export const SYMBOL_DROPDOWN_POPUP_TITLE = "symbols";

function createSymbolElement(token, title) {
  const element = document.createElement("abbr");
  const normalizedToken = token
    .replace(/[{}]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();

  element.className = `card-symbol card-symbol-${normalizedToken}`;
  element.title = title;
  element.textContent = token;
  return element;
}

function createMetaSymbols(tokens = [], title) {
  const symbols = document.createElement("span");
  symbols.className = "scryfall-otag-dropdown-popup__item-meta";

  for (const token of tokens) {
    symbols.append(createSymbolElement(token, title));
  }

  return symbols;
}

function createLabel(text) {
  const label = document.createElement("span");
  label.className = "scryfall-otag-dropdown-popup__item-label";
  label.textContent = text;
  return label;
}

function createMetaText(text) {
  const meta = document.createElement("span");
  meta.className = "scryfall-otag-dropdown-popup__item-meta";
  meta.textContent = text;
  return meta;
}

function renderCategoryItemContent(option, item) {
  const content = document.createElement("span");
  content.className = "scryfall-otag-dropdown-popup__item-content";
  content.append(createLabel(item.label), createMetaSymbols(item.examples, item.description));
  option.append(content);
}

function renderBackItemContent(option, item) {
  const content = document.createElement("span");
  content.className = "scryfall-otag-dropdown-popup__item-content";
  content.append(createLabel(item.label), createMetaText(item.meta));
  option.append(content);
}

function renderSymbolItemContent(option, item) {
  const content = document.createElement("span");
  content.className = "scryfall-otag-dropdown-popup__item-content";
  content.append(
    createLabel(item.description),
    createMetaSymbols([item.token], item.description),
  );
  option.append(content);
}

function createBackItem(categoryKey) {
  const category = getCategoryItem(categoryKey);
  if (!category) {
    return null;
  }

  return {
    key: "back",
    kind: "back",
    label: "Back to categories",
    meta: category.label,
  };
}

function getSymbolDropdownItems({ context, state }) {
  if (context.symbolQuery.trim()) {
    return filterSymbolItems(context.symbolQuery);
  }

  if (state?.categoryKey) {
    const backItem = createBackItem(state.categoryKey);
    return [
      ...(backItem ? [backItem] : []),
      ...getSymbolItemsForCategory(state.categoryKey),
    ];
  }

  return SYMBOL_CATEGORY_ITEMS.slice();
}

function getSymbolPopupTitle({ context, state }) {
  if (context.symbolQuery.trim()) {
    return "matching symbols";
  }

  if (state?.categoryKey) {
    const category = getCategoryItem(state.categoryKey);
    if (category) {
      return `${category.label.toLowerCase()} symbols`;
    }
  }

  return SYMBOL_DROPDOWN_POPUP_TITLE;
}

export function renderSymbolItemContentByType(option, item) {
  if (item.kind === "category") {
    renderCategoryItemContent(option, item);
    return;
  }

  if (item.kind === "back") {
    renderBackItemContent(option, item);
    return;
  }

  renderSymbolItemContent(option, item);
}

export const symbolDropdownConfig = {
  getItemLabel: (item) => item.label || item.token,
  getItems: getSymbolDropdownItems,
  getPopupTitle: getSymbolPopupTitle,
  getReplacement: ({ context, item }) => formatSymbolSelection(item, context),
  popupId: SYMBOL_DROPDOWN_POPUP_ID,
  popupTitle: SYMBOL_DROPDOWN_POPUP_TITLE,
  renderItemContent: renderSymbolItemContentByType,
  resolveContext: getSymbolContext,
};

export const symbolDropdownDefinition = createScryfallSearchDropdownDefinition({
  config: symbolDropdownConfig,
  handleName: SYMBOL_DROPDOWN_HANDLE_NAME,
  key: SYMBOL_DROPDOWN_KEY,
  routeOperators: SYMBOL_TRIGGER_OPERATORS,
});
