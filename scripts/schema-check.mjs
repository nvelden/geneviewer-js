// Checks of the spec schema (npm run schema:check):
// - schema/spec-v1.schema.json is valid JSON Schema 2020-12 and compiles;
// - every documented R argument in test/coverage.md has a row in
//   schema/NAMING.md, with a spec name or "not in spec";
// - every spec name in schema/NAMING.md is a property in the schema;
// - every example in schema/examples/ is a valid spec.
import { readFileSync, readdirSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";

const failures = [];
const fail = (message) => failures.push(message);

const schema = JSON.parse(readFileSync("schema/spec-v1.schema.json", "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
if (!ajv.validateSchema(schema)) fail(`schema: ${ajv.errorsText(ajv.errors)}`);
const validate = ajv.compile(schema);

// Rows of a Markdown table: cells without their backticks
const tableRows = (text) => text.split("\n")
  .filter((line) => /^\| `/.test(line))
  .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/`/g, "")));

const covered = tableRows(readFileSync("test/coverage.md", "utf8")).map(([fn, arg]) => `${fn}:${arg}`);
const naming = new Map(tableRows(readFileSync("schema/NAMING.md", "utf8"))
  .filter(([, arg]) => arg !== "(function)")
  .map(([fn, arg, spec]) => [`${fn}:${arg}`, spec]));
for (const key of covered) {
  if (key.endsWith(":GC_chart")) continue; // the chart itself, the first argument of every GC_* function
  if (!naming.has(key)) fail(`NAMING.md has no row for ${key}`);
}

// The schema node of a dotted spec name: through $ref, allOf, oneOf, arrays
// ("annotation[].type") and the "*" of options passed through (...)
const resolve = (node) => (node && node.$ref ? resolve(schema.$defs[node.$ref.split("/").pop()]) : node);
function find(node, parts) {
  node = resolve(node);
  if (!node) return null;
  if (!parts.length) return node;
  for (const sub of [...(node.allOf || []), ...(node.oneOf || [])]) {
    const found = find(sub, parts);
    if (found) return found;
  }
  let [part, ...rest] = parts;
  if (part.endsWith("[]")) {
    const next = node.properties && node.properties[part.slice(0, -2)];
    return next ? find(resolve(next).items, rest) : null;
  }
  if (part === "*") return node.additionalProperties ? node : null;
  if (node.type === "array" && node.items) return find(node.items, parts);
  return node.properties && part in node.properties ? find(node.properties[part], rest) : null;
}
for (const [key, spec] of naming) {
  if (spec === "not in spec") continue;
  if (!find(schema, spec.split("."))) fail(`${key}: ${spec} is not in the schema`);
}

for (const file of readdirSync("schema/examples").filter((f) => f.endsWith(".json"))) {
  const spec = JSON.parse(readFileSync(`schema/examples/${file}`, "utf8"));
  if (!validate(spec)) fail(`examples/${file}: ${ajv.errorsText(validate.errors)}`);
}

failures.forEach((message) => console.error(`FAIL  ${message}`));
console.log(`schema: ${failures.length ? failures.length + " failed" : "all passed"} ` +
  `(${covered.length} R arguments, ${naming.size} rows in NAMING.md)`);
process.exit(failures.length ? 1 : 0);
