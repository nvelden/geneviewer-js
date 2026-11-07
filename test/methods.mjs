// The chart methods select(), getSelection(), undo(), redo() and download(),
// on rd-GC-toolbar-1 (three labelled genes, events select and drag) drawn
// from its spec. Run through `npm test`.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const failures = [];
const expect = (ok, message) => {
  console.log(`${ok ? "pass" : "FAIL"}  ${message}`);
  if (!ok) failures.push(message);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const harness = pathToFileURL(path.join(here, "harness", "index.html")).href + "?mode=spec";
const spec = JSON.parse(readFileSync(path.join(here, "fixtures", "rd-GC-toolbar-1", "spec.json"), "utf8"));
const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const browser = await chromium.launch({ args: ["--font-render-hinting=none", "--disable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
const warnings = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "warning") warnings.push(message.text()); });

// Draws a spec into #chart; events and saved files are kept on window
const mount = (spec) => page.evaluate((spec) => {
  window.__chart?.destroy();
  window.__events = [];
  window.__saved = [];
  const el = document.getElementById("chart");
  el.style.width = "1000px";
  el.style.height = spec.height || "400px";
  const on = {};
  ["select", "selection", "drag", "moves"].forEach((name) => {
    on[name] = (event) => window.__events.push({ type: event.type, detail: event.detail });
  });
  window.__chart = geneviewer.newChart(el, spec, {
    on,
    saveAs: async (blob, filename) => {
      const bytes = [...new Uint8Array(await blob.arrayBuffer()).slice(0, 200)];
      window.__saved.push({ filename, type: blob.type, bytes });
    },
  });
}, spec);
const events = (type) => page.evaluate((type) => window.__events.filter((e) => e.type === type), type);
const clearEvents = () => page.evaluate(() => { window.__events = []; });
const selection = () => page.evaluate(() => window.__chart.getSelection()
  .map((item) => [item.component, item.data?.rowID ?? item.data, item.part ?? null]));
const selectedNodes = () => page.evaluate(() =>
  document.querySelectorAll("#chart .geneviewer-selected").length);

try {
  await page.goto(harness, { waitUntil: "load" });
  await mount(spec);

  // select() and getSelection()
  expect(same(await selection(), []), "getSelection() is empty before anything is selected");
  await page.evaluate(() => window.__chart.select([{ component: "genes", data: { rowID: 2 } }]));
  expect(same(await selection(), [["genes", 2, null]]), "select() a gene by its rowID");
  expect(await selectedNodes() === 1, "the selected gene is outlined");
  const reported = await events("selection");
  expect(reported.length === 1 && reported[0].detail.length === 1 && reported[0].detail[0].data.rowID === 2,
    "select() reports selection once");
  expect((await events("select"))[0]?.detail?.data?.rowID === 2, "select() reports the gene as select");
  const item = await page.evaluate(() => window.__chart.getSelection()[0]);
  expect(item.cluster !== undefined && item.style && typeof item.style === "object",
    "a selected item has its cluster and drawn style, as the selection event");

  await clearEvents();
  await page.evaluate(() => window.__chart.select(window.__chart.getSelection()));
  expect(same(await selection(), [["genes", 2, null]]), "the items of getSelection() select their elements again");
  expect((await events("selection")).length === 0, "selecting the same elements reports nothing");

  // getSelection() and the events give copies: changing them changes nothing
  const copies = await page.evaluate(() => {
    const chart = window.__chart;
    const [item] = chart.getSelection();
    item.component = "labels";
    item.data.rowID = 99;
    chart.getSelection().length = 0;
    const kept = chart.getSelection().map((i) => [i.component, i.data.rowID]);
    // A selection handler that changes what it gets
    const off = chart.on("selection", (event) => { event.detail.length = 0; });
    const offSelect = chart.on("select", (event) => { if (event.detail) event.detail.component = "labels"; });
    chart.select([{ component: "genes", data: { rowID: 3 } }]);
    off(); offSelect();
    const after = chart.getSelection().map((i) => [i.component, i.data.rowID]);
    chart.select([{ component: "genes", data: { rowID: 2 } }]);
    return { kept, after, again: chart.getSelection().map((i) => [i.component, i.data.rowID]) };
  });
  expect(same(copies.kept, [["genes", 2]]), "changing what getSelection() gives leaves the selection as it was");
  expect(same(copies.after, [["genes", 3]]), "changing what the select and selection events give leaves it too");
  expect(same(copies.again, [["genes", 2]]), "the drawn rows keep their rowID");

  await page.evaluate(() => window.__chart.select({ component: "labels" }));
  expect(same(await selection(), [["labels", 1, null], ["labels", 2, null], ["labels", 3, null]]),
    "an item with only a component selects every element of it");
  expect((await events("select")).at(-1)?.detail?.data?.rowID === 3, "the last element is the one select reports");

  await page.evaluate(() => window.__chart.select([
    { component: "labels", data: { rowID: 3 } }, { component: "genes", data: { rowID: 1 } }]));
  expect(same(await selection(), [["labels", 3, null], ["genes", 1, null]]), "elements are selected in the order of the items");

  await page.evaluate(() => window.__chart.select([{ component: "genes", data: { rowID: 99 } }]));
  expect(same(await selection(), []), "an item that matches nothing selects nothing");
  await page.evaluate(() => window.__chart.select([{ component: "genes" }]));
  await page.evaluate(() => window.__chart.select(null));
  expect(same(await selection(), []) && await selectedNodes() === 0, "select(null) clears the selection");
  expect((await events("select")).at(-1)?.detail === null, "clearing reports select as null");

  const badItem = await page.evaluate(() => {
    try { window.__chart.select([{ rowID: 1 }]); return null; } catch (error) { return error.message; }
  });
  expect(/component/.test(badItem ?? ""), "an item without a component is an error");

  await page.evaluate(() => window.__chart.select([{ component: "genes", data: { rowID: 1 } }]));
  await page.evaluate(() => window.__chart.update({ height: "160px" }));
  expect(same(await selection(), [["genes", 1, null]]), "the selection is kept when the chart is drawn again");

  // Undo and redo of a drag
  await mount(spec);
  await page.evaluate(() => window.__chart.undo());
  expect((await events("drag")).length === 0, "undo() with no moves does nothing");
  const box = await page.locator("#chart text.label").nth(0).boundingBox();
  const from = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(from.x + 3 * i, from.y - 2 * i);
  await page.mouse.up();
  const dragged = (await events("drag")).at(-1)?.detail;
  expect(dragged && (dragged.position.moveX !== 0 || dragged.position.moveY !== 0), "a label is dragged");

  await clearEvents();
  await page.evaluate(() => window.__chart.undo());
  const undone = (await events("drag")).at(-1)?.detail;
  expect(undone?.action === "undo" && same(undone.position, { moveX: 0, moveY: 0 }), "undo() moves the label back");
  await clearEvents();
  await page.evaluate(() => window.__chart.redo());
  const redone = (await events("drag")).at(-1)?.detail;
  expect(redone?.action === "redo" && same(redone.position, dragged?.position), "redo() moves it again");
  await clearEvents();
  await page.evaluate(() => window.__chart.redo());
  expect((await events("drag")).length === 0, "redo() with nothing undone does nothing");
  expect(await page.evaluate(() => !document.querySelector("#chart .geneviewer-undo").disabled),
    "the toolbar's undo button follows undo() and redo()");

  // download()
  await page.evaluate(() => window.__chart.download("svg"));
  await page.evaluate(() => window.__chart.download("png", "chart.png"));
  const saved = await page.evaluate(() => window.__saved);
  expect(saved[0]?.filename === "graph.svg" && saved[0].type.startsWith("image/svg+xml") &&
    /<svg[\s>]/.test(Buffer.from(saved[0].bytes).toString("utf8")),
    "download(\"svg\") saves graph.svg through saveAs");
  expect(saved[1]?.filename === "chart.png" && same(saved[1].bytes.slice(0, 8), pngSignature),
    "download(\"png\", name) saves a PNG with that name");
  const badFormat = await page.evaluate(() => window.__chart.download("pdf").then(() => null, (error) => error.message));
  expect(/svg.*png/.test(badFormat ?? ""), "another format is rejected");

  // Without saveAs, the browser downloads the file
  const plain = await browser.newPage({ viewport: { width: 1200, height: 900 }, acceptDownloads: true });
  try {
    await plain.goto(harness, { waitUntil: "load" });
    await plain.evaluate((spec) => {
      const el = document.getElementById("chart");
      el.style.width = "1000px";
      el.style.height = spec.height;
      window.__chart = geneviewer.newChart(el, spec);
    }, spec);
    const [download] = await Promise.all([
      plain.waitForEvent("download", { timeout: 10000 }),
      plain.evaluate(() => window.__chart.download("svg", "genes.svg")),
    ]);
    expect(download.suggestedFilename() === "genes.svg", "without saveAs, download() is a browser download");
  } finally {
    await plain.close();
  }

  // Without events.select, select() warns and selects nothing
  await mount({ ...spec, events: { drag: true } });
  await page.evaluate(() => window.__chart.select([{ component: "genes" }]));
  expect(same(await selection(), []), "select() needs events.select");
  expect(warnings.some((text) => /select\(\) needs events/.test(text)), "and warns once without it");

  // chart.on() warns when the event is off, not for options.on or when an
  // update in the same tick turns it on
  const listen = (name, turnOn) => page.evaluate(async ({ name, turnOn }) => {
    window.__chart.on(name, () => {});
    if (turnOn) window.__chart.update({ events: turnOn });
    await Promise.resolve();
  }, { name, turnOn });
  await mount({ ...spec, events: { drag: true } });
  expect(!warnings.some((text) => /chart\.on\(/.test(text)), "options.on does not warn about events that are off");
  await listen("drag");
  expect(!warnings.some((text) => /chart\.on\(/.test(text)), "chart.on() does not warn about an event that is on");
  // Clicks are on as soon as the spec has an events key
  await mount({ ...spec, events: undefined });
  await listen("click");
  expect(warnings.some((text) => text === 'chart.on("click") reports nothing without events: { click: true }.'),
    "chart.on() warns about an event that is off");
  await listen("selection");
  expect(warnings.some((text) => text === 'chart.on("selection") reports nothing without events: { select: true }.'),
    "and names the option that turns it on");
  await listen("dblclick", { dblclick: true });
  expect(!warnings.some((text) => /chart\.on\("dblclick"/.test(text)), "chart.on() does not warn when an update turns the event on");
} finally {
  await browser.close();
}

expect(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join("; ") : ""));
console.log(`methods: ${failures.length ? failures.length + " failed" : "all passed"}`);
process.exit(failures.length ? 1 : 0);
