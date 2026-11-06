// Two charts on one page keep their own selection, moves and undo history,
// and chart.on() handlers only hear their own chart. Draws vig-geneviewer-5
// twice with geneviewer.newChart(). Run through `npm test`.
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright-core");

const harness = pathToFileURL(path.join(__dirname, "harness", "index.html")).href + "?mode=direct";
const fixture = path.join(__dirname, "fixtures", "vig-geneviewer-5");

(async () => {
  const payload = JSON.parse(fs.readFileSync(path.join(fixture, "payload.json"), "utf8"));
  const meta = JSON.parse(fs.readFileSync(path.join(fixture, "meta.json"), "utf8"));
  const browser = await chromium.launch({ args: ["--font-render-hinting=none", "--disable-gpu"] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1100 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const failures = [];
  const expect = (ok, message) => {
    console.log(`${ok ? "pass" : "FAIL"}  ${message}`);
    if (!ok) failures.push(message);
  };
  try {
    await page.goto(harness, { waitUntil: "load" });
    await page.evaluate(({ payload, meta }) => {
      const second = document.createElement("div");
      second.id = "chart2";
      document.body.appendChild(second);
      window.__charts = {};
      window.__events = { chart: [], chart2: [] };
      ["chart", "chart2"].forEach((id) => {
        const el = document.getElementById(id);
        el.style.width = (meta.width || 1000) + "px";
        el.style.height = meta.height || "400px";
        const on = {};
        ["select", "selection", "drag", "moves"].forEach((name) => {
          on[name] = (event) => window.__events[id].push({ name: event.type, detail: event.detail });
        });
        window.__charts[id] = geneviewer.newChart(el, payload, { on });
      });
    }, { payload, meta });

    const settle = async () => {
      await page.mouse.move(5, 5);
      await page.waitForTimeout(450);
    };
    const center = async (selector, nth = 0) => {
      const box = await page.locator(selector).nth(nth).boundingBox();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };
    const takeEvents = () => page.evaluate(() => {
      const events = window.__events;
      window.__events = { chart: [], chart2: [] };
      return { chart: events.chart.map((e) => e.name), chart2: events.chart2.map((e) => e.name) };
    });
    const selected = (id) => page.locator(`#${id} .geneviewer-selected`).count();
    const transform = (id, nth) => page.locator(`#${id} text.label`).nth(nth).getAttribute("transform");
    await settle();
    await takeEvents();

    // Select a gene in the first chart
    const gene = await center("#chart .gene", 1);
    await page.mouse.click(gene.x, gene.y);
    await settle();
    let events = await takeEvents();
    expect(events.chart.includes("select") && events.chart2.length === 0,
      `click in chart 1 reports to chart 1 only (chart: ${events.chart}; chart2: ${events.chart2})`);
    expect(await selected("chart") > 0 && await selected("chart2") === 0, "only chart 1 shows a selection");

    // Drag a label in the first chart
    const label = await center("#chart text.label", 2);
    const before2 = await transform("chart2", 2);
    await page.mouse.move(label.x, label.y);
    await page.mouse.down();
    await page.mouse.move(label.x + 30, label.y - 20, { steps: 8 });
    await page.mouse.up();
    await settle();
    events = await takeEvents();
    expect(events.chart.includes("drag") && events.chart2.length === 0,
      `drag in chart 1 reports to chart 1 only (chart: ${events.chart}; chart2: ${events.chart2})`);
    expect(await transform("chart2", 2) === before2, "chart 2's label did not move");
    expect(await page.locator("#chart .geneviewer-undo").isDisabled() === false &&
      await page.locator("#chart2 .geneviewer-history").isHidden(),
      "only chart 1 has an undo step");

    // Ctrl+Z after clicking in the second chart: its history is empty, so
    // nothing happens in either chart
    const empty = await page.locator("#chart2 svg.geneviewer-svg-content").nth(1).boundingBox();
    await page.mouse.click(empty.x + 3, empty.y + 3);
    await page.keyboard.press("Control+z");
    await settle();
    events = await takeEvents();
    expect(!events.chart.includes("drag") && !events.chart2.includes("drag"),
      `Ctrl+Z in chart 2 undoes nothing (chart: ${events.chart}; chart2: ${events.chart2})`);

    // Ctrl+Z after clicking in the first chart undoes its drag
    const empty1 = await page.locator("#chart svg.geneviewer-svg-content").nth(1).boundingBox();
    await page.mouse.click(empty1.x + 3, empty1.y + 3);
    await page.keyboard.press("Control+z");
    await settle();
    const undo = await page.evaluate(() => window.__events.chart.find((e) => e.name === "drag")?.detail.action);
    events = await takeEvents();
    expect(undo === "undo" && !events.chart2.includes("drag"), `Ctrl+Z in chart 1 undoes its drag (${undo})`);

    // Destroying the first chart leaves the second working
    await page.evaluate(() => window.__charts.chart.destroy());
    expect(await page.locator("#chart *").count() === 0, "destroy empties chart 1");
    const gene2 = await center("#chart2 .gene", 1);
    await page.mouse.click(gene2.x, gene2.y);
    await settle();
    events = await takeEvents();
    expect(events.chart2.includes("select") && events.chart.length === 0,
      `chart 2 still selects after chart 1 is destroyed (chart: ${events.chart}; chart2: ${events.chart2})`);

    // A legend click hides genes in its own chart only, whatever the id of the
    // chart's element: none (as on the docs site), or one that is no selector
    const legendPayload = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "vig-Examples-15", "payload.json"), "utf8"));
    const legendMeta = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "vig-Examples-15", "meta.json"), "utf8"));
    for (const ids of [["", ""], ["my.chart:1", "my.chart:2"]]) {
      const name = ids[0] ? "ids with . and :" : "no id";
      await page.evaluate(({ payload, meta, ids }) => {
        document.querySelectorAll(".legend-test").forEach((node) => {
          node.__chart.destroy();
          node.remove();
        });
        ids.forEach((id) => {
          const el = document.createElement("div");
          el.className = "legend-test";
          if (id) el.id = id;
          el.style.width = (meta.width || 1000) + "px";
          el.style.height = meta.height || "400px";
          document.body.appendChild(el);
          el.__chart = geneviewer.newChart(el, payload);
        });
      }, { payload: legendPayload, meta: legendMeta, ids });
      const hiddenRows = (nth) => page.locator(".legend-test").nth(nth).evaluate((el) =>
        Array.from(el.querySelectorAll("[rowID]")).filter((node) => node.style.display === "none").length);
      await page.locator(".legend-test").nth(0).locator(".legend").nth(0).click();
      await settle();
      expect(await hiddenRows(0) > 0, `${name}: the legend click hides genes in its own chart`);
      expect(await hiddenRows(1) === 0, `${name}: the other chart keeps its genes`);
    }
    expect(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join("; ") : ""));
  } finally {
    await browser.close();
  }
  console.log(`two charts: ${failures.length ? failures.length + " failed" : "all passed"}`);
  process.exit(failures.length ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
