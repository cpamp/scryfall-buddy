import { PROPERTY_TRIGGER_OPERATORS } from "../property/constants.js";
import { filterPropertyItems } from "../property/filter-property-items.js";
import { formatPropertySelection } from "../property/format-property-selection.js";
import { renderTokenMetaItemContent } from "../shared/dropdown/render-item-content.js";
import { getPropertyContext } from "../property/get-property-context.js";
import { createScryfallSearchDropdownDefinition } from "../shared/dropdown/create-scryfall-search-dropdown-definition.js";

export const PROPERTY_DROPDOWN_HANDLE_NAME =
  "__scryfallPropertyDropdownExtension";
export const PROPERTY_DROPDOWN_KEY = "property";
export const PROPERTY_DROPDOWN_POPUP_ID = "scryfall-property-extension-dropdown";
export const PROPERTY_DROPDOWN_POPUP_TITLE = "properties";

export const renderPropertyItemContent = renderTokenMetaItemContent;

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
