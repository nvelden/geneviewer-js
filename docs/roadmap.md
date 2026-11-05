# Roadmap

From the JavaScript inside the geneviewer R package to one library used by
JavaScript, R and Python. Written 2026-11-04. The API design is in
[design/api.md](design/api.md); step-by-step development plans for each
milestone are in [plans/](plans/README.md).

## Ground rules

These were decided with the maintainer on 2026-11-04 and apply to every
milestone.

- **Who does what.** Claude builds everything, following the plans in
  [plans/](plans/README.md), and commits step by step on a milestone
  branch. Niels reviews at the end of each milestone and at the points
  marked **Niels**.
- **Merging.** After Niels approves a milestone, Claude merges it into
  `main` and pushes. Tags, releases (GitHub, npm, PyPI, CRAN) and app
  deployments still need Niels's go each time.
- **Chart building only.** The JS library builds and draws charts. Loading
  and processing data stays in R and Python: file readers, protein
  alignment, MUMmer, matching genes for links, introns, and aligning or
  normalising positions. See design/api.md, Decision 1.
- **Bugs found in R.** A bug in R's current behaviour found during the port
  is fixed in R on `main` straight away, with a test. The affected fixtures
  are regenerated and the fixed behaviour is ported. It ships with R
  0.3.0; there is no extra CRAN release.
- **Order.** JS library first, then the R package switches to it, then the
  Python package. No calendar dates: each milestone starts when the one
  before it has passed its exit check.
- **Parity.** The library must draw exactly what R draws today: the resolved
  chart data and the SVG must match. Every intended difference goes on the
  exceptions list (below) and needs Niels's approval.
- **Icons.** The toolbar's default icons are inline SVG; custom icons by
  Font Awesome name still work where Font Awesome is loaded.
- **Language.** Plain JavaScript with JSDoc comments. Type definitions are
  generated from the JSDoc and the JSON Schema; no TypeScript source.
- **Versions.** One version line for the library, continuing from v0.2.0.
  The first npm release is 0.3.0. The library stays 0.x until the R and
  Python packages are both released on it, then becomes 1.0.0. The R package
  that switches over is 0.3.0.
- **Publishing.** npm and PyPI releases are published by GitHub Actions when
  a version tag is pushed, using trusted publishing (no stored tokens).
- **Shiny app.** The Gene Cluster Dashboard stays an R app. It gets the new
  library through the R package.

## Overview

| # | Milestone | Size | Repo | Ends with |
|---|-----------|------|------|-----------|
| M0 | Housekeeping | S | geneviewer-js | Clean repo, bug triage recorded |
| M1 | Reference fixtures | M | geneviewer-js | SVG regression tests in CI |
| M2 | Library core | L | geneviewer-js | `newChart(el, renderModel)`; thin R binding |
| M3 | Modules and schema | M | geneviewer-js | ES modules, esbuild, JSON Schema for spec v1 |
| M4 | `compile()` in JavaScript | L | both | Full parity with R for chart building |
| M5 | npm 0.3.0 | M | geneviewer-js | On npm and jsDelivr; full docs site |
| M6 | R package 0.3.0 | L | geneviewer | On CRAN; app deployed on the new library |
| M7 | Python package 0.1.0 | XL | geneviewer-python | On PyPI, working in Shiny for Python |
| M8 | 1.0.0 | S | all | Spec v1 frozen; library 1.0.0 |

Sizes are relative: S is a single short piece of work, XL is the largest.

## M0: Housekeeping

- Commit the open work in this repo: `scripts/try-app.sh`, the design
  document and the README sections.
- **Bug triage** (`dev/BUGLIST.md` in the R repo). Of B01 to B61, only B48
  is open: `read_gff` makes list columns when a key repeats in a row, and
  GTF/GFF2 files are not supported. It is a file reader issue, not a
  rendering one, so it does not block the port. It is scheduled in M7, fixed
  in R first so the Python reader copies the corrected behaviour.

**Exit:** working tree clean; triage noted in BUGLIST.md.

## M1: Reference fixtures

The safety net for everything after it.

- **Harvest charts from R.** Record the payload (`widget$x`) of every chart
  the R package builds in its test suite, vignettes and examples. Each
  fixture stores the R call, the payload and the drawn SVG.
- **Render harness.** `npm test` draws every payload in headless Chrome with
  the current bundle and compares the SVG with the stored one. Generated ids
  are normalised first so they do not cause false failures.
- **Coverage.** A report lists which `GC_*` functions and arguments the
  fixtures use. Fixtures are added until every exported `GC_*` function and
  every documented argument appears at least once.
