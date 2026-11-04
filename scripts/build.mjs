// Build dist/: the release files (flat, as GitHub release assets are) plus SHA256SUMS.
//
// dist/geneviewer.js is bundled by esbuild from src/lib/index.js: a classic script
// that defines the global `geneviewer` and uses the page's global `d3`. It is
// not minified, so the R package can ship it as readable source and verify it
// against SHA256SUMS. The other files are copied from src/ unchanged.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { bundleScript } from "./bundle.mjs";
import { bundle, files } from "./files.mjs";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");

const outputs = { [bundle.name]: await bundleScript(`src/${bundle.entry}`, "geneviewer") };
for (const { name, sources } of files) {
  const parts = sources.map((source) => readFileSync(`src/${source}`, "utf8"));
  // Each part ends with exactly one newline, so the parts join cleanly
  outputs[name] = parts.map((part) => part.replace(/\n*$/, "\n")).join("\n");
}

const sums = [];
for (const [name, content] of Object.entries(outputs)) {
  writeFileSync(`dist/${name}`, content);
  sums.push(`${createHash("sha256").update(content).digest("hex")}  ${name}`);
  console.log(`built dist/${name}`);
}
writeFileSync("dist/SHA256SUMS", sums.join("\n") + "\n");
console.log("built dist/SHA256SUMS");
