// compile() against R (npm run test:compile): for every fixture, the render
// model compile(spec.json) makes is compared with payload.json, the render
// model R made from the same call. Runs in Node, without a browser.
//
//   node test/compile.mjs                      every fixture, a table
//   node test/compile.mjs --only labels        one component (repeatable)
//   node test/compile.mjs --fixture ophA       one fixture (repeatable), with
//                                              every difference listed
//   node test/compile.mjs --verbose            differences of every failure
//
// Comparison rules
// ----------------
// The two render models are compared value by value, per key path
// (series.<cluster>.labels.label, ...). Each path belongs to a component
// (see componentOf()); a component passes for a fixture when none of its
// paths differ.
//
// - Numbers are equal within 1e-9 relative difference (absolute near 0).
//   This covers R's JSON digit rounding.
// - R's JSON rules are mirrored by compile() itself: length-1 vectors are
//   scalars, and data frames are objects of columns. The comparison does not
//   unbox arrays: ["a"] and "a" differ.
// - NULL: R leaves a NULL element out of a list, or writes it as null (a
//   list element set to NULL with list(a = NULL)). A key that is missing,
//   undefined or null on one side and missing, undefined or null on the
//   other is equal. In arrays, null is a value (R's NA) and must match.
// - An empty list() is [] or {} as htmlwidgets writes it: [] and {} are
//   equal.
// - Key order in objects does not matter; order in arrays does.
// - Any other difference is a failure.
//
// Exit status: 1 when a compared component fails for a fixture, apart from
// the approved exceptions in EXCEPTIONS below.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { compile } from "../src/lib/compile/index.js";

const args = process.argv.slice(2);
const valuesOf = (flag) => args.flatMap((arg, i) => (arg === flag ? [args[i + 1]] : []));
const only = valuesOf("--only");
const fixtures = valuesOf("--fixture");
const verbose = args.includes("--verbose");

// Approved differences from R, by fixture
// and component: { "<fixture>": ["<component>", ...] }
const EXCEPTIONS = {
  // 2: params of GenBank input have cluster and strand (from fields)
  "rd-GC-chart-2": ["data"],
  // 3: clusters not normalised get the original_* columns, all null
  // and, with cov-normalize: R's GC_normalize() now shares the total gap
  // between the gaps (it divided by the number of genes), so the positions
  // and the end of the scale differ from the payload of R 0.2
  "rd-GC-normalize-1": ["data", "scale"],
  "vig-geneviewer-26": ["data", "scale"],
  "vig-geneviewer-27": ["data", "scale"],
  "cov-normalize": ["data", "scale"],
  // 4: GC_tooltip(FALSE): the hidden tooltip has the default formatter
  ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`vig-geneviewer-${53 + i}`, ["tooltip"]])),
  // 6: the example of GC_genes() no longer passes prevent_overlap and
  // gene_overlap_spacing, which nothing reads; R 0.2's payload has them
  "rd-GC-genes-1": ["genes"],
  // 5: save_button = FALSE is toolbar.buttons without "save"
  "cov-chart-without-extras": ["toolbar"],
};

// The components of the render model, in the order of the port
export const COMPONENTS = [
  "data", "grid", "genes", "sequence", "labels", "coordinates", "tooltip",
  "legend", "title", "clusterTitle", "clusterLabel", "clusterFooter",
  "cluster", "scale", "scaleBar", "links", "transcript", "annotation",
  "elementStyle", "theme", "zoom", "toolbar", "events", "trackMouse", "align",
];

const seriesKeys = {
  clusterName: "data", data: "data", container: "grid", grid: "grid",
  positionShift: "scale", footer: "clusterFooter", annotations: "annotation",
};
const topKeys = {
  params: "data", group: "data", cluster: "data", dataColumns: "data",
  graphContainer: "grid", size: "grid", style: "grid",
  saveButton: "toolbar", transcript_called: "transcript",
};

// The component of a key path of the render model
export function componentOf(path) {
  const [top, , sub, part] = path;
  if (top === "series") {
    if (sub === undefined) return "data";
    if (part === "itemStyle") return "elementStyle";
    return seriesKeys[sub] || sub;
  }
  if (path[1] === "itemStyle") return "elementStyle";
  if ((top === "title" || top === "legend") && path[1] === "margin") return "grid";
  return topKeys[top] || top;
}

const isObject = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const isEmpty = (x) => (Array.isArray(x) && x.length === 0) || (isObject(x) && Object.keys(x).length === 0);
const isNothing = (x) => x === null || x === undefined;

