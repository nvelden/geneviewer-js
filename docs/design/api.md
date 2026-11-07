# geneviewer-js: public API and chart spec

Status: accepted, 2026-11-04. All four open questions were settled as recommended.

## Goal

Make geneviewer a standalone JavaScript charting library, used the way
people use plotly.js:

```html
<script src="https://cdn.jsdelivr.net/npm/geneviewer-js/dist/geneviewer.min.js"></script>
<div id="chart"></div>
<script>
  const chart = geneviewer.newChart("#chart", {
    data: genes,
    fields: { cluster: "cluster", start: "start", end: "end", group: "class" },
    labels: { label: "name" },
    links: { data: homologs, measure: "identity" },  // pairs of genes
  });
  chart.on("click", (event) => console.log(event.detail));
</script>
```

The R package, a future Python package and plain JavaScript all use this
one API. R and Python become thin layers that build a spec and call
`newChart`.

## Where the logic sits today

The R package does more than pass options through. Before the JavaScript
sees a chart, R:

- splits the gene table into one series per cluster, with its own data,
  coordinate range and copy of every component's options;
- resolves per-cluster settings (`GC_labels(cluster = 1)` and so on);
- shifts coordinates for `GC_align()` and `GC_normalize()` (`GC_align()`
  moved into the library in M4);
- computes link pairs for `GC_links()`;
- expands a theme name into its full options (`R/theme.R`, about 780 lines).

The JavaScript then draws that resolved payload. About 4,000 lines of
`R/chart_*.R`, `R/theme.R` and `R/gene_*.R` are this kind of logic.

## Decision 1: resolve the spec in JavaScript

Move chart resolution into the library, as a `compile` step:

```
spec (public, what users write)
  -> compile()  splits clusters, applies per-cluster settings and
                themes, lays out scale breaks and gene tracks
  -> render model (internal; today's R payload)
  -> render()
```

Reasons:

- **Plain JS users need it.** Without it, a JS user would have to write the
  per-cluster payload by hand.
- **One implementation.** Otherwise Python has to port the same 4,000 lines
  of R, and the two ports drift apart.
- **Consistency.** R, Python and JS charts behave identically because the
  same code resolves them.

**The library only builds charts.** Loading and processing data stays in R
and Python (decided 2026-11-04). The line falls here:

| In the library (chart building) | In R and Python (data processing) |
|---------------------------------|-----------------------------------|
| Splitting genes into clusters | File readers: `read_gbk`, `read_gff`, `read_fasta`, `read_bed`, `gbk_features_to_df`, `genbank_to_fasta` |
| Per-cluster settings, defaults, themes, palettes | Alignment: `protein_blast`, `mummer_alignment` |
| Reading strand values (`+`, `1`, `complement`, ...) | Introns from exons (`get_introns`, used by `GC_transcript`) |
| Automatic scale breaks at gaps | Matching genes for links (`GC_links(group = )`) |
| Gene tracks to avoid overlap | Shifting coordinates: `GC_normalize` |
| Drawing links from a links table | |
| Aligning clusters on a gene (`align`; moved here in M4) | |

So the spec carries finished data: transcripts with their intron rows,
links as a table of pairs, coordinates already normalised. R and
Python both implement the processing functions, and must give identical
results.

Cost: the R `GC_*` functions change from building the render model to
building the spec. This is the largest single piece of work, and it is why
the parity test below matters.

**Parity test.** For every fixture, `compile(spec)` in JavaScript must equal
what R produces today, field for field. This turns the port into a
mechanical, checkable task.

## Decision 2: the spec mirrors the R functions

People who know `GC_labels()` should recognise `labels`. Each `GC_*`
function maps to one top-level key; arguments become camelCase fields.

```js
{
  version: 1,  // optional

  // Data: an array of row objects, or columns ({ start: [...], end: [...] }).
  // Columns are what R and Python send; they are smaller and need no
  // conversion.
  data: [...],
  fields: { cluster: "cluster", start: "start", end: "end",
            group: "class", strand: "strand" },

  width: "100%", height: "400px",
  theme: "dark",                       // a name, or { base: "dark", ... }

  title: { title: "OphA clusters" },
  genes: {}, sequence: {}, transcript: {}, labels: { label: "name" },
  coordinates: {}, scale: {}, scaleBar: {}, grid: {},
  clusterTitle: {}, clusterLabel: {}, clusterFooter: {},
  annotation: [...], tooltip: {}, legend: { group: "class" },
  color: { customColors: { Monooxygenase: "#1f77b4" } },
  pattern: {},
  elementStyle: [...],

  links: { data: [...], measure: "identity" },  // pairs made by R or Python

  zoom: { show: true, range: [2000, 9000] },
  toolbar: {}, events: { select: true }, trackMouse: {},
}
```

**Per-cluster settings.** Any component can be an array. Entries apply in
order; an entry with `clusters` applies only to those clusters (by name or
1-based position, as in R):

```js
labels: [
  { label: "name" },
  { clusters: ["dbophA"], show: false },
]
```

**Versioning.** `version` is the spec version, separate from the package
version. It is optional: a spec without one is version 1, also once later
versions exist. A renderer that sees a newer major version than it knows warns
and draws what it can. Breaking spec changes bump the major version.

**Schema.** The spec is defined once as a JSON Schema in this repo
(`schema/spec-v1.schema.json`; names approved 2026-11-04, see
`schema/NAMING.md`). The
TypeScript types, the reference docs and Python's input validation are
generated from it.

## Decision 3: the JavaScript API

`geneviewer.newChart(target, spec, options)` draws a chart and gives a
`Chart` with methods to update, zoom, select, undo and export it, and
`chart.on()` for its events. `compile(spec)` is public for tests and
debugging. The API itself is documented once: the site's
[API reference](https://nvelden.github.io/geneviewer-docs/api) and
`dist/geneviewer.d.ts`, generated from the JSDoc in `src/lib/`.

The decisions behind it:

- **`update()` deep-merges** into the spec, like plotly's `relayout`;
  `setSpec()` replaces it.
- **Events** are the ones the R package already reports to Shiny, so the R
  and Python bindings forward them unchanged. Each event's payload is typed
  in `ChartEventDetails` (`src/lib/chart.js`).
- **Interaction stays in the library.** Toolbar, zoom slider, selection,
  drag and undo/redo moved out of the R htmlwidgets binding into the
  library, switched on through `toolbar`, `zoom` and `events`, so every
  host gets them.
- **No host dependencies:** no `HTMLWidgets`, FileSaver or Font Awesome.
  Downloads use the browser's own `<a download>`; the toolbar icons are
  inline SVG; styles are injected, with `geneviewer.css` for pages whose
  Content-Security-Policy blocks that.
- **Names:** published on npm as `geneviewer-js`, since npm refused
  `geneviewer` as too similar to `gene-viewer` (2026-11-05). The global
  name stays `geneviewer`. The builds are listed in the README.

## Not in scope for 1.0

- The app's editing panels (they stay in geneviewer-shinylive).
- Rendering without a browser (static images from R or Python). Possible
  later through a headless browser.
- Canvas or WebGL rendering for very large genomes.

## Decisions taken

1. **compile() in JavaScript:** yes.
2. **Spec naming:** mirrors the R function names.
3. **`update()`:** deep-merges into the spec, like plotly's `relayout`.
4. **Global name:** `geneviewer`.
