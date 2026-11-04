// Syntax-check every JavaScript source file, and check that the version in
// src/lib/chart.js is the one in package.json.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { files } from "./files.mjs";

// The modules of the bundle (package.json "type": "module", so node checks
// them as ES modules) and the files copied as they are
const modules = readdirSync("src/lib", { recursive: true })
  .filter((f) => f.endsWith(".js")).sort().map((f) => `lib/${f}`);
const copied = files.flatMap((f) => f.sources).filter((f) => f.endsWith(".js"));
for (const file of [...modules, ...copied]) {
  execFileSync(process.execPath, ["--check", `src/${file}`], { stdio: "inherit" });
  console.log(`ok  src/${file}`);
}

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const match = /var version = "([^"]+)";/.exec(readFileSync("src/lib/chart.js", "utf8"));
if (!match || match[1] !== version) {
  console.error(`src/lib/chart.js has version ${match ? match[1] : "(none)"}, package.json ${version}`);
  process.exit(1);
}
console.log(`ok  version ${version}`);
