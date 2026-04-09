function createUnsupportedQueryStateMessage(message) {
  return message || "This query cannot be edited in the visual builder.";
}

export function getQueryStateStatusMetadata(queryState, builderValidation) {
  if (queryState.status === "invalid") {
    return {
      badgeClassName: "scryfall-search-builder-modal__status-badge is-error",
      badgeLabel: "Invalid",
      builderAvailable: false,
      message: queryState.message,
    };
  }

  if (queryState.status === "not-representable") {
    return {
      badgeClassName: "scryfall-search-builder-modal__status-badge is-warning",
      badgeLabel: "GUI Unavailable",
      builderAvailable: false,
      message: createUnsupportedQueryStateMessage(queryState.message),
    };
  }

  if (!builderValidation.isValid) {
    return {
      badgeClassName: "scryfall-search-builder-modal__status-badge is-warning",
      badgeLabel: "Incomplete",
      builderAvailable: true,
      message: builderValidation.message,
    };
  }

  return {
    badgeClassName: "scryfall-search-builder-modal__status-badge is-valid",
    badgeLabel: "Valid",
    builderAvailable: true,
    message: "The visual builder and raw query are in sync.",
  };
}
