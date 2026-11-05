// chart.update(), setSpec() and getSpec(). The merge rules of update() in
// Node: objects merge key by key, arrays and other values replace, tables
// (data, links.data) replace as a whole. Then in
// the browser: a chart drawn from a spec (rd-GC-title-1) is updated with a
// partial spec, given a new spec, and gives its spec back; a chart drawn
// from a render model keeps update() with a render model, as the R binding
// uses it. Run through `npm test`.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { mergeSpec } from "../src/lib/compile/merge.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const failures = [];
const expect = (ok, message) => {
  console.log(`${ok ? "pass" : "FAIL"}  ${message}`);
  if (!ok) failures.push(message);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Merge rules
const base = {
  version: 1,
  data: { start: [1, 50], end: [40, 90] },
  title: { title: "A", titleFont: { fontSize: "12px", fill: "red" } },
  labels: [{ label: "name" }, { clusters: [2], show: false }],
  zoom: { range: [0.2, 0.4] },
};
const merged = mergeSpec(base, {
  title: { titleFont: { fontSize: "20px" } },
  labels: [{ label: "group" }],
  zoom: { range: [0.5, 0.6] },
  data: { start: [5] },
  legend: { show: false },
});
expect(same(merged.title, { title: "A", titleFont: { fontSize: "20px", fill: "red" } }),
  "objects merge at every level");
expect(same(merged.labels, [{ label: "group" }]), "an array replaces the array");
expect(same(merged.zoom.range, [0.5, 0.6]), "an array inside an object replaces it");
expect(same(merged.data, { start: [5] }), "data replaces the table as a whole");
expect(same(mergeSpec({ links: { data: { start1: [1], end1: [2] }, curve: true } },
  { links: { data: { start1: [3] } } }).links, { data: { start1: [3] }, curve: true }),
  "links.data replaces the table; the other links options merge");
expect(same(merged.legend, { show: false }), "a new key is added");
expect(same(mergeSpec(base, { title: null }).title, null), "null replaces the value");
expect(base.title.titleFont.fontSize === "12px" && base.labels.length === 2, "the spec given is not changed");

// In the browser
const harness = pathToFileURL(path.join(here, "harness", "index.html")).href + "?mode=spec";
const fixture = path.join(here, "fixtures", "rd-GC-title-1");
const spec = JSON.parse(readFileSync(path.join(fixture, "spec.json"), "utf8"));
const payload = JSON.parse(readFileSync(path.join(fixture, "payload.json"), "utf8"));
const meta = JSON.parse(readFileSync(path.join(fixture, "meta.json"), "utf8"));

const browser = await chromium.launch({ args: ["--font-render-hinting=none", "--disable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const titleText = () => page.evaluate(() =>
  [...document.querySelectorAll("#chart .geneviewer-title, #chart text")]
    .map((node) => node.textContent).join("|"));
try {
  await page.goto(harness, { waitUntil: "load" });
  await page.evaluate(({ spec, meta }) => { window.__chart = mountChart(spec, meta); }, { spec, meta });

  const original = await page.evaluate(() => window.__chart.getSpec());
  expect(same(original, spec), "getSpec() gives the spec drawn");
  await page.evaluate(() => { window.__chart.getSpec().title = "changed"; });
  expect(same(await page.evaluate(() => window.__chart.getSpec()), spec), "getSpec() gives a copy");

  await page.evaluate(() => window.__chart.update({ title: { title: "Updated title" } }));
  const updated = await page.evaluate(() => window.__chart.getSpec());
  expect(updated.title.title === "Updated title", "update() merges a partial spec into the spec");
  expect(same(updated.data, spec.data), "update() keeps the rest of the spec");
  expect((await titleText()).includes("Updated title"), "update() draws the chart again");

  await page.evaluate((spec) => window.__chart.setSpec({ ...spec, title: { title: "New spec" } }), spec);
  const replaced = await page.evaluate(() => window.__chart.getSpec());
  expect(same(replaced.title, { title: "New spec" }), "setSpec() replaces the spec");
  expect((await titleText()).includes("New spec") && !(await titleText()).includes("Updated title"),
    "setSpec() draws the new spec");

  const thrown = await page.evaluate(() => {
    try { window.__chart.setSpec({ title: { title: "x" } }); return null; } catch (e) { return e.message; }
  });
  expect(thrown !== null, "setSpec() without a version throws");

  // A chart drawn from a render model, as the R binding draws it
  await page.evaluate(({ payload }) => {
    window.__chart.destroy();
    window.__chart = geneviewer.newChart(document.getElementById("chart"), payload);
  }, { payload });
  expect((await page.evaluate(() => window.__chart.getSpec())) === null, "a render model chart has no spec");
  await page.evaluate(({ payload }) => {
    window.__chart.update({ ...payload, title: { ...payload.title, title: "Render model" } });
  }, { payload });
  expect((await titleText()).includes("Render model"), "update() with a render model draws it");

  // The R binding with { spec }, as R sends it from 0.3.0 on: a redraw from
  // Shiny gives the whole spec, which replaces the chart's spec
  const bindingPage = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  bindingPage.on("pageerror", (error) => errors.push(error.message));
  await bindingPage.goto(harness.replace("?mode=spec", "?mode=rspec"), { waitUntil: "load" });
  const bindingTitles = () => bindingPage.evaluate(() =>
    [...document.querySelectorAll("#chart .geneviewer-title, #chart text")]
      .map((node) => node.textContent).join("|"));
  await bindingPage.evaluate(({ spec, meta }) => { window.__widget = mountChart(spec, meta); }, { spec, meta });
  const drawnTitle = spec.title.title;
  expect((await bindingTitles()).includes(drawnTitle), "the binding draws x.spec");
  expect(await bindingPage.evaluate(() => window.__widget.getChart().toSVG().includes("<svg")),
    "the widget gives its chart (getChart())");
  expect(await bindingPage.evaluate(() => window.chartToSVG === undefined && window.chartToPNG === undefined),
    "the binding defines no chartToSVG() or chartToPNG() globals");
  const withoutTitle = { ...spec };
  delete withoutTitle.title;
  await bindingPage.evaluate((spec) => window.__widget.renderValue({ spec }), withoutTitle);
  expect(!(await bindingTitles()).includes(drawnTitle),
    "a redraw through the binding replaces the spec (a key left out goes)");
  await bindingPage.close();

  // A newer spec version warns and draws
  const warnings = [];
  page.on("console", (message) => { if (message.type() === "warning") warnings.push(message.text()); });
  await page.evaluate((spec) => window.__chart.setSpec({ ...spec, version: 2 }), spec);
  expect(warnings.some((w) => w.includes("spec version 2")), "a newer spec version warns");

  // The stylesheet is added once, however many charts are drawn
  expect(await page.evaluate(() => document.querySelectorAll("style[data-geneviewer]").length) === 1,
    "the stylesheet is added to the page once");
  const unstyled = await browser.newPage();
  await unstyled.goto(harness, { waitUntil: "load" });
  const added = await unstyled.evaluate((spec) => {
    geneviewer.newChart(document.getElementById("chart"), spec, { injectStyles: false });
    return document.querySelectorAll("style[data-geneviewer]").length;
  }, spec);
  expect(added === 0, "injectStyles: false adds no stylesheet");
  await unstyled.close();

  expect(errors.length === 0, `no page errors${errors.length ? `: ${errors.join("; ")}` : ""}`);
} finally {
  await browser.close();
}

if (failures.length) {
  console.log(`update: ${failures.length} failed`);
  process.exit(1);
}
console.log("update: all passed");
