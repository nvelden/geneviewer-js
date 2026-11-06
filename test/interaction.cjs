// Interaction tests: run each scenario in test/interaction/scenarios.cjs and
// compare, step by step, the events and the chart listing with
// test/interaction/<scenario>.txt. Run through `npm test` in Docker.
//
//   node test/interaction.cjs              compare
//   node test/interaction.cjs --update     write the .txt files
//   node test/interaction.cjs --only <n>   one scenario
//   node test/interaction.cjs --mode <m>   one harness mode, spec or rspec
//                                          (default both; --update: rspec)
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright-core");
const scenarios = require("./interaction/scenarios.cjs");

const args = process.argv.slice(2);
const update = args.includes("--update");
const only = args.flatMap((arg, i) => (arg === "--only" ? [args[i + 1]] : []));
const modeArgs = args.flatMap((arg, i) => (arg === "--mode" ? [args[i + 1]] : []));
const modes = modeArgs.length ? modeArgs : update ? ["rspec"] : ["rspec", "spec"];
const harness = pathToFileURL(path.join(__dirname, "harness", "index.html")).href;
const eventNames = ["click", "dblclick", "select", "selection", "drag", "dragmove", "moves", "zoom", "rendered"];

async function runScenario(browser, scenario, mode) {
  const dir = path.join(__dirname, "fixtures", scenario.fixture);
  const spec = JSON.parse(fs.readFileSync(path.join(dir, "spec.json"), "utf8"));
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(harness + "?mode=" + mode, { waitUntil: "load" });
    await page.evaluate(({ spec, meta, eventNames }) => {
      window.__events = [];
      mountChart(spec, meta, eventNames, (name, detail) => {
        window.__events.push(name + " " + JSON.stringify(detail));
      });
    }, { spec, meta, eventNames });

    // Pointer away from the chart, then wait out tooltip fades and redraws
    const settle = async () => {
      await page.mouse.move(5, 5);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      await page.waitForTimeout(450);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    };
    // Move the pointer and let Chrome apply :hover before pressing, so
    // styles read at the press do not depend on timing
    const hover = async (at) => {
      await page.mouse.move(at.x, at.y);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    };
    const h = {
      async center(selector, nth = 0) {
        const box = await page.locator(selector).nth(nth).boundingBox();
        if (!box) throw new Error(`not visible: ${selector} [${nth}]`);
        return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      },
      async drag(from, to) {
        await hover(from);
        await page.mouse.down();
        await page.mouse.move(to.x, to.y, { steps: 8 });
        await page.mouse.up();
      },
      async click(at, modifiers = []) {
        await hover(at);
        for (const key of modifiers) await page.keyboard.down(key);
        await page.mouse.click(at.x, at.y);
        for (const key of modifiers.reverse()) await page.keyboard.up(key);
      },
      press: (key) => page.keyboard.press(key),
    };
    const snapshot = () => page.evaluate(() => {
      const events = window.__events.splice(0).map((line) =>
        line.replace(/-?\d+\.\d+(e-?\d+)?/gi, (n) => String(Math.round(parseFloat(n) * 100) / 100)));
      return { events, listing: normalizeChart(document.getElementById("chart")) };
    });

    await settle();
    const parts = [];
    const record = async (name) => {
      const { events, listing } = await snapshot();
      parts.push(`## ${name}\n\n### events\n${events.join("\n") || "(none)"}\n\n### chart\n${listing}`);
    };
    await record("drawn");
    for (const step of scenario.steps) {
      await step.run(page, h);
      await settle();
      await record(step.name);
    }
    if (errors.length) throw new Error(errors.join("\n"));
    return parts.join("\n");
  } finally {
    await page.close();
  }
}

(async () => {
  const browser = await chromium.launch({ args: ["--font-render-hinting=none", "--disable-gpu"] });
  let failed = 0;
  try {
    for (const mode of modes) for (const scenario of scenarios.filter((s) => !only.length || only.includes(s.name))) {
      const file = path.join(__dirname, "interaction", `${scenario.name}.txt`);
      let actual;
      try {
        actual = await runScenario(browser, scenario, mode);
      } catch (error) {
        failed++;
        console.log(`FAIL  ${mode}  ${scenario.name}  (error)\n${error.message}\n`);
        continue;
      }
      if (update) {
        fs.writeFileSync(file, actual);
        console.log(`wrote interaction/${scenario.name}.txt`);
        continue;
      }
      const expected = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
      if (expected === actual) {
        console.log(`pass  ${mode}  ${scenario.name}`);
      } else {
        failed++;
        const a = expected.split("\n"), b = actual.split("\n");
        let i = 0;
        while (i < a.length && i < b.length && a[i] === b[i]) i++;
        const step = a.slice(0, i + 1).reverse().find((line) => line.startsWith("## ")) || "";
        console.log(`FAIL  ${mode}  ${scenario.name}  at line ${i + 1} (${step})\n- ${(a[i] || "").slice(0, 300)}\n+ ${(b[i] || "").slice(0, 300)}\n`);
      }
    }
  } finally {
    await browser.close();
  }
  console.log(update ? "interaction listings written" : `interaction: ${failed ? failed + " failed" : "all passed"}`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
