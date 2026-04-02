import { FETCH_TAGGER_CARD_HTML } from "../extension/messaging/message-types.js";
import { sendRuntimeMessage } from "../extension/runtime/browser-api.js";
import { normalizeTaggerCardUrl } from "./validate-tagger-card-url.js";

function createAbortError() {
  return new DOMException("The operation was aborted.", "AbortError");
}

function createRuntimeResponseError(response) {
  const error = new Error(
    response?.error?.message || "Could not load Scryfall Tagger card tags.",
  );

  error.code = response?.error?.code || "TAGGER_FETCH_FAILED";
  if (response?.error?.details !== undefined) {
    error.details = response.error.details;
  }

  return error;
}

function createUrlValidationError(validation) {
  const error = new Error(validation.error.message);
  error.code = validation.error.code;
  return error;
}

function raceWithAbort(promise, signal) {
  if (!signal) {
    return promise;
  }

  if (signal.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise((resolve, reject) => {
    const handleAbort = () => {
      signal.removeEventListener("abort", handleAbort);
      reject(createAbortError());
    };

    signal.addEventListener("abort", handleAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", handleAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", handleAbort);
        reject(error);
      },
    );
  });
}

export async function loadTaggerPageHtml(url, signal) {
  const validation = normalizeTaggerCardUrl(url);
  if (!validation.ok) {
    throw createUrlValidationError(validation);
  }

  const response = await raceWithAbort(
    sendRuntimeMessage({
      type: FETCH_TAGGER_CARD_HTML,
      taggerUrl: validation.value,
    }),
    signal,
  );

  if (!response?.ok) {
    throw createRuntimeResponseError(response);
  }

  if (typeof response.data?.html !== "string") {
    throw createRuntimeResponseError({
      error: {
        code: "INVALID_BACKGROUND_RESPONSE",
        message: "Background did not return Tagger HTML.",
      },
    });
  }

  return response.data.html;
}
