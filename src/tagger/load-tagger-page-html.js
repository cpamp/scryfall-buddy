function loadTaggerPageHtmlViaBridge(url, signal, bridge) {
  return Promise.resolve(bridge(url, { signal })).then((result) => {
    if (typeof result !== "string") {
      throw new Error("The configured Tagger bridge must resolve to an HTML string.");
    }

    return result;
  });
}

function loadTaggerPageHtmlViaGmRequest(url, signal) {
  return new Promise((resolve, reject) => {
    const request = GM_xmlhttpRequest({
      method: "GET",
      onerror: () => {
        reject(new Error("GM_xmlhttpRequest could not load the Scryfall Tagger page."));
      },
      onload: (response) => {
        if (response.status < 200 || response.status >= 300) {
          reject(
            new Error(
              `GM_xmlhttpRequest returned ${response.status} for the Scryfall Tagger page.`,
            ),
          );
          return;
        }

        resolve(response.responseText);
      },
      url,
    });

    signal?.addEventListener(
      "abort",
      () => {
        request.abort();
        reject(new DOMException("The operation was aborted.", "AbortError"));
      },
      { once: true },
    );
  });
}

function createCspBridgeError(error) {
  const bridgeError = new Error(
    "Scryfall blocks direct page fetches to tagger.scryfall.com. Provide window.__scryfallPluginFetchText(url) from an extension/userscript bridge, or run this feature outside page CSP.",
  );

  bridgeError.cause = error;
  bridgeError.code = "SCRYFALL_TAGGER_FETCH_BLOCKED";
  return bridgeError;
}

export async function loadTaggerPageHtml(url, signal) {
  if (typeof globalThis.__scryfallPluginFetchText === "function") {
    return loadTaggerPageHtmlViaBridge(
      url,
      signal,
      globalThis.__scryfallPluginFetchText,
    );
  }

  if (typeof GM_xmlhttpRequest === "function") {
    return loadTaggerPageHtmlViaGmRequest(url, signal);
  }

  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`Tagger request failed with ${response.status}`);
    }

    return response.text();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw createCspBridgeError(error);
  }
}
