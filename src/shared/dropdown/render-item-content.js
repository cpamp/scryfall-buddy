const DROPDOWN_POPUP_ITEM_CONTENT_CLASS = "scryfall-otag-dropdown-popup__item-content";
const DROPDOWN_POPUP_ITEM_LABEL_CLASS = "scryfall-otag-dropdown-popup__item-label";
const DROPDOWN_POPUP_ITEM_META_CLASS = "scryfall-otag-dropdown-popup__item-meta";

function appendDropdownLabelMetaContent(option, { label: labelText, meta: metaText }) {
  const content = document.createElement("span");
  content.className = DROPDOWN_POPUP_ITEM_CONTENT_CLASS;

  const label = document.createElement("span");
  label.className = DROPDOWN_POPUP_ITEM_LABEL_CLASS;
  label.textContent = labelText;

  const meta = document.createElement("span");
  meta.className = DROPDOWN_POPUP_ITEM_META_CLASS;
  meta.textContent = metaText;

  content.append(label, meta);
  option.append(content);
}

export function renderTokenMetaItemContent(option, item) {
  appendDropdownLabelMetaContent(option, {
    label: item.token,
    meta: item.display,
  });
}

export function renderNameSlugItemContent(option, item) {
  appendDropdownLabelMetaContent(option, {
    label: item.name,
    meta: item.slug,
  });
}
