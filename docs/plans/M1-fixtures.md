# M1: Reference fixtures

**Goal:** a test suite that records what the R package draws today, for
every `GC_*` function and argument, and fails when the JavaScript draws
anything different.
**Repo:** geneviewer-js (reads the R package; does not change it).
**Branch:** `m1-fixtures`.

> **As built (2026-11-04):** the test image runs natively on arm64 with
> Chromium pinned by Playwright, not amd64 Chrome via puppeteer. Chrome
> under emulation misread numbers. Baselines are `render.txt` listings, and
> payloads are exported with `htmlwidgets:::createPayload()`. See
> [reports/M1.md](reports/M1.md).

## Background

- The R package builds a payload (`widget$x`) and the JavaScript draws it.
  A fixture stores one chart: the R code, the payload and the SVG drawn
  from it.
- `site/examples/*.json` and `scripts/export-examples.R` already export six
  payloads; reuse that approach.
- **Fonts decide layout.** Label wrapping, label spreading and title sizes
  depend on measured text width, which differs between macOS and Linux
  fonts. SVGs are therefore only compared inside one Docker image with
  fixed fonts, both locally (Docker is installed) and in CI.
- Drawing is synchronous after `renderValue()`. The `geneviewer:rendered`
  event fires only when `events.rendered` is set, so the harness waits for
  `document.fonts.ready` and two animation frames instead.
- There is no `Math.random` or `Date.now` in the drawing code. Element ids
  come from counters, so they are deterministic on a fresh page.

## Layout

```
test/
  fixtures/
    <id>/
      call.R          R code that builds the chart; last expression is the widget
      payload.json    widget$x as htmlwidgets serialises it
      meta.json       { "id", "width": 1000, "height", "covers": [...] }
      chart.svg       normalised SVG baseline
  charts.R            the list of fixture charts (source of call.R)
  harness/
    index.html        loads d3, FileSaver, geneviewer.js, the htmlwidgets
                      stand-in and geneviewerwidget.js
    render.mjs        draws one fixture and returns normalised SVG
  run.mjs             npm test: draw every fixture, compare with chart.svg
  coverage.R          which GC_* arguments the fixtures use
docker/
  Dockerfile          Node, pinned Chrome (puppeteer), fonts
  fonts.conf          maps sans-serif, serif, monospace, Arial, Helvetica,
                      Times to the bundled fonts
```

## Steps

### M1.1: Docker image and harness

- **Image:** `docker/Dockerfile` based on `node:22-bookworm-slim`.
  Install Chrome's runtime libraries and `fonts-dejavu-core`,
  `fonts-liberation2` and `fontconfig`, plus puppeteer pinned to an exact
  version, which pins Chrome. Copy `fonts.conf` to
  `/etc/fonts/local.conf`. Add a `package.json` devDependency for the same
  puppeteer version.
- **Harness page:** move the htmlwidgets stand-in from `site/assets/embed.js`
  to `test/harness/htmlwidgets-shim.js`, and make the site load it from
  there. One copy only; the build copies it into `_site`.
- **`render.mjs`:**
  - Takes a payload and a size, opens a fresh page, sets the container to
    1000 px wide by `meta.height`, calls the binding's `renderValue`, then
    waits for fonts and two animation frames.
  - Returns the container's `innerHTML`, normalised:
    - attributes sorted;
    - numbers rounded to 2 decimals;
    - `style` declarations sorted;
    - `<style>` elements kept, since they are part of the output.
- **Scripts:**
  - `npm run test:docker` builds the image if needed and runs
    `node test/run.mjs` inside it with the repo mounted.
  - `npm test` runs `test:docker`.
  - `npm run test:update` writes baselines instead of comparing them; it is
    only used in steps that say so.

**Checks:**
- One hand-made fixture, the `ophA` site example, renders.
- Its SVG is identical over three runs.
- Changing one colour in its payload makes the test fail with a readable
  diff of the first differing lines.

### M1.2: Fixture list and export

- `test/charts.R`: a named list of chart expressions. Start with:
  - every chart in the R package's vignettes, except `biomaRt`/network ones;
  - every `@examples` block in `R/*.R` that builds a chart;
  - the six site examples.
- `scripts/export-fixtures.R` (modelled on `scripts/export-examples.R`):
  for each entry, evaluate it with `pkgload::load_all()` on
  `GENEVIEWER_R_DIR`. Write `call.R`, `payload.json` (with
  `htmlwidgets:::toJSON`) and `meta.json`, and stop with an error if a
  payload contains JavaScript functions.
- Ids are short kebab-case names, e.g. `labels-spread-top`.

**Checks:**
- The export runs from a clean checkout.
- Running it twice gives byte-identical files.

### M1.3: Baselines

- Run `npm run test:update` to write `chart.svg` for every fixture.
- Open 10 baselines chosen across features and compare them by eye with
  the same chart in R (`htmlwidgets::saveWidget` and a browser). Note any
  that look wrong in the report: a wrong baseline is a bug in the harness,
  not in the chart.

**Checks:** `npm test` passes; a second `npm test` passes without changes.

### M1.4: Coverage report and gap filling

- `test/coverage.R`:
  - Lists every exported `GC_*` function and its documented arguments,
    parsed from `man/GC_*.Rd`; there are about 284.
  - For each fixture, finds the `GC_*` calls in `call.R` and the argument
    names they use, matched with `match.call()` against the function, so
    positional arguments count.
  - Writes `test/coverage.md`, a table of function, argument and fixture
    ids, with uncovered arguments first.
- Add fixtures to `test/charts.R` until every argument is covered.
- Group related arguments in one fixture where that keeps it readable; aim
  for 80 to 150 fixtures. Each extra fixture is a short chart on the
  bundled datasets (`ophA_clusters`, `BRCA1_splice_variants`,
  `pQEB1_plasmids` and so on).
- Arguments that cannot be shown in a static chart (Shiny-only, such as
  `GC_events(render_id = )`) are listed in `coverage.md` as "not drawable",
  with the reason.

**Checks:**
- `coverage.md` shows 0 uncovered arguments apart from "not drawable" ones.
- `npm test` passes.

**Niels:** reviews `coverage.md`.

### M1.5: Interaction fixtures

Static SVGs do not cover zoom, selection, drag and undo/redo, so add
scripted checks:

- `test/interaction/*.mjs`, each one a fixture plus a sequence of actions
  (drag the zoom window, click a gene, Shift-click a second, drag a label,
  undo, redo, reset).
- After each action, compare the normalised SVG with a baseline and record
  the `geneviewer:*` events with their details.
- At least: zoom (`relative` and `absolute`), selection (click, Shift-click,
  box), drag of label/title/legend/scale with undo/redo/reset, and the
  keyboard shortcuts.

**Checks:** all pass twice in a row in Docker.

### M1.6: CI

- `.github/workflows/test.yml`: on push and pull request, build the Docker
  image (cached) and run `npm test` and the interaction tests.
- The fixture files are committed, so CI does not need R.

**Check:** the workflow passes on the branch, pushed to GitHub to run it.

## Done when

- `npm test` and the interaction tests pass locally in Docker and in CI.
- `coverage.md` has no uncovered drawable arguments.
- **Niels** has reviewed `coverage.md`; the branch is merged into `main`.

## Pitfalls

- **Payload size.** Some payloads are large (`erythromycin-blastp` is
  277 KB). Prefer smaller datasets for new fixtures.
- **Fonts.** If text differs between runs in Docker, fonts are not pinned
  properly; fix `fonts.conf` rather than loosening the comparison.
- **Normalising.** Rounding hides real differences below 0.01 px; do not
  round more coarsely.
