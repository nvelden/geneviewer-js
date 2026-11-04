// esbuild settings shared by the release build (scripts/build.mjs) and the
// test build (scripts/build-test.mjs): an unminified classic script that
// defines one global and uses the page's global `d3`.
import { readFileSync } from "node:fs";
import * as esbuild from "esbuild";
import { bundle } from "./files.mjs";

// The classic scripts, joined into the one module "geneviewer:scripts" (until
// M3.2 splits them), with `exports` added as its exports
function scripts(exports = []) {
  return {
    name: "scripts",
    setup(build) {
      build.onResolve({ filter: /^geneviewer:scripts$/ }, (args) => ({ path: args.path, namespace: "scripts" }));
      build.onLoad({ filter: /.*/, namespace: "scripts" }, () => ({
        contents: bundle.scripts.map((source) => readFileSync(`src/${source}`, "utf8")).join("\n") +
          (exports.length ? `\nexport { ${exports.join(", ")} };\n` : ""),
        loader: "js",
        resolveDir: "src",
      }));
    },
  };
}

// Bundles entry into one script that defines the global globalName; gives its text
export async function bundleScript(entry, globalName, { exports } = {}) {
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: "iife",
    globalName,
    minify: false,
    charset: "utf8",
    target: "es2020",
    logLevel: "warning",
    plugins: [scripts(exports)],
    write: false,
  });
  return result.outputFiles[0].text;
}
