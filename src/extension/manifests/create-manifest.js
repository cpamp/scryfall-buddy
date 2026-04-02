const packageJson = require("../../../package.json");

function createBaseManifest() {
  return {
    manifest_version: 3,
    name: "Scryfall Plugin",
    version: packageJson.version || "0.1.0",
    description:
      "Adds otag suggestions on Scryfall search pages.",
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

function createManifest(target) {
  if (target === "chrome" || target === "firefox") {
    return createBaseManifest();
  }

  throw new Error(`Unsupported extension target: ${target}`);
}

module.exports = {
  createManifest,
};
