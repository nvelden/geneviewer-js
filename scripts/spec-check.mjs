// Checks the specs R recorded for the fixtures (npm run spec:check): every
// fixture has a spec.json, and every spec is valid against
// schema/spec-v1.schema.json.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";

const schema = JSON.parse(readFileSync("schema/spec-v1.schema.json", "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
const validate = ajv.compile(schema);

const dir = "test/fixtures";
const ids = readdirSync(dir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const failures = [];
for (const id of ids) {
  const file = `${dir}/${id}/spec.json`;
  if (!existsSync(file)) {
    failures.push(`${id}: no spec.json`);
    continue;
  }
  const spec = JSON.parse(readFileSync(file, "utf8"));
  if (!validate(spec)) {
    const errors = validate.errors
      .map((error) => `${error.instancePath || "/"} ${error.message}`)
      .slice(0, 5);
    failures.push(`${id}:\n    ${errors.join("\n    ")}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`spec: ${failures.length} of ${ids.length} fixtures failed`);
  process.exit(1);
}
console.log(`spec: all ${ids.length} fixture specs valid`);
