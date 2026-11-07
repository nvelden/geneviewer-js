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
builds (see "Files" in the [README](../README.md#files)), `geneviewer.css`, `themes.json`, the R binding,
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

- **Fixtures** (`test/fixtures/`): charts exported from the R package:
  its help-page examples, its vignettes and `test/charts.R`. Each has the
  R code, the spec R recorded and `render.txt`, a canonical listing of the
  drawn chart. `npm test` draws every fixture and compares.
- **compile()** (`npm run test:compile`, in `npm test`): `compile(spec)`
  equals the `payload.json` R 0.2 made, for the fixtures that still have one,
  apart from the approved exceptions (docs/roadmap.md).
- **Interaction tests** (`test/interaction/`): scripted zoom, selection,
  drag and undo/redo, with the chart and its events recorded after each
  step.
- **Two modes:** interaction tests run against the same baselines through
  the R binding, as R draws charts, and with `geneviewer.newChart()`
  (`test/harness/mount.js`). Fixtures run through the R binding in the core
  build and with `newChart()` in the min build.
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

1. `npm version <version>` sets the version, commits and tags. The build
   takes the library's version from `package.json`.
2. Push: `git push origin main v<version>`.

The publish workflow tests, builds, runs the smoke test, publishes to npm with provenance,
and attaches `dist/` to a GitHub release.

## Using a release in the R package

The R package vendors a release: its copies of the files are stored in the R
repo and shipped inside the package, so users never download JavaScript
separately. From the R repo, a maintainer pulls a release with:

```sh
Rscript dev/update_js.R <version>
```

It downloads `geneviewer.core.js`, `geneviewer.css`, `themes.json`, the
binding and `SHA256SUMS` from the GitHub release, checks the checksums and
writes them to `inst/htmlwidgets/`. Do not edit those copies in the R repo;
make changes here and cut a new release.

## Docs site

The site, for all languages, has its own repository:
[geneviewer-docs](https://github.com/nvelden/geneviewer-docs). It builds with
the newest version of this library on npm, and its tests check that every chart
draws.

## Roadmap

See [roadmap.md](roadmap.md).
