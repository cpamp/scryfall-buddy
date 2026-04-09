function createStorageError(message, options = {}) {
  const error = new Error(message);
  error.unavailable = options.unavailable === true;
  return error;
}

function getPromiseStorageArea() {
  if (
    typeof globalThis.browser !== "undefined" &&
    globalThis.browser?.storage?.sync &&
    typeof globalThis.browser.storage.sync.get === "function"
  ) {
    return globalThis.browser.storage.sync;
  }

  return null;
}

function getCallbackStorageArea() {
  if (
    typeof globalThis.chrome !== "undefined" &&
    globalThis.chrome?.storage?.sync &&
    typeof globalThis.chrome.storage.sync.get === "function"
  ) {
    return globalThis.chrome.storage.sync;
  }

  return null;
}

function getCallbackStorageError() {
  const message = globalThis.chrome?.runtime?.lastError?.message;
  return typeof message === "string" && message.length > 0
    ? new Error(message)
    : null;
}

async function callPromiseStorageMethod(storageArea, methodName, ...args) {
  try {
    return await storageArea[methodName](...args);
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Browser sync storage request failed.");
  }
}

function callCallbackStorageMethod(storageArea, methodName, ...args) {
  return new Promise((resolve, reject) => {
    try {
      storageArea[methodName](...args, (result) => {
        const runtimeError = getCallbackStorageError();
        if (runtimeError) {
          reject(runtimeError);
          return;
        }

        resolve(result);
      });
    } catch (error) {
      reject(
        error instanceof Error
          ? error
          : new Error("Browser sync storage request failed."),
      );
    }
  });
}

function getSyncStorageArea() {
  const promiseStorageArea = getPromiseStorageArea();
  if (promiseStorageArea) {
    return {
      kind: "promise",
      storageArea: promiseStorageArea,
    };
  }

  const callbackStorageArea = getCallbackStorageArea();
  if (callbackStorageArea) {
    return {
      kind: "callback",
      storageArea: callbackStorageArea,
    };
  }

  return null;
}

async function callStorageMethod(methodName, ...args) {
  const storageDescriptor = getSyncStorageArea();
  if (!storageDescriptor) {
    throw createStorageError("Browser sync storage is unavailable.", {
      unavailable: true,
    });
  }

  if (storageDescriptor.kind === "promise") {
    return callPromiseStorageMethod(storageDescriptor.storageArea, methodName, ...args);
  }

  return callCallbackStorageMethod(storageDescriptor.storageArea, methodName, ...args);
}

export function isBrowserSyncStorageAvailable() {
  return getSyncStorageArea() !== null;
}

export async function readBrowserSyncStorage(keys) {
  return callStorageMethod("get", keys);
}

export async function writeBrowserSyncStorage(values) {
  await callStorageMethod("set", values);
}
