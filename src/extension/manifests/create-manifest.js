const packageJson = require("../../../package.json");

function createBaseManifest() {
  return {
    manifest_version: 3,
    name: "Scryfall Plugin",
    version: packageJson.version || "0.1.0",
    description:
      "Adds otag suggestions on Scryfall search pages and loads Scryfall Tagger card tags on card pages through extension background requests.",
    host_permissions: [
      "https://scryfall.com/*",
      "https://tagger.scryfall.com/*",
    ],
    content_scripts: [
      {
        matches: ["https://scryfall.com/*"],
        js: ["content-script.js"],
        css: ["content.css"],
        run_at: "document_idle",
      },
    ],
  };
}

function createChromeManifest() {
  return {
    ...createBaseManifest(),
    background: {
      service_worker: "background.js",
    },
  };
}

function createFirefoxManifest() {
  return {
    ...createBaseManifest(),
    background: {
      scripts: ["background.js"],
    },
  };
}

function createManifest(target) {
  if (target === "chrome") {
    return createChromeManifest();
  }

  if (target === "firefox") {
    return createFirefoxManifest();
  }

  throw new Error(`Unsupported extension target: ${target}`);
}

module.exports = {
  createManifest,
};
