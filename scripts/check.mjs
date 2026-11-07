// Syntax-check every JavaScript source file.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
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
