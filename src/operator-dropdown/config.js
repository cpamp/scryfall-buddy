import { filterOperatorItems } from "../operator/filter-operator-items.js";
import { formatOperatorSelection } from "../operator/format-operator-selection.js";
import { getOperatorDropdownContext } from "../operator/get-operator-context.js";
import { createScryfallSearchDropdownDefinition } from "../shared/dropdown/create-scryfall-search-dropdown-definition.js";

export const OPERATOR_DROPDOWN_HANDLE_NAME =
  "__scryfallOperatorDropdownExtension";
export const OPERATOR_DROPDOWN_KEY = "operator";
export const OPERATOR_DROPDOWN_POPUP_ID = "scryfall-operator-extension-dropdown";
export const OPERATOR_DROPDOWN_POPUP_TITLE = "operators";

export function renderOperatorItemContent(option, item) {
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
