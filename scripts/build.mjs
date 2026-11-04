// Build dist/: the release files (flat, as GitHub release assets are) plus SHA256SUMS.
//
// The files are joined from src/ unminified and unchanged, so the R package
// can ship them as readable source and verify them against SHA256SUMS.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { files } from "./files.mjs";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");

const sums = [];
for (const { name, sources } of files) {
  const parts = sources.map((source) => readFileSync(`src/${source}`, "utf8"));
  // Each part ends with exactly one newline, so the parts join cleanly
  const content = parts.map((part) => part.replace(/\n*$/, "\n")).join("\n");
  writeFileSync(`dist/${name}`, content);
  sums.push(`${createHash("sha256").update(content).digest("hex")}  ${name}`);
  console.log(`built dist/${name}`);
}

writeFileSync("dist/SHA256SUMS", sums.join("\n") + "\n");
console.log("built dist/SHA256SUMS");
