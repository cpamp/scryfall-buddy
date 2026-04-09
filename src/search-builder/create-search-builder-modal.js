import { filterColorItems } from "../color/filter-color-items.js";
import { COLOR_TRIGGER_OPERATORS } from "../color/constants.js";
import { renderColorItemContent } from "../color-dropdown/config.js";
import { filterOperatorItems } from "../operator/filter-operator-items.js";
import { OTAG_TRIGGER_OPERATORS } from "../otag/constants.js";
import { filterOtagItems } from "../otag/filter-otag-items.js";
import { filterPropertyItems } from "../property/filter-property-items.js";
import { PROPERTY_TRIGGER_OPERATORS } from "../property/constants.js";
import { createBrowserAutocompleteController } from "../shared/autocomplete/create-browser-autocomplete-controller.js";
import {
  compactSearchText,
  createSearchAliases,
  getAliasMatchScore,
  normalizeSearchQuery,
} from "../shared/search/text-match.js";
import { createDropdownPopup } from "../shared/ui/create-dropdown-popup.js";
import { createDropdownThemeToggleButton } from "../shared/ui/dropdown-theme.js";
import { setInputValue } from "../shared/text-input/set-input-value.js";
import {
  SEARCH_BUILDER_COMPARATOR_OPTIONS,
  SEARCH_BUILDER_PROPERTY_SET,
  SEARCH_BUILDER_TEXT_PROPERTY_VALUE,
  getSearchBuilderPropertyDisplayValue,
  resolveSearchBuilderPropertyValue,
} from "./config.js";
import {
  SEARCH_BUILDER_CONDITION_KIND_FIELD,
  SEARCH_BUILDER_CONDITION_KIND_TEXT,
  SEARCH_BUILDER_GROUP_MODE_ALL,
  SEARCH_BUILDER_GROUP_MODE_ANY,
  createDefaultSearchBuilderCondition,
  createDefaultSearchBuilderGroup,
  parseSearchBuilderQuery,
  serializeSearchBuilderTree,
  validateSearchBuilderTree,
} from "./query-language.js";

const SEARCH_BUILDER_MODAL_CLASS = "scryfall-search-builder-modal";
const SEARCH_BUILDER_MODAL_HIDDEN_CLASS = "is-hidden";
const SEARCH_BUILDER_MODAL_PANEL_CLASS = "scryfall-search-builder-modal__panel";
const SEARCH_BUILDER_SUGGESTION_POPUP_ID = "scryfall-search-builder-modal-suggestions";
const SEARCH_BUILDER_COLOR_FIELD_SET = new Set(
  COLOR_TRIGGER_OPERATORS.map((operator) => operator.toLowerCase()),
);
const SEARCH_BUILDER_PROPERTY_FIELD_SET = new Set(
  PROPERTY_TRIGGER_OPERATORS.map((operator) => operator.toLowerCase()),
);
const SEARCH_BUILDER_OTAG_FIELD_SET = new Set(
  OTAG_TRIGGER_OPERATORS.map((operator) => operator.toLowerCase()),
);
const SEARCH_BUILDER_TEXT_PROPERTY_ITEM = {
  display: "Free Text Search",
  searchAliases: createSearchAliases([
    SEARCH_BUILDER_TEXT_PROPERTY_VALUE,
    "free text",
    "free text search",
    "plain text",
  ]),
  token: SEARCH_BUILDER_TEXT_PROPERTY_VALUE,
};

