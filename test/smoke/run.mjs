// Smoke tests in fresh projects (npm run test:smoke), from a tarball made by
// npm pack, as users install the package:
//   plain-html  a page loading dist/geneviewer.min.js draws a chart
//   vite        a new Vite project (vanilla) imports { newChart } from
//               "geneviewer-js", vite build, and its page draws a chart
//   types       a .ts file using newChart and Spec compiles (tsc --noEmit)
// Each chart is the spec in test/smoke/spec.json; headless Chrome checks
// that its genes are drawn. Needs the network (npm) and Chrome: the
// browser of playwright-core, or CHROME_PATH.
//
//   node test/smoke/run.mjs                  all, from a new tarball
//   node test/smoke/run.mjs --only vite      one (repeatable)
//   node test/smoke/run.mjs --url <script>   plain-html with this script URL
//                                            (e.g. the jsDelivr URL)
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const only = args.flatMap((arg, i) => (arg === "--only" ? [args[i + 1]] : []));
const scriptUrl = args.includes("--url") ? args[args.indexOf("--url") + 1] : null;
const wanted = (name) => !only.length || only.includes(name);
const spec = readFileSync(path.join(repo, "test/smoke/spec.json"), "utf8");
const work = mkdtempSync(path.join(tmpdir(), "geneviewer-smoke-"));
const run = (cmd, cmdArgs, cwd) => execFileSync(cmd, cmdArgs, { cwd, stdio: ["ignore", "pipe", "inherit"] }).toString();
const failures = [];
const report = (ok, message) => {
  console.log(`${ok ? "pass" : "FAIL"}  ${message}`);
  if (!ok) failures.push(message);
};

// The tarball, from a fresh build
run("npm", ["run", "-s", "build"], repo);
const tarball = path.join(work, run("npm", ["pack", "--silent", "--pack-destination", work], repo).trim().split("\n").pop());
console.log(`tarball ${tarball}`);

// Serves dir on a free port; gives its URL and a close function
function serve(dir) {
  const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json" };
  const server = createServer((req, res) => {
    const file = path.join(dir, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
    if (!file.startsWith(dir) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () =>
    resolve({ url: `http://127.0.0.1:${server.address().port}/`, close: () => server.close() })));
}

// The number of genes drawn on the page at url
async function genesDrawn(browser, url) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(url, { waitUntil: "load" });
    await page.waitForFunction(() => document.querySelectorAll("#chart .gene").length > 0,
      null, { timeout: 15000, polling: 100 }).catch(() => {});
    const genes = await page.evaluate(() => document.querySelectorAll("#chart .gene").length);
    return { genes, errors };
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
try {
  if (wanted("plain-html")) {
    const dir = path.join(work, "plain-html");
    run("mkdir", ["-p", dir]);
    run("tar", ["-xzf", tarball, "-C", dir]);
    const src = scriptUrl || "package/dist/geneviewer.min.js";
    writeFileSync(path.join(dir, "index.html"), `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>plain-html</title>
<script src="${src}"></script></head>
<body><div id="chart" style="width: 800px; height: 300px"></div>
<script>geneviewer.newChart("#chart", ${spec});</script></body></html>
`);
    const server = await serve(dir);
    const { genes, errors } = await genesDrawn(browser, server.url);
    server.close();
    report(genes === 3 && !errors.length, `plain-html: ${genes} genes drawn from ${src}${errors.length ? `; errors: ${errors.join("; ")}` : ""}`);
  }

  if (wanted("vite")) {
    const dir = path.join(work, "vite");
    run("npm", ["create", "--yes", "vite@latest", "vite", "--", "--template", "vanilla", "--no-interactive"], work);
    run("npm", ["install", "--silent"], dir);
    run("npm", ["install", "--silent", tarball], dir);
    writeFileSync(path.join(dir, "index.html"), `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>vite</title></head>
<body><div id="chart" style="width: 800px; height: 300px"></div>
<script type="module" src="/main.js"></script></body></html>
`);
    writeFileSync(path.join(dir, "main.js"), `import { newChart } from "geneviewer-js";\n\nnewChart(document.getElementById("chart"), ${spec});\n`);
    run("npx", ["vite", "build", "--logLevel", "error"], dir);
    const server = await serve(path.join(dir, "dist"));
    const { genes, errors } = await genesDrawn(browser, server.url);
    server.close();
    report(genes === 3 && !errors.length, `vite: ${genes} genes drawn after vite build${errors.length ? `; errors: ${errors.join("; ")}` : ""}`);
  }

  if (wanted("types")) {
    const dir = path.join(work, "types");
    run("mkdir", ["-p", dir]);
    writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "types-smoke", private: true, type: "module" }));
    run("npm", ["install", "--silent", tarball], dir);
    cpSync(path.join(repo, "test/smoke/usage.ts"), path.join(dir, "usage.ts"));
    writeFileSync(path.join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: {
      strict: true, noEmit: true, target: "es2020", module: "esnext", moduleResolution: "bundler",
      lib: ["es2020", "dom"], skipLibCheck: false }, files: ["usage.ts"] }));
    let ok = true;
    try {
      run(process.execPath, [path.join(repo, "node_modules/typescript/bin/tsc"), "-p", "."], dir);
    } catch {
      ok = false;
    }
    report(ok, "types: usage.ts compiles against the installed package");
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.log(`smoke: ${failures.length} failed (files in ${work})`);
  process.exit(1);
}
console.log("smoke: all passed");
