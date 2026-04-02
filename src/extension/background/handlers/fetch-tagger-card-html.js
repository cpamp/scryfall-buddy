import { normalizeTaggerCardUrl } from "../../../tagger/validate-tagger-card-url.js";

function createErrorResponse(code, message, details) {
  const response = {
    ok: false,
    error: {
      code,
      message,
    },
  };

  if (details !== undefined) {
    response.error.details = details;
  }

  return response;
}

export async function handleFetchTaggerCardHtmlMessage(message) {
  const normalizedTaggerUrl = normalizeTaggerCardUrl(message.taggerUrl);
  if (!normalizedTaggerUrl.ok) {
    return createErrorResponse(
      normalizedTaggerUrl.error.code,
      normalizedTaggerUrl.error.message,
    );
  }

  try {
    const response = await fetch(normalizedTaggerUrl.value, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
      },
      method: "GET",
    });

    if (!response.ok) {
      return createErrorResponse(
        "TAGGER_FETCH_FAILED",
        `Scryfall Tagger returned ${response.status}.`,
        {
          status: response.status,
          taggerUrl: normalizedTaggerUrl.value,
        },
      );
    }

    const finalUrl = normalizeTaggerCardUrl(response.url);
    if (!finalUrl.ok) {
      return createErrorResponse(
        "TAGGER_FETCH_REDIRECT_BLOCKED",
        "Scryfall Tagger redirected to an unsupported URL.",
        {
          redirectedTo: response.url,
        },
      );
    }

    return {
      ok: true,
      data: {
        html: await response.text(),
        taggerUrl: finalUrl.value,
      },
    };
  } catch (error) {
    return createErrorResponse(
      "TAGGER_FETCH_FAILED",
      error?.message || "Could not load Scryfall Tagger card tags.",
    );
  }
}
