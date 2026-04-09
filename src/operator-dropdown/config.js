import { filterOperatorItems } from "../operator/filter-operator-items.js";
import { formatOperatorSelection } from "../operator/format-operator-selection.js";
import { renderTokenMetaItemContent } from "../shared/dropdown/render-item-content.js";
import { getOperatorDropdownContext } from "../operator/get-operator-context.js";
import { createScryfallSearchDropdownDefinition } from "../shared/dropdown/create-scryfall-search-dropdown-definition.js";

export const OPERATOR_DROPDOWN_HANDLE_NAME =
  "__scryfallOperatorDropdownExtension";
export const OPERATOR_DROPDOWN_KEY = "operator";
export const OPERATOR_DROPDOWN_POPUP_ID = "scryfall-operator-extension-dropdown";
export const OPERATOR_DROPDOWN_POPUP_TITLE = "operators";

export const renderOperatorItemContent = renderTokenMetaItemContent;

export const operatorDropdownConfig = {
  getItemLabel: (item) => item.token,
  getItems: ({ context }) => filterOperatorItems(context.rawQuery),
  getPopupTitle: () => OPERATOR_DROPDOWN_POPUP_TITLE,
  getReplacement: ({ context, item }) => formatOperatorSelection(item, context),
  popupId: OPERATOR_DROPDOWN_POPUP_ID,
  popupTitle: OPERATOR_DROPDOWN_POPUP_TITLE,
  renderItemContent: renderOperatorItemContent,
  resolveContext: getOperatorDropdownContext,
};

export const operatorDropdownDefinition =
  createScryfallSearchDropdownDefinition({
    config: operatorDropdownConfig,
    handleName: OPERATOR_DROPDOWN_HANDLE_NAME,
    key: OPERATOR_DROPDOWN_KEY,
  });
