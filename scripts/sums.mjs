// Write dist/SHA256SUMS: the checksum of every file in dist/ (the last step
// of npm run build).
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const names = readdirSync("dist").filter((name) => name !== "SHA256SUMS").sort();
const lines = names.map((name) =>
  `${createHash("sha256").update(readFileSync(`dist/${name}`)).digest("hex")}  ${name}`);
writeFileSync("dist/SHA256SUMS", lines.join("\n") + "\n");
console.log(`built dist/SHA256SUMS (${names.length} files)`);
