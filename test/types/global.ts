// The script build: the global `geneviewer`, without an import.
/// <reference path="../../dist/geneviewer.d.ts" />
const globalChart = geneviewer.newChart("#chart", { data: [] });
globalChart.resize();
