# Scryfall Plugin WebExtension

This repository now builds a real Chrome/Firefox WebExtension for Scryfall.

The extension keeps the existing `otag:` dropdown behavior on Scryfall search pages and adds a card-page "Card Tags" section that loads Tagger HTML through privileged background requests instead of page-context `fetch()`.

## Features

- Search-oriented Scryfall pages (`/`, `/search`, `/advanced`) get the `otag:` dropdown.
- Scryfall card pages inject a "Card Tags" section as the last child of `.card-text`.
- Clicking `Load card tags from Scryfall Tagger` sends a `FETCH_TAGGER_CARD_HTML` runtime message to the extension background.
- Background code validates the sender, validates the Tagger card URL, fetches the HTML from `https://tagger.scryfall.com/*`, and returns a structured success or error payload.
- Card tag buttons still insert `otag:<slug>` into the active or primary Scryfall search input.
- UI styling is shipped through extension-owned CSS, not runtime `<style>` injection or inline style attributes.

## Source Layout

- `src/extension/content-script/main.js`: page-aware content-script bootstrap
- `src/extension/background/main.js`: background message router
- `src/extension/background/handlers/fetch-tagger-card-html.js`: closed Tagger fetch handler
- `src/extension/messaging/`: message types and payload validation
- `src/extension/runtime/browser-api.js`: Chrome/Firefox runtime messaging wrapper
- `src/extension/styles/content.css`: extension-owned UI styling
- `src/extension/manifests/create-manifest.js`: browser-specific manifest generation
- `src/otag/`: otag parsing, matching, and token insertion
- `src/tagger/`: Tagger URL validation plus HTML parsing
- `src/platform/scryfall/`: Scryfall DOM selectors and page context
- `src/shared/`: reusable dropdown, autocomplete, and text-input helpers
- `research/html/`: saved Scryfall and Tagger fixtures

The migration audit and architecture rationale live in `docs/architecture-decisions.md`.

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
- `dist/chrome/background.js`
- `dist/chrome/content.css`
- `dist/firefox/manifest.json`
- `dist/firefox/content-script.js`
- `dist/firefox/background.js`
- `dist/firefox/content.css`

## Load In Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select `dist/chrome`.

Chrome uses a Manifest V3 service worker background generated as `background.service_worker`.

## Load In Firefox

1. Run `npm run build`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click `Load Temporary Add-on...`.
4. Select `dist/firefox/manifest.json`.

Firefox uses a generated Manifest V3 background script entry under `background.scripts`.

## Permissions

- `https://scryfall.com/*`: runs the content script and provides the sender URL that the background validates before serving requests.
- `https://tagger.scryfall.com/*`: allows the background to fetch Tagger card pages on behalf of the content script.

No generic background fetch API is exposed. The only runtime fetch path is `FETCH_TAGGER_CARD_HTML`, and it accepts only validated Tagger card URLs.

## Message Flow

1. The content script decides whether the current page is a card page or a search-oriented page.
2. On a card page, clicking the load button calls `src/tagger/load-tagger-page-html.js`.
3. That module sends `FETCH_TAGGER_CARD_HTML` to the background.
4. The background validates the message payload, validates the sender, validates the Tagger card URL, performs the fetch, and returns structured success or error data.
5. The content script parses Tagger HTML with `src/tagger/extract-card-tags-from-html.js` and renders safe button-based tag actions.
