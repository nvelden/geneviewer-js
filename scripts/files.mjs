// Files shipped in each release, by their name in dist/.
//
// bundle: dist/geneviewer.js, built by esbuild from src/<entry> and the
// modules it imports.
export const bundle = { name: "geneviewer.js", entry: "lib/index.js" };

// Copied from src/ unchanged (several sources are joined in order)
export const files = [
  { name: "styles.css", sources: ["styles.css"] },
  { name: "geneviewerwidget.js", sources: ["htmlwidgets/geneviewerwidget.js"] },
];
