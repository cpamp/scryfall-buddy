import { FETCH_TAGGER_CARD_HTML } from "./message-types.js";

function createErrorResponse(code, message) {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateExtensionMessage(message) {
  if (!isPlainObject(message)) {
    return {
      ok: false,
      response: createErrorResponse(
        "INVALID_MESSAGE",
        "Extension message payload must be an object.",
      ),
    };
  }

  if (message.type !== FETCH_TAGGER_CARD_HTML) {
    return {
      ok: false,
      response: createErrorResponse(
        "UNSUPPORTED_MESSAGE",
        "Unsupported extension message type.",
      ),
    };
  }

  if (typeof message.taggerUrl !== "string" || message.taggerUrl.trim() === "") {
    return {
      ok: false,
      response: createErrorResponse(
        "INVALID_MESSAGE",
        "FETCH_TAGGER_CARD_HTML requires a non-empty taggerUrl string.",
      ),
    };
  }

  return {
    ok: true,
    value: {
      type: FETCH_TAGGER_CARD_HTML,
      taggerUrl: message.taggerUrl.trim(),
    },
  };
}
