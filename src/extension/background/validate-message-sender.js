const SCRYFALL_HOSTNAME = "scryfall.com";

export function isAllowedExtensionMessageSender(sender) {
  if (!sender?.tab || typeof sender.url !== "string") {
    return false;
  }

  try {
    const url = new URL(sender.url);
    return url.protocol === "https:" && url.hostname === SCRYFALL_HOSTNAME;
  } catch {
    return false;
  }
}
