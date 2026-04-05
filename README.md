# Scryfall Plugin WebExtension

This repository builds a Chrome/Firefox WebExtension that adds `otag:` suggestions and color-query suggestions to Scryfall search pages.

## Features

- Color dropdowns
- OTag dropdowns

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
