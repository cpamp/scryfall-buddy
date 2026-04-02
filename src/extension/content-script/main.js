import { mountCardPageTags } from "../../card-page-tags/install.js";
import { mountOtagDropdown } from "../../otag-dropdown/install.js";
import { getScryfallCardPageContext } from "../../platform/scryfall/card-page.js";
import { getScryfallSearchInputs } from "../../platform/scryfall/search-inputs.js";

function isSearchOrientedPath(pathname) {
  return (
    pathname === "/" ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/advanced")
  );
}

export function bootstrapScryfallExtensionContentScript() {
  const cardPageContext = getScryfallCardPageContext();

  if (cardPageContext) {
    mountCardPageTags();
  }

  if (
    (cardPageContext || isSearchOrientedPath(window.location.pathname)) &&
    getScryfallSearchInputs().length > 0
  ) {
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
