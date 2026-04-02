import { mountOtagDropdown } from "../../otag-dropdown/install.js";
import { getScryfallSearchInputs } from "../../platform/scryfall/search-inputs.js";

export function bootstrapScryfallExtensionContentScript() {
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
