# Scryfall Plugin WebExtension

This repository builds a Chrome/Firefox WebExtension that adds `otag:` suggestions to Scryfall search pages.

## Features

- Scryfall search-oriented pages (`/`, `/search`, `/advanced`) get the `otag:` dropdown when typing `otag:`, `function:`, or `oracletag:`.
- Selecting a suggestion inserts the chosen `otag:<slug>` token into the active or primary Scryfall search input.
- UI styling is shipped through extension-owned CSS.

## Source Layout

- `src/extension/content-script/main.js`: content-script bootstrap for Scryfall pages
- `src/extension/manifests/create-manifest.js`: browser-specific manifest generation
- `src/extension/styles/content.css`: extension-owned UI styling
- `src/otag-dropdown/`: dropdown mounting and page integration
- `src/otag/`: otag parsing, matching, and token insertion
- `src/platform/scryfall/search-inputs.js`: Scryfall search input selectors
- `src/shared/`: reusable dropdown, autocomplete, and text-input helpers
- `research/html/`: saved HTML fixtures

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
- `dist/firefox/manifest.json`
- `dist/firefox/content-script.js`
- `dist/firefox/content.css`

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
