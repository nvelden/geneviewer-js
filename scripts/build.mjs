// Build dist/: the release files (flat, as GitHub release assets are) plus
// SHA256SUMS. The bundles are in scripts/files.mjs: geneviewer.core.js stays
// unminified, so the R package can ship it as readable source and verify it
// against SHA256SUMS. The other files are copied from src/ unchanged.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { bundle } from "./bundle.mjs";
import { bundles, files } from "./files.mjs";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");

const outputs = {};
for (const { name, ...options } of bundles) {
  for (const file of await bundle("src/lib/index.js", { ...options, globalName: "geneviewer", outfile: `dist/${name}` })) {
    const base = file.path.split("/").pop();
    // Source maps point at the sources relative to dist/
    outputs[base] = file.text;
  }
}
for (const { name, sources } of files) {
  const parts = sources.map((source) => readFileSync(`src/${source}`, "utf8"));
  // Each part ends with exactly one newline, so the parts join cleanly
  outputs[name] = parts.map((part) => part.replace(/\n*$/, "\n")).join("\n");
}

for (const [name, content] of Object.entries(outputs)) {
  writeFileSync(`dist/${name}`, content);
  console.log(`built dist/${name}`);
}
// npm run build then builds the type definitions (scripts/build-types.mjs),
// which writes SHA256SUMS last, over every file in dist/