function numbersEqual(a, b) {
  if (a === b) return true;
  const scale = Math.max(Math.abs(a), Math.abs(b));
  return scale < 1e-12 ? Math.abs(a - b) < 1e-12 : Math.abs(a - b) / scale <= 1e-9;
}

// The key paths where expected (R) and actual (compile) differ
export function differences(expected, actual, path = [], out = []) {
  if (isNothing(expected) && isNothing(actual)) return out;
  if (isEmpty(expected) && isEmpty(actual)) return out;
  if (typeof expected === "number" && typeof actual === "number") {
    if (!numbersEqual(expected, actual)) out.push({ path, expected, actual });
    return out;
  }
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) {
      out.push({ path, expected, actual });
      return out;
    }
    expected.forEach((value, i) => {
      // In arrays, null is a value (NA)
      if (isNothing(value) !== isNothing(actual[i])) out.push({ path: [...path, i], expected: value, actual: actual[i] });
      else differences(value, actual[i], [...path, i], out);
    });
    return out;
  }
  if (isObject(expected) && isObject(actual)) {
    const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    for (const key of keys) differences(expected[key], actual[key], [...path, key], out);
    return out;
  }
  if (expected !== actual) out.push({ path, expected, actual });
  return out;
}

const short = (value) => {
  const text = value === undefined ? "(missing)" : JSON.stringify(value);
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
};

function main() {
  const dir = "test/fixtures";
  let ids = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(`${dir}/${entry.name}/payload.json`))
    .map((entry) => entry.name)
    .sort();
  if (fixtures.length) ids = ids.filter((id) => fixtures.includes(id));
  const components = only.length ? only : COMPONENTS;
  for (const name of components) {
    if (!COMPONENTS.includes(name)) {
      console.error(`unknown component: ${name}; one of ${COMPONENTS.join(", ")}`);
      process.exit(2);
    }
  }

  const failed = new Map(components.map((name) => [name, []]));
  const excused = new Map(components.map((name) => [name, []]));
  const crashed = [];
  for (const id of ids) {
    const spec = JSON.parse(readFileSync(`${dir}/${id}/spec.json`, "utf8"));
    const payload = JSON.parse(readFileSync(`${dir}/${id}/payload.json`, "utf8"));
    let model;
    try {
      model = compile(spec);
    } catch (error) {
      crashed.push(id);
      console.log(`crash ${id}: ${error.stack.split("\n").slice(0, 3).join(" | ")}`);
      for (const name of components) failed.get(name).push(id);
      continue;
    }
    const byComponent = new Map();
    for (const diff of differences(payload, model)) {
      const name = componentOf(diff.path);
      if (!byComponent.has(name)) byComponent.set(name, []);
      byComponent.get(name).push(diff);
    }
    for (const name of components) {
      const diffs = byComponent.get(name);
      if (!diffs) continue;
      const exception = (EXCEPTIONS[id] || []).includes(name);
      (exception ? excused : failed).get(name).push(id);
      if (fixtures.length || verbose) {
        console.log(`${exception ? "excused" : "fail"} ${id} ${name}:`);
        for (const diff of diffs.slice(0, fixtures.length ? 50 : 5)) {
          console.log(`    ${diff.path.join(".")}: R ${short(diff.expected)}, compile ${short(diff.actual)}`);
        }
        if (diffs.length > (fixtures.length ? 50 : 5)) console.log(`    ... ${diffs.length} differences`);
      }
    }
  }

  // Table: component, fixtures passed, and the fixtures that fail
  console.log(`\n${"component".padEnd(14)} ${"passed".padStart(9)}  failing fixtures`);
  for (const name of components) {
    const fails = failed.get(name);
    const passed = ids.length - fails.length - excused.get(name).length;
    const list = fails.length > 6 ? `${fails.slice(0, 6).join(", ")} ... (${fails.length})` : fails.join(", ");
    const note = excused.get(name).length ? ` [${excused.get(name).length} excused]` : "";
    console.log(`${name.padEnd(14)} ${`${passed}/${ids.length}`.padStart(9)}  ${list}${note}`);
  }
  const failures = [...failed.values()].reduce((sum, list) => sum + list.length, 0);
  if (crashed.length) console.log(`\n${crashed.length} fixtures crashed compile()`);
  console.log(failures ? `\ncompile: ${failures} component failures` : "\ncompile: all passed");
  process.exit(failures ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
