// Site check: serves _site/ (npm run site) and loads its pages. Every chart
// draws, nothing shows an error, the console has no errors, the event log
// of the interactive example logs a selection, each example has JavaScript
// and R code, and the API reference lists every option of the schema. Run
// through `npm test`.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright-core");

const root = path.join(__dirname, "..", "_site");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
                ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

(async () => {
  if (!fs.existsSync(path.join(root, "index.html"))) throw new Error("_site/ is missing: run npm run site.");
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = path.join(root, url.endsWith("/") ? url + "index.html" : url);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: ["--font-render-hinting=none", "--disable-gpu"] });
  const failures = [];
  const expect = (ok, message) => {
    console.log(`${ok ? "pass" : "FAIL"}  ${message}`);
    if (!ok) failures.push(message);
  };
  try {
    for (const name of ["index.html", "getting-started.html", "examples.html"]) {
      const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      await page.goto(base + name, { waitUntil: "networkidle" });
      const charts = await page.evaluate(() => [...document.querySelectorAll(".chart")].map((el) => ({
        id: el.closest("section")?.id || el.id,
        drawn: !!el.querySelector("svg.geneviewer-svg-content .gene, svg.geneviewer-svg-content path"),
        error: el.classList.contains("chart-error") ? el.textContent : null,
      })));
      expect(charts.length > 0, `${name}: has charts (${charts.length})`);
      charts.forEach((chart) => expect(chart.drawn && !chart.error,
        `${name}: ${chart.id} draws` + (chart.error ? ` (${chart.error})` : "")));
      const pageErrors = await page.locator(".chart-error").count();
      expect(pageErrors === 0, `${name}: no error messages on the page`);
      // The toolbar shows while the mouse is over the chart (styles.css
      // finds the chart by the class newChart gives it)
      const first = page.locator(".chart").first();
      await first.scrollIntoViewIfNeeded();
      await first.hover();
      await page.waitForTimeout(300);
      const opacity = await first.locator(".geneviewer-toolbar").evaluate((node) => getComputedStyle(node).opacity);
      expect(opacity === "1", `${name}: hovering a chart shows its toolbar (opacity ${opacity})`);
      if (name === "examples.html") {
        await page.locator("#interactive .gene").nth(1).scrollIntoViewIfNeeded();
        const gene = await page.locator("#interactive .gene").nth(1).boundingBox();
        await page.mouse.click(gene.x + gene.width / 2, gene.y + gene.height / 2);
        const log = await page.locator("#interactive .event-log").textContent();
        expect(/^select\s/m.test(log) && /^selection\s/m.test(log),
          `${name}: the event log shows a selection (${JSON.stringify(log.slice(0, 80))})`);
        const tabs = await page.evaluate(() => [...document.querySelectorAll(".chart-card")].map((card) => ({
          id: card.id,
          tabs: [...card.querySelectorAll(".tab")].map((tab) => tab.textContent),
          code: [...card.querySelectorAll("pre code")].map((code) => code.textContent),
        })));
        tabs.forEach((card) => expect(card.tabs.join(",") === "JavaScript,R" &&
          card.code[0].includes("geneviewer.newChart(") && /GC_chart\(/.test(card.code[1]),
          `${name}: ${card.id} shows its JavaScript and R code`));
        // The data files the JavaScript loads are there
        for (const card of tabs) {
          const file = /fetch\("([^"]+)"\)/.exec(card.code[0])?.[1];
          const response = file ? await page.request.get(base + file) : null;
          expect(response && response.ok(), `${name}: ${card.id} loads ${file}`);
        }
      }
      expect(errors.length === 0, `${name}: no console errors` + (errors.length ? ": " + errors.join("; ") : ""));
      await page.close();
    }
    // The API reference lists every option of every component
    const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "schema", "spec-v1.schema.json"), "utf8"));
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base + "api.html", { waitUntil: "load" });
    const listed = await page.evaluate(() => {
      const out = {};
      document.querySelectorAll("h3[id]").forEach((heading) => {
        let table = heading.nextElementSibling;
        while (table && table.tagName !== "TABLE" && !/^H[23]$/.test(table.tagName)) table = table.nextElementSibling;
        if (table && table.tagName !== "TABLE") table = null;
        out[heading.id] = table ? [...table.querySelectorAll("tr td:first-child code")].map((c) => c.textContent) : [];
      });
      return out;
    });
    const resolve = (node) => (node && node.$ref ? schema.$defs[node.$ref.split("/").pop()] : node);
    const entryOf = (node) => {
      const alternatives = node.oneOf || node.allOf || [node];
      return alternatives.map(resolve).find((alt) => alt && alt.properties) ||
        resolve(alternatives.find((alt) => alt.type === "array")?.items);
    };
    const missing = [];
    for (const [key, node] of Object.entries(schema.properties)) {
      const entry = entryOf(node);
      if (!entry || !entry.properties || ["version", "data", "width", "height", "style"].includes(key)) continue;
      for (const option of Object.keys(entry.properties)) {
        if (!(listed[key] || []).includes(option)) missing.push(`${key}.${option}`);
      }
    }
    expect(missing.length === 0, `api.html: every option of the schema is listed` +
      (missing.length ? ` (missing: ${missing.slice(0, 10).join(", ")})` : ""));
    expect(errors.length === 0, `api.html: no page errors`);
    await page.close();
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`site: ${failures.length ? failures.length + " failed" : "all passed"}`);
  process.exit(failures.length ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
