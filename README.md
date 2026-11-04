# geneviewer-js

The D3 rendering code behind [geneviewer](https://github.com/nvelden/geneviewer),
kept in one place so the R package and a future Python package can draw
gene cluster charts with the same JavaScript.

## Contents

| File | What it is |
|------|------------|
| `src/geneviewer.js` | Chart library: genes, links, labels, legends, scales, colour bars, SVG/PNG export |
| `src/styles.css` | Chart styles |
| `src/htmlwidgets/geneviewerwidget.js` | htmlwidgets binding used by the R package: rendering pipeline, toolbar, zoom, selection, drag and undo/redo |

The files run as classic browser scripts. They expect these globals:

- `d3` (D3 7.8.5)
- `saveAs` (FileSaver.js 2.0.4), for the save buttons
- `HTMLWidgets`, for `HTMLWidgets.dataframeToD3` and the widget binding

## Build

```sh
npm run check   # syntax-check the sources
npm run build   # write dist/ and dist/SHA256SUMS
```

The build copies the sources unchanged and unminified, so the R package can
ship readable source, as CRAN expects. D3 and FileSaver are not bundled; each
host package ships them as separate dependencies with their own licences.

## Tests

```sh
npm test               # fixture and interaction tests, in Docker
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

1. Bump `version` in `package.json`.
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

- Separate the shared chart logic in `geneviewerwidget.js` (pipeline, toolbar,
  zoom, selection, undo/redo) from the htmlwidgets-specific parts, so a Python
  binding can reuse it.
- Add an ES-module build with D3 included, for anywidget and Shinylive (Python).
- Split `geneviewer.js` into ES modules.

## Licence

MIT. Copyright (c) 2023 geneviewer authors.
