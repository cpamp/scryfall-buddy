import { createTextInputDropdownController } from "./create-text-input-dropdown-controller.js";
import { initializeDropdownRoutes } from "./dropdown-target-registry.js";

function createCleanupHandle(controller, definition) {
  return {
    cleanup() {
      controller.cleanup();
      delete window[definition.handleName];
    },
  };
}

export function mountDropdownDefinition(definition) {
  const existingInstance = window[definition.handleName];
  if (existingInstance && typeof existingInstance.cleanup === "function") {
    existingInstance.cleanup();
  }

  const controller = createTextInputDropdownController({
    ...definition.config,
  }).mount();

  window[definition.handleName] = createCleanupHandle(controller, definition);
  return window[definition.handleName];
}

export function mountDropdownDefinitions(definitions) {
  initializeDropdownRoutes(definitions);

  return definitions.map((definition) => ({
    handle: mountDropdownDefinition(definition),
    key: definition.key,
  }));
}
