const DROPDOWN_THEME_ATTRIBUTE_NAME = "data-scryfall-plugin-dropdown-theme";
const DROPDOWN_THEME_STORAGE_KEY = "scryfall-plugin-dropdown-theme";
const DROPDOWN_THEME_TOGGLE_CLASS = "scryfall-plugin-dropdown-theme-toggle";
const DROPDOWN_THEME_DARK = "dark";
const DROPDOWN_THEME_LIGHT = "light";

function readStoredTheme() {
  try {
    const value = window.localStorage.getItem(DROPDOWN_THEME_STORAGE_KEY);
    return value === DROPDOWN_THEME_DARK || value === DROPDOWN_THEME_LIGHT
      ? value
      : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme) {
  try {
    window.localStorage.setItem(DROPDOWN_THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures in restricted browser contexts.
  }
}

function resolveInitialTheme() {
  const storedTheme = readStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? DROPDOWN_THEME_DARK
    : DROPDOWN_THEME_LIGHT;
}

function updateThemeToggleButton(button, theme = getActiveDropdownTheme()) {
  const darkModeEnabled = theme === DROPDOWN_THEME_DARK;
  button.textContent = darkModeEnabled ? "Dark" : "Light";
  button.setAttribute("aria-pressed", darkModeEnabled ? "true" : "false");
  button.setAttribute(
    "aria-label",
    darkModeEnabled
      ? "Disable dark mode for plugin dropdowns"
      : "Enable dark mode for plugin dropdowns",
  );
  button.title = darkModeEnabled
    ? "Disable dark mode for plugin dropdowns"
    : "Enable dark mode for plugin dropdowns";
}

function syncThemeToggleButtons(theme = getActiveDropdownTheme()) {
  document
    .querySelectorAll(`.${DROPDOWN_THEME_TOGGLE_CLASS}`)
    .forEach((button) => updateThemeToggleButton(button, theme));
}

export function initializeDropdownTheme() {
  if (document.documentElement.hasAttribute(DROPDOWN_THEME_ATTRIBUTE_NAME)) {
    return;
  }

  document.documentElement.setAttribute(
    DROPDOWN_THEME_ATTRIBUTE_NAME,
    resolveInitialTheme(),
  );
}

export function getActiveDropdownTheme() {
  initializeDropdownTheme();
  return document.documentElement.getAttribute(DROPDOWN_THEME_ATTRIBUTE_NAME) ===
    DROPDOWN_THEME_DARK
    ? DROPDOWN_THEME_DARK
    : DROPDOWN_THEME_LIGHT;
}

export function toggleDropdownTheme() {
  const nextTheme =
    getActiveDropdownTheme() === DROPDOWN_THEME_DARK
      ? DROPDOWN_THEME_LIGHT
      : DROPDOWN_THEME_DARK;

  document.documentElement.setAttribute(DROPDOWN_THEME_ATTRIBUTE_NAME, nextTheme);
  writeStoredTheme(nextTheme);
  syncThemeToggleButtons(nextTheme);

  return nextTheme;
}

export function createDropdownThemeToggleButton() {
  initializeDropdownTheme();

  const button = document.createElement("button");
  button.type = "button";
  button.className = DROPDOWN_THEME_TOGGLE_CLASS;
  updateThemeToggleButton(button);

  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  button.addEventListener("click", () => {
    toggleDropdownTheme();
  });

  return button;
}