- **CI.** The fixture tests run on every push.

**Review:** Niels checks the coverage report.
**Exit:** `npm test` passes in CI; every `GC_*` argument covered.

## M2: Library core

- Move the render pipeline, toolbar, zoom, selection, drag and undo/redo out
  of `geneviewerwidget.js` into the library as
  `newChart(el, renderModel)`, with `chart.on()` events. The
  `geneviewer:<name>` DOM events stay.
- Remove the library's dependencies on its host:
  - `HTMLWidgets.dataframeToD3`: a library function instead.
  - FileSaver: the browser's own download, with `options.saveAs` to override it.
- The R htmlwidgets binding becomes a thin layer: it calls `newChart` and
  forwards events to Shiny inputs, with the same input names as today.
- The docs site drops its stand-in for `HTMLWidgets`.

**Exit:** all SVG baselines identical; `npm run try-app` passes (12 browser
tests and the app's testthat suite); Niels clicks through the app.

## M3: Modules and schema

- Split `geneviewer.js` into ES modules by component. Bundle with esbuild;
  the core build stays unminified and readable for CRAN.
- Write the **JSON Schema for spec v1**: every component and option, named
  after the R functions and arguments in camelCase (`GC_labels(label = )` →
  `labels.label`). This fixes the public names.
- JSDoc types on the public API; generate `geneviewer.d.ts`.

**Review:** Niels approves the schema, the most important review of the
project, because these names become public.
**Exit:** SVG baselines identical; schema approved.

## M4: `compile()` in JavaScript

Move spec resolution from R to the library, with full parity.

1. **R records the spec.** Each `GC_*` function also writes what it was
   asked for into `widget$x$spec`, next to the payload it builds today. This
   does not change output. The fixtures are then regenerated, so each holds
   the spec and the payload from the same R call.
2. **Port, in this order.** For each group, port the R logic and check that
   `compile(spec)` equals R's payload for every fixture that uses it:
   1. Data and clusters: column/row data, `fields`, splitting into clusters,
      strand, coordinate ranges.
   2. Genes, sequence, labels, coordinates, tooltip, colours, legend.
   3. Title, cluster title, label and footer; `cluster` and `grid`.
   4. Scale, scale breaks and scale bar.
   5. Links: drawing a given table of pairs. Matching genes, `align` and
      `normalize` stay in R.
   6. Transcripts.
   7. Annotations, patterns, element styles.
   8. Themes (the 780 lines of `R/theme.R`).
   9. Zoom, toolbar, events, trackMouse.
3. **Per-cluster settings** (`clusters: [...]`) are covered within each
   group, since most `GC_*` functions take `cluster =`.

**Review:** Niels approves every entry on the exceptions list.
**Exit:** for every fixture, `compile(spec)` equals R's payload, apart from
approved exceptions; SVG baselines identical.

## M5: npm 0.3.0

- **Builds:**
  - `geneviewer.min.js`: script tag, D3 included, with source map.
  - `geneviewer.mjs`: ES module that imports `d3` from npm.
  - `geneviewer.standalone.mjs`: ES module with D3 included.
  - `geneviewer.core.js`: script tag, uses the page's `d3`, for R.
  - `geneviewer.css` and `geneviewer.d.ts`.
- **Icons:** the default toolbar icons become inline SVG copies of the same
  Font Awesome glyphs (CC BY 4.0, credited), so the library needs no icon
  font. Custom icons by Font Awesome name (`GC_toolbar(icons = )`) keep
  working when Font Awesome is on the page, which the R package still
  provides.
- **Package:** `package.json` exports, files, README and LICENSE for npm; a
  release workflow that publishes on a version tag.
- **Docs site:** the examples show JavaScript, with R in a second tab. Add a
  full API reference generated from the schema, a getting-started guide, and
  examples for a plain HTML page and for a bundler (Vite). Remove the
  "Planned" labels.

**Niels, once:** create the npm account with two-factor sign-in and link the
repository for trusted publishing.
**Exit:** `npm install geneviewer` and the jsDelivr URL work in a fresh
project; docs site live.

## M6: R package 0.3.0

- `GC_*` functions build only the spec; the R chart-resolution code that
  `compile()` replaces is removed. The data processing (`get_links`,
  `GC_align`, `GC_normalize`, `get_introns`) stays and writes its results
  into the spec's data.
- The htmlwidgets binding ships `geneviewer.core.js`, vendored from a library
  release by `dev/update_js.R`, with a checksum check in R CMD check CI.
- R tests that inspect payload details are rewritten to test the spec, or
  move to browser tests (chromote).
- NEWS: charts look the same; code that read `widget$x` internals must read
  `widget$x$spec`.
- **Shiny app:** `npm run try-app` passes; after release, R-universe rebuilds
  the WebAssembly binary and the app is re-exported and deployed (on Niels's
  go).
- CRAN checks: R release and R-devel on Linux, macOS and Windows
  (win-builder); `cran-comments.md` filled from those logs.

**Review:** Niels approves the submission and the app deployment.
**Exit:** 0.3.0 accepted on CRAN; app deployed on the new library.

## M7: Python package 0.1.0

New repo `nvelden/geneviewer-python`; package `geneviewer` on PyPI.

- **Chart API:** method chaining that mirrors the R functions, e.g.
  `GC(df, cluster="cluster", group="class").labels("name").links("class")`.
  It builds the spec, which is checked against the JSON Schema.
- **Shiny for Python:** a chart output and the same events as R, as inputs
  with the same names (`input.<id>_select()`, `_zoom`, `_drag` and so on).
  This is the one environment the first release must support.
- **Readers:** port `read_gbk`, `read_gff`, `read_fasta`, `read_bed` and
  `gbk_features_to_df` from R, with their bug fixes. Fix B48 in R first.
  Tests: the same files give the same tables as R.
- **Alignment:** `protein_blast` with Biopython's `PairwiseAligner`, set up
  like the R defaults; results close to R's, with known differences
  documented. `mummer_alignment` runs MUMmer as R does.
- **Chart data processing:** matching genes for links, introns, align and
  normalize, ported from R with identical results.
- The JavaScript is vendored from a library release, as in R.
- README with examples; a release workflow that publishes to PyPI on a tag.

**Niels:** approve the Python API names and the PyPI registration.
**Exit:** 0.1.0 on PyPI; a Shiny for Python app reproduces the R vignette
charts.

## M8: 1.0.0

Once R 0.3.0 is on CRAN and Python 0.1.0 on PyPI: freeze spec v1 and release
the library as 1.0.0. The next R and Python releases ship 1.0.0.

## Later

Not scheduled:
- **Python:** Jupyter (anywidget), standalone HTML export and Quarto, and
  Pyodide/Shinylive.
- **Rendering without a browser:** static images from R or Python.
- **Large genomes:** Canvas rendering.

## Exceptions list

Intended differences between R's output today and the library's. Each needs
Niels's approval before the milestone that introduces it closes.

| # | Milestone | Difference | Reason | Approved |
|---|-----------|------------|--------|----------|
| 1 | M4 | A chart without a server reports clicks when `events.click` is on: `chart.on("click")` handlers and the `geneviewer:click` DOM event. With `events.highlight` also on, the element gets the hover highlight (`geneviewer-highlight`) in standalone R output too. | `chart.on("click")` is public API but fires only with `server: true` (Shiny), so JavaScript users never get clicks. | Niels, 2026-11-04 |
| 2 | M4 | `GC_chart()` of GenBank files (`rd-GC-chart-2`): the render model's `params` has `cluster` and `strand`, which R sets only after reading the files. | `params` is R's copy of the call for `GC_transcript()`; the renderer does not read it. compile() takes it from the spec's `fields`. Draws the same. | Niels, 2026-11-04 |
| 3 | M4 | After `GC_normalize(cluster = )` on some clusters (`rd-GC-normalize-1`, `vig-geneviewer-26`, `vig-geneviewer-27`), the other clusters' data has `original_start` and `original_end`, all null; in R they had no such columns. | The spec's data has the columns for all rows; compile() splits it into clusters as R does. Not drawn; tooltips leave out empty fields. Draws the same. | Niels, 2026-11-04 |
| 4 | M4 | `GC_tooltip(FALSE)` (`vig-geneviewer-53` to `-62`): the tooltip's `formatter` is the default text, not `false`. | The spec records `show: false`; the formatter of a hidden tooltip is not used. Draws the same. | Niels, 2026-11-04 |
| 5 | M4 | `GC_chart(save_button = FALSE)` (`cov-chart-without-extras`): the render model has `toolbar.buttons` without "save"; R had no toolbar options. | NAMING.md case 1: the spec has no `saveButton`. The toolbar draws the same. | Niels, 2026-11-04 |

## Risks

- **M4 is the largest piece, and behaviour lives in R details:** factor
  order, `NA` handling, rounding and sorting. The fixtures catch these, but
  some will take several passes.
- **M6 test rewrite:** R tests that check payload internals lose their target
  when resolution moves to JavaScript.
- **Coverage gaps in M1** let differences through unnoticed. The coverage
  report and Niels's review of it are the defence.
