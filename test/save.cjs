// Save tests: the save menu downloads graph.svg and graph.png. The download
// is intercepted and its first bytes checked. Run through `npm test`.
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright-core");

const harness = pathToFileURL(path.join(__dirname, "harness", "index.html")).href;
const fixture = path.join(__dirname, "fixtures", "ophA");
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const checks = [
  { label: "Save as SVG", filename: "graph.svg",
    // chartToSVG() writes an XML declaration first
    ok: (bytes) => /^(<\?xml[^>]*\?>\s*)?<svg[\s>]/.test(bytes.subarray(0, 200).toString("utf8")) },
  { label: "Save as PNG", filename: "graph.png",
    ok: (bytes) => bytes.subarray(0, 8).equals(pngSignature) },
];

(async () => {
  const payload = JSON.parse(fs.readFileSync(path.join(fixture, "payload.json"), "utf8"));
  const meta = JSON.parse(fs.readFileSync(path.join(fixture, "meta.json"), "utf8"));
  const browser = await chromium.launch({ args: ["--font-render-hinting=none", "--disable-gpu"] });
  let failed = 0;
  try {
    for (const mode of ["binding", "direct"]) for (const check of checks) {
      const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, acceptDownloads: true });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.goto(harness + "?mode=" + mode, { waitUntil: "load" });
        await page.evaluate(({ payload, meta }) => mountChart(payload, meta), { payload, meta });
        // With the keyboard: the menu shows while the save icon has focus.
        // (The harness has no icon font, so the icon has no size to hover.)
        await page.focus("#chart .geneviewer-save-icon");
        const item = page.getByRole("menuitem", { name: check.label });
        await item.focus();
        const [download] = await Promise.all([
          page.waitForEvent("download", { timeout: 10000 }),
          item.press("Enter"),
        ]);
        const bytes = fs.readFileSync(await download.path());
        const name = download.suggestedFilename();
        if (errors.length) throw new Error(errors.join("\n"));
        if (name !== check.filename) throw new Error(`file name ${name}, expected ${check.filename}`);
        if (!check.ok(bytes)) throw new Error(`unexpected content: ${JSON.stringify(bytes.subarray(0, 16).toString("latin1"))}`);
        console.log(`pass  ${mode}  ${check.filename}  (${bytes.length} bytes)`);
      } catch (error) {
        failed++;
        console.log(`FAIL  ${mode}  ${check.filename}  ${error.message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`save: ${failed ? failed + " failed" : "all passed"}`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
