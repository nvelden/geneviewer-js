# M2: Library core

**Goal:** the chart, with all its interaction, runs from
`geneviewer.newChart(el, renderModel, options)` with no htmlwidgets, Shiny
or FileSaver. The R binding becomes a thin layer over it.
**Repo:** geneviewer-js.
**Branch:** `m2-core`.
**Needs:** M1 merged (fixtures and interaction tests).

## Background

- `src/htmlwidgets/geneviewerwidget.js` (about 1,700 lines) is one
  `HTMLWidgets.widget({ factory })`. Inside `factory(el, width, height)` it
  holds the chart's state and logic:
  - the draw pipeline (`draw`, `renderValue`);
  - toolbar and save menu;
  - zoom slider (`zoomTargets`, `reportZoom`);
  - selection (`selection`, `changeSelection`, box select);
  - drag, nudge and move history (`createMoveHistory`, undo/redo/reset);
  - keyboard shortcuts;
  - event reporting (`report`, which calls `Shiny.setInputValue` in Shiny
    and always dispatches a `geneviewer:<name>` DOM event).
- Host dependencies to remove:
  - `HTMLWidgets.dataframeToD3`: 5 uses in `geneviewer.js` and the binding.
  - `HTMLWidgets.shinyMode` and `Shiny.setInputValue` /
    `Shiny.addCustomMessageHandler("geneviewer-zoom")`: binding only.
  - `saveAs`: `geneviewer.js` lines ~1102 and ~1108.
- Nothing outside these files calls the library's functions; the app and
  the R package only use DOM events and Shiny inputs.
- The output must not change: every M1 baseline stays identical.

## Target shape

```js
// src/chart.js: classic script for now (ES modules come in M3)
geneviewer.newChart(el, renderModel, { saveAs }) → chart

chart.update(renderModel)       // draw again with a new model
chart.resize()                  // draw at the element's current size
chart.on(name, handler) → off   // events: click, dblclick, select, selection,
chart.off(name, handler)        //   drag, moves, zoom, rendered
chart.zoomTo(range)
chart.toSVG() / chart.toPNG()
chart.destroy()
```

Events go to `chart.on` handlers and are also dispatched as
`geneviewer:<name>` DOM events, as today. `update`/`zoomTo` take the
render model in M2; M4 changes them to take the spec.

## Steps

### M2.1: Library-owned data conversion

- Add `toRows(data)` to `geneviewer.js`: columns to rows, rows passed
  through. It must behave exactly like the htmlwidgets stand-in in
  `test/harness/htmlwidgets-shim.js`.
- Replace every `HTMLWidgets.dataframeToD3` call in `geneviewer.js` and the
  binding with `toRows`.

**Checks:** `npm test` and the interaction tests pass; `grep -n HTMLWidgets
src/geneviewer.js` finds nothing.

### M2.2: Downloads without FileSaver

- Add `downloadBlob(blob, filename)`: an `<a download>` link with an object
  URL, revoked afterwards.
- The save functions take a `saveAs` function from the chart's options and
  fall back to `downloadBlob`.

**Checks:**
- The tests pass.
- In the harness, the save menu triggers a download of `graph.svg` and
  `graph.png`: the test intercepts the download and checks the bytes start
  with `<svg` and the PNG signature.

### M2.3: Move the chart out of the factory

- Create `src/chart.js`. Move the body of `factory` into
  `newChart(el, renderModel, options)`, keeping the code as it is apart from
  these changes:
  - `report(name, detail)` calls `chart.on` handlers and dispatches the DOM
    event. It no longer knows about Shiny.
  - The Shiny zoom handler becomes `chart.zoomTo(range)`.
  - `renderValue(input)` becomes the initial draw plus `chart.update()`.
  - Module-level state (`renderSequence`, `activeShortcuts`, `zoomTargets`,
    `zoomHandlerAdded`) stays module-level where it is shared across
    charts; per-chart state lives inside `newChart`.
- `scripts/build.mjs` concatenates `src/geneviewer.js` and `src/chart.js`
  into `dist/geneviewer.js`, so the set of dist files, and therefore
  `try-app`, stays the same.
- `window.geneviewer = { newChart, version }` is defined at the end.

**Checks:**
- The harness gets a second mode that calls `geneviewer.newChart` directly.
  `npm test` passes in both modes: the old binding still exists at this
  step.
- The interaction tests pass in both modes.

### M2.4: Thin R binding

- Rewrite `src/htmlwidgets/geneviewerwidget.js` to about 100 lines:
  - `factory` creates the chart with `newChart(el, x, { })` on the first
    `renderValue` and calls `chart.update(x)` after that.
  - In Shiny mode it maps every event to `Shiny.setInputValue`. Input names
    and types must be the same as today: `<id>_click`, `_select`,
    `_selection` (with the `:geneviewer.list` type for arrays), `_dblclick`,
    `_drag`, `_moves`, `_zoom`, `_rendered`, with `priority: "event"`.
  - It registers the `geneviewer-zoom` message handler, calling
    `chart.zoomTo`.
  - `resize` calls `chart.resize()`.

**Checks:**
- `npm test` and the interaction tests pass (binding mode).
- `npm run try-app` passes: testthat and all 12 browser tests.
- The R package's own browser tests pass against the new JS. Run
  `devtools::test()` in a temporary copy of the R package with `dist/`
  copied in, the same way `try-app` does; add a `--r-tests` flag to
  `try-app` for this.

**Niels:** clicks through the app at the URL `try-app` prints: zoom,
select, drag, undo/redo, save, every example dataset.

### M2.5: Docs site on newChart

- The site's charts call `geneviewer.newChart(el, payload.x)`; drop the
  stand-in from the site (the test harness keeps it for binding mode).
- The event log on the examples page uses `chart.on`.

**Checks:** `npm run site`; the page check from the site work (every chart
draws, no console errors) passes.

### M2.6: Release v0.3.0-alpha.1 (GitHub only)

- Bump `package.json` to `0.3.0-alpha.1`.
- With Niels's go at the milestone review, push the tag. Only a GitHub
  release; nothing goes to npm before M5.

## Done when

- Every M1 baseline is unchanged in both harness modes.
- `try-app` passes, with and without `--r-tests`.
- `grep -nE "HTMLWidgets|Shiny|saveAs\(" src/geneviewer.js src/chart.js`
  finds nothing.
- **Niels** has clicked through the app and approved; branch merged.

## Pitfalls

- **Shared state.** Two charts on one page must not share selection or
  history. Add an interaction test with two charts.
- **`this` in `mergeOptions`.** It reads `this?.themeOptions`. In a module
  or strict code, `this` is `undefined` where it used to be `window`, so
  check every caller passes the right `this`.
- **Shiny priority.** Events must keep `priority: "event"`, or repeated
  identical events stop reaching the server.
