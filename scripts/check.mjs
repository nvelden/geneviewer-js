// Syntax-check every JavaScript source file, and check that the version in
// src/chart.js is the one in package.json.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { bundle, files } from "./files.mjs";

const sources = [...bundle.scripts, ...files.flatMap((f) => f.sources)].filter((f) => f.endsWith(".js"));
for (const file of sources) {
  execFileSync(process.execPath, ["--check", `src/${file}`], { stdio: "inherit" });
  console.log(`ok  src/${file}`);
}

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const match = /var version = "([^"]+)";/.exec(readFileSync("src/chart.js", "utf8"));
if (!match || match[1] !== version) {
  console.error(`src/chart.js has version ${match ? match[1] : "(none)"}, package.json ${version}`);
  process.exit(1);
}
console.log(`ok  version ${version}`);
