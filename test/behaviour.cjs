// Behaviour tests: what a drawn chart does, checked with assertions. Each case
// in test/behaviour/*.cjs draws a fixture through the R binding (rspec mode),
// runs code on the page and checks the result. Run through `npm test`, in the
// Docker test image, as the other browser tests.
//
//   node test/behaviour.cjs              every case
//   node test/behaviour.cjs --only <s>   the cases whose name contains <s>
//                                        (repeatable)
//
// A case: { name, fixture, run(page, t) }, with optional
//   viewport  { width, height } of the page (default 1200 x 1000)
//   width     the chart's width in px (default: the spec's pixel width, as
//             htmlwidgets sizes the widget, else meta.json's)
//   mount     false: draw nothing; run() draws the chart itself
// On the page: window.el (the chart's element), window.widget (the binding's
// widget), window.fixture (the spec) and window.input() (a copy of what R
// sends, { spec }, to change and pass to widget.renderValue()).
// t: equal(actual, expected, message) (deep), ok(value, message),
// match(text, regexp, message), near(actual, expected, tolerance, message).
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright-core");

const harness = pathToFileURL(path.join(__dirname, "harness", "index.html")).href + "?mode=rspec";
const dir = path.join(__dirname, "behaviour");
const args = process.argv.slice(2);
const only = args.flatMap((arg, i) => (arg === "--only" ? [args[i + 1]] : []));

const cases = fs.readdirSync(dir).filter((file) => file.endsWith(".cjs")).sort()
  .flatMap((file) => require(path.join(dir, file)).map((c) => ({ ...c, file })))
  .filter((c) => !only.length || only.some((s) => c.name.includes(s)));

function readFixture(id) {
  const fixture = path.join(__dirname, "fixtures", id);
  return {
    spec: JSON.parse(fs.readFileSync(path.join(fixture, "spec.json"), "utf8")),
    meta: JSON.parse(fs.readFileSync(path.join(fixture, "meta.json"), "utf8")),
  };
}

// A pixel width of the spec ("700px" or 700), as htmlwidgets gives the widget
function pixelWidth(width) {
  if (typeof width === "number") return width;
  const px = /^(\d+(?:\.\d+)?)px$/.exec(width || "");
  return px ? Number(px[1]) : null;
}

function checker(failures) {
  const check = (fn, message) => {
    try {
      fn();
    } catch (error) {
      failures.push(`${message || "assertion"}: ${error.message.split("\n").slice(0, 6).join(" ")}`);
    }
  };
  return {
    equal: (actual, expected, message) => check(() => assert.deepStrictEqual(actual, expected), message),
    ok: (value, message) => check(() => assert.ok(value), message),
    match: (text, regexp, message) => check(() => assert.match(String(text), regexp), message),
    near: (actual, expected, tolerance, message) => check(() => assert.ok(
      Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`), message),
  };
}

async function runCase(browser, c) {
  const page = await browser.newPage({ viewport: c.viewport || { width: 1200, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const failures = [];
  try {
    await page.goto(harness, { waitUntil: "load" });
    if (c.fixture) {
      const { spec, meta } = readFixture(c.fixture);
      const width = c.width || pixelWidth(spec.width) || meta.width;
      await page.evaluate(({ spec, meta, mount }) => {
        window.fixture = spec;
        window.fixtureMeta = meta;
        window.el = document.getElementById("chart");
        window.input = () => ({ spec: JSON.parse(JSON.stringify(window.fixture)) });
        if (mount) window.widget = mountChart(spec, meta);
      }, { spec, meta: { ...meta, width }, mount: c.mount !== false });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
    }
    await c.run(page, checker(failures));
  } catch (error) {
    failures.push(`error: ${error.message}`);
  } finally {
    await page.close();
  }
  if (errors.length && !c.pageErrors) failures.push(`page errors: ${errors.join("; ")}`);
  return failures;
}

(async () => {
  if (!cases.length) throw new Error("No behaviour cases found.");
  const browser = await chromium.launch({ args: ["--font-render-hinting=none", "--disable-gpu"] });
  let failed = 0;
  try {
    for (const c of cases) {
      const failures = await runCase(browser, c);
      if (failures.length) {
        failed++;
        console.log(`FAIL  ${c.file}  ${c.name}\n${failures.map((f) => "      " + f).join("\n")}`);
      } else {
        console.log(`pass  ${c.file}  ${c.name}`);
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`behaviour: ${failed ? failed + " of " + cases.length + " failed" : cases.length + " passed"}`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
