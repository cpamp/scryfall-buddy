import { createCardPageTagsController } from "./create-card-page-tags-controller.js";
import { CARD_PAGE_TAGS_HANDLE_NAME, cardPageTagsConfig } from "./config.js";

export function mountCardPageTags() {
  const existingInstance = window[CARD_PAGE_TAGS_HANDLE_NAME];
  if (existingInstance && typeof existingInstance.cleanup === "function") {
    existingInstance.cleanup();
  }

  const controller = createCardPageTagsController({
    ...cardPageTagsConfig,
  }).mount();

  window[CARD_PAGE_TAGS_HANDLE_NAME] = {
    cleanup() {
      controller.cleanup();
      delete window[CARD_PAGE_TAGS_HANDLE_NAME];
    },
  };

  return window[CARD_PAGE_TAGS_HANDLE_NAME];
}
