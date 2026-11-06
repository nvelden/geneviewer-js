// The R binding finds a chart when GC_zoom_to()'s message arrives and keeps no
// list of charts: the chart of a removed Shiny output can be freed, and an
// output drawn again under the same id gets the message. Draws rd-GC-title-1
// through geneviewerwidget.js. Run through `npm test`.
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright-core");

const harness = pathToFileURL(path.join(__dirname, "harness", "index.html")).href + "?mode=rspec";
const spec = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "rd-GC-title-1", "spec.json"), "utf8"));
spec.zoom = { show: true };

(async () => {
  const browser = await chromium.launch({ args: ["--font-render-hinting=none", "--disable-gpu", "--js-flags=--expose-gc"] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const failures = [];
  const expect = (ok, message) => {
    console.log(`${ok ? "pass" : "FAIL"}  ${message}`);
    if (!ok) failures.push(message);
  };
  try {
    await page.goto(harness, { waitUntil: "load" });
    await page.evaluate((spec) => {
      window.handlers = {};
      window.Shiny = {
        addCustomMessageHandler: (name, handler) => { window.handlers[name] = handler; },
        setInputValue: () => {},
      };
      HTMLWidgets.shinyMode = true;
      // An output as Shiny binds it: the runtime keeps the widget on the element
      window.addOutput = (id) => {
        const el = document.createElement("div");
        el.id = id;
        el.style.width = "800px";
        el.style.height = "300px";
        document.body.appendChild(el);
        el.__widget = HTMLWidgets.bindings.geneviewer.factory(el, 800, 300);
        el.__widget.renderValue({ spec });
        return el;
      };
      window.zoomStart = (id) => document.querySelector(`#${id} [data-zoom-part=window]`).style.left;
      window.zoom = (id, range) => window.handlers["geneviewer-zoom"]({ id, range });
    }, spec);

    const zoomed = (id) => page.evaluate((id) => {
      window.zoom(id, [0.25, 0.5]);
      return window.zoomStart(id);
    }, id);

    await page.evaluate(() => { window.addOutput("one"); window.addOutput("two"); });
    expect(await zoomed("two") === "25%", "the message reaches the chart of its output");
    expect(await page.evaluate(() => window.zoomStart("one")) === "0%", "other outputs stay as they are");

    await page.evaluate(() => window.zoom("none", [0.25, 0.5]));
    expect(true, "a message for an output that does not exist is ignored");

    await page.evaluate(() => {
      document.getElementById("one").remove();
      window.addOutput("one");
    });
    expect(await zoomed("one") === "25%", "an output drawn again gets the message");

    // Allocated in a function that has returned, so nothing here holds the chart
    await page.evaluate(() => {
      const el = window.addOutput("gone");
      window.freed = new WeakRef(el.__widget.getChart());
      el.remove();
    });
    const collected = await page.evaluate(async () => {
      for (let i = 0; i < 20 && window.freed.deref(); i++) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        window.gc();
      }
      return window.freed.deref() === undefined;
    });
    expect(collected, "the chart of a removed output is freed");
    expect(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join("; ") : ""));
  } finally {
    await browser.close();
  }
  console.log(`binding: ${failures.length ? failures.length + " failed" : "all passed"}`);
  process.exit(failures.length ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
