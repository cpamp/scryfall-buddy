import { getScryfallSearchInputs } from "../../platform/scryfall/search-inputs.js";
import { mountSearchBuilder } from "../../search-builder/install.js";
import { DROPDOWN_DEFINITIONS } from "../../shared/dropdown/dropdown-definitions.js";
import { mountDropdownDefinitions } from "../../shared/dropdown/mount-dropdown-definition.js";
import { initializeDropdownTheme } from "../../shared/ui/dropdown-theme.js";

const SEARCH_BUILDER_HANDLE_NAME = "__scryfallSearchBuilderExtension";

export function bootstrapScryfallExtensionContentScript() {
  initializeDropdownTheme();

  if (getScryfallSearchInputs().length > 0) {
    mountDropdownDefinitions(DROPDOWN_DEFINITIONS);

    const existingSearchBuilderHandle = window[SEARCH_BUILDER_HANDLE_NAME];
    if (existingSearchBuilderHandle?.cleanup) {
      existingSearchBuilderHandle.cleanup();
    }

    window[SEARCH_BUILDER_HANDLE_NAME] = mountSearchBuilder();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapScryfallExtensionContentScript, {
    once: true,
  });
} else {
  bootstrapScryfallExtensionContentScript();
}
