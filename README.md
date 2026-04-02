# Scryfall Plugin Prototype

This repository currently holds research snapshots plus a small console-injected prototype for testing `otag:` autocomplete behavior on Scryfall pages.

## Structure

- `research/html/`: captured Scryfall HTML fixtures
- `src/otag-dropdown/`: otag dropdown entry point and assembly
- `src/card-page-tags/`: card-page entry point for loading Tagger card tags on demand
- `src/otag/`: otag-specific parsing, filtering, and token replacement
- `src/tagger/`: Scryfall Tagger HTML parsing
- `src/platform/scryfall/`: Scryfall-specific DOM targeting
- `src/shared/`: reusable dropdown, autocomplete, and text-input primitives
- `src/main.js`: combined browser bootstrap for all current features
- `dist/main.js`: generated combined build output
- `dist/otag-dropdown.js`: generated otag dropdown build output
- `dist/card-page-tags.js`: generated card-page tag entry build output
- `scripts/build.js`: `esbuild`-based bundling script

`dist/main.js` is page-aware: it mounts card-page tags on card pages and the otag dropdown anywhere Scryfall exposes a supported search input, including card pages.

The card-page Tagger loader can use `window.__scryfallPluginFetchText(url)` or `GM_xmlhttpRequest` when page CSP blocks direct `fetch()` to `tagger.scryfall.com`.

## Build

Run:

```sh
npm run build
```

For rebuild-on-change:

```sh
npm run build:watch
```

That generates:

- `dist/main.js`
- `dist/otag-dropdown.js`
- `dist/card-page-tags.js`
