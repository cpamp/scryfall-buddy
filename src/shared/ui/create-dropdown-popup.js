import { ensureDocumentStyleSheet } from "./ensure-document-style-sheet.js";

const DROPDOWN_POPUP_STYLE_KEY = "scryfall-otag-dropdown-popup";
const DROPDOWN_POPUP_CLASS = "scryfall-otag-dropdown-popup";
const DROPDOWN_POPUP_HIDDEN_CLASS = "is-hidden";
const DROPDOWN_POPUP_HEADER_CLASS = "scryfall-otag-dropdown-popup__header";
const DROPDOWN_POPUP_LABEL_CLASS = "scryfall-otag-dropdown-popup__label";
const DROPDOWN_POPUP_CLOSE_CLASS = "scryfall-otag-dropdown-popup__close";
const DROPDOWN_POPUP_ITEM_CLASS = "scryfall-otag-dropdown-popup__item";
const DROPDOWN_POPUP_ITEM_SELECTED_CLASS = "is-selected";

function escapeCssIdentifier(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function ensureDropdownPopupStyles() {
  ensureDocumentStyleSheet(
    DROPDOWN_POPUP_STYLE_KEY,
    `
.${DROPDOWN_POPUP_CLASS} {
  position: fixed;
  z-index: 2147483647;
  min-width: 260px;
  max-width: 420px;
  max-height: 240px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
  font: 14px/1.4 system-ui, sans-serif;
  color: #111;
}

.${DROPDOWN_POPUP_CLASS}.${DROPDOWN_POPUP_HIDDEN_CLASS} {
  display: none;
}

.${DROPDOWN_POPUP_HEADER_CLASS} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 8px 8px;
}

.${DROPDOWN_POPUP_LABEL_CLASS} {
  font-size: 12px;
  color: #555;
}

.${DROPDOWN_POPUP_CLOSE_CLASS} {
  border: 0;
  border-radius: 999px;
  padding: 4px 8px;
  background: #efefef;
  color: #333;
  font-size: 12px;
  cursor: pointer;
}

.${DROPDOWN_POPUP_ITEM_CLASS} {
  display: block;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  text-align: left;
  background: transparent;
  color: #111;
  cursor: pointer;
}

.${DROPDOWN_POPUP_ITEM_CLASS}.${DROPDOWN_POPUP_ITEM_SELECTED_CLASS} {
  background: #e8f0fe;
}
    `.trim(),
  );
}

function createPositionController(id) {
  return ensureDocumentStyleSheet(
    `${DROPDOWN_POPUP_STYLE_KEY}-${id}`,
    `#${escapeCssIdentifier(id)} { left: 8px; top: 8px; width: 260px; }`,
  );
}

function createRoot(id) {
  ensureDropdownPopupStyles();
  const root = document.createElement("div");
  root.id = id;
  root.className = `${DROPDOWN_POPUP_CLASS} ${DROPDOWN_POPUP_HIDDEN_CLASS}`;
  document.body.appendChild(root);
  return root;
}

function positionRoot(root, anchor, positionController) {
  const rect = anchor.getBoundingClientRect();
  const left = Math.max(8, rect.left);
  const top = Math.min(window.innerHeight - 8, rect.bottom + 6);
  const width = Math.min(Math.max(rect.width, 260), 420);

  positionController.update(
    `#${escapeCssIdentifier(root.id)} { left: ${left}px; top: ${top}px; width: ${width}px; }`,
  );
}

export function createDropdownPopup({
  closeButtonLabel = "Close",
  getItemLabel = (item) => String(item),
  id,
  onClose,
  onHighlight,
  onSelect,
  title,
}) {
  const root = createRoot(id);
  const positionController = createPositionController(id);

  function hide() {
    root.classList.add(DROPDOWN_POPUP_HIDDEN_CLASS);
    root.innerHTML = "";
  }

  function renderHeader(titleText) {
    const header = document.createElement("div");
    header.className = DROPDOWN_POPUP_HEADER_CLASS;

    const label = document.createElement("div");
    label.textContent = titleText;
    label.className = DROPDOWN_POPUP_LABEL_CLASS;
    header.appendChild(label);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = closeButtonLabel;
    closeButton.className = DROPDOWN_POPUP_CLOSE_CLASS;
    closeButton.addEventListener("mousedown", (event) => {
      event.preventDefault();
      onClose();
    });

    header.appendChild(closeButton);
    root.appendChild(header);
  }

  function renderItems(items, selectedIndex) {
    items.forEach((item, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.textContent = getItemLabel(item);
      option.className = DROPDOWN_POPUP_ITEM_CLASS;
      if (index === selectedIndex) {
        option.classList.add(DROPDOWN_POPUP_ITEM_SELECTED_CLASS);
      }

      option.addEventListener("mousedown", (event) => {
        event.preventDefault();
        onSelect(item, index);
      });

      option.addEventListener("mouseenter", () => {
        onHighlight(index);
      });

      root.appendChild(option);
    });
  }

  function show({ anchor, items, selectedIndex, titleText = title }) {
    if (!anchor || items.length === 0) {
      hide();
      return;
    }

    positionRoot(root, anchor, positionController);
    root.classList.remove(DROPDOWN_POPUP_HIDDEN_CLASS);
    root.innerHTML = "";
    renderHeader(titleText);
    renderItems(items, selectedIndex);
  }

  return {
    contains(target) {
      return root.contains(target);
    },
    destroy() {
      hide();
      positionController.destroy();
      if (root.isConnected) {
        root.remove();
      }
    },
    hide,
    isVisible() {
      return !root.classList.contains(DROPDOWN_POPUP_HIDDEN_CLASS);
    },
    reposition(anchor) {
      if (!anchor || root.classList.contains(DROPDOWN_POPUP_HIDDEN_CLASS)) {
        return;
      }

      positionRoot(root, anchor, positionController);
    },
    show,
  };
}
