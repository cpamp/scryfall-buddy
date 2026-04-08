import { formatOtagSelection } from "../otag/apply-otag-selection.js";
import { OTAG_TRIGGER_OPERATORS } from "../otag/constants.js";
import { filterOtagItems } from "../otag/filter-otag-items.js";
import { getOtagContext } from "../otag/get-otag-context.js";
import { createScryfallSearchDropdownDefinition } from "../shared/dropdown/create-scryfall-search-dropdown-definition.js";

export const OTAG_DROPDOWN_HANDLE_NAME = "__scryfallOtagDropdownExtension";
export const OTAG_DROPDOWN_KEY = "otag";
export const OTAG_DROPDOWN_POPUP_ID = "scryfall-otag-extension-dropdown";
export const OTAG_DROPDOWN_POPUP_TITLE = "oracle tags";

export const otagDropdownConfig = {
  getItemLabel: (item) => item.name,
  getItems: ({ context }) => filterOtagItems(context.rawQuery),
  getPopupTitle: () => OTAG_DROPDOWN_POPUP_TITLE,
  getReplacement: ({ context, item }) => formatOtagSelection(item, context),
  popupId: OTAG_DROPDOWN_POPUP_ID,
  popupTitle: OTAG_DROPDOWN_POPUP_TITLE,
  resolveContext: getOtagContext,
};

export const otagDropdownDefinition = createScryfallSearchDropdownDefinition({
  config: otagDropdownConfig,
  handleName: OTAG_DROPDOWN_HANDLE_NAME,
  key: OTAG_DROPDOWN_KEY,
  routeOperators: OTAG_TRIGGER_OPERATORS,
});
