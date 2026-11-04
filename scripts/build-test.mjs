// Build test/harness/build/internals.js: the library functions tests call
// directly (test/harness/internals.js), as the global `geneviewerInternals`.
// `npm test` runs this before the tests.
import { mkdirSync, writeFileSync } from "node:fs";
import { bundleScript } from "./bundle.mjs";

mkdirSync("test/harness/build", { recursive: true });
writeFileSync("test/harness/build/internals.js",
  await bundleScript("test/harness/internals.js", "geneviewerInternals", { exports: ["getColorScale"] }));
console.log("built test/harness/build/internals.js");
