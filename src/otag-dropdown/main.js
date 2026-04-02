import { createTextInputDropdownController } from "../shared/dropdown/create-text-input-dropdown-controller.js";
import { OTAG_DROPDOWN_HANDLE_NAME, otagDropdownConfig } from "./config.js";

const existingInstance = window[OTAG_DROPDOWN_HANDLE_NAME];
if (existingInstance && typeof existingInstance.cleanup === "function") {
  existingInstance.cleanup();
}

const controller = createTextInputDropdownController({
  ...otagDropdownConfig,
}).mount();

window[OTAG_DROPDOWN_HANDLE_NAME] = {
  cleanup() {
    controller.cleanup();
    delete window[OTAG_DROPDOWN_HANDLE_NAME];
  },
};
