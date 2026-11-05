// Draws one fixture in headless Chrome and returns its canonical listing.
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const harness = pathToFileURL(path.join(__dirname, "index.html")).href;

/**
 * @param {import("playwright-core").Browser} browser
 * @param {object} payload  widget$x as exported from R
 * @param {{ width?: number, height: string }} meta
 * @param {"binding"|"direct"|"spec"|"rspec"} mode  how the harness draws it (mount.js)
 * @param {"core"|"min"} build  the library build the page loads
 * @returns {Promise<string>} canonical listing of the drawn chart
 */
async function renderFixture(browser, payload, meta, mode = "binding", build = "core") {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push("console: " + message.text());
  });
  try {
    await page.goto(`${harness}?mode=${mode}&build=${build}`, { waitUntil: "load" });
    const listing = await page.evaluate(async ({ payload, meta }) => {
      mountChart(payload, meta);
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return normalizeChart(document.getElementById("chart"));
    }, { payload, meta });
    if (errors.length) throw new Error(errors.join("\n"));
    return listing;
  } finally {
    await page.close();
  }
}

module.exports = { renderFixture };
