// Assemble the documentation site in _site/: the pages in site/, the built
// library from dist/ and the vendored D3 and FileSaver. Run `npm run build`
// first (`npm run site` does both).
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

if (!existsSync("dist/geneviewer.js")) {
  console.error("dist/ is missing: run npm run build first.");
  process.exit(1);
}

rmSync("_site", { recursive: true, force: true });
cpSync("site", "_site", { recursive: true });
mkdirSync("_site/lib");

const lib = {
  "dist/geneviewer.js": "geneviewer.js",
  "dist/geneviewerwidget.js": "geneviewerwidget.js",
  "dist/styles.css": "styles.css",
  "vendor/d3-7.8.5/d3.min.js": "d3.min.js",
  "vendor/filesaver-2.0.4/FileSaver.min.js": "FileSaver.min.js",
};
for (const [from, to] of Object.entries(lib)) cpSync(from, `_site/lib/${to}`);

// Serve files as they are, without Jekyll processing
writeFileSync("_site/.nojekyll", "");
console.log("built _site/");
