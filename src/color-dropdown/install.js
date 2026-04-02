import { createTextInputDropdownController } from "../shared/dropdown/create-text-input-dropdown-controller.js";
import {
  COLOR_DROPDOWN_HANDLE_NAME,
  colorDropdownConfig,
} from "./config.js";

export function mountColorDropdown() {
  const existingInstance = window[COLOR_DROPDOWN_HANDLE_NAME];
  if (existingInstance && typeof existingInstance.cleanup === "function") {
    existingInstance.cleanup();
  }

  const controller = createTextInputDropdownController({
    ...colorDropdownConfig,
  }).mount();

  window[COLOR_DROPDOWN_HANDLE_NAME] = {
    cleanup() {
      controller.cleanup();
      delete window[COLOR_DROPDOWN_HANDLE_NAME];
    },
  };

  return window[COLOR_DROPDOWN_HANDLE_NAME];
}
