function createRoot(id) {
  const root = document.createElement("div");
  root.id = id;
  root.style.cssText = [
    "position: fixed",
    "display: none",
    "z-index: 2147483647",
    "min-width: 260px",
    "max-width: 420px",
    "max-height: 240px",
    "overflow-y: auto",
    "padding: 6px",
    "border: 1px solid rgba(0,0,0,0.18)",
    "border-radius: 10px",
    "background: #fff",
    "box-shadow: 0 12px 30px rgba(0,0,0,0.18)",
    "font: 14px/1.4 system-ui, sans-serif",
    "color: #111",
  ].join("; ");
  document.body.appendChild(root);
  return root;
}

function positionRoot(root, anchor) {
  const rect = anchor.getBoundingClientRect();
  root.style.left = `${Math.max(8, rect.left)}px`;
  root.style.top = `${Math.min(window.innerHeight - 8, rect.bottom + 6)}px`;
  root.style.width = `${Math.min(Math.max(rect.width, 260), 420)}px`;
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

  function hide() {
    root.style.display = "none";
    root.innerHTML = "";
  }

  function renderHeader(titleText) {
    const header = document.createElement("div");
    header.style.cssText = [
      "display: flex",
      "align-items: center",
      "justify-content: space-between",
      "gap: 12px",
      "padding: 4px 8px 8px",
    ].join("; ");

    const label = document.createElement("div");
    label.textContent = titleText;
    label.style.cssText = "font-size: 12px; color: #555;";
    header.appendChild(label);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = closeButtonLabel;
    closeButton.style.cssText = [
      "border: 0",
      "border-radius: 999px",
      "padding: 4px 8px",
      "background: #efefef",
      "color: #333",
      "font-size: 12px",
      "cursor: pointer",
    ].join("; ");
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
      option.style.cssText = [
        "display: block",
        "width: 100%",
        "padding: 8px 10px",
        "border: 0",
        "border-radius: 8px",
        "text-align: left",
        "background: " + (index === selectedIndex ? "#e8f0fe" : "transparent"),
        "color: #111",
        "cursor: pointer",
      ].join("; ");

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

    positionRoot(root, anchor);
    root.style.display = "block";
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
      if (root.isConnected) {
        root.remove();
      }
    },
    hide,
    isVisible() {
      return root.style.display !== "none";
    },
    reposition(anchor) {
      if (!anchor || root.style.display === "none") {
        return;
      }

      positionRoot(root, anchor);
    },
    show,
  };
}
