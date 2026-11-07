// Files shipped in each release, by their name in dist/.

// Bundles of src/lib/index.js (scripts/bundle.mjs settings)
export const bundles = [
  // Script tag, D3 included: CDN and plain HTML pages
  { name: "geneviewer.min.js", format: "iife", d3: "bundle", minify: true, sourcemap: true },
  // ES module importing d3 from npm: bundlers
  { name: "geneviewer.mjs", format: "esm", d3: "import" },
  // ES module, D3 included: browser import, anywidget
  { name: "geneviewer.standalone.mjs", format: "esm", d3: "bundle", minify: true, sourcemap: true },
  // Script tag using the page's d3, not minified: the R package (CRAN wants
  // readable source)
  { name: "geneviewer.core.js", format: "iife", d3: "global" },
];

// Copied unchanged, paths from src/ (several sources are joined in order)
export const files = [
  { name: "geneviewer.css", sources: ["styles.css"] },
  { name: "themes.json", sources: ["themes.json"] },
  { name: "geneviewerwidget.js", sources: ["htmlwidgets/geneviewerwidget.js"] },
  // For the docs site and the Python package
  { name: "spec-v1.schema.json", sources: ["../schema/spec-v1.schema.json"] },
];
