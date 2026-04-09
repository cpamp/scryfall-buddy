import {
  isBrowserSyncStorageAvailable,
  readBrowserSyncStorage,
  writeBrowserSyncStorage,
} from "../shared/storage/browser-sync-storage.js";

const SEARCH_BUILDER_FAVORITES_STORAGE_KEY = "scryfall-search-builder-favorites";

function createStorageResultError(message, options = {}) {
  return {
    errorMessage: message,
    ok: false,
    unavailable: options.unavailable === true,
  };
}

function createFavoriteId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `favorite-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeFavoriteName(name) {
  return String(name ?? "").replace(/\s+/g, " ").trim();
}

function normalizeStoredFavorite(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const id = typeof record.id === "string" ? record.id : "";
  const name = normalizeFavoriteName(record.name);
  const query = typeof record.query === "string" ? record.query : null;
  const createdAt = typeof record.createdAt === "string" ? record.createdAt : null;
  const updatedAt = typeof record.updatedAt === "string" ? record.updatedAt : createdAt;

  if (!id || !name || query === null || !createdAt || !updatedAt) {
    return null;
  }

  return {
    createdAt,
    id,
    name,
    query,
    updatedAt,
  };
}

function sortFavorites(favorites) {
  return favorites
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

async function readFavorites() {
  if (!isBrowserSyncStorageAvailable()) {
    return createStorageResultError("Browser sync storage is unavailable.", {
      unavailable: true,
    });
  }

  try {
    const storageValue = await readBrowserSyncStorage({
      [SEARCH_BUILDER_FAVORITES_STORAGE_KEY]: [],
    });
    const rawFavorites = Array.isArray(storageValue?.[SEARCH_BUILDER_FAVORITES_STORAGE_KEY])
      ? storageValue[SEARCH_BUILDER_FAVORITES_STORAGE_KEY]
      : [];

    return {
      favorites: sortFavorites(rawFavorites.map(normalizeStoredFavorite).filter(Boolean)),
      ok: true,
    };
  } catch (error) {
    return createStorageResultError(
      error?.message || "Unable to read search builder favorites.",
      {
        unavailable: error?.unavailable === true,
      },
    );
  }
}

async function writeFavorites(favorites) {
  try {
    await writeBrowserSyncStorage({
      [SEARCH_BUILDER_FAVORITES_STORAGE_KEY]: favorites,
    });

    return {
      favorites,
      ok: true,
    };
  } catch (error) {
    return createStorageResultError(
      error?.message || "Unable to save search builder favorites.",
      {
        unavailable: error?.unavailable === true,
      },
    );
  }
}

export async function listSearchBuilderFavorites() {
  return readFavorites();
}

export async function saveSearchBuilderFavorite({ name, query }) {
  const normalizedName = normalizeFavoriteName(name);
  const favoriteQuery = typeof query === "string" ? query : "";

  if (!normalizedName) {
    return createStorageResultError("Favorites need a name before they can be saved.");
  }

  if (!favoriteQuery.trim()) {
    return createStorageResultError("Add a query before saving it as a favorite.");
  }

  const favoritesResult = await readFavorites();
  if (!favoritesResult.ok) {
    return favoritesResult;
  }

  const now = new Date().toISOString();
  const nextFavorites = sortFavorites([
    {
      createdAt: now,
      id: createFavoriteId(),
      name: normalizedName,
      query: favoriteQuery,
      updatedAt: now,
    },
    ...favoritesResult.favorites,
  ]);

  return writeFavorites(nextFavorites);
}

export async function renameSearchBuilderFavorite(favoriteId, nextName) {
  const normalizedName = normalizeFavoriteName(nextName);
  if (!normalizedName) {
    return createStorageResultError("Favorites need a name before they can be saved.");
  }

  const favoritesResult = await readFavorites();
  if (!favoritesResult.ok) {
    return favoritesResult;
  }

  const favoriteExists = favoritesResult.favorites.some(
    (favorite) => favorite.id === favoriteId,
  );
  if (!favoriteExists) {
    return createStorageResultError("That favorite could not be found.");
  }

  const now = new Date().toISOString();
  const nextFavorites = sortFavorites(
    favoritesResult.favorites.map((favorite) =>
      favorite.id === favoriteId
        ? {
            ...favorite,
            name: normalizedName,
            updatedAt: now,
          }
        : favorite,
    ),
  );

  return writeFavorites(nextFavorites);
}

export async function deleteSearchBuilderFavorite(favoriteId) {
  const favoritesResult = await readFavorites();
  if (!favoritesResult.ok) {
    return favoritesResult;
  }

  const nextFavorites = favoritesResult.favorites.filter(
    (favorite) => favorite.id !== favoriteId,
  );

  if (nextFavorites.length === favoritesResult.favorites.length) {
    return createStorageResultError("That favorite could not be found.");
  }

  return writeFavorites(nextFavorites);
}
