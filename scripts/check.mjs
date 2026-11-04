// Syntax-check every JavaScript source file.
import { execFileSync } from "node:child_process";
import { files } from "./files.mjs";

for (const file of files.filter((f) => f.endsWith(".js"))) {
  execFileSync(process.execPath, ["--check", `src/${file}`], { stdio: "inherit" });
  console.log(`ok  src/${file}`);
}
