// Warnings: "colors will repeat" only when a group takes a repeated colour
// of the scheme, and each warning once per page, though the scales are made
// for every cluster and legend on every draw. Run through `npm test`.
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright-core");

const harness = pathToFileURL(path.join(__dirname, "harness", "index.html")).href;
// getColorScale() is not public: it comes from the test build (scripts/build-test.mjs)
const internals = path.join(__dirname, "harness", "build", "internals.js");

(async () => {
  const browser = await chromium.launch({ args: ["--disable-gpu"] });
  const failures = [];
  const expect = (ok, message) => {
    console.log(`${ok ? "pass" : "FAIL"}  ${message}`);
    if (!ok) failures.push(message);
  };
  try {
    // A new page for each case: warnings are once per page
    const run = async (fn) => {
      const page = await browser.newPage();
      const warnings = [];
      page.on("console", (message) => { if (message.type() === "warning") warnings.push(message.text()); });
      await page.goto(harness, { waitUntil: "load" });
      await page.addScriptTag({ path: internals });
      const result = await page.evaluate(fn);
      await page.close();
      return { warnings, result };
    };
    let r = await run(() => {
      const scale = geneviewerInternals.getColorScale(["#111111", "#222222"], { a: "#ff0000", b: "#00ff00", c: "#0000ff" }, ["a", "b", "c"]);
      return ["a", "b", "c"].map(scale);
    });
    expect(r.warnings.length === 0, `every group has its own colour: no warning (${r.warnings.length})`);
    expect(JSON.stringify(r.result) === JSON.stringify(["#ff0000", "#00ff00", "#0000ff"]), "and the colours are the given ones");

    r = await run(() => {
      const scale = geneviewerInternals.getColorScale(["#111111", "#222222"], { c: "#ff0000" }, ["a", "b", "c"]);
      return ["a", "b", "c"].map(scale);
    });
    expect(r.warnings.length === 0, `the group past the scheme has its own colour: no warning (${r.warnings.length})`);
    expect(JSON.stringify(r.result) === JSON.stringify(["#111111", "#222222", "#ff0000"]),
      `and the others keep the colour of their place in the scheme (${r.result})`);

    r = await run(() => {
      for (let i = 0; i < 50; i++) geneviewerInternals.getColorScale(["#111111", "#222222"], null, ["a", "b", "c"]);
      return ["a", "b", "c"].map(geneviewerInternals.getColorScale(["#111111", "#222222"], null, ["a", "b", "c"]));
    });
    expect(r.warnings.length === 1 && /colors will repeat/.test(r.warnings[0]),
      `colours repeat: one warning for 51 scales (${r.warnings.length})`);
    expect(JSON.stringify(r.result) === JSON.stringify(["#111111", "#222222", "#111111"]), "and the colours repeat as before");

    // What compile() finds in a spec reaches the console, once per page
    r = await run(() => {
      const spec = { data: { start: [1], end: [9], cluster: ["A"], name: ["x"] }, fields: { cluster: "cluster" },
                     align: { idColumn: "name", id: "nope" } };
      geneviewer.compile(spec);
      geneviewer.compile(spec);
    });
    expect(r.warnings.length === 1 && /^geneviewer: .*nope.*not found/.test(r.warnings[0]),
      `a gene to align on that is not there: one warning (${r.warnings})`);
  } finally {
    await browser.close();
  }
  console.log(`warnings: ${failures.length ? failures.length + " failed" : "all passed"}`);
  process.exit(failures.length ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
