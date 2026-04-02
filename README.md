# Scryfall Plugin Prototype

This repository currently holds research snapshots plus a small console-injected prototype for testing `otag:` autocomplete behavior on Scryfall pages.

## Structure

- `research/html/`: captured Scryfall HTML fixtures
- `src/otag-dropdown/`: otag dropdown entry point and assembly
- `src/otag/`: otag-specific parsing, filtering, and token replacement
- `src/platform/scryfall/`: Scryfall-specific DOM targeting
- `src/shared/`: reusable dropdown, autocomplete, and text-input primitives
- `dist/main.js`: generated build output
- `scripts/build.js`: `esbuild`-based bundling script

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
