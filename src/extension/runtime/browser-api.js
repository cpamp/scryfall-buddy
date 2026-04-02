function getBrowserRuntime() {
  return globalThis.browser?.runtime || null;
}

function getChromeRuntime() {
  return globalThis.chrome?.runtime || null;
}

function createUnexpectedResponse(error) {
  return {
    ok: false,
    error: {
      code: "UNEXPECTED_EXTENSION_ERROR",
      message: error?.message || "Unexpected extension runtime error.",
    },
  };
}

export function sendRuntimeMessage(message) {
  const browserRuntime = getBrowserRuntime();
  if (browserRuntime) {
    return browserRuntime.sendMessage(message);
  }

  const chromeRuntime = getChromeRuntime();
  if (!chromeRuntime) {
    return Promise.reject(new Error("Browser runtime messaging API is not available."));
  }

  return new Promise((resolve, reject) => {
    chromeRuntime.sendMessage(message, (response) => {
      if (chromeRuntime.lastError) {
        reject(new Error(chromeRuntime.lastError.message));
        return;
      }

      resolve(response);
    });
  });
}

export function addRuntimeMessageListener(listener) {
  const browserRuntime = getBrowserRuntime();
  if (browserRuntime) {
    browserRuntime.onMessage.addListener(listener);
    return;
  }

  const chromeRuntime = getChromeRuntime();
  if (!chromeRuntime) {
    throw new Error("Browser runtime messaging API is not available.");
  }

  chromeRuntime.onMessage.addListener((message, sender, sendResponse) => {
    Promise.resolve()
      .then(() => listener(message, sender))
      .then((response) => {
        sendResponse(response);
      })
      .catch((error) => {
        sendResponse(createUnexpectedResponse(error));
      });

    return true;
  });
}
