const installedStyleControllers = new Map();

function canUseAdoptedStyleSheets() {
  return (
    typeof CSSStyleSheet !== "undefined" &&
    Array.isArray(document.adoptedStyleSheets)
  );
}

function createAdoptedStyleSheetController(cssText) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(cssText);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];

  return {
    destroy() {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (entry) => entry !== sheet,
      );
    },
    update(nextCssText) {
      sheet.replaceSync(nextCssText);
    },
  };
}

function createStyleElementController(key, cssText) {
  const style = document.createElement("style");
  style.dataset.scryfallPluginStyle = key;
  style.textContent = cssText;
  document.head.append(style);

  return {
    destroy() {
      style.remove();
    },
    update(nextCssText) {
      style.textContent = nextCssText;
    },
  };
}

export function ensureDocumentStyleSheet(key, cssText) {
  let controller = installedStyleControllers.get(key);

  if (!controller) {
    controller = canUseAdoptedStyleSheets()
      ? createAdoptedStyleSheetController(cssText)
      : createStyleElementController(key, cssText);
    installedStyleControllers.set(key, controller);
    return controller;
  }

  controller.update(cssText);
  return controller;
}
