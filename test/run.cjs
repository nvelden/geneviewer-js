// Fixture tests: draw every fixture in test/fixtures and compare it with its
// stored listing (render.txt). Run through `npm test`, which runs this in the
// Docker test image so fonts, and therefore layout, are fixed.
//
//   node test/run.cjs              compare
//   node test/run.cjs --update     write render.txt instead of comparing
//   node test/run.cjs --only <id>  one fixture (repeatable)
//   node test/run.cjs --mode <m>   one harness mode, binding or direct
//                                  (default both; --update: binding)
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright-core");
const { renderFixture } = require("./harness/render.cjs");

const fixturesDir = path.join(__dirname, "fixtures");
const args = process.argv.slice(2);
const update = args.includes("--update");
const only = args.flatMap((arg, i) => (arg === "--only" ? [args[i + 1]] : []));
const modeArgs = args.flatMap((arg, i) => (arg === "--mode" ? [args[i + 1]] : []));
const modes = modeArgs.length ? modeArgs : update ? ["binding"] : ["binding", "direct"];

// The first differing line with a few lines of context from both sides
function firstDifference(expected, actual) {
  const a = expected.split("\n");
  const b = actual.split("\n");
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const from = Math.max(0, i - 3);
  const show = (lines, sign) => lines.slice(from, i + 4)
    .map((line, k) => `${from + k === i ? sign : " "} ${from + k + 1}: ${line}`).join("\n");
  return `first difference at line ${i + 1}\n  expected:\n${show(a, "-")}\n  actual:\n${show(b, "+")}`;
}

(async () => {
  const ids = fs.readdirSync(fixturesDir)
    .filter((id) => fs.existsSync(path.join(fixturesDir, id, "payload.json")))
    .filter((id) => !only.length || only.includes(id))
    .sort();
  if (!ids.length) throw new Error("No fixtures found.");

  const browser = await chromium.launch({
    args: ["--font-render-hinting=none", "--disable-gpu"],
  });
  let failed = 0;
  let written = 0;
  try {
    for (const mode of modes) for (const id of ids) {
      const dir = path.join(fixturesDir, id);
      const payload = JSON.parse(fs.readFileSync(path.join(dir, "payload.json"), "utf8"));
      const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
      const file = path.join(dir, "render.txt");
      let actual;
      try {
        actual = await renderFixture(browser, payload, meta, mode);
      } catch (error) {
        failed++;
        console.log(`FAIL  ${mode}  ${id}  (error while drawing)\n${error.message}\n`);
        continue;
      }
      if (update) {
        const before = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
        if (before !== actual) {
          fs.writeFileSync(file, actual);
          written++;
          console.log(`wrote ${id}/render.txt`);
        }
        continue;
      }
      if (!fs.existsSync(file)) {
        failed++;
        console.log(`FAIL  ${mode}  ${id}  (no render.txt; run npm run test:update)`);
        continue;
      }
      const expected = fs.readFileSync(file, "utf8");
      if (expected === actual) {
        console.log(`pass  ${mode}  ${id}`);
      } else {
        failed++;
        console.log(`FAIL  ${mode}  ${id}  ${firstDifference(expected, actual)}\n`);
      }
    }
  } finally {
    await browser.close();
  }
  if (update) console.log(`${written} of ${ids.length} listings written`);
  else console.log(`${ids.length * modes.length - failed} passed, ${failed} failed (${ids.length} fixtures; ${modes.join(" and ")})`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
