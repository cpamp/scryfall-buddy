import { getScryfallSearchInputs } from "../../platform/scryfall/search-inputs.js";
import { DROPDOWN_DEFINITIONS } from "../../shared/dropdown/dropdown-definitions.js";
import { mountDropdownDefinitions } from "../../shared/dropdown/mount-dropdown-definition.js";
import { initializeDropdownTheme } from "../../shared/ui/dropdown-theme.js";

export function bootstrapScryfallExtensionContentScript() {
  initializeDropdownTheme();

  if (getScryfallSearchInputs().length > 0) {
    mountDropdownDefinitions(DROPDOWN_DEFINITIONS);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapScryfallExtensionContentScript, {
    once: true,
  });
} else {
  bootstrapScryfallExtensionContentScript();
}
