import { getScryfallSearchInputs } from "../platform/scryfall/search-inputs.js";
import { createSearchBuilderModal } from "./create-search-builder-modal.js";

const SEARCH_BUILDER_LAUNCHER_CLASS = "scryfall-search-builder-launcher";
const SEARCH_BUILDER_LAUNCHER_HIDDEN_CLASS = "is-hidden";
const SEARCH_BUILDER_LINKS_SELECTOR = ".header-links";

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

function createLauncherButton(modal) {
  const button = document.createElement("a");
  button.href = "#";
  button.className = `header-link double-pad-left ${SEARCH_BUILDER_LAUNCHER_CLASS}`;
  button.setAttribute("aria-label", "Open the visual search builder");
  button.setAttribute("title", "Open the visual search builder");
  button.innerHTML = `
    <span>Builder</span>
  `;
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
  const button = createLauncherButton(modal);

  function syncLaunchers() {
    const container = document.querySelector(SEARCH_BUILDER_LINKS_SELECTOR);
    const activeInput = resolveActiveSearchInput();

    if (!container || !activeInput) {
      button.classList.add(SEARCH_BUILDER_LAUNCHER_HIDDEN_CLASS);
      button.remove();
      return;
    }

    if (button.parentElement !== container) {
      container.prepend(button);
    } else if (container.firstElementChild !== button) {
      container.prepend(button);
    }

    button.classList.remove(SEARCH_BUILDER_LAUNCHER_HIDDEN_CLASS);
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
      button.remove();
      modal.destroy();
    },
  };
}
