// Draws one fixture in headless Chrome and returns its canonical listing.
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const harness = pathToFileURL(path.join(__dirname, "index.html")).href;

/**
 * @param {import("puppeteer").Browser} browser
 * @param {object} payload  widget$x as exported from R
 * @param {{ width?: number, height: string }} meta
 * @returns {Promise<string>} canonical listing of the drawn chart
 */
async function renderFixture(browser, payload, meta) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push("console: " + message.text());
  });
  try {
    await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1 });
    await page.goto(harness, { waitUntil: "load" });
    const listing = await page.evaluate(async (payload, meta) => {
      const el = document.getElementById("chart");
      el.classList.add("html-widget", "geneviewer");
      el.style.width = (meta.width || 1000) + "px";
      el.style.height = meta.height || "400px";
      const binding = HTMLWidgets.bindings.geneviewer;
      const chart = binding.factory(el, el.clientWidth, el.clientHeight);
      chart.renderValue(payload);
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return normalizeChart(el);
    }, payload, meta);
    if (errors.length) throw new Error(errors.join("\n"));
    return listing;
  } finally {
    await page.close();
  }
}

module.exports = { renderFixture };
