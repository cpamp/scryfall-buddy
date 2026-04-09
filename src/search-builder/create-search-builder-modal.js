import { createSearchBuilderFavoritesController } from "./create-search-builder-favorites-controller.js";
import { createSearchBuilderSuggestionsController } from "./create-search-builder-suggestions-controller.js";
import { createSearchBuilderTreeElement } from "./create-search-builder-tree-view.js";
import { createButton } from "./dom.js";
import {
  SEARCH_BUILDER_COMPARATOR_OPTIONS,
  SEARCH_BUILDER_PROPERTY_SET,
} from "./config.js";
import {
  parseSearchBuilderQuery,
  serializeSearchBuilderTree,
  validateSearchBuilderTree,
} from "./query-language.js";
import { getQueryStateStatusMetadata } from "./status.js";
import { findNodeAndParent } from "./tree-utils.js";
import { createDropdownThemeToggleButton } from "../shared/ui/dropdown-theme.js";
import { setInputValue } from "../shared/text-input/set-input-value.js";

const SEARCH_BUILDER_MODAL_CLASS = "scryfall-search-builder-modal";
const SEARCH_BUILDER_MODAL_HIDDEN_CLASS = "is-hidden";
const SEARCH_BUILDER_MODAL_PANEL_CLASS = "scryfall-search-builder-modal__panel";
const SEARCH_BUILDER_SUGGESTION_POPUP_ID = "scryfall-search-builder-modal-suggestions";
const SEARCH_BUILDER_FAVORITES_NAME_FOCUS_KEY = "favorites-form-name";

