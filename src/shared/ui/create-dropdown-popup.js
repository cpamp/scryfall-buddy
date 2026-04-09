import { createDropdownThemeToggleButton } from "./dropdown-theme.js";

const DROPDOWN_POPUP_CLASS = "scryfall-otag-dropdown-popup";
const DROPDOWN_POPUP_HIDDEN_CLASS = "is-hidden";
const DROPDOWN_POPUP_HEADER_CLASS = "scryfall-otag-dropdown-popup__header";
const DROPDOWN_POPUP_LABEL_CLASS = "scryfall-otag-dropdown-popup__label";
const DROPDOWN_POPUP_ACTIONS_CLASS = "scryfall-otag-dropdown-popup__actions";
const DROPDOWN_POPUP_CLOSE_CLASS = "scryfall-otag-dropdown-popup__close";
const DROPDOWN_POPUP_ITEM_CLASS = "scryfall-otag-dropdown-popup__item";
const DROPDOWN_POPUP_ITEM_SELECTED_CLASS = "is-selected";
const DROPDOWN_POPUP_GAP_PX = 6;
const DROPDOWN_POPUP_VIEWPORT_MARGIN_PX = 12;
const DROPDOWN_POPUP_MIN_WIDTH_PX = 260;
const DROPDOWN_POPUP_MAX_WIDTH_PX = 420;

function createRoot(id) {
  const root = document.createElement("div");
  root.id = id;
  root.className = `${DROPDOWN_POPUP_CLASS} ${DROPDOWN_POPUP_HIDDEN_CLASS}`;
  root.setAttribute("role", "listbox");
  return root;
}

function replaceChildren(node, children = []) {
  node.replaceChildren(...children);
}

export function createDropdownPopup({
  closeButtonLabel = "Close",
  getItemLabel = (item) => String(item),
  id,
  onClose,
  onHighlight,
  onSelect,
  renderItemContent,
  title,
}) {
  const root = createRoot(id);
  let renderedItems = [];
  let selectedItemIndex = 0;

  function position(anchorElement) {
    if (!anchorElement) {
      return;
    }

    const rect = anchorElement.getBoundingClientRect();
    const maxWidth = Math.max(
      DROPDOWN_POPUP_MIN_WIDTH_PX,
      Math.min(
        DROPDOWN_POPUP_MAX_WIDTH_PX,
        window.innerWidth - DROPDOWN_POPUP_VIEWPORT_MARGIN_PX * 2,
      ),
    );
    const width = Math.min(maxWidth, Math.max(rect.width, DROPDOWN_POPUP_MIN_WIDTH_PX));
    const left = Math.min(
      Math.max(DROPDOWN_POPUP_VIEWPORT_MARGIN_PX, rect.left),
      Math.max(
        DROPDOWN_POPUP_VIEWPORT_MARGIN_PX,
        window.innerWidth - width - DROPDOWN_POPUP_VIEWPORT_MARGIN_PX,
      ),
    );
    const top = Math.min(
      rect.bottom + DROPDOWN_POPUP_GAP_PX,
      window.innerHeight - DROPDOWN_POPUP_VIEWPORT_MARGIN_PX,
    );

    root.style.left = `${left}px`;
    root.style.top = `${top}px`;
    root.style.width = `${width}px`;
  }

  function detach() {
    if (root.parentElement) {
      root.remove();
    }
  }

  function hide() {
    root.classList.add(DROPDOWN_POPUP_HIDDEN_CLASS);
    renderedItems = [];
    selectedItemIndex = 0;
    replaceChildren(root);
    detach();
  }

  function updateSelectedItem(index) {
    renderedItems.forEach((item, itemIndex) => {
      item.classList.toggle(
        DROPDOWN_POPUP_ITEM_SELECTED_CLASS,
        itemIndex === index,
      );
    });
    selectedItemIndex = index;
    renderedItems[index]?.scrollIntoView({
      block: "nearest",
    });
  }

  function renderHeader(titleText) {
    const header = document.createElement("div");
    header.className = DROPDOWN_POPUP_HEADER_CLASS;

    const label = document.createElement("div");
    label.textContent = titleText;
    label.className = DROPDOWN_POPUP_LABEL_CLASS;
    header.appendChild(label);

    const actions = document.createElement("div");
    actions.className = DROPDOWN_POPUP_ACTIONS_CLASS;
    actions.appendChild(createDropdownThemeToggleButton());

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = closeButtonLabel;
    closeButton.className = DROPDOWN_POPUP_CLOSE_CLASS;
    closeButton.addEventListener("mousedown", (event) => {
      event.preventDefault();
      onClose();
    });

    actions.appendChild(closeButton);
    header.appendChild(actions);
    return header;
  }

  function renderItems(items, selectedIndex) {
    return items.map((item, index) => {
      const option = document.createElement("button");
      let selectedOnPointerDown = false;
      option.type = "button";
      option.setAttribute("aria-label", getItemLabel(item));
      option.className = DROPDOWN_POPUP_ITEM_CLASS;
      if (index === selectedIndex) {
        option.classList.add(DROPDOWN_POPUP_ITEM_SELECTED_CLASS);
      }

      if (typeof renderItemContent === "function") {
        renderItemContent(option, item, index);
      } else {
        option.textContent = getItemLabel(item);
      }

      option.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) {
          return;
        }

        event.preventDefault();
        selectedOnPointerDown = true;
        onSelect(item, index, "pointerdown");
      });

      option.addEventListener("click", (event) => {
        event.preventDefault();
        if (selectedOnPointerDown) {
          selectedOnPointerDown = false;
          return;
        }

        onSelect(item, index, "click");
      });

      option.addEventListener("mouseenter", () => {
        onHighlight(index);
      });

      return option;
    });
  }

  function show({ anchor: anchorElement, items, selectedIndex, titleText = title }) {
    if (!anchorElement || items.length === 0) {
      hide();
      return;
    }

    if (root.parentElement !== document.body) {
      document.body.append(root);
    }

    position(anchorElement);
    root.classList.remove(DROPDOWN_POPUP_HIDDEN_CLASS);
    root.setAttribute("aria-label", titleText);
    renderedItems = renderItems(items, selectedIndex);
    replaceChildren(root, [renderHeader(titleText), ...renderedItems]);
    updateSelectedItem(selectedIndex);
  }

  return {
    contains(target) {
      return root.contains(target);
    },
    destroy() {
      hide();
      root.remove();
    },
    hide,
    isVisible() {
      return !root.classList.contains(DROPDOWN_POPUP_HIDDEN_CLASS);
    },
    reposition(anchor) {
      if (!anchor || root.classList.contains(DROPDOWN_POPUP_HIDDEN_CLASS)) {
        return;
      }

      position(anchor);
    },
    setSelectedIndex(index) {
      if (renderedItems.length === 0 || index === selectedItemIndex) {
        return;
      }

      updateSelectedItem(index);
    },
    show,
  };
}
