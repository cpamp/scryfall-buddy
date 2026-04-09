import {
  deleteSearchBuilderFavorite,
  listSearchBuilderFavorites,
  renameSearchBuilderFavorite,
  saveSearchBuilderFavorite,
} from "./favorites-storage.js";
import { createActionLink, createButton } from "./dom.js";

function createFavoriteNameSuggestion(rawQuery) {
  const compactQuery = String(rawQuery ?? "").replace(/\s+/g, " ").trim();
  if (!compactQuery) {
    return "Favorite query";
  }

  return compactQuery.length > 48 ? `${compactQuery.slice(0, 48).trimEnd()}...` : compactQuery;
}

function createFavoriteQueryPreview(rawQuery) {
  const compactQuery = String(rawQuery ?? "").replace(/\s+/g, " ").trim();
  if (!compactQuery) {
    return "Empty query";
  }

  return compactQuery.length > 120 ? `${compactQuery.slice(0, 120).trimEnd()}...` : compactQuery;
}

export function createSearchBuilderFavoritesController({
  getRawQuery,
  isOpen,
  nameFocusKey,
  onLoadQuery,
  requestRender,
}) {
  const state = {
    favoriteFormMode: null,
    favoriteFormName: "",
    favoriteFormTargetId: null,
    favorites: [],
    favoritesExpanded: false,
    favoritesLoading: false,
    favoritesNoticeMessage: "",
    favoritesNoticeTone: "info",
    favoritesOperationPending: false,
    favoritesRequestId: 0,
    favoritesStorageUnavailable: false,
    pendingFocusKey: null,
  };

  function renderIfOpen() {
    if (isOpen()) {
      requestRender();
    }
  }

  function setFavoritesNotice(message, tone = "info") {
    state.favoritesNoticeMessage = message || "";
    state.favoritesNoticeTone = tone;
  }

  function clearFavoritesNotice() {
    setFavoritesNotice("", "info");
  }

  function resetFavoriteForm() {
    state.favoriteFormMode = null;
    state.favoriteFormName = "";
    state.favoriteFormTargetId = null;
  }

  function syncFavoriteFormState() {
    if (
      state.favoriteFormMode === "rename" &&
      !state.favorites.some((favorite) => favorite.id === state.favoriteFormTargetId)
    ) {
      resetFavoriteForm();
    }
  }

  function updateFavoritesCollection(favorites) {
    state.favorites = Array.isArray(favorites) ? favorites : [];
    syncFavoriteFormState();
  }

  function getFavoriteById(favoriteId) {
    return state.favorites.find((favorite) => favorite.id === favoriteId) || null;
  }

  function resetForOpen() {
    state.favoritesExpanded = false;
    state.favoritesLoading = false;
    state.favoritesOperationPending = false;
    state.favoritesStorageUnavailable = false;
    state.pendingFocusKey = null;
    resetFavoriteForm();
    clearFavoritesNotice();
  }

  function consumePendingFocusKey() {
    const pendingFocusKey = state.pendingFocusKey;
    state.pendingFocusKey = null;
    return pendingFocusKey;
  }

  async function loadFavorites(options = {}) {
    const requestId = state.favoritesRequestId + 1;
    state.favoritesRequestId = requestId;

    if (options.showLoading === true) {
      state.favoritesLoading = true;
      state.favoritesStorageUnavailable = false;
      renderIfOpen();
    }

    const favoritesResult = await listSearchBuilderFavorites();
    if (requestId !== state.favoritesRequestId) {
      return;
    }

    state.favoritesLoading = false;

    if (favoritesResult.ok) {
      updateFavoritesCollection(favoritesResult.favorites);
      state.favoritesStorageUnavailable = false;
      renderIfOpen();
      return;
    }

    updateFavoritesCollection([]);
    state.favoritesStorageUnavailable = favoritesResult.unavailable === true;
    setFavoritesNotice(
      favoritesResult.errorMessage || "Favorites are unavailable right now.",
      "error",
    );
    renderIfOpen();
  }

  function toggleExpanded() {
    state.favoritesExpanded = !state.favoritesExpanded;
    if (!state.favoritesExpanded) {
      resetFavoriteForm();
    }

    renderIfOpen();
  }

  function beginCreateFavorite() {
    if (!getRawQuery().trim() || state.favoritesStorageUnavailable) {
      return;
    }

    state.favoritesExpanded = true;
    state.favoriteFormMode = "create";
    state.favoriteFormName = createFavoriteNameSuggestion(getRawQuery());
    state.favoriteFormTargetId = null;
    clearFavoritesNotice();
    state.pendingFocusKey = nameFocusKey;
    renderIfOpen();
  }

  function beginRenameFavorite(favoriteId) {
    const favorite = getFavoriteById(favoriteId);
    if (!favorite || state.favoritesStorageUnavailable) {
      return;
    }

    state.favoritesExpanded = true;
    state.favoriteFormMode = "rename";
    state.favoriteFormName = favorite.name;
    state.favoriteFormTargetId = favorite.id;
    clearFavoritesNotice();
    state.pendingFocusKey = nameFocusKey;
    renderIfOpen();
  }

  function cancelFavoriteForm() {
    resetFavoriteForm();
    clearFavoritesNotice();
    renderIfOpen();
  }

  async function submitFavoriteForm() {
    if (state.favoritesOperationPending) {
      return;
    }

    const favoriteName = state.favoriteFormName.replace(/\s+/g, " ").trim();
    if (!favoriteName) {
      setFavoritesNotice("Favorites need a name before they can be saved.", "error");
      state.pendingFocusKey = nameFocusKey;
      renderIfOpen();
      return;
    }

    state.favoritesOperationPending = true;
    clearFavoritesNotice();
    renderIfOpen();

    const isRenameOperation = state.favoriteFormMode === "rename";
    const favoritesResult =
      isRenameOperation
        ? await renameSearchBuilderFavorite(state.favoriteFormTargetId, favoriteName)
        : await saveSearchBuilderFavorite({
            name: favoriteName,
            query: getRawQuery(),
          });

    state.favoritesOperationPending = false;

    if (favoritesResult.ok) {
      updateFavoritesCollection(favoritesResult.favorites);
      resetFavoriteForm();
      state.favoritesExpanded = true;
      state.favoritesStorageUnavailable = false;
      setFavoritesNotice(
        isRenameOperation ? "Favorite renamed." : "Favorite saved.",
        "success",
      );
      renderIfOpen();
      return;
    }

    state.favoritesStorageUnavailable = favoritesResult.unavailable === true;
    setFavoritesNotice(
      favoritesResult.errorMessage || "Unable to save that favorite right now.",
      "error",
    );
    state.pendingFocusKey = nameFocusKey;
    renderIfOpen();
  }

  async function deleteFavorite(favoriteId) {
    if (state.favoritesOperationPending) {
      return;
    }

    state.favoritesOperationPending = true;
    clearFavoritesNotice();
    renderIfOpen();

    const favoritesResult = await deleteSearchBuilderFavorite(favoriteId);
    state.favoritesOperationPending = false;

    if (favoritesResult.ok) {
      updateFavoritesCollection(favoritesResult.favorites);
      state.favoritesStorageUnavailable = false;
      if (state.favoriteFormTargetId === favoriteId) {
        resetFavoriteForm();
      }
      setFavoritesNotice("Favorite deleted.", "success");
      renderIfOpen();
      return;
    }

    state.favoritesStorageUnavailable = favoritesResult.unavailable === true;
    setFavoritesNotice(
      favoritesResult.errorMessage || "Unable to delete that favorite right now.",
      "error",
    );
    renderIfOpen();
  }

  function loadFavorite(favoriteId) {
    const favorite = getFavoriteById(favoriteId);
    if (!favorite) {
      setFavoritesNotice("That favorite could not be found.", "error");
      renderIfOpen();
      return;
    }

    resetFavoriteForm();
    clearFavoritesNotice();
    onLoadQuery(favorite.query);
  }

  function renderSection() {
    const favoritesSection = document.createElement("section");
    favoritesSection.className =
      "scryfall-search-builder-modal__section scryfall-search-builder-modal__favorites";

    const favoritesCard = document.createElement("div");
    favoritesCard.className = "scryfall-search-builder-modal__favorites-card";
    if (!state.favoritesExpanded) {
      favoritesCard.classList.add("is-collapsed");
    }

    const favoritesHeader = document.createElement("div");
    favoritesHeader.className = "scryfall-search-builder-modal__favorites-header";

    const favoritesHeading = document.createElement("div");
    favoritesHeading.className = "scryfall-search-builder-modal__favorites-heading";

    const favoritesLabel = createActionLink(
      "Favorites",
      "scryfall-search-builder-modal__collapse-link scryfall-search-builder-modal__favorites-title-link",
      () => toggleExpanded(),
      {
        ariaLabel: state.favoritesExpanded ? "Collapse favorites" : "Expand favorites",
        ariaExpanded: state.favoritesExpanded,
      },
    );
    favoritesLabel.dataset.focusKey = "favorites-toggle";

    const favoritesCount = document.createElement("span");
    favoritesCount.className = "scryfall-search-builder-modal__favorites-count";
    favoritesCount.textContent = state.favoritesLoading
      ? "Loading..."
      : state.favoritesStorageUnavailable
        ? "Unavailable"
        : `${state.favorites.length} saved`;

    favoritesHeading.append(favoritesLabel, favoritesCount);

    const favoritesActions = document.createElement("div");
    favoritesActions.className = "scryfall-search-builder-modal__favorites-actions";

    const saveFavoriteButton = createButton(
      "Save current",
      "scryfall-search-builder-modal__secondary-button",
      () => beginCreateFavorite(),
      {
        disabled:
          state.favoritesOperationPending ||
          state.favoritesStorageUnavailable ||
          !getRawQuery().trim(),
      },
    );
    saveFavoriteButton.dataset.focusKey = "favorites-save-current";

    favoritesActions.append(saveFavoriteButton);
    favoritesHeader.append(favoritesHeading, favoritesActions);
    favoritesCard.append(favoritesHeader);

    if (!state.favoritesExpanded) {
      favoritesSection.append(favoritesCard);
      return favoritesSection;
    }

    const favoritesBody = document.createElement("div");
    favoritesBody.className = "scryfall-search-builder-modal__favorites-body";

    if (state.favoritesNoticeMessage) {
      const favoritesNotice = document.createElement("div");
      favoritesNotice.className =
        `scryfall-search-builder-modal__favorites-notice is-${state.favoritesNoticeTone}`;
      favoritesNotice.textContent = state.favoritesNoticeMessage;
      favoritesBody.append(favoritesNotice);
    }

    if (state.favoriteFormMode) {
      const favoriteForm = document.createElement("div");
      favoriteForm.className = "scryfall-search-builder-modal__favorites-form";

      const favoriteFormLabel = document.createElement("span");
      favoriteFormLabel.className = "scryfall-search-builder-modal__favorites-form-label";
      favoriteFormLabel.textContent = "Name";

      const favoriteFormRow = document.createElement("div");
      favoriteFormRow.className = "scryfall-search-builder-modal__favorites-form-row";

      const favoriteNameInput = document.createElement("input");
      favoriteNameInput.type = "text";
      favoriteNameInput.className = "scryfall-search-builder-modal__input";
      favoriteNameInput.value = state.favoriteFormName;
      favoriteNameInput.placeholder = "Favorite name";
      favoriteNameInput.dataset.focusKey = nameFocusKey;
      favoriteNameInput.addEventListener("input", () => {
        state.favoriteFormName = favoriteNameInput.value;
      });
      favoriteNameInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          submitFavoriteForm();
        }
      });

      const favoriteSubmitButton = createButton(
        state.favoriteFormMode === "rename" ? "Save name" : "Save favorite",
        "scryfall-search-builder-modal__primary-button",
        () => submitFavoriteForm(),
        {
          disabled: state.favoritesOperationPending,
        },
      );

      const favoriteCancelButton = createButton(
        "Cancel",
        "scryfall-search-builder-modal__ghost-button",
        () => cancelFavoriteForm(),
        {
          disabled: state.favoritesOperationPending,
        },
      );

      favoriteFormRow.append(
        favoriteNameInput,
        favoriteSubmitButton,
        favoriteCancelButton,
      );
      favoriteForm.append(favoriteFormLabel, favoriteFormRow);
      favoritesBody.append(favoriteForm);
    }

    if (state.favoritesStorageUnavailable) {
      const unavailableState = document.createElement("div");
      unavailableState.className = "scryfall-search-builder-modal__favorites-empty-state";
      unavailableState.textContent =
        "Sync storage is unavailable in this browser context, so favorites cannot be loaded.";
      favoritesBody.append(unavailableState);
      favoritesCard.append(favoritesBody);
      favoritesSection.append(favoritesCard);
      return favoritesSection;
    }

    if (state.favoritesLoading) {
      const loadingState = document.createElement("div");
      loadingState.className = "scryfall-search-builder-modal__favorites-empty-state";
      loadingState.textContent = "Loading saved favorites...";
      favoritesBody.append(loadingState);
      favoritesCard.append(favoritesBody);
      favoritesSection.append(favoritesCard);
      return favoritesSection;
    }

    if (state.favorites.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "scryfall-search-builder-modal__favorites-empty-state";
      emptyState.textContent = "No favorites saved yet.";
      favoritesBody.append(emptyState);
      favoritesCard.append(favoritesBody);
      favoritesSection.append(favoritesCard);
      return favoritesSection;
    }

    const favoritesList = document.createElement("div");
    favoritesList.className = "scryfall-search-builder-modal__favorites-list";

    state.favorites.forEach((favorite) => {
      const favoriteItem = document.createElement("article");
      favoriteItem.className = "scryfall-search-builder-modal__favorite-item";

      const favoriteInfo = document.createElement("div");
      favoriteInfo.className = "scryfall-search-builder-modal__favorite-info";

      const favoriteName = document.createElement("div");
      favoriteName.className = "scryfall-search-builder-modal__favorite-name";
      favoriteName.textContent = favorite.name;

      const favoriteQuery = document.createElement("div");
      favoriteQuery.className = "scryfall-search-builder-modal__favorite-query";
      favoriteQuery.textContent = createFavoriteQueryPreview(favorite.query);
      favoriteQuery.title = favorite.query;

      favoriteInfo.append(favoriteName, favoriteQuery);

      const favoriteActions = document.createElement("div");
      favoriteActions.className = "scryfall-search-builder-modal__favorite-actions";

      favoriteActions.append(
        createButton(
          "Load",
          "scryfall-search-builder-modal__secondary-button",
          () => loadFavorite(favorite.id),
          {
            disabled: state.favoritesOperationPending,
          },
        ),
        createButton(
          "Rename",
          "scryfall-search-builder-modal__ghost-button",
          () => beginRenameFavorite(favorite.id),
          {
            disabled: state.favoritesOperationPending,
          },
        ),
        createButton(
          "Delete",
          "scryfall-search-builder-modal__ghost-button",
          () => deleteFavorite(favorite.id),
          {
            disabled: state.favoritesOperationPending,
          },
        ),
      );

      favoriteItem.append(favoriteInfo, favoriteActions);
      favoritesList.append(favoriteItem);
    });

    favoritesBody.append(favoritesList);
    favoritesCard.append(favoritesBody);
    favoritesSection.append(favoritesCard);
    return favoritesSection;
  }

  return {
    consumePendingFocusKey,
    loadFavorites,
    renderSection,
    resetForOpen,
  };
}
