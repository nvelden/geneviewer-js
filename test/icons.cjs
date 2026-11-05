// The toolbar's default icons show on a page without Font Awesome: each is
// an inline SVG with a size. A custom icon by name stays a Font Awesome <i>.
// Draws rd-GC-title-1 from its spec with drag, zoom and the toolbar always
// shown. Run through `npm test`.
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright-core");

const harness = pathToFileURL(path.join(__dirname, "harness", "index.html")).href + "?mode=spec";
const fixture = path.join(__dirname, "fixtures", "rd-GC-title-1");

(async () => {
  const spec = JSON.parse(fs.readFileSync(path.join(fixture, "spec.json"), "utf8"));
  const meta = JSON.parse(fs.readFileSync(path.join(fixture, "meta.json"), "utf8"));
  const browser = await chromium.launch({ args: ["--font-render-hinting=none", "--disable-gpu"] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  const failures = [];
  const expect = (ok, message) => {
    console.log(`${ok ? "pass" : "FAIL"}  ${message}`);
    if (!ok) failures.push(message);
  };
  try {
    await page.goto(harness, { waitUntil: "load" });
    const icons = async (extra) => page.evaluate(({ spec, meta, extra }) => {
      const el = document.getElementById("chart");
      if (window.__chart) window.__chart.destroy();
      window.__chart = mountChart({ ...spec, events: { drag: true }, zoom: { show: true },
                                    toolbar: { show: "always", ...extra } }, meta);
      // Show the groups that wait for a move or a zoom, to measure them
      el.querySelectorAll(".geneviewer-toolbar [hidden]").forEach((node) => { node.hidden = false; });
      const fontAwesome = !!document.querySelector('link[href*="fontawesome"]');
      const of = (selector) => {
        const node = el.querySelector(selector);
        if (!node) return null;
        const box = node.getBoundingClientRect();
        return { tag: node.tagName.toLowerCase(), width: box.width, height: box.height,
                 path: !!node.querySelector("path"), className: node.getAttribute("class") };
      };
      return {
        fontAwesome,
        undo: of(".geneviewer-undo svg"), redo: of(".geneviewer-redo svg"), reset: of(".geneviewer-reset svg"),
        zoom: of(".geneviewer-zoom svg"), save: of(".geneviewer-save-icon svg"),
        customSave: of(".geneviewer-save-icon"),
      };
    }, { spec, meta, extra });

    const plain = await icons({});
    expect(!plain.fontAwesome, "the page has no Font Awesome");
    for (const name of ["undo", "redo", "reset", "zoom", "save"]) {
      const icon = plain[name];
      expect(icon && icon.tag === "svg" && icon.path && icon.width > 5 && icon.height > 5,
        `${name}: an inline SVG icon that shows (${icon ? `${icon.width.toFixed(1)}x${icon.height.toFixed(1)}` : "missing"})`);
    }
    const custom = await icons({ icons: { save: "camera" } });
    expect(custom.customSave && custom.customSave.tag === "i" && /fa-solid fa-camera/.test(custom.customSave.className) && !custom.save,
      "a custom icon by name is a Font Awesome <i>");
  } finally {
    await browser.close();
  }
  if (failures.length) {
    console.log(`icons: ${failures.length} failed`);
    process.exit(1);
  }
  console.log("icons: all passed");
})();
