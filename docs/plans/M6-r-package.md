# M6: R package 0.3.0

**Goal:** the R package builds specs and draws them with the library;
version 0.3.0 accepted on CRAN; the Shinylive app deployed on it.
**Repo:** geneviewer (R). The app repo is touched in M6.7 only.
**Branch:** `m6-js-library` in the R repo.
**Needs:** M5 released (npm 0.3.0 and its GitHub release).

## Rules for this milestone

- **Exported functions keep working as they are:** every function in
  `NAMESPACE`, its arguments and their defaults, and its argument checks and
  error messages, which users rely on.
- Charts look the same. M1's fixtures, drawn from R 0.3.0's output, must
  match their baselines.
- Shiny input names and types stay the same.

## Steps

### M6.1: Vendor the library

- `dev/update_js.R <version>`:
  1. downloads from the GitHub release `geneviewer.core.js`,
     `geneviewer.css`, `geneviewerwidget.js`, `themes.json` and
     `SHA256SUMS`;
  2. verifies the checksums;
  3. writes them to `inst/htmlwidgets/lib/geneviewer-<version>/` (the
     binding goes to `inst/htmlwidgets/`);
  4. updates `inst/htmlwidgets/geneviewer.yaml`, and removes the old
     folder.
- `tests/testthat/test-vendored-js.R`: the vendored files match the
  vendored `SHA256SUMS`.
- `inst/COPYRIGHTS` and `DESCRIPTION` (`Authors@R`, copyright holders) are
  updated for the Font Awesome glyphs.

**Checks:** `devtools::test()` passes; charts still draw: the library
accepts render models until the next step.

### M6.2: `GC_*` build the spec

- Turn the M4.1 spec recording into the only output: `widget$x` becomes
  `list(spec = <spec>)`, and the binding calls `newChart(el, x.spec)`.
- Remove the R code that built the render model, function by function in
  the M4 order. Keep argument checks.
- Keep the data processing, which now writes its results into the spec's
  data: `get_links` (for `GC_links(group = )`), `get_introns` (for
  `GC_transcript()`), `GC_align` and `GC_normalize`.
- Remove helpers in `R/utils.R` and `R/theme.R` that are no longer used.
  `geneviewer_theme()` and `geneviewer_palette()` read the vendored
  `themes.json`.
- Expect about 4,000 fewer lines. Run `R CMD check` to find what is unused.

**Checks:**
- For every M1 fixture, `call.R` evaluated with this branch gives a spec
  equal to the fixture's `spec.json`; this is an R test that reads the
  fixtures from a `GENEVIEWER_JS_DIR` checkout and is skipped without it.
- The fixtures drawn from this output match their SVG baselines: run the
  geneviewer-js harness on payloads exported from this branch.

### M6.3: Tests

- Tests that check render-model details (`widget$x$series[[...]]` and so
  on) are rewritten:
  - to check the spec, when the test is about what R records;
  - or to draw with chromote (`tests/testthat/helper-chrome.R`) and check
    the DOM, when the test is about the result. These are skipped on CRAN,
    as today.
- No test is deleted without replacing what it checked. List each
  rewritten test in the report.

**Check:** `devtools::test()` passes with `NOT_CRAN=true` and Chrome.

### M6.4: Docs and NEWS

- **NEWS** under `# geneviewer 0.3.0`:
  - charts are drawn by the geneviewer JavaScript library;
  - they look and behave the same;
  - code that read `widget$x` internals must use `widget$x$spec`;
  - the toolbar's default icons are inline SVG.
- README and vignettes render with no changes in what they show.
- `pkgdown::build_site()` runs without errors (not deployed).

### M6.5: Version

`DESCRIPTION` version `0.3.0`.

### M6.6: CRAN checks

- `R CMD check --as-cran` on the built tarball with R release and R-devel.
- win-builder: release and devel.
- `rhub` on Linux and macOS.
- Fill `cran-comments.md` from these logs only: no claims without a log.

### M6.7: App

- `npm run try-app` with the R branch: point `GENEVIEWER_R_DIR` at it. The
  app's testthat suite and all 12 browser tests must pass. **Niels** clicks
  through.
- The app repo needs no change unless a test shows one. Make any change
  locally and show it to Niels; nothing is committed without his go.

### M6.8: Submit and deploy

- **Niels:** approves the submission. The agent prepares the tarball;
  Niels submits, or approves `devtools::submit_cran()`.
- After CRAN accepts:
  - merge to `main` and tag;
  - check R-universe builds the WebAssembly binary;
  - re-export the Shinylive site, and deploy it on **Niels's** go (the
    app's `deploy-app.yaml` workflow).

## Done when

R 0.3.0 is on CRAN, and the deployed app runs on the library and passes its
browser tests against the deployed URL (`GENEVIEWER_APP_URL`).
