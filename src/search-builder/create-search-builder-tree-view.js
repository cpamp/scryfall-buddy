import {
  SEARCH_BUILDER_COMPARATOR_OPTIONS,
  SEARCH_BUILDER_TEXT_PROPERTY_VALUE,
  getSearchBuilderPropertyDisplayValue,
  resolveSearchBuilderPropertyValue,
} from "./config.js";
import { createButton, createActionLink, createOption } from "./dom.js";
import {
  SEARCH_BUILDER_CONDITION_KIND_FIELD,
  SEARCH_BUILDER_CONDITION_KIND_TEXT,
  SEARCH_BUILDER_GROUP_MODE_ALL,
  SEARCH_BUILDER_GROUP_MODE_ANY,
  createDefaultSearchBuilderCondition,
  createDefaultSearchBuilderGroup,
} from "./query-language.js";

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

export function createSearchBuilderTreeElement({
  group,
  isGroupCollapsed,
  onRefreshSuggestions,
  onRemoveNode,
  onScheduleSuggestionRefresh,
  onToggleGroupCollapsed,
  onUpdateNode,
}) {
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
      onUpdateNode(condition.id, (node) => {
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
      onUpdateNode(condition.id, (node) => {
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
      onScheduleSuggestionRefresh(propertyInput.dataset.focusKey);
    });
    propertyInput.addEventListener("focus", () => {
      onRefreshSuggestions(propertyInput.dataset.focusKey);
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
      onUpdateNode(condition.id, (node) => {
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
      onUpdateNode(condition.id, (node) => {
        node.value = valueInput.value;
      });
      onScheduleSuggestionRefresh(valueInput.dataset.focusKey);
    });
    valueInput.addEventListener("focus", () => {
      onRefreshSuggestions(valueInput.dataset.focusKey);
    });

    const removeButton = createButton(
      "Remove",
      "scryfall-search-builder-modal__ghost-button",
      () => onRemoveNode(condition.id),
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

  function createGroupElement(currentGroup, depth = 0, isRoot = false) {
    const collapsed = isGroupCollapsed(currentGroup.id);
    const section = document.createElement("section");
    section.className = "scryfall-search-builder-modal__group";
    if (collapsed) {
      section.classList.add("is-collapsed");
    }
    section.style.setProperty("--scryfall-search-builder-group-depth", String(depth));
    section.style.setProperty(
      "--scryfall-search-builder-group-depth-mobile",
      String(Math.min(depth, 2)),
    );

    const header = document.createElement("div");
    header.className = "scryfall-search-builder-modal__group-header";

    const heading = document.createElement("div");
    heading.className = "scryfall-search-builder-modal__group-heading";

    const groupTitleLink = createActionLink(
      isRoot ? "Root group" : "Nested group",
      "scryfall-search-builder-modal__collapse-link scryfall-search-builder-modal__group-title-link",
      () => onToggleGroupCollapsed(currentGroup.id),
      {
        ariaLabel: collapsed ? "Expand group" : "Collapse group",
        ariaExpanded: !collapsed,
      },
    );
    groupTitleLink.dataset.focusKey = `group-collapse-${currentGroup.id}`;

    const groupLevel = document.createElement("span");
    groupLevel.className = "scryfall-search-builder-modal__group-level";
    groupLevel.textContent = `Level ${depth}`;

    const modeSelect = document.createElement("select");
    modeSelect.className = "scryfall-search-builder-modal__select";
    modeSelect.dataset.focusKey = `group-mode-${currentGroup.id}`;
    modeSelect.append(
      createOption(SEARCH_BUILDER_GROUP_MODE_ALL, "Match all"),
      createOption(SEARCH_BUILDER_GROUP_MODE_ANY, "Match any"),
    );
    modeSelect.value = currentGroup.mode;
    modeSelect.addEventListener("change", () => {
      onUpdateNode(currentGroup.id, (node) => {
        node.mode = modeSelect.value;
      });
    });

    heading.append(groupTitleLink, groupLevel, modeSelect);
    header.append(heading);

    if (!isRoot) {
      header.append(
        createButton(
          "Remove group",
          "scryfall-search-builder-modal__ghost-button",
          () => onRemoveNode(currentGroup.id),
        ),
      );
    }

    section.append(header);

    if (collapsed) {
      const summary = document.createElement("div");
      summary.className = "scryfall-search-builder-modal__group-summary";
      summary.textContent = summarizeGroupChildren(currentGroup);
      section.append(summary);
    }

    const body = document.createElement("div");
    body.className = "scryfall-search-builder-modal__group-body";

    if (currentGroup.children.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "scryfall-search-builder-modal__empty-group";
      emptyState.textContent = "No rules yet. Add a rule or nested group.";
      body.append(emptyState);
    } else {
      currentGroup.children.forEach((child) => {
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
        onUpdateNode(currentGroup.id, (node) => {
          node.children.push(createDefaultSearchBuilderCondition());
        });
      }),
      createButton("Add group", "scryfall-search-builder-modal__secondary-button", () => {
        onUpdateNode(currentGroup.id, (node) => {
          node.children.push(createDefaultSearchBuilderGroup());
        });
      }),
    );

    if (!collapsed) {
      section.append(footer);
    }

    return section;
  }

  return createGroupElement(group, 0, true);
}
