import { mountOtagDropdown } from "../../otag-dropdown/install.js";
import { installThemeControls } from "../theme/install.js";
import { getScryfallSearchInputs } from "../../platform/scryfall/search-inputs.js";

export function bootstrapScryfallExtensionContentScript() {
  installThemeControls();

  if (getScryfallSearchInputs().length > 0) {
    mountOtagDropdown();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapScryfallExtensionContentScript, {
    once: true,
  });
} else {
  bootstrapScryfallExtensionContentScript();
}
