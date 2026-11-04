// Entry of the library: the public API. scripts/build.mjs bundles it into
// dist/geneviewer.js, which defines the global `geneviewer`.

// The drawn parts add their methods to container.prototype
import "./components/scale.js";
import "./components/title.js";
import "./components/footer.js";
import "./components/clusterLabel.js";
import "./components/sequence.js";
import "./components/coordinates.js";
import "./components/scaleBar.js";
import "./components/labels.js";
import "./components/tooltip.js";
import "./components/genes.js";
import "./components/transcript.js";
import "./components/legend.js";
import "./components/links.js";
import "./components/trackMouse.js";
import "./components/zoom.js";
import "./components/annotations.js";

export { newChart, version } from "./chart.js";
// The render model of a spec, for tests and debugging (design/api.md)
export { compile } from "./compile/index.js";
// The chart as one SVG document or PNG image. The R binding also makes them
// the globals chartToSVG() and chartToPNG(), which tests in the R package and
// the app use (until M6).
export { chartToSVG, chartToPNG } from "./export.js";