function createButton(label, className, onClick, options = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;

  if (options.ariaLabel) {
    button.setAttribute("aria-label", options.ariaLabel);
  }

  if (options.disabled) {
    button.disabled = true;
  }

  button.addEventListener("click", onClick);
  return button;
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function renderOperatorLikeItemContent(option, item) {
  const content = document.createElement("span");
  content.className = "scryfall-otag-dropdown-popup__item-content";

  const label = document.createElement("span");
  label.className = "scryfall-otag-dropdown-popup__item-label";
  label.textContent = item.token;

  const meta = document.createElement("span");
  meta.className = "scryfall-otag-dropdown-popup__item-meta";
  meta.textContent = item.display;

  content.append(label, meta);
  option.append(content);
}

function renderOtagItemContent(option, item) {
  const content = document.createElement("span");
  content.className = "scryfall-otag-dropdown-popup__item-content";

  const label = document.createElement("span");
  label.className = "scryfall-otag-dropdown-popup__item-label";
  label.textContent = item.name;

  const meta = document.createElement("span");
  meta.className = "scryfall-otag-dropdown-popup__item-meta";
  meta.textContent = item.slug;

  content.append(label, meta);
  option.append(content);
}

function getPropertyTextItemScore(query) {
  const normalizedNeedle = normalizeSearchQuery(query);
  if (!normalizedNeedle) {
    return 1;
  }

  return getAliasMatchScore(
    SEARCH_BUILDER_TEXT_PROPERTY_ITEM.searchAliases,
    normalizedNeedle,
    compactSearchText(normalizedNeedle),
  );
}

function filterSearchBuilderPropertyItems(query) {
  const matches = filterOperatorItems(query);

  if (getPropertyTextItemScore(query) > 0) {
    return [SEARCH_BUILDER_TEXT_PROPERTY_ITEM, ...matches];
  }

  return matches;
}

function findNodeAndParent(node, nodeId, parent = null) {
  if (!node) {
    return null;
  }

  if (node.id === nodeId) {
    return {
      node,
      parent,
    };
  }

  if (node.type !== "group") {
    return null;
  }

  for (const child of node.children) {
    const match = findNodeAndParent(child, nodeId, node);
    if (match) {
      return match;
    }
  }

  return null;
}

function createUnsupportedQueryStateMessage(message) {
  return message || "This query cannot be edited in the visual builder.";
}

function getQueryStateStatusMetadata(queryState, builderValidation) {
  if (queryState.status === "invalid") {
    return {
      badgeClassName: "scryfall-search-builder-modal__status-badge is-error",
      badgeLabel: "Invalid",
      builderAvailable: false,
      message: queryState.message,
    };
  }

  if (queryState.status === "not-representable") {
    return {
      badgeClassName: "scryfall-search-builder-modal__status-badge is-warning",
      badgeLabel: "GUI Unavailable",
      builderAvailable: false,
      message: createUnsupportedQueryStateMessage(queryState.message),
    };
  }

  if (!builderValidation.isValid) {
    return {
      badgeClassName: "scryfall-search-builder-modal__status-badge is-warning",
      badgeLabel: "Incomplete",
      builderAvailable: true,
      message: builderValidation.message,
    };
  }

  return {
    badgeClassName: "scryfall-search-builder-modal__status-badge is-valid",
    badgeLabel: "Valid",
    builderAvailable: true,
    message: "The visual builder and raw query are in sync.",
  };
}

export function createSearchBuilderModal() {
  const parseOptions = {
    supportedComparators: new Set(
      SEARCH_BUILDER_COMPARATOR_OPTIONS.map((option) => option.value),
    ),
    supportedFields: SEARCH_BUILDER_PROPERTY_SET,
  };
  const autocomplete = createBrowserAutocompleteController();
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
  let suppressedSuggestionRefreshKey = null;
  const suggestionState = {
    getItemLabel: (item) => String(item),
    input: null,
    items: [],
    renderItemContent: null,
    selectItem: null,
    selectedIndex: 0,
    title: "Suggestions",
  };
  const suggestionPopup = createDropdownPopup({
    getItemLabel: (item) => suggestionState.getItemLabel(item),
    id: SEARCH_BUILDER_SUGGESTION_POPUP_ID,
    onClose: hideSuggestions,
    onHighlight: highlightSuggestion,
    onSelect: selectSuggestion,
    renderItemContent(option, item, index) {
      if (typeof suggestionState.renderItemContent === "function") {
        suggestionState.renderItemContent(option, item, index);
        return;
      }

      option.textContent = suggestionState.getItemLabel(item);
    },
    title: suggestionState.title,
  });

  function ensureMounted() {
    if (root.parentElement !== document.body) {
      document.body.append(root);
    }
  }

  function hideSuggestions() {
    suggestionPopup.hide();
    autocomplete.restore(suggestionState.input);
    suggestionState.getItemLabel = (item) => String(item);
    suggestionState.input = null;
    suggestionState.items = [];
    suggestionState.renderItemContent = null;
    suggestionState.selectItem = null;
    suggestionState.selectedIndex = 0;
    suggestionState.title = "Suggestions";
  }

  function repositionSuggestions() {
    if (!suggestionState.input || !suggestionPopup.isVisible()) {
      return;
    }

    suggestionPopup.reposition(suggestionState.input);
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

  function summarizeGroupChildren(group) {
    const nestedGroupCount = group.children.filter((child) => child.type === "group").length;
    const ruleCount = group.children.length - nestedGroupCount;
    const summary = [];

    if (ruleCount > 0) {
      summary.push(`${ruleCount} rule${ruleCount === 1 ? "" : "s"}`);
    }

    if (nestedGroupCount > 0) {
      summary.push(`${nestedGroupCount} group${nestedGroupCount === 1 ? "" : "s"}`);
    }

    return summary.length > 0 ? summary.join(", ") : "Empty group";
  }

  function getSuggestionDescriptor(input) {
    if (!input?.dataset?.conditionId || !input.dataset.suggestionKind) {
      return null;
    }

    const condition = getConditionById(input.dataset.conditionId);
    if (!condition || condition.type !== "condition") {
      return null;
    }

    if (input.dataset.suggestionKind === "property") {
      return {
        getItemLabel: (item) => item.token,
        items: filterSearchBuilderPropertyItems(input.value),
        renderItemContent: renderOperatorLikeItemContent,
        selectItem(item) {
          updateNode(condition.id, (node) => {
            if (item.token === SEARCH_BUILDER_TEXT_PROPERTY_VALUE) {
              node.kind = SEARCH_BUILDER_CONDITION_KIND_TEXT;
              node.field = "";
              node.comparator = ":";
              return;
            }

            node.kind = SEARCH_BUILDER_CONDITION_KIND_FIELD;
            node.field = item.token;
            if (!SEARCH_BUILDER_COMPARATOR_OPTIONS.some((option) => option.value === node.comparator)) {
              node.comparator = ":";
            }
          });
        },
        title: "operators",
      };
    }

    if (input.dataset.suggestionKind !== "value" || condition.kind !== SEARCH_BUILDER_CONDITION_KIND_FIELD) {
      return null;
    }

    const normalizedField = condition.field.toLowerCase();

    if (SEARCH_BUILDER_PROPERTY_FIELD_SET.has(normalizedField)) {
      return {
        getItemLabel: (item) => item.token,
        items: filterPropertyItems(input.value),
        renderItemContent: renderOperatorLikeItemContent,
        selectItem(item) {
          updateNode(condition.id, (node) => {
            node.value = item.token;
          });
        },
        title: "properties",
      };
    }

    if (SEARCH_BUILDER_COLOR_FIELD_SET.has(normalizedField)) {
      return {
        getItemLabel: (item) => item.name,
        items: filterColorItems(input.value),
        renderItemContent: renderColorItemContent,
        selectItem(item) {
          updateNode(condition.id, (node) => {
            node.value = item.code;
          });
        },
        title: "colors",
      };
    }

    if (SEARCH_BUILDER_OTAG_FIELD_SET.has(normalizedField)) {
      return {
        getItemLabel: (item) => item.name,
        items: filterOtagItems(input.value),
        renderItemContent: renderOtagItemContent,
        selectItem(item) {
          updateNode(condition.id, (node) => {
            node.value = item.name;
          });
        },
        title: "oracle tags",
      };
    }

    return null;
  }

  function refreshSuggestions(focusKey = null) {
    const input = focusKey
      ? panel.querySelector(`[data-focus-key="${focusKey}"]`)
      : document.activeElement;

    const descriptor = getSuggestionDescriptor(input);
    if (!descriptor || descriptor.items.length === 0) {
      hideSuggestions();
      return;
    }

    if (suggestionState.input !== input) {
      suggestionState.selectedIndex = 0;
    }

    suggestionState.getItemLabel = descriptor.getItemLabel;
    suggestionState.input = input;
    suggestionState.items = descriptor.items;
    suggestionState.renderItemContent = descriptor.renderItemContent;
    suggestionState.selectItem = descriptor.selectItem;
    suggestionState.title = descriptor.title;
    suggestionState.selectedIndex = Math.min(
      suggestionState.selectedIndex,
      descriptor.items.length - 1,
    );

    suggestionPopup.show({
      anchor: input,
      items: descriptor.items,
      selectedIndex: suggestionState.selectedIndex,
      titleText: descriptor.title,
    });
    autocomplete.suppress(input);
  }

  function scheduleSuggestionRefresh(focusKey) {
    window.requestAnimationFrame(() => {
      if (!state.isOpen) {
        return;
      }

      if (suppressedSuggestionRefreshKey === focusKey) {
        suppressedSuggestionRefreshKey = null;
        return;
      }

      refreshSuggestions(focusKey);
    });
  }

  function highlightSuggestion(index) {
    suggestionState.selectedIndex = index;
    if (!suggestionState.input) {
      return;
    }

    refreshSuggestions(suggestionState.input.dataset.focusKey);
  }

  function selectSuggestion(item, index) {
    suggestionState.selectedIndex = index;
    const focusKey = suggestionState.input?.dataset?.focusKey || null;
    suppressedSuggestionRefreshKey = focusKey;
    if (typeof suggestionState.selectItem === "function") {
      suggestionState.selectItem(item);
    }

    hideSuggestions();
    if (focusKey) {
      window.requestAnimationFrame(() => {
        const nextInput = panel.querySelector(`[data-focus-key="${focusKey}"]`);
        nextInput?.focus();
      });
    }
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

  function createConditionElement(condition) {
    const row = document.createElement("div");
    row.className = "scryfall-search-builder-modal__condition";

    const negationToggleLabel = document.createElement("label");
    negationToggleLabel.className = "scryfall-search-builder-modal__toggle";
    const negationToggle = document.createElement("input");
    negationToggle.type = "checkbox";
    negationToggle.checked = condition.negated === true;
    negationToggle.dataset.focusKey = `condition-negated-${condition.id}`;
    negationToggle.addEventListener("change", () => {
      updateNode(condition.id, (node) => {
        node.negated = negationToggle.checked;
      });
    });
    const negationText = document.createElement("span");
    negationText.textContent = "";
    const negationIndicator = document.createElement("span");
    negationIndicator.className = `scryfall-search-builder-modal__toggle-indicator ${
      condition.negated ? "is-negated" : "is-positive"
    }`;
    negationIndicator.textContent = condition.negated ? "-" : "+";
    negationToggleLabel.append(negationToggle, negationIndicator, negationText);

    const propertyInput = document.createElement("input");
    propertyInput.type = "text";
    propertyInput.className =
      "scryfall-search-builder-modal__input scryfall-search-builder-modal__input--property";
    propertyInput.autocomplete = "off";
    propertyInput.dataset.focusKey = `condition-property-${condition.id}`;
    propertyInput.dataset.conditionId = condition.id;
    propertyInput.dataset.suggestionKind = "property";
    propertyInput.placeholder = "Search properties";
    propertyInput.value =
      condition.kind === SEARCH_BUILDER_CONDITION_KIND_TEXT
        ? SEARCH_BUILDER_TEXT_PROPERTY_VALUE
        : getSearchBuilderPropertyDisplayValue(condition.field);
    propertyInput.addEventListener("input", () => {
      updateNode(condition.id, (node) => {
        const nextPropertyValue = resolveSearchBuilderPropertyValue(propertyInput.value);
        if (nextPropertyValue === SEARCH_BUILDER_TEXT_PROPERTY_VALUE) {
          node.kind = SEARCH_BUILDER_CONDITION_KIND_TEXT;
          node.field = "";
          node.comparator = ":";
          return;
        }

        node.kind = SEARCH_BUILDER_CONDITION_KIND_FIELD;
        node.field = nextPropertyValue;
        if (!SEARCH_BUILDER_COMPARATOR_OPTIONS.some((option) => option.value === node.comparator)) {
          node.comparator = ":";
        }
      });
      scheduleSuggestionRefresh(propertyInput.dataset.focusKey);
    });
    propertyInput.addEventListener("focus", () => {
      refreshSuggestions(propertyInput.dataset.focusKey);
    });

    const comparatorSelect = document.createElement("select");
    comparatorSelect.className = "scryfall-search-builder-modal__select";
    comparatorSelect.dataset.focusKey = `condition-comparator-${condition.id}`;
    SEARCH_BUILDER_COMPARATOR_OPTIONS.forEach((option) => {
      comparatorSelect.append(createOption(option.value, option.label));
    });
    comparatorSelect.value = condition.comparator || ":";
    comparatorSelect.disabled = condition.kind !== SEARCH_BUILDER_CONDITION_KIND_FIELD;
    comparatorSelect.addEventListener("change", () => {
      updateNode(condition.id, (node) => {
        node.comparator = comparatorSelect.value;
      });
    });

    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.className = "scryfall-search-builder-modal__input";
    valueInput.autocomplete = "off";
    valueInput.value = condition.value;
    valueInput.placeholder =
      condition.kind === SEARCH_BUILDER_CONDITION_KIND_TEXT
        ? "Search term"
        : "Value";
    valueInput.dataset.focusKey = `condition-value-${condition.id}`;
    valueInput.dataset.conditionId = condition.id;
    valueInput.dataset.suggestionKind = "value";
    valueInput.addEventListener("input", () => {
      updateNode(condition.id, (node) => {
        node.value = valueInput.value;
      });
      scheduleSuggestionRefresh(valueInput.dataset.focusKey);
    });
    valueInput.addEventListener("focus", () => {
      refreshSuggestions(valueInput.dataset.focusKey);
    });

    const removeButton = createButton(
      "Remove",
      "scryfall-search-builder-modal__ghost-button",
      () => removeNode(condition.id),
      {
        ariaLabel: "Remove rule",
      },
    );

    row.append(
      negationToggleLabel,
      propertyInput,
      comparatorSelect,
      valueInput,
      removeButton,
    );

    return row;
  }

  function createGroupElement(group, depth = 0, isRoot = false) {
    const collapsed = isGroupCollapsed(group.id);
    const section = document.createElement("section");
    section.className = "scryfall-search-builder-modal__group";
    if (collapsed) {
      section.classList.add("is-collapsed");
    }
    section.style.setProperty("--scryfall-search-builder-group-depth", String(depth));

    const header = document.createElement("div");
    header.className = "scryfall-search-builder-modal__group-header";

    const heading = document.createElement("div");
    heading.className = "scryfall-search-builder-modal__group-heading";

    const collapseButton = createButton(
      collapsed ? "Expand" : "Collapse",
      "scryfall-search-builder-modal__collapse-button",
      () => toggleGroupCollapsed(group.id),
      {
        ariaLabel: collapsed ? "Expand group" : "Collapse group",
      },
    );
    collapseButton.dataset.focusKey = `group-collapse-${group.id}`;

    const headingLabel = document.createElement("span");
    headingLabel.className = "scryfall-search-builder-modal__group-label";
    headingLabel.textContent = isRoot ? "Root group" : "Nested group";

    const modeSelect = document.createElement("select");
    modeSelect.className = "scryfall-search-builder-modal__select";
    modeSelect.dataset.focusKey = `group-mode-${group.id}`;
    modeSelect.append(
      createOption(SEARCH_BUILDER_GROUP_MODE_ALL, "Match all"),
      createOption(SEARCH_BUILDER_GROUP_MODE_ANY, "Match any"),
    );
    modeSelect.value = group.mode;
    modeSelect.addEventListener("change", () => {
      updateNode(group.id, (node) => {
        node.mode = modeSelect.value;
      });
    });

    heading.append(collapseButton, headingLabel, modeSelect);
    header.append(heading);

    if (!isRoot) {
      header.append(
        createButton(
          "Remove group",
          "scryfall-search-builder-modal__ghost-button",
          () => removeNode(group.id),
        ),
      );
    }

    section.append(header);

    if (collapsed) {
      const summary = document.createElement("div");
      summary.className = "scryfall-search-builder-modal__group-summary";
      summary.textContent = summarizeGroupChildren(group);
      section.append(summary);
    }

    const body = document.createElement("div");
    body.className = "scryfall-search-builder-modal__group-body";

    if (group.children.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "scryfall-search-builder-modal__empty-group";
      emptyState.textContent = "No rules yet. Add a rule or nested group.";
      body.append(emptyState);
    } else {
      group.children.forEach((child) => {
        body.append(
          child.type === "group"
            ? createGroupElement(child, depth + 1, false)
            : createConditionElement(child),
        );
      });
    }

    if (!collapsed) {
      section.append(body);
    }

    const footer = document.createElement("div");
    footer.className = "scryfall-search-builder-modal__group-footer";
    footer.append(
      createButton("Add rule", "scryfall-search-builder-modal__secondary-button", () => {
        updateNode(group.id, (node) => {
          node.children.push(createDefaultSearchBuilderCondition());
        });
      }),
      createButton("Add group", "scryfall-search-builder-modal__secondary-button", () => {
        updateNode(group.id, (node) => {
          node.children.push(createDefaultSearchBuilderGroup());
        });
      }),
    );

    if (!collapsed) {
      section.append(footer);
    }
    return section;
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
    validationRow.className = "scryfall-search-builder-modal__validation";

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
      createButton("Clear all", "scryfall-search-builder-modal__ghost-button", () => {
        updateRawQuery("");
      }),
      createButton("Close", "scryfall-search-builder-modal__ghost-button", () => close()),
      createButton("Search", "scryfall-search-builder-modal__primary-button", () => {
        search();
      }),
    );

    header.append(titleBlock, headerActions);
    nextPanelChildren.push(header);

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

    rawSection.append(rawHeading, rawInput);
    nextPanelChildren.push(rawSection);

    const visualSection = document.createElement("section");
    visualSection.className = "scryfall-search-builder-modal__section";

    const visualHeading = document.createElement("div");
    visualHeading.className = "scryfall-search-builder-modal__section-heading";
    visualHeading.textContent = "Visual builder";
    visualSection.append(visualHeading);

    if (status.builderAvailable) {
      visualSection.append(createGroupElement(getBuilderTree(), 0, true));
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
    if (focusState?.focusKey?.startsWith("condition-")) {
      scheduleSuggestionRefresh(focusState.focusKey);
    } else {
      hideSuggestions();
    }
  }

  function onKeyDown(event) {
    if (!state.isOpen) {
      return;
    }

    if (suggestionState.input && event.target === suggestionState.input) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        suggestionState.selectedIndex =
          (suggestionState.selectedIndex + 1) % suggestionState.items.length;
        refreshSuggestions(suggestionState.input.dataset.focusKey);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        suggestionState.selectedIndex =
          (suggestionState.selectedIndex - 1 + suggestionState.items.length) %
          suggestionState.items.length;
        refreshSuggestions(suggestionState.input.dataset.focusKey);
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        if (suggestionState.items.length > 0) {
          event.preventDefault();
          selectSuggestion(
            suggestionState.items[suggestionState.selectedIndex],
            suggestionState.selectedIndex,
          );
          return;
        }
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      if (suggestionState.input) {
        hideSuggestions();
        return;
      }

      close();
    }
  }

  function onDocumentPointerDown(event) {
    if (!state.isOpen || !suggestionState.input) {
      return;
    }

    if (suggestionPopup.contains(event.target)) {
      return;
    }

    if (event.target === suggestionState.input) {
      return;
    }

    hideSuggestions();
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
    root.classList.remove(SEARCH_BUILDER_MODAL_HIDDEN_CLASS);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("mousedown", onDocumentPointerDown, true);
    window.addEventListener("resize", repositionSuggestions);
    panel.addEventListener("scroll", repositionSuggestions, true);
    render();

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

    hideSuggestions();
    state.isOpen = false;
    root.classList.add(SEARCH_BUILDER_MODAL_HIDDEN_CLASS);
    document.removeEventListener("keydown", onKeyDown, true);
    document.removeEventListener("mousedown", onDocumentPointerDown, true);
    window.removeEventListener("resize", repositionSuggestions);
    panel.removeEventListener("scroll", repositionSuggestions, true);

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
      suggestionPopup.destroy();
      root.remove();
    },
    open,
  };
}
