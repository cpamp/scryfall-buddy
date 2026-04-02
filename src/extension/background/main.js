import { FETCH_TAGGER_CARD_HTML } from "../messaging/message-types.js";
import { validateExtensionMessage } from "../messaging/validate-message.js";
import { addRuntimeMessageListener } from "../runtime/browser-api.js";
import { handleFetchTaggerCardHtmlMessage } from "./handlers/fetch-tagger-card-html.js";
import { isAllowedExtensionMessageSender } from "./validate-message-sender.js";

const messageHandlers = {
  [FETCH_TAGGER_CARD_HTML]: handleFetchTaggerCardHtmlMessage,
};

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

addRuntimeMessageListener(async (message, sender) => {
  const validatedMessage = validateExtensionMessage(message);
  if (!validatedMessage.ok) {
    return validatedMessage.response;
  }

  if (!isAllowedExtensionMessageSender(sender)) {
    return createErrorResponse(
      "UNAUTHORIZED_SENDER",
      "Only content scripts on https://scryfall.com/* may request Tagger card HTML.",
    );
  }

  const handler = messageHandlers[validatedMessage.value.type];
  if (typeof handler !== "function") {
    return createErrorResponse(
      "UNSUPPORTED_MESSAGE",
      `No background handler is registered for ${validatedMessage.value.type}.`,
    );
  }

  return handler(validatedMessage.value, sender);
});
