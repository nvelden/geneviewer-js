<h1><strong>geneviewer-js</strong> - Gene Cluster Visualizations in JavaScript</h1>

<img src="https://raw.githubusercontent.com/nvelden/geneviewer/main/man/figures/logo.png" height="150px" align="right" alt="geneviewer logo">

[![CI](https://github.com/nvelden/geneviewer-js/actions/workflows/ci.yml/badge.svg)](https://github.com/nvelden/geneviewer-js/actions/workflows/ci.yml) [![npm version](https://img.shields.io/npm/v/geneviewer-js)](https://www.npmjs.com/package/geneviewer-js) [![npm downloads](https://img.shields.io/npm/dt/geneviewer-js)](https://www.npmjs.com/package/geneviewer-js) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

**geneviewer-js** is a JavaScript library for drawing interactive gene cluster, transcript and genome alignment charts in the browser, built on D3. Charts can include legends, labels, annotations, scales, links, colors, tooltips and more, with zooming, selection and SVG or PNG export. The same library draws the charts of the [geneviewer R package](https://github.com/nvelden/geneviewer) and the [geneviewer-py Python package](https://github.com/nvelden/geneviewer-py). To explore all features visit the [documentation](https://nvelden.github.io/geneviewer-docs/).

The library only draws charts, from the data you pass to it. It does not read GenBank, FASTA or GFF files or run alignments; those are done by the R and Python packages.

<br clear="right">

<p align="center"><a href="https://nvelden.github.io/geneviewer-shinylive/"><img src="https://raw.githubusercontent.com/nvelden/geneviewer/main/man/figures/geneviewer_promo.gif" width="100%" alt="geneviewer: load GenBank, FASTA or CSV files, add titles, labels and a legend, zoom in with the zoom bar, drag labels, switch the theme, and save the figure for a paper"/></a></p>

## Installation

You can install **geneviewer-js** from npm with:

```sh
npm install geneviewer-js
```

Or load it from a CDN, with D3 included:

```html
<script src="https://cdn.jsdelivr.net/npm/geneviewer-js@0.3/dist/geneviewer.min.js"></script>
```

## Usage

This example plots a gene cluster from the start and end positions of each gene, colors the genes by class and labels them by name. Click a gene to log its data to the console.

```html
<div id="chart"></div>
<script src="https://cdn.jsdelivr.net/npm/geneviewer-js@0.3/dist/geneviewer.min.js"></script>
<script>
  // Data
  const geneCluster = [
    { name: "ophB1", start: 2522, end: 4276, class: "Monooxygenase" },
    { name: "ophC", start: 5286, end: 4718, class: "NTF2-like" },
    { name: "ophA", start: 9536, end: 10904, class: "Methyltransferase" },
    { name: "ophD", start: 12616, end: 11859, class: "O-acyltransferase" },
    { name: "ophB2", start: 13183, end: 15046, class: "Monooxygenase" },
    { name: "ophP", start: 19346, end: 16016, class: "Prolyloligopeptidase" },
    { name: "ophE", start: 20170, end: 21484, class: "F-box/RNHI-like" },
  ];

  // Chart
  const chart = geneviewer.newChart("#chart", {
    data: geneCluster,
    height: "100px",
    fields: { group: "class" },
    labels: { label: "name" },
    events: { click: true },
  });

  chart.on("click", (event) => console.log(event.detail));
</script>
```

<img src="https://raw.githubusercontent.com/nvelden/geneviewer/main/man/figures/ophA_gene_cluster_2x.png" width="776" alt="The ophA gene cluster: seven labelled gene arrows colored by class, with a legend below"/>

Each row of `data` is one gene. A gene needs a `start` and an `end`; when `start` is greater than `end` the arrow points left, on the reverse strand. The `fields` key says which columns hold what:

| Field | Column that holds | Default |
|-------|-------------------|---------|
| `start`, `end` | The position of the gene | `"start"`, `"end"` |
| `cluster` | The cluster the gene belongs to | One cluster |
| `group` | The group of the gene, which sets its color and the legend | No groups |
| `strand` | The strand of the gene; when set, it decides the arrow direction instead of `start` and `end` | A `strand` column if there is one, otherwise from `start` and `end` |

The rest of the spec has one key per part of the chart (`genes`, `labels`, `links`, `scale`, `theme`, ...); see the API reference in the [documentation](https://nvelden.github.io/geneviewer-docs/) and `dist/spec.d.ts`.

### With a bundler

With a bundler (Vite, webpack, ...), import the ES module; it imports `d3` from npm. `chart.update()` changes a chart that is already drawn:

```js
import { newChart } from "geneviewer-js";

const chart = newChart("#chart", {
  data: [{ name: "geneA", start: 100, end: 900 }],
  labels: { label: "name" },
});

chart.update({ title: { title: "New title" } });
```

### Content-Security-Policy

The library adds its stylesheet to the page. On pages whose Content-Security-Policy blocks that, load `geneviewer-js/geneviewer.css` yourself and pass the option as the third argument:

```js
newChart("#chart", spec, { injectStyles: false });
```

## See it in action

Try the **[Gene Cluster Dashboard](https://nvelden.github.io/geneviewer-shinylive/)** - a web interface that provides point-and-click access to geneviewer's visualization features, with charts drawn by this library. *(Allow 1-2 minutes for loading)* Its source code is in the [geneviewer-shinylive](https://github.com/nvelden/geneviewer-shinylive) repository.

## Files

| File | For |
|------|-----|
| `dist/geneviewer.min.js` | Script tag, global `geneviewer`, D3 included (the Python package's Shiny output) |
| `dist/geneviewer.mjs` | ES module for bundlers (`import ... from "geneviewer-js"`), imports `d3` |
| `dist/geneviewer.standalone.mjs` | ES module with D3 included (`geneviewer-js/standalone`; the Python package's Jupyter widget) |
| `dist/geneviewer.core.js` | Script tag using the page's `d3`, not minified (the R package) |
| `dist/geneviewer.css` | The stylesheet, when styles cannot be added by script |
| `dist/geneviewer.d.ts`, `dist/spec.d.ts` | Types |

## Development

To build, test or release the library, see the [development guide](docs/development.md).

## Issues

If you encounter any issues or have feature requests, please open an [Issue](https://github.com/nvelden/geneviewer-js/issues).

## License

MIT. Copyright (c) 2023 geneviewer authors. The toolbar icons are Font Awesome Free (CC BY 4.0); see [LICENSE-THIRD-PARTY.md](LICENSE-THIRD-PARTY.md).
