// Files shipped in each release, by their name in dist/.
//
// bundle: dist/geneviewer.js, built by esbuild from src/<entry>. Until M3.2
// the classic scripts in `scripts` are joined into one module for it, which
// exports the functions in `exports`.
export const bundle = {
  name: "geneviewer.js",
  entry: "index.js",
  scripts: ["geneviewer.js", "chart.js"],
  exports: ["chartToSVG", "chartToPNG"],
};

// Copied from src/ unchanged (several sources are joined in order)
export const files = [
  { name: "styles.css", sources: ["styles.css"] },
  { name: "geneviewerwidget.js", sources: ["htmlwidgets/geneviewerwidget.js"] },
];
