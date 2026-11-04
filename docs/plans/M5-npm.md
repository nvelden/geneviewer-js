# M5: npm 0.3.0

**Goal:** `geneviewer` 0.3.0 on npm and jsDelivr, with complete docs.
**Repo:** geneviewer-js.
**Branch:** `m5-npm`.
**Needs:** M4 merged.

## Steps

### M5.1: Builds

`scripts/build.mjs` writes to `dist/`:

| File | esbuild settings |
|------|------------------|
| `geneviewer.min.js` | IIFE, global `geneviewer`, D3 bundled, minified, source map |
| `geneviewer.mjs` | ESM, `d3` external (npm dependency) |
| `geneviewer.standalone.mjs` | ESM, D3 bundled, minified, source map |
| `geneviewer.core.js` | IIFE, global `geneviewer`, `d3` from the global, **not minified** (for R) |
| `geneviewer.css` | copy of `src/styles.css` |
| `geneviewer.d.ts`, `spec.d.ts` | from M3.4 |
| `themes.json` | from M4.11, for the R package |
| `geneviewerwidget.js` | the R binding, unchanged |
| `SHA256SUMS` | all of the above |

- `d3` moves from `peerDependencies` to `dependencies`, pinned to `^7.8.5`.
- **Styles:** the library injects its CSS once per document on the first
  `newChart`, as a `<style data-geneviewer>` element. The option
  `newChart(el, spec, { injectStyles: false })` turns this off, for pages
  whose Content-Security-Policy blocks injected styles.

**Checks:**
- The harness runs from `geneviewer.min.js` and from `geneviewer.core.js`;
  `npm test` passes with both.
- `try-app` uses the core build.

### M5.2: Icons

- The toolbar's default icons are drawn as inline SVG, using the same Font
  Awesome Free glyph paths, credited (CC BY 4.0) in `LICENSE-THIRD-PARTY.md`.
- A custom icon by Font Awesome name (`toolbar.icons`) keeps using
  `<i class="fa-solid fa-...">`; that needs Font Awesome on the page, which
  the R package provides.
- The SVG baselines for toolbar icons change. Niels decided this on
  2026-11-04: add it to the exceptions table as approved, regenerate only
  the affected baselines, and list them in the report.

**Check:** a page without Font Awesome shows all default icons.

### M5.3: Package metadata

`package.json`:
- `name: "geneviewer"`; remove `private`.
- `version: "0.3.0"`.
- `module` and `types`; `unpkg` and `jsdelivr` pointing at
  `dist/geneviewer.min.js`.
- An `exports` map: `"."` with `types` (`dist/geneviewer.d.ts`) and
  `import` (`dist/geneviewer.mjs`), plus `"./geneviewer.css"` and
  `"./standalone"` (`dist/geneviewer.standalone.mjs`). No CommonJS entry:
  the package is ESM-only for bundlers.
- `files`: `dist`, `README.md`, `LICENSE.md`, `LICENSE-THIRD-PARTY.md`.
- `sideEffects: ["*.css"]`, `keywords`, `homepage`, `bugs`, `repository`.

Rewrite the README for npm users: install, a script-tag example, a
bundler example, a link to the docs; development notes go further down.

**Check:** `npm pack --dry-run` lists only the intended files.

### M5.4: Smoke tests in fresh projects

`test/smoke/`, run from a tarball made by `npm pack`:

- **plain-html:** a page loading `geneviewer.min.js` that draws a chart from
  a spec.
- **vite:** `npm create vite` (vanilla template), install the tarball,
  `import { newChart } from "geneviewer"`, then `vite build`.
- **types:** a `.ts` file using `newChart` and the `Spec` type compiles
  with `tsc --noEmit`.

Each smoke test checks in headless Chrome that genes are drawn.

**Check:** `npm run test:smoke` passes.

### M5.5: Docs site

- **Examples:** each example has JavaScript and R tabs.
  - The JavaScript is generated from the fixture's `spec.json`, with data
    loaded from `examples/data/<id>.json` so the code stays short.
  - Charts are drawn from the spec with `newChart`.
- **API reference** (`api.html`): generated from the schema by
  `scripts/build-reference.mjs`: one section per component with each
  option's name, type, default and description; plus the methods and
  events.
- **Getting started** page: install, first chart, data and fields,
  updating, events, export.
- Remove every "Planned" label and notice that no longer applies.

**Checks:**
- The site check passes (every chart draws, no console errors).
- Every option in the schema appears in the reference.

### M5.6: Publishing workflow

- `.github/workflows/publish.yml`:
  - triggered on tags `v*`;
  - permissions `id-token: write` and `contents: write`;
  - runs `npm ci`, `npm test`, `npm run build`, then
    `npm publish --provenance --access public`;
  - creates the GitHub release with `dist/*` attached, replacing the current
    `release.yml`.

**Niels, once:**
1. Create the npm account with two-factor sign-in.
2. On npmjs.com, add `nvelden/geneviewer-js` with workflow `publish.yml`
   as a trusted publisher for `geneviewer`. The first publish may need to be
   done by hand to create the package; check npm's current docs.

### M5.7: Release

- With **Niels's** approval: merge, tag `v0.3.0`, push.
- **Afterwards:** `npm view geneviewer version` shows 0.3.0. The jsDelivr URL
  serves `dist/geneviewer.min.js`. The plain-html smoke test passes against
  the jsDelivr URL instead of the tarball.

## Done when

`geneviewer` 0.3.0 is on npm, jsDelivr serves it, and the docs site
describes it with no "Planned" labels left for released features.
