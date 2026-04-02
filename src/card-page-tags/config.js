import { applyOtagSlugSelection } from "../otag/apply-otag-slug-selection.js";
import { getScryfallCardPageContext } from "../platform/scryfall/card-page.js";
import { getScryfallSearchInputs } from "../platform/scryfall/search-inputs.js";
import { extractTaggerCardTagsFromHtml } from "../tagger/extract-card-tags-from-html.js";
import { loadTaggerPageHtml } from "../tagger/load-tagger-page-html.js";

export const CARD_PAGE_TAGS_HANDLE_NAME = "__scryfallCardPageTagsPrototype";
export const CARD_PAGE_TAGS_SECTION_ID = "scryfall-card-page-tags-prototype";
export const CARD_PAGE_TAGS_SECTION_TITLE = "Card Tags";
export const CARD_PAGE_TAGS_SECTION_DESCRIPTION =
  "Load card tags from the linked Scryfall Tagger page, then click one to insert an otag filter into Scryfall search.";
export const CARD_PAGE_TAGS_LOAD_BUTTON_LABEL = "Load card tags from Scryfall Tagger";
export const CARD_PAGE_TAGS_LOADING_BUTTON_LABEL = "Loading card tags...";

export const cardPageTagsConfig = {
  applySelection: ({ input, tag }) =>
    applyOtagSlugSelection({
      input,
      slug: tag.slug,
    }),
  getCardPageContext: getScryfallCardPageContext,
  getInputs: getScryfallSearchInputs,
  loadButtonLabel: CARD_PAGE_TAGS_LOAD_BUTTON_LABEL,
  loadingButtonLabel: CARD_PAGE_TAGS_LOADING_BUTTON_LABEL,
  loadTaggerPageHtml,
  parseTagsFromHtml: extractTaggerCardTagsFromHtml,
  sectionTitle: CARD_PAGE_TAGS_SECTION_TITLE,
  sectionDescription: CARD_PAGE_TAGS_SECTION_DESCRIPTION,
  sectionId: CARD_PAGE_TAGS_SECTION_ID,
};
