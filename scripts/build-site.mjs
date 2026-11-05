// Assemble the documentation site in _site/: the pages in site/, the built
// library from dist/, the API reference (scripts/build-reference.mjs), and
// for each example its data file and its JavaScript, made from its spec.
// Run `npm run build` first (`npm run site` does both).
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

if (!existsSync("dist/geneviewer.min.js")) {
  console.error("dist/ is missing: run npm run build first.");
  process.exit(1);
}

rmSync("_site", { recursive: true, force: true });
cpSync("site", "_site", { recursive: true });
mkdirSync("_site/lib");
for (const name of ["geneviewer.min.js", "geneviewer.min.js.map"]) cpSync(`dist/${name}`, `_site/lib/${name}`);

// JavaScript source of a value: object keys without quotes where they can
// be, short arrays on one line; names in placeholders are written as code
const identifier = /^[A-Za-z_$][\w$]*$/;
function toJs(value, indent = "") {
  if (value && typeof value === "object" && "$code" in value) return value.$code;
  if (Array.isArray(value)) {
    const flat = `[${value.map((v) => toJs(v, indent)).join(", ")}]`;
    if (flat.length <= 72 && !flat.includes("\n")) return flat;
    const inner = indent + "  ";
    return `[\n${value.map((v) => inner + toJs(v, inner)).join(",\n")},\n${indent}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) return "{}";
    const inner = indent + "  ";
    const items = entries.map(([key, v]) => {
      if (v && typeof v === "object" && v.$code === key) return `${inner}${key}`;
      return `${inner}${identifier.test(key) ? key : JSON.stringify(key)}: ${toJs(v, inner)}`;
    });
    const flat = `{ ${items.map((item) => item.trim()).join(", ")} }`;
    if (flat.length <= 72 && !flat.includes("\n")) return flat;
    return `{\n${items.join(",\n")},\n${indent}}`;
  }
  return JSON.stringify(value);
}

// Each example: its tables in examples/data/<id>.json, and the JavaScript
// that loads them and draws the chart
mkdirSync("_site/examples/data", { recursive: true });
const ids = JSON.parse(readFileSync("site/examples/index.json", "utf8"));
for (const id of ids) {
  const example = JSON.parse(readFileSync(`site/examples/${id}.json`, "utf8"));
  const tables = { data: example.spec.data };
  const shown = { ...example.spec, data: { $code: "data" } };
  const linkEntries = Array.isArray(shown.links) ? shown.links : shown.links ? [shown.links] : [];
  linkEntries.forEach((entry, i) => {
    tables[`links${linkEntries.length > 1 ? i + 1 : ""}`] = entry.data;
  });
  const names = Object.keys(tables);
  const withLinks = linkEntries.map((entry, i) => {
    const { data, ...options } = entry;
    return { data: { $code: names[i + 1] }, ...options };
  });
  if (linkEntries.length) shown.links = Array.isArray(example.spec.links) ? withLinks : withLinks[0];
  writeFileSync(`_site/examples/data/${id}.json`, JSON.stringify(tables));
  example.js = `const { ${names.join(", ")} } = await fetch("examples/data/${id}.json")
  .then((response) => response.json());

const chart = geneviewer.newChart("#chart", ${toJs(shown)});`;
  writeFileSync(`_site/examples/${id}.json`, JSON.stringify(example));
}

await import("./build-reference.mjs");

// Serve files as they are, without Jekyll processing
writeFileSync("_site/.nojekyll", "");
console.log("built _site/");
