import { filterColorItems } from "../color/filter-color-items.js";
import { COLOR_TRIGGER_OPERATORS } from "../color/constants.js";
import { renderColorItemContent } from "../color-dropdown/config.js";
import { filterOperatorItems } from "../operator/filter-operator-items.js";
import { OTAG_TRIGGER_OPERATORS } from "../otag/constants.js";
import { filterOtagItems } from "../otag/filter-otag-items.js";
import { filterPropertyItems } from "../property/filter-property-items.js";
import { PROPERTY_TRIGGER_OPERATORS } from "../property/constants.js";
import { createBrowserAutocompleteController } from "../shared/autocomplete/create-browser-autocomplete-controller.js";
import { renderNameSlugItemContent, renderTokenMetaItemContent } from "../shared/dropdown/render-item-content.js";
import {
  compactSearchText,
  createSearchAliases,
  getAliasMatchScore,
  normalizeSearchQuery,
} from "../shared/search/text-match.js";
import { createDropdownPopup } from "../shared/ui/create-dropdown-popup.js";
import {
  SEARCH_BUILDER_COMPARATOR_OPTIONS,
  SEARCH_BUILDER_TEXT_PROPERTY_VALUE,
} from "./config.js";
import {
  SEARCH_BUILDER_CONDITION_KIND_FIELD,
  SEARCH_BUILDER_CONDITION_KIND_TEXT,
} from "./query-language.js";

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

export function createSearchBuilderSuggestionsController({
  getConditionById,
  isOpen,
  panel,
  popupId,
  updateNode,
}) {
  const autocomplete = createBrowserAutocompleteController();
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
    id: popupId,
    onClose: hide,
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
        renderItemContent: renderTokenMetaItemContent,
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

    if (
      input.dataset.suggestionKind !== "value" ||
      condition.kind !== SEARCH_BUILDER_CONDITION_KIND_FIELD
    ) {
      return null;
    }

    const normalizedField = condition.field.toLowerCase();

    if (SEARCH_BUILDER_PROPERTY_FIELD_SET.has(normalizedField)) {
      return {
        getItemLabel: (item) => item.token,
        items: filterPropertyItems(input.value),
        renderItemContent: renderTokenMetaItemContent,
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
        renderItemContent: renderNameSlugItemContent,
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

  function hide() {
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

  function reposition() {
    if (!suggestionState.input || !suggestionPopup.isVisible()) {
      return;
    }

    suggestionPopup.reposition(suggestionState.input);
  }

  function refresh(focusKey = null) {
    const input = focusKey
      ? panel.querySelector(`[data-focus-key="${focusKey}"]`)
      : document.activeElement;

    const descriptor = getSuggestionDescriptor(input);
    if (!descriptor || descriptor.items.length === 0) {
      hide();
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

  function scheduleRefresh(focusKey) {
    window.requestAnimationFrame(() => {
      if (!isOpen()) {
        return;
      }

      if (suppressedSuggestionRefreshKey === focusKey) {
        suppressedSuggestionRefreshKey = null;
        return;
      }

      refresh(focusKey);
    });
  }

  function highlightSuggestion(index) {
    suggestionState.selectedIndex = index;
    suggestionPopup.setSelectedIndex(index);
  }

  function selectSuggestion(item, index) {
    suggestionState.selectedIndex = index;
    const focusKey = suggestionState.input?.dataset?.focusKey || null;
    suppressedSuggestionRefreshKey = focusKey;
    if (typeof suggestionState.selectItem === "function") {
      suggestionState.selectItem(item);
    }

    hide();
    if (focusKey) {
      window.requestAnimationFrame(() => {
        const nextInput = panel.querySelector(`[data-focus-key="${focusKey}"]`);
        nextInput?.focus();
      });
    }
  }

  function handleKeyDown(event) {
    if (suggestionState.input && event.target === suggestionState.input) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        suggestionState.selectedIndex =
          (suggestionState.selectedIndex + 1) % suggestionState.items.length;
        refresh(suggestionState.input.dataset.focusKey);
        return true;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        suggestionState.selectedIndex =
          (suggestionState.selectedIndex - 1 + suggestionState.items.length) %
          suggestionState.items.length;
        refresh(suggestionState.input.dataset.focusKey);
        return true;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        if (suggestionState.items.length > 0) {
          event.preventDefault();
          selectSuggestion(
            suggestionState.items[suggestionState.selectedIndex],
            suggestionState.selectedIndex,
          );
          return true;
        }
      }
    }

    if (event.key === "Escape" && suggestionState.input) {
      event.preventDefault();
      hide();
      return true;
    }

    return false;
  }

  function handleDocumentPointerDown(event) {
    if (!isOpen() || !suggestionState.input) {
      return;
    }

    if (suggestionPopup.contains(event.target)) {
      return;
    }

    if (event.target === suggestionState.input) {
      return;
    }

    hide();
  }

  return {
    destroy() {
      hide();
      suggestionPopup.destroy();
    },
    handleDocumentPointerDown,
    handleKeyDown,
    hide,
    refresh,
    reposition,
    scheduleRefresh,
  };
}
