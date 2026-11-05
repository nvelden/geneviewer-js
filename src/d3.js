// The d3 the library uses in its ES module and bundled builds: imported from
// the d3 package. The core build (for R) uses the page's global d3 instead.
// esbuild injects this module where the code names `d3`.
import * as d3 from "d3";
export { d3 };
