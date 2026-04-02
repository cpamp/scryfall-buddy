import { getScryfallCardPageContext } from "./platform/scryfall/card-page.js";
import { getScryfallSearchInputs } from "./platform/scryfall/search-inputs.js";
import { mountCardPageTags } from "./card-page-tags/install.js";
import { mountOtagDropdown } from "./otag-dropdown/install.js";

if (getScryfallCardPageContext()) {
  mountCardPageTags();
}

if (getScryfallSearchInputs().length > 0) {
  mountOtagDropdown();
}
