const THEME_ATTRIBUTE_NAME = "data-scryfall-plugin-theme";
const THEME_STORAGE_KEY = "scryfall-plugin-theme";
const THEME_TOGGLE_CLASS = "scryfall-plugin-theme-toggle";
const THEME_DARK = "dark";
const THEME_LIGHT = "light";

function readStoredTheme() {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === THEME_DARK || value === THEME_LIGHT ? value : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
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
    ? THEME_DARK
    : THEME_LIGHT;
}

function getActiveTheme() {
  return document.documentElement.getAttribute(THEME_ATTRIBUTE_NAME) === THEME_DARK
    ? THEME_DARK
    : THEME_LIGHT;
}

function applyTheme(theme) {
  document.documentElement.setAttribute(THEME_ATTRIBUTE_NAME, theme);
}

function updateThemeToggleButton(button, theme) {
  const darkModeEnabled = theme === THEME_DARK;
  button.textContent = darkModeEnabled ? "Theme: Dark" : "Theme: Light";
  button.setAttribute("aria-pressed", darkModeEnabled ? "true" : "false");
  button.setAttribute(
    "aria-label",
    darkModeEnabled ? "Switch to light mode" : "Switch to dark mode",
  );
  button.title = darkModeEnabled ? "Switch to light mode" : "Switch to dark mode";
}

function createThemeToggleButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `button-n inverted ${THEME_TOGGLE_CLASS}`;
  updateThemeToggleButton(button, getActiveTheme());

  button.addEventListener("click", () => {
    const nextTheme = getActiveTheme() === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    applyTheme(nextTheme);
    writeStoredTheme(nextTheme);
    updateThemeToggleButton(button, nextTheme);
  });

  return button;
}

function mountThemeToggleButton() {
  const headerControlRow = document.querySelector(".header-control-row");
  if (!headerControlRow || headerControlRow.querySelector(`.${THEME_TOGGLE_CLASS}`)) {
    return;
  }

  const button = createThemeToggleButton();
  const mobileMenuButton = headerControlRow.querySelector(".header-menu-button-container");
  if (mobileMenuButton?.parentElement === headerControlRow) {
    headerControlRow.insertBefore(button, mobileMenuButton);
    return;
  }

  headerControlRow.appendChild(button);
}

export function installThemeControls() {
  applyTheme(resolveInitialTheme());
  mountThemeToggleButton();
}
