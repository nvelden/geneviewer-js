# geneviewer-js

The D3 rendering code behind [geneviewer](https://github.com/nvelden/geneviewer),
kept in one place so the R package and a future Python package can draw
gene cluster charts with the same JavaScript.

## Contents

| File | What it is |
|------|------------|
| `src/lib/index.js` | Entry of the bundle: the public API, what the global `geneviewer` holds |
| `src/lib/chart.js` | `geneviewer.newChart()`: the chart, with its toolbar, zoom, selection, drag and undo/redo |
| `src/lib/container.js` | The container of one chart part; `components/*.js` add a method to it for each part drawn (genes, labels, legend, ...) |
| `src/lib/*.js` | Shared helpers: `util`, `style`, `text`, `color`, `scale`, `links` (and colour bar), `export` (SVG/PNG, save menu) |
| `src/styles.css` | Chart styles |
| `src/htmlwidgets/geneviewerwidget.js` | htmlwidgets binding used by the R package: calls `newChart` and sends events to Shiny |

The sources are ES modules. esbuild bundles them into `dist/geneviewer.js`, a classic browser
script that defines the global `geneviewer` and needs the global `d3` (D3
7.8.5); the binding also needs `HTMLWidgets`.

```js
const chart = geneviewer.newChart(el, renderModel, { on: { select: (e) => console.log(e.detail) } });
chart.on("zoom", (e) => console.log(e.detail));
```

The render model is what the R package sends today (`widget$x`); from M4 it
is the chart spec. Events also arrive as `geneviewer:<name>` DOM events on
`el`. The save menu downloads with the browser; pass `options.saveAs(blob,
filename)` to save another way.

## Build

```sh
npm run check   # syntax-check the sources
npm run build   # write dist/ and dist/SHA256SUMS
```

`npm run build` needs the dev dependencies (`npm ci`). The bundle is not
minified, so the R package can ship readable source, as CRAN expects;
esbuild does drop the comments. D3 is not bundled; each host package
ships it as a separate dependency with its own licence.

## Tests

```sh
npm test               # all tests, in Docker
npm run test:update    # write new baselines (only when output should change)
Rscript scripts/export-fixtures.R   # re-export fixtures from the R package
Rscript test/coverage.R             # update test/coverage.md
```

- **Fixtures** (`test/fixtures/`): 206 charts exported from the R package:
  its help-page examples, its vignettes and `test/charts.R`. Each has the
  R code, the payload R sends to the browser, and `render.txt`, a canonical
  listing of the drawn chart. `npm test` draws every payload and compares.
- **Interaction tests** (`test/interaction/`): scripted zoom, selection,
  drag and undo/redo, with the chart and its events recorded after each
  step.
- **Two modes:** fixtures and interaction tests run twice against the same
  baselines: through the R binding, as R draws charts, and with
  `geneviewer.newChart()` directly (`test/harness/mount.js`).
- **Save, two-chart and site checks** (`test/save.cjs`,
  `test/two-charts.cjs`, `test/site.cjs`): the save menu downloads a valid
  SVG and PNG; two charts on a page keep their own selection and undo
  history; every chart on the docs site draws without errors.
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
2. Commit, then tag and push: `git tag v0.2.1 && git push origin main v0.2.1`.

The release workflow checks that the tag matches `package.json`, builds
`dist/` and publishes the files with `SHA256SUMS` as a GitHub release.

## Using a release in the R package

The R package vendors a release: its copies of the files are stored in the R
repo and shipped inside the package, so users never download JavaScript
separately. A maintainer pulls a new release with:

```sh
curl -sSLO https://github.com/nvelden/geneviewer-js/releases/download/v0.2.0/{geneviewer.js,styles.css,geneviewerwidget.js,SHA256SUMS}
shasum -a 256 -c SHA256SUMS
```

They then copy the files into `inst/htmlwidgets/`. Do not edit those copies in
the R repo; make changes here and cut a new release.

## Roadmap

See [docs/roadmap.md](docs/roadmap.md). Next:

- Add an ES-module build with D3 included, for anywidget and Shinylive (Python).
- Split `geneviewer.js` into ES modules.

## Licence

MIT. Copyright (c) 2023 geneviewer authors.
