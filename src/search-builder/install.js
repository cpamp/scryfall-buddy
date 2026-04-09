import { getScryfallSearchInputs } from "../platform/scryfall/search-inputs.js";
import { createSearchBuilderModal } from "./create-search-builder-modal.js";

const SEARCH_BUILDER_LAUNCHER_CLASS = "scryfall-search-builder-launcher";
const SEARCH_BUILDER_LAUNCHER_HIDDEN_CLASS = "is-hidden";
const SEARCH_BUILDER_LINKS_SELECTOR = ".header-links";
const SEARCH_BUILDER_MOBILE_NAV_SELECTOR = ".mobile-nav";

function isInputVisible(input) {
  const rect = input.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= window.innerHeight &&
    rect.left <= window.innerWidth
  );
}

function resolveActiveSearchInput() {
  const inputs = getScryfallSearchInputs();
  const activeElement = document.activeElement;
  if (inputs.includes(activeElement)) {
    return activeElement;
  }

  return inputs.find((input) => isInputVisible(input)) || inputs[0] || null;
}

function createLauncherButton(modal, options = {}) {
  const button = document.createElement("a");
  button.href = "#";
  button.className = `${options.className || ""} ${SEARCH_BUILDER_LAUNCHER_CLASS}`.trim();
  button.setAttribute("aria-label", "Open the visual search builder");
  button.setAttribute("title", "Open the visual search builder");
  button.textContent = options.label || "Builder";
  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });
  button.addEventListener("click", (event) => {
    event.preventDefault();
    modal.open(resolveActiveSearchInput());
  });
  return button;
}

export function mountSearchBuilder() {
  const modal = createSearchBuilderModal();
  const headerButton = createLauncherButton(modal, {
    className: "header-link double-pad-left",
  });
  const mobileButton = createLauncherButton(modal, {
    className: "button-n inverted align-left",
    label: "Search Builder",
  });

  function syncLaunchers() {
    const headerContainer = document.querySelector(SEARCH_BUILDER_LINKS_SELECTOR);
    const mobileContainer = document.querySelector(SEARCH_BUILDER_MOBILE_NAV_SELECTOR);
    const activeInput = resolveActiveSearchInput();

    if (!activeInput) {
      headerButton.classList.add(SEARCH_BUILDER_LAUNCHER_HIDDEN_CLASS);
      mobileButton.classList.add(SEARCH_BUILDER_LAUNCHER_HIDDEN_CLASS);
      headerButton.remove();
      mobileButton.remove();
      return;
    }

    if (!headerContainer) {
      headerButton.classList.add(SEARCH_BUILDER_LAUNCHER_HIDDEN_CLASS);
      headerButton.remove();
    } else {
      if (headerButton.parentElement !== headerContainer) {
        headerContainer.prepend(headerButton);
      } else if (headerContainer.firstElementChild !== headerButton) {
        headerContainer.prepend(headerButton);
      }

      headerButton.classList.remove(SEARCH_BUILDER_LAUNCHER_HIDDEN_CLASS);
    }

    if (!mobileContainer) {
      mobileButton.classList.add(SEARCH_BUILDER_LAUNCHER_HIDDEN_CLASS);
      mobileButton.remove();
    } else {
      if (mobileButton.parentElement !== mobileContainer) {
        mobileContainer.prepend(mobileButton);
      } else if (mobileContainer.firstElementChild !== mobileButton) {
        mobileContainer.prepend(mobileButton);
      }

      mobileButton.classList.remove(SEARCH_BUILDER_LAUNCHER_HIDDEN_CLASS);
    }
  }

  const mutationObserver = new MutationObserver(() => {
    syncLaunchers();
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  syncLaunchers();

  return {
    cleanup() {
      mutationObserver.disconnect();
      headerButton.remove();
      mobileButton.remove();
      modal.destroy();
    },
  };
}
