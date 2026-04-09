export function createButton(label, className, onClick, options = {}) {
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

export function createActionLink(label, className, onClick, options = {}) {
  const link = document.createElement("a");
  link.href = "#";
  link.className = className;
  link.textContent = label;

  if (options.ariaLabel) {
    link.setAttribute("aria-label", options.ariaLabel);
  }

  if (options.ariaExpanded === true || options.ariaExpanded === false) {
    link.setAttribute("aria-expanded", options.ariaExpanded ? "true" : "false");
  }

  link.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  link.addEventListener("click", (event) => {
    event.preventDefault();
    onClick(event);
  });

  return link;
}

export function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}
