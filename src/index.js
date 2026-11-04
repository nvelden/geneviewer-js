// Entry of the bundle (scripts/build.mjs), which esbuild builds into
// dist/geneviewer.js with the global name `geneviewer`. Until the sources
// are split into modules, geneviewer.js and chart.js are classic scripts:
// the build joins them into the one module "geneviewer:scripts", which sets
// window.geneviewer, and this file exports what it holds.
import "geneviewer:scripts";

export const { newChart, version } = window.geneviewer;
// The chart as one SVG document or PNG image. The R binding also makes them
// the globals chartToSVG() and chartToPNG(), which tests in the R package and
// the app use.
export { chartToSVG, chartToPNG } from "geneviewer:scripts";
