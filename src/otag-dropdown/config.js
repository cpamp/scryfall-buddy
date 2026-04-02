import {
  SCRYFALL_SEARCH_INPUT_SELECTOR,
  getScryfallSearchInputs,
} from "../platform/scryfall/search-inputs.js";
import { formatOtagSelection } from "../otag/apply-otag-selection.js";
import { filterOtagItems } from "../otag/filter-otag-items.js";
import { getOtagContext } from "../otag/get-otag-context.js";

export const OTAG_DROPDOWN_HANDLE_NAME = "__scryfallOtagDropdownExtension";
export const OTAG_DROPDOWN_POPUP_ID = "scryfall-otag-extension-dropdown";
export const OTAG_DROPDOWN_POPUP_TITLE = "otag: suggestions";

export const otagDropdownConfig = {
  getInputs: getScryfallSearchInputs,
  getItemLabel: (item) => item.name,
  getItems: ({ context }) => filterOtagItems(context.rawQuery),
  getPopupTitle: () => OTAG_DROPDOWN_POPUP_TITLE,
  getReplacement: ({ context, item }) => formatOtagSelection(item, context),
  inputSelector: SCRYFALL_SEARCH_INPUT_SELECTOR,
  popupId: OTAG_DROPDOWN_POPUP_ID,
  popupTitle: OTAG_DROPDOWN_POPUP_TITLE,
  resolveContext: getOtagContext,
};
