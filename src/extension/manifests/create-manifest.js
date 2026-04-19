const packageJson = require("../../../package.json");
const FIREFOX_EXTENSION_ID = "scryfall-plugin@cpamp.dev";

function createBaseManifest() {
  return {
    manifest_version: 3,
    name: "Scryfall Buddy",
    version: packageJson.version || "0.1.0",
    description:
      "Adds search suggestions, a visual builder, and synced favorites on Scryfall search pages.",
    permissions: ["storage"],
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

function createFirefoxManifest() {
  return {
    ...createBaseManifest(),
    browser_specific_settings: {
      gecko: {
        id: FIREFOX_EXTENSION_ID,
        data_collection_permissions: {
          required: ["websiteContent"],
        },
      },
    },
  };
}

function createManifest(target) {
  if (target === "chrome") {
    return createBaseManifest();
  }

  if (target === "firefox") {
    return createFirefoxManifest();
  }

  throw new Error(`Unsupported extension target: ${target}`);
}

module.exports = {
  createManifest,
};
