// Build dist/: the release files (flat, as GitHub release assets are) plus SHA256SUMS.
//
// The files are copied unminified and unchanged, so the R package can ship
// them as readable source and verify them against SHA256SUMS.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { files } from "./files.mjs";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");

const sums = [];
for (const file of files) {
  const content = readFileSync(`src/${file}`);
  writeFileSync(`dist/${basename(file)}`, content);
  sums.push(`${createHash("sha256").update(content).digest("hex")}  ${basename(file)}`);
  console.log(`built dist/${basename(file)}`);
}

writeFileSync("dist/SHA256SUMS", sums.join("\n") + "\n");
console.log("built dist/SHA256SUMS");
