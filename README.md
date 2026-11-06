# geneviewer

Interactive gene cluster, transcript and genome alignment charts in the
browser, drawn with D3. The same library draws the charts of the
[geneviewer R package](https://github.com/nvelden/geneviewer) and its Shiny
app.

**Docs and examples:** https://nvelden.github.io/geneviewer-docs/

## Install

```sh
npm install geneviewer-js
```

Or load it from a CDN, with D3 included:

```html
<script src="https://cdn.jsdelivr.net/npm/geneviewer-js@0.3/dist/geneviewer.min.js"></script>
```

## A first chart

```html
<div id="chart" style="width: 800px; height: 300px"></div>
<script src="https://cdn.jsdelivr.net/npm/geneviewer-js@0.3/dist/geneviewer.min.js"></script>
<script>
  const chart = geneviewer.newChart("#chart", {
    data: [
      { cluster: "A", name: "geneA", start: 100, end: 900, class: "kinase" },
      { cluster: "A", name: "geneB", start: 1200, end: 2000, class: "transporter" },
      { cluster: "B", name: "geneA", start: 300, end: 1100, class: "kinase" },
    ],
    fields: { cluster: "cluster", group: "class" },
    labels: { label: "name" },
    title: { title: "Two clusters" },
  });
  chart.on("click", (event) => console.log(event.detail));
</script>
```

With a bundler (Vite, webpack, ...), import the ES module; it imports `d3`
from npm:

```js
import { newChart } from "geneviewer-js";

const chart = newChart(document.getElementById("chart"), spec);
chart.update({ title: { title: "New title" } });
```

The chart spec has one key per part of the chart (`genes`, `labels`,
`links`, `scale`, `theme`, ...); see the API reference on the docs site and
`dist/spec.d.ts`. The library adds its stylesheet to the page; on pages
whose Content-Security-Policy blocks that, pass `{ injectStyles: false }`
and load `geneviewer-js/geneviewer.css`.

## Files

| File | For |
|------|-----|
| `dist/geneviewer.min.js` | Script tag, global `geneviewer`, D3 included |
| `dist/geneviewer.mjs` | ES module for bundlers (`import ... from "geneviewer-js"`), imports `d3` |
| `dist/geneviewer.standalone.mjs` | ES module with D3 included (`geneviewer-js/standalone`) |
| `dist/geneviewer.core.js` | Script tag using the page's `d3`, not minified (the R package) |
| `dist/geneviewer.css` | The stylesheet, when styles cannot be added by script |
| `dist/geneviewer.d.ts`, `dist/spec.d.ts` | Types |

# Development

## Source

| File | What it is |
|------|------------|
| `src/lib/index.js` | Entry of the bundle: the public API, what the global `geneviewer` holds |
| `src/lib/chart.js` | `geneviewer.newChart()`: the chart, with its toolbar, zoom, selection, drag and undo/redo |
| `src/lib/container.js` | The container of one chart part; `components/*.js` add a method to it for each part drawn (genes, labels, legend, ...) |
| `src/lib/*.js` | Shared helpers: `util`, `style`, `text`, `color`, `scale`, `links` (and colour bar), `export` (SVG/PNG, save menu) |
| `src/styles.css` | Chart styles |
| `src/htmlwidgets/geneviewerwidget.js` | htmlwidgets binding used by the R package: calls `newChart` and sends events to Shiny |

The sources are ES modules, bundled by esbuild (`scripts/files.mjs`). The
code uses `d3` as a global; the ES module and bundled builds import it from
the `d3` package instead (`src/d3.js`).

## Build

```sh
npm run check   # syntax-check the sources
npm run build   # write dist/ and dist/SHA256SUMS
```

`npm run build` needs the dev dependencies (`npm ci`). It writes the four
builds (see "Files" above), `geneviewer.css`, `themes.json`, the R binding,
the type definitions and `SHA256SUMS`. `geneviewer.core.js` is not
minified, so the R package can ship readable source, as CRAN expects;
esbuild does drop the comments.

## Chart spec schema

`schema/spec-v1.schema.json` (JSON Schema 2020-12) defines the chart spec:
one top-level key per `GC_*` function of the R package, one property per
argument, in camelCase. `schema/NAMING.md` lists every R argument and its
spec name; the names were approved for spec v1, which is frozen at 1.0.0.

```sh
npm run schema:check   # validate the schema, NAMING.md and schema/examples/
npm run spec:check     # validate the spec.json R recorded for each fixture
```

## Types

`npm run build` also writes `dist/geneviewer.d.ts`, from the JSDoc in
`src/lib/`, and `dist/spec.d.ts`, from the schema. The source stays plain
JavaScript.

```sh
npm run types:test   # compile test/types/ against the .d.ts files (in npm test)
npm run types:src    # type-check src/lib/ (jsconfig.json); some errors remain
```

## Tests

```sh
npm test               # all tests, in Docker
npm run test:update    # write new baselines (only when output should change)
npm run test:smoke     # the packed package in a plain page, a Vite project and TypeScript
Rscript scripts/export-fixtures.R   # re-export fixtures from the R package
Rscript test/coverage.R             # update test/coverage.md
```

- **Fixtures** (`test/fixtures/`): 206 charts exported from the R package:
  its help-page examples, its vignettes and `test/charts.R`. Each has the
  R code, the spec R recorded, the payload R sends to the browser, and
  `render.txt`, a canonical listing of the drawn chart. `npm test` draws
  every fixture and compares.
- **compile()** (`npm run test:compile`, in `npm test`): `compile(spec)`
  equals R's payload for every fixture, apart from the approved exceptions
  (docs/roadmap.md).
- **Interaction tests** (`test/interaction/`): scripted zoom, selection,
  drag and undo/redo, with the chart and its events recorded after each
  step.
- **Three modes:** fixtures and interaction tests run against the same
  baselines through the R binding, as R draws charts, with
  `geneviewer.newChart()` and R's payload, and with `newChart()` and the
  spec (`test/harness/mount.js`); the fixtures also with the min build.
- **Chart methods** (`test/methods.mjs`): `select()`, `getSelection()`,
  `undo()`, `redo()` and `download()`.
- **Save and two-chart checks** (`test/save.cjs`, `test/two-charts.cjs`):
  the save menu downloads a valid SVG and PNG; two charts on a page keep
  their own selection and undo history.
- **Coverage** (`test/coverage.md`): every documented argument of the `GC_*`
  chart functions is used by at least one fixture.
- **Fixed environment:** the tests run in a Docker image (`docker/`) with
  pinned Chromium (Playwright) and fonts, because chart layout depends on
  text measures. The image runs natively on arm64: on Apple silicon
  locally, and on GitHub's `ubuntu-24.04-arm` runners in CI. Chrome under
  amd64 emulation misreads numbers, so emulation is not supported.

## Trying a change in the Shiny app

```sh
npm run try-app               # build, start the app, run the app's tests
npm run try-app -- --no-tests # build and start the app only
npm run try-app -- --r-tests  # also run the R package's tests on the copy
```

This runs the [geneviewer Shiny app](https://github.com/nvelden/geneviewer-shinylive)
with the JavaScript from this repo:

- **Isolated:** the R package is copied to a temporary folder and the built
  files replace its JavaScript there, so neither the R repo nor your R library
  changes.
- **Tests:** the app starts at <http://127.0.0.1:4849/> and the app's
  `tests/testthat` and `tests/browser` suites run against it. The browser
  tests need `puppeteer`.
- **Left running:** the app stays up afterwards so you can try it by hand; the
  script prints the command that stops it.

Set the two repo locations in a `.try-app.env` file (ignored by git):

```sh
GENEVIEWER_R_DIR="/path/to/geneviewer"
GENEVIEWER_APP_DIR="/path/to/geneviewer-shinylive"
```

Set `PORT` to use a port other than 4849.

## Releases

1. Bump `version` in `package.json` and `src/lib/chart.js` (`npm run check`
   compares them).
2. Commit, then tag and push: `git tag v0.3.6 && git push origin main v0.3.6`.

The publish workflow tests and builds, publishes to npm with provenance,
and attaches `dist/` to a GitHub release.

## Using a release in the R package

The R package vendors a release: its copies of the files are stored in the R
repo and shipped inside the package, so users never download JavaScript
separately. From the R repo, a maintainer pulls a release with:

```sh
Rscript dev/update_js.R 0.3.6
```

It downloads `geneviewer.core.js`, `geneviewer.css`, `themes.json`, the
binding and `SHA256SUMS` from the GitHub release, checks the checksums and
writes them to `inst/htmlwidgets/`. Do not edit those copies in the R repo;
make changes here and cut a new release.

## Roadmap

See [docs/roadmap.md](docs/roadmap.md).

## Licence

MIT. Copyright (c) 2023 geneviewer authors. The toolbar icons are Font
Awesome Free (CC BY 4.0); see LICENSE-THIRD-PARTY.md.

## Docs site

The site, for all languages, has its own repository:
[geneviewer-docs](https://github.com/nvelden/geneviewer-docs). It builds with
the newest version of this library on npm, and its tests check that every chart
draws.
