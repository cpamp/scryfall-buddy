const TAGGER_CARD_HOSTNAME = "tagger.scryfall.com";
const TAGGER_CARD_PATHNAME_PATTERN =
  /^\/card\/[^/?#]+\/[^/?#]+(?:\/[^/?#]+)?\/?$/;

function createInvalidUrlResult(message) {
  return {
    ok: false,
    error: {
      code: "INVALID_TAGGER_URL",
      message,
    },
  };
}

export function normalizeTaggerCardUrl(candidate) {
  if (typeof candidate !== "string") {
    return createInvalidUrlResult("Tagger card URL must be a string.");
  }

  const trimmedCandidate = candidate.trim();
  if (!trimmedCandidate) {
    return createInvalidUrlResult("Tagger card URL must not be empty.");
  }

  let url;
  try {
    url = new URL(trimmedCandidate);
  } catch {
    return createInvalidUrlResult("Tagger card URL must be a valid absolute URL.");
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== TAGGER_CARD_HOSTNAME ||
    url.username ||
    url.password ||
    url.port
  ) {
    return createInvalidUrlResult(
      "Only HTTPS URLs on tagger.scryfall.com card pages are allowed.",
    );
  }

  if (url.search || url.hash) {
    return createInvalidUrlResult(
      "Scryfall Tagger card URLs may not include query strings or fragments.",
    );
  }

  if (!TAGGER_CARD_PATHNAME_PATTERN.test(url.pathname)) {
    return createInvalidUrlResult(
      "Only Scryfall Tagger card pages under /card/<set>/<number> are allowed.",
    );
  }

  url.pathname = url.pathname.replace(/\/+$/, "");
  return {
    ok: true,
    value: url.toString(),
  };
}
