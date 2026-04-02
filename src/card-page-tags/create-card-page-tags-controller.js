const CARD_PAGE_TAGS_SECTION_CLASS = "scryfall-card-page-tags";
const CARD_PAGE_TAGS_DESCRIPTION_CLASS = "scryfall-card-page-tags__description";
const CARD_PAGE_TAGS_STATUS_CLASS = "scryfall-card-page-tags__status";
const CARD_PAGE_TAGS_STATUS_ERROR_CLASS = "is-error";
const CARD_PAGE_TAGS_CONTENT_CLASS = "scryfall-card-page-tags__content";
const CARD_PAGE_TAGS_TAG_LIST_CLASS = "scryfall-card-page-tags__list";
const CARD_PAGE_TAGS_LOAD_BUTTON_CLASS = "scryfall-card-page-tags__load-button";
const CARD_PAGE_TAGS_TAG_BUTTON_CLASS = "scryfall-card-page-tags__tag-button";
const CARD_PAGE_TAGS_EMPTY_CLASS = "scryfall-card-page-tags__empty";

function createSectionRoot(sectionId) {
  const root = document.createElement("section");
  root.id = sectionId;
  root.className = CARD_PAGE_TAGS_SECTION_CLASS;

  return root;
}

function createSectionTitle(title) {
  const heading = document.createElement("h6");
  heading.textContent = title;

  return heading;
}

function createSectionDescription(text) {
  const description = document.createElement("p");
  description.className = CARD_PAGE_TAGS_DESCRIPTION_CLASS;
  description.textContent = text;

  return description;
}

function createStatusNode() {
  const node = document.createElement("p");
  node.className = CARD_PAGE_TAGS_STATUS_CLASS;
  node.hidden = true;

  return node;
}

function createLoadButton(label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `button-n ${CARD_PAGE_TAGS_LOAD_BUTTON_CLASS}`;
  button.textContent = label;

  return button;
}

function createTagButton(tag) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `button-n ${CARD_PAGE_TAGS_TAG_BUTTON_CLASS}`;
  button.textContent = tag.name;
  button.title = `Insert otag:${tag.slug}`;

  return button;
}

function createTagList(tags, onTagClick) {
  const list = document.createElement("div");
  list.className = CARD_PAGE_TAGS_TAG_LIST_CLASS;

  for (const tag of tags) {
    const button = createTagButton(tag);
    button.addEventListener("click", () => {
      onTagClick(tag);
    });
    list.append(button);
  }

  return list;
}

export function createCardPageTagsController({
  applySelection,
  getCardPageContext,
  getInputs,
  loadButtonLabel,
  loadingButtonLabel,
  loadTaggerPageHtml,
  parseTagsFromHtml,
  sectionTitle,
  sectionDescription,
  sectionId,
}) {
  let root = null;
  let content = null;
  let statusNode = null;
  let abortController = null;

  function setStatus(message, tone = "muted") {
    if (!statusNode) {
      return;
    }

    statusNode.hidden = !message;
    statusNode.textContent = message || "";
    statusNode.classList.toggle(
      CARD_PAGE_TAGS_STATUS_ERROR_CLASS,
      tone === "error",
    );
  }

  function getTargetInput() {
    const inputs = getInputs();

    return inputs.find((input) => input === document.activeElement) || inputs[0] || null;
  }

  function handleTagClick(tag) {
    const input = getTargetInput();

    if (!input) {
      setStatus("No Scryfall search input was found on this page.", "error");
      return;
    }

    applySelection({ input, tag });
    setStatus("");
  }

  function renderTags(tags) {
    if (!content) {
      return;
    }

    if (!tags.length) {
      const emptyState = document.createElement("p");
      emptyState.className = CARD_PAGE_TAGS_EMPTY_CLASS;
      emptyState.textContent =
        "No card tags were found on the linked Scryfall Tagger page.";
      content.replaceChildren(emptyState);
      return;
    }

    content.replaceChildren(createTagList(tags, handleTagClick));
  }

  async function loadTags(taggerUrl, button) {
    if (abortController) {
      abortController.abort();
    }

    const requestController = new AbortController();
    abortController = requestController;
    button.disabled = true;
    button.textContent = loadingButtonLabel;
    setStatus("");

    try {
      const html = await loadTaggerPageHtml(taggerUrl, requestController.signal);
      const tags = parseTagsFromHtml(html, taggerUrl);

      renderTags(tags);
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      console.error("Failed to load card tags from Scryfall Tagger.", error);
      button.disabled = false;
      button.textContent = loadButtonLabel;
      setStatus(error?.message || "Could not load Scryfall Tagger card tags.", "error");
    } finally {
      if (abortController === requestController) {
        abortController = null;
      }
    }
  }

  function mount() {
    const cardPageContext = getCardPageContext();

    if (!cardPageContext) {
      return { cleanup };
    }

    root = createSectionRoot(sectionId);
    content = document.createElement("div");
    content.className = CARD_PAGE_TAGS_CONTENT_CLASS;
    statusNode = createStatusNode();

    const loadButton = createLoadButton(loadButtonLabel);
    loadButton.addEventListener("click", () => {
      void loadTags(cardPageContext.taggerUrl, loadButton);
    });
    content.replaceChildren(loadButton);

    root.append(
      createSectionTitle(sectionTitle),
      createSectionDescription(sectionDescription),
      content,
      statusNode,
    );
    cardPageContext.mountTarget.append(root);

    return { cleanup };
  }

  function cleanup() {
    abortController?.abort();
    abortController = null;
    root?.remove();
    root = null;
    content = null;
    statusNode = null;
  }

  return {
    mount,
    cleanup,
  };
}
