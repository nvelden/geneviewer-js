// Build the type definitions in dist/ (npm run types):
// - spec.d.ts: the chart spec, from schema/spec-v1.schema.json
//   (json-schema-to-typescript);
// - geneviewer.d.ts: the public API, from the JSDoc of src/lib/chart.js (tsc),
//   with the global `geneviewer` of the script build.
// Run after npm run build, which empties dist/.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { compile } from "json-schema-to-typescript";

// One named type per $def. A $ref with a description of its own would
// otherwise become a numbered copy of its type (Clusters1, Clusters2, ...):
// it refers to the named type by tsType instead, keeping its description.
const schema = JSON.parse(readFileSync("schema/spec-v1.schema.json", "utf8"));
const typeName = (key) => key[0].toUpperCase() + key.slice(1);
function named(node) {
  if (Array.isArray(node)) return node.map(named);
  if (!node || typeof node !== "object") return node;
  const { $ref, ...rest } = node;
  if ($ref && Object.keys(rest).length) return { ...named(rest), tsType: typeName($ref.split("/").pop()) };
  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, named(value)]));
}
const input = named({ ...schema, title: "Spec" });
for (const [key, def] of Object.entries(input.$defs)) def.title = typeName(key);
const spec = await compile(input, "Spec", {
  bannerComment: "// The geneviewer chart spec, version 1. Generated from schema/spec-v1.schema.json; do not edit.",
  additionalProperties: false,
  unreachableDefinitions: true,
  format: true,
});
writeFileSync("dist/spec.d.ts", spec);
console.log("built dist/spec.d.ts");

// Declarations of every module, into a temporary folder
const out = mkdtempSync(path.join(tmpdir(), "geneviewer-types-"));
try {
  execFileSync(process.execPath, ["node_modules/typescript/bin/tsc",
    "src/lib/index.js", "types/globals.d.ts", "--allowJs", "--declaration", "--emitDeclarationOnly",
    "--skipLibCheck", "--target", "es2020", "--module", "esnext", "--moduleResolution", "bundler",
    "--lib", "es2020,dom", "--resolveJsonModule", "--rootDir", "src", "--outDir", out], { stdio: "inherit" });

  // chart.d.ts without the JSDoc blocks tsc copies after the types it made of them
  const chart = readFileSync(path.join(out, "lib", "chart.d.ts"), "utf8")
    .replace(/\/\*\*(?:(?!\*\/)[\s\S])*@(?:typedef|callback)(?:(?!\*\/)[\s\S])*\*\/\n/g, "")
    .replace(/^declare var version: string;\n/m, "")
    .replace(/^export \{ newChart, version \};\n/m, "")
    .replace(/^declare function newChart/m, "export declare function newChart")
    // The JSDoc reaches the spec's types in dist/ from src/lib/
    .replaceAll('import("../../dist/spec").Spec', "Spec");
  // compile(), with its JSDoc
  const compileDts = readFileSync(path.join(out, "lib", "compile", "index.d.ts"), "utf8");
  const compileMatch = /\/\*\*(?:(?!\*\/)[\s\S])*\*\/\nexport declare function compile\(.*\n/.exec(compileDts);
  if (!compileMatch) throw new Error("compile/index.d.ts has no compile");

  const dts = [
    "// geneviewer: types of the public API. Generated from the JSDoc in src/lib/; do not edit.",
    "// The script build defines the global `geneviewer`.",
    "export as namespace geneviewer;",
    "",
    'import type { Spec } from "./spec";',
    "export type { Spec };",
    "",
    "/** The library's version. */",
    "export declare const version: string;",
    "",
    chart.trim(),
    "",
    compileMatch[0].trim(),
    "",
    "/** The built-in themes, by name: their settings as the R package defines them. */",
    "export declare const themes: Record<string, Record<string, any>>;",
    "/** The geneviewer palettes: their colours, by name. */",
    "export declare const palettes: Record<string, string[]>;",
    "",
  ].join("\n");
  writeFileSync("dist/geneviewer.d.ts", dts);
  console.log("built dist/geneviewer.d.ts");
} finally {
  rmSync(out, { recursive: true, force: true });
}
