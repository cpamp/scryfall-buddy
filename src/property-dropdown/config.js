import { PROPERTY_TRIGGER_OPERATORS } from "../property/constants.js";
import { filterPropertyItems } from "../property/filter-property-items.js";
import { formatPropertySelection } from "../property/format-property-selection.js";
import { getPropertyContext } from "../property/get-property-context.js";
import { createScryfallSearchDropdownDefinition } from "../shared/dropdown/create-scryfall-search-dropdown-definition.js";

export const PROPERTY_DROPDOWN_HANDLE_NAME =
  "__scryfallPropertyDropdownExtension";
export const PROPERTY_DROPDOWN_KEY = "property";
export const PROPERTY_DROPDOWN_POPUP_ID = "scryfall-property-extension-dropdown";
export const PROPERTY_DROPDOWN_POPUP_TITLE = "properties";

export function renderPropertyItemContent(option, item) {
  const content = document.createElement("span");
  content.className = "scryfall-otag-dropdown-popup__item-content";

  const label = document.createElement("span");
  label.className = "scryfall-otag-dropdown-popup__item-label";
  label.textContent = item.token;

  const meta = document.createElement("span");
  meta.className = "scryfall-otag-dropdown-popup__item-meta";
  meta.textContent = item.display;

  content.append(label, meta);
  option.append(content);
}

export const propertyDropdownConfig = {
  getItemLabel: (item) => item.token,
  getItems: ({ context }) => filterPropertyItems(context.rawQuery),
  getPopupTitle: () => PROPERTY_DROPDOWN_POPUP_TITLE,
  getReplacement: ({ context, item }) => formatPropertySelection(item, context),
  popupId: PROPERTY_DROPDOWN_POPUP_ID,
  popupTitle: PROPERTY_DROPDOWN_POPUP_TITLE,
  renderItemContent: renderPropertyItemContent,
  resolveContext: getPropertyContext,
};

export const propertyDropdownDefinition =
  createScryfallSearchDropdownDefinition({
    config: propertyDropdownConfig,
    handleName: PROPERTY_DROPDOWN_HANDLE_NAME,
    key: PROPERTY_DROPDOWN_KEY,
    routeOperators: PROPERTY_TRIGGER_OPERATORS,
  });
