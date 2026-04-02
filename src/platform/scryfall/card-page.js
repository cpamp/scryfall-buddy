export const SCRYFALL_CARD_TEXT_SELECTOR = ".card-text";
export const SCRYFALL_CARD_TAGGER_LINK_SELECTOR =
  'a.button-n[href*="tagger.scryfall.com/card/"]';

export function getScryfallCardPageContext() {
  const mountTarget = document.querySelector(SCRYFALL_CARD_TEXT_SELECTOR);
  const taggerLink = document.querySelector(SCRYFALL_CARD_TAGGER_LINK_SELECTOR);

  if (!mountTarget || !taggerLink) {
    return null;
  }

  const href = taggerLink.getAttribute("href") || taggerLink.href;

  return {
    mountTarget,
    taggerUrl: new URL(href, window.location.href).href,
  };
}
