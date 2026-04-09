# Scryfall Plugin WebExtension

This repository builds a Chrome/Firefox WebExtension that adds operator, `otag:`, and color-query suggestions plus a visual search builder to Scryfall search pages.

## Features

- Color dropdowns
- Operator dropdowns
- OTag dropdowns
- Visual search builder
- Saved search-builder favorites synced through browser extension sync storage

## Build

Build both extension targets:

```sh
npm run build
```

Watch both targets:

```sh
npm run build:watch
```

`npm run build` emits:

- `dist/chrome/manifest.json`
- `dist/chrome/content-script.js`
- `dist/chrome/content.css`
- `dist/chrome-<version>.zip`
- `dist/firefox/manifest.json`
- `dist/firefox/content-script.js`
- `dist/firefox/content.css`
- `dist/firefox-<version>.zip`

The zip archives place `manifest.json`, `content-script.js`, and `content.css` at the root of the archive.

## Load In Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select `dist/chrome`.

## Load In Firefox

1. Run `npm run build`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click `Load Temporary Add-on...`.
4. Select `dist/firefox/manifest.json`.

## Permissions

- `https://scryfall.com/*`: runs the content script on Scryfall pages.
- `storage`: stores extension settings and saved search-builder favorites in browser extension storage.

## Privacy And Stored Data

- The extension stores user preferences and saved search-builder favorites in browser extension storage.
- Search-builder favorites are stored in browser sync storage when it is available, so they can sync through the user's browser account.
- Favorites stay local to the browser's extension storage and are not sent to any separate remote service operated by this project.