export function createSearchBuilderModal() {
  const parseOptions = {
    supportedComparators: new Set(
      SEARCH_BUILDER_COMPARATOR_OPTIONS.map((option) => option.value),
    ),
    supportedFields: SEARCH_BUILDER_PROPERTY_SET,
  };
  const root = document.createElement("div");
  root.className = `${SEARCH_BUILDER_MODAL_CLASS} ${SEARCH_BUILDER_MODAL_HIDDEN_CLASS}`;

  const backdrop = document.createElement("div");
  backdrop.className = "scryfall-search-builder-modal__backdrop";
  backdrop.addEventListener("click", () => close());

  const panel = document.createElement("div");
  panel.className = SEARCH_BUILDER_MODAL_PANEL_CLASS;
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Search builder");

  root.append(backdrop, panel);

  const state = {
    activeInput: null,
    collapsedGroupIds: new Set(),
    initialQuery: "",
    isOpen: false,
    lastFocusedElement: null,
    lastKnownValidQuery: null,
    queryState: parseSearchBuilderQuery("", parseOptions),
    rawQuery: "",
  };

  const favorites = createSearchBuilderFavoritesController({
    getRawQuery: () => state.rawQuery,
    isOpen: () => state.isOpen,
    nameFocusKey: SEARCH_BUILDER_FAVORITES_NAME_FOCUS_KEY,
    onLoadQuery: updateRawQuery,
    requestRender: render,
  });
  const suggestions = createSearchBuilderSuggestionsController({
    getConditionById,
    isOpen: () => state.isOpen,
    panel,
    popupId: SEARCH_BUILDER_SUGGESTION_POPUP_ID,
    updateNode,
  });

  function ensureMounted() {
    if (root.parentElement !== document.body) {
      document.body.append(root);
    }
  }

  function getBuilderTree() {
    return state.queryState.status === "valid" ? state.queryState.tree : null;
  }

  function getBuilderValidation() {
    return validateSearchBuilderTree(getBuilderTree(), {
      supportedFields: SEARCH_BUILDER_PROPERTY_SET,
    });
  }

  function captureFocusState() {
    const activeElement = document.activeElement;
    if (!root.contains(activeElement) || !activeElement?.dataset?.focusKey) {
      return null;
    }

    return {
      focusKey: activeElement.dataset.focusKey,
      selectionEnd: activeElement.selectionEnd,
      selectionStart: activeElement.selectionStart,
    };
  }

  function restoreFocusState(focusState) {
    if (!focusState?.focusKey) {
      return;
    }

    const focusTarget = panel.querySelector(
      `[data-focus-key="${focusState.focusKey}"]`,
    );
    if (!focusTarget) {
      return;
    }

    focusTarget.focus();
    if (typeof focusTarget.setSelectionRange === "function") {
      try {
        focusTarget.setSelectionRange(
          focusState.selectionStart ?? 0,
          focusState.selectionEnd ?? focusState.selectionStart ?? 0,
        );
      } catch {
        // Ignore selection failures for elements that do not support it.
      }
    }
  }

  function updateLastKnownValidQuery() {
    if (state.queryState.status === "invalid") {
      return;
    }

    if (state.queryState.status === "not-representable") {
      state.lastKnownValidQuery = state.rawQuery;
      return;
    }

    const builderValidation = getBuilderValidation();
    if (builderValidation.isValid) {
      state.lastKnownValidQuery = state.rawQuery;
    }
  }

  function getConditionById(conditionId) {
    return findNodeAndParent(getBuilderTree(), conditionId)?.node || null;
  }

  function isGroupCollapsed(groupId) {
    return state.collapsedGroupIds.has(groupId);
  }

  function toggleGroupCollapsed(groupId) {
    if (state.collapsedGroupIds.has(groupId)) {
      state.collapsedGroupIds.delete(groupId);
    } else {
      state.collapsedGroupIds.add(groupId);
    }

    render();
  }

  function syncRawQueryFromBuilder() {
    const tree = getBuilderTree();
    if (!tree) {
      return;
    }

    state.rawQuery = serializeSearchBuilderTree(tree);
    state.queryState = {
      message: "",
      status: "valid",
      tree,
    };
    updateLastKnownValidQuery();
    render();
  }

  function updateRawQuery(nextRawQuery) {
    state.rawQuery = nextRawQuery;
    state.queryState = parseSearchBuilderQuery(nextRawQuery, parseOptions);
    updateLastKnownValidQuery();
    render();
  }

  function updateNode(nodeId, callback) {
    const match = findNodeAndParent(getBuilderTree(), nodeId);
    if (!match?.node) {
      return;
    }

    callback(match.node, match.parent);
    syncRawQueryFromBuilder();
  }

  function removeNode(nodeId) {
    const tree = getBuilderTree();
    const match = findNodeAndParent(tree, nodeId);

    if (!match?.parent) {
      return;
    }

    match.parent.children = match.parent.children.filter((child) => child.id !== nodeId);
    syncRawQueryFromBuilder();
  }

  function render() {
    if (!state.isOpen) {
      return;
    }

    const focusState = captureFocusState();
    const builderValidation = getBuilderValidation();
    const status = getQueryStateStatusMetadata(state.queryState, builderValidation);

    const nextPanelChildren = [];

    const header = document.createElement("div");
    header.className = "scryfall-search-builder-modal__header";

    const titleBlock = document.createElement("div");
    titleBlock.className = "scryfall-search-builder-modal__title-block";

    const title = document.createElement("h2");
    title.className = "scryfall-search-builder-modal__title";
    title.textContent = "Search builder";

    const validationRow = document.createElement("div");
    validationRow.className =
      "scryfall-search-builder-modal__validation scryfall-search-builder-modal__validation--header";

    const statusBadge = document.createElement("span");
    statusBadge.className = status.badgeClassName;
    statusBadge.textContent = status.badgeLabel;

    const statusMessage = document.createElement("p");
    statusMessage.className = "scryfall-search-builder-modal__status-message";
    statusMessage.textContent = status.message;

    validationRow.append(statusBadge, statusMessage);
    titleBlock.append(title, validationRow);

    const headerActions = document.createElement("div");
    headerActions.className = "scryfall-search-builder-modal__header-actions";
    headerActions.append(
      createDropdownThemeToggleButton(),
      createButton("Clear", "scryfall-search-builder-modal__ghost-button", () => {
        updateRawQuery("");
      }),
      createButton("Close", "scryfall-search-builder-modal__ghost-button", () => close()),
      createButton("Search", "scryfall-search-builder-modal__primary-button", () => {
        search();
      }),
    );

    header.append(titleBlock, headerActions);
    nextPanelChildren.push(header);
    nextPanelChildren.push(favorites.renderSection());

    const rawSection = document.createElement("section");
    rawSection.className = "scryfall-search-builder-modal__section";

    const rawHeading = document.createElement("label");
    rawHeading.className = "scryfall-search-builder-modal__section-heading";
    rawHeading.setAttribute("for", "scryfall-search-builder-raw-query");
    rawHeading.textContent = "Raw query";

    const rawInput = document.createElement("textarea");
    rawInput.id = "scryfall-search-builder-raw-query";
    rawInput.className = "scryfall-search-builder-modal__textarea";
    rawInput.rows = 4;
    rawInput.value = state.rawQuery;
    rawInput.placeholder = 'id>u (type:dragon or o:"draw a card")';
    rawInput.dataset.focusKey = "raw-query";
    rawInput.addEventListener("input", () => {
      updateRawQuery(rawInput.value);
    });

    const rawValidationRow = document.createElement("div");
    rawValidationRow.className =
      "scryfall-search-builder-modal__validation scryfall-search-builder-modal__validation--raw";

    const rawStatusBadge = document.createElement("span");
    rawStatusBadge.className = status.badgeClassName;
    rawStatusBadge.textContent = status.badgeLabel;

    const rawStatusMessage = document.createElement("p");
    rawStatusMessage.className = "scryfall-search-builder-modal__status-message";
    rawStatusMessage.textContent = status.message;

    rawValidationRow.append(rawStatusBadge, rawStatusMessage);
    rawSection.append(rawHeading, rawInput, rawValidationRow);
    nextPanelChildren.push(rawSection);

    const visualSection = document.createElement("section");
    visualSection.className = "scryfall-search-builder-modal__section";

    const visualHeading = document.createElement("div");
    visualHeading.className = "scryfall-search-builder-modal__section-heading";
    visualHeading.textContent = "Visual builder";
    visualSection.append(visualHeading);

    if (status.builderAvailable) {
      visualSection.append(
        createSearchBuilderTreeElement({
          group: getBuilderTree(),
          isGroupCollapsed,
          onRefreshSuggestions: suggestions.refresh,
          onRemoveNode: removeNode,
          onScheduleSuggestionRefresh: suggestions.scheduleRefresh,
          onToggleGroupCollapsed: toggleGroupCollapsed,
          onUpdateNode: updateNode,
        }),
      );
    } else {
      const unavailableState = document.createElement("div");
      unavailableState.className = "scryfall-search-builder-modal__builder-unavailable";
      unavailableState.textContent =
        state.queryState.status === "invalid"
          ? "Fix the raw query below to re-enable the visual builder."
          : "This query is preserved as-is, but it cannot be edited safely in the visual builder.";
      visualSection.append(unavailableState);
    }

    nextPanelChildren.push(visualSection);

    panel.replaceChildren(...nextPanelChildren);
    restoreFocusState(focusState);

    const pendingFocusKey = favorites.consumePendingFocusKey();
    if (pendingFocusKey) {
      const pendingFocusTarget = panel.querySelector(
        `[data-focus-key="${pendingFocusKey}"]`,
      );
      pendingFocusTarget?.focus();
      pendingFocusTarget?.select?.();
    }

    const nextSuggestionFocusKey = pendingFocusKey || focusState?.focusKey || null;
    if (nextSuggestionFocusKey?.startsWith("condition-")) {
      suggestions.scheduleRefresh(nextSuggestionFocusKey);
    } else {
      suggestions.hide();
    }
  }

  function onKeyDown(event) {
    if (!state.isOpen) {
      return;
    }

    if (suggestions.handleKeyDown(event)) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  function onDocumentPointerDown(event) {
    suggestions.handleDocumentPointerDown(event);
  }

  function open(input) {
    if (!input) {
      return;
    }

    ensureMounted();
    state.activeInput = input;
    state.initialQuery = input.value || "";
    state.isOpen = true;
    state.lastFocusedElement = document.activeElement;
    state.rawQuery = state.initialQuery;
    state.queryState = parseSearchBuilderQuery(state.rawQuery, parseOptions);
    state.lastKnownValidQuery =
      state.queryState.status === "valid" || state.queryState.status === "not-representable"
        ? state.rawQuery
        : null;
    favorites.resetForOpen();
    root.classList.remove(SEARCH_BUILDER_MODAL_HIDDEN_CLASS);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("mousedown", onDocumentPointerDown, true);
    window.addEventListener("resize", suggestions.reposition);
    panel.addEventListener("scroll", suggestions.reposition, true);
    render();
    favorites.loadFavorites({ showLoading: true });

    const rawInput = panel.querySelector('[data-focus-key="raw-query"]');
    rawInput?.focus();
  }

  function commitLastKnownValidQuery() {
    if (!state.activeInput) {
      return;
    }

    const nextQuery = state.lastKnownValidQuery ?? state.initialQuery;
    if (typeof nextQuery !== "string" || state.activeInput.value === nextQuery) {
      return;
    }

    setInputValue(state.activeInput, nextQuery, {
      caret: nextQuery.length,
    });
  }

  function triggerSearchFromInput(input) {
    if (!input) {
      return;
    }

    input.focus();

    if (typeof input.form?.requestSubmit === "function") {
      input.form.requestSubmit();
      return;
    }

    const keyboardEventOptions = {
      bubbles: true,
      cancelable: true,
      code: "Enter",
      key: "Enter",
      keyCode: 13,
      which: 13,
    };

    input.dispatchEvent(new KeyboardEvent("keydown", keyboardEventOptions));
    input.dispatchEvent(new KeyboardEvent("keypress", keyboardEventOptions));
    input.dispatchEvent(new KeyboardEvent("keyup", keyboardEventOptions));
  }

  function close(options = {}) {
    if (!state.isOpen) {
      return;
    }

    if (options.commit !== false) {
      commitLastKnownValidQuery();
    }

    suggestions.hide();
    state.isOpen = false;
    root.classList.add(SEARCH_BUILDER_MODAL_HIDDEN_CLASS);
    document.removeEventListener("keydown", onKeyDown, true);
    document.removeEventListener("mousedown", onDocumentPointerDown, true);
    window.removeEventListener("resize", suggestions.reposition);
    panel.removeEventListener("scroll", suggestions.reposition, true);

    if (typeof state.lastFocusedElement?.focus === "function") {
      state.lastFocusedElement.focus();
    } else if (typeof state.activeInput?.focus === "function") {
      state.activeInput.focus();
    }
  }

  function search() {
    const input = state.activeInput;
    close();
    triggerSearchFromInput(input);
  }

  return {
    destroy() {
      close({ commit: false });
      suggestions.destroy();
      root.remove();
    },
    open,
  };
}
