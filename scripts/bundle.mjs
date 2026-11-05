// esbuild settings shared by the release build (scripts/build.mjs) and the
// test build (scripts/build-test.mjs). Any esbuild warning fails the build.
//
// d3 is the page's global (d3: "global"), imported from the d3 package
// (d3: "import", left as an import), or bundled in (d3: "bundle"). The
// stylesheet src/styles.css is bundled as text; the library injects it.
import * as esbuild from "esbuild";

/**
 * Bundles entry; gives the output files ({ path, text }) by name.
 * @param {string} entry
 * @param {{ format?: "iife"|"esm", globalName?: string, d3?: "global"|"import"|"bundle",
 *   minify?: boolean, sourcemap?: boolean, outfile?: string }} [options]
 */
export async function bundle(entry, options = {}) {
  const { format = "iife", globalName, d3 = "global", minify = false, sourcemap = false,
    outfile = "out.js" } = options;
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format,
    globalName: format === "iife" ? globalName : undefined,
    minify,
    sourcemap: sourcemap ? "linked" : false,
    outfile,
    charset: "utf8",
    target: "es2020",
    logLevel: "warning",
    write: false,
    loader: { ".css": "text" },
    inject: d3 === "global" ? [] : ["src/d3.js"],
    external: d3 === "import" ? ["d3"] : [],
  });
  if (result.warnings.length) {
    console.error(`${entry}: ${result.warnings.length} esbuild warning(s)`);
    process.exit(1);
  }
  return result.outputFiles;
}

// Bundles entry into one unminified script that defines the global
// globalName and uses the page's d3; gives its text
export async function bundleScript(entry, globalName) {
  const [file] = await bundle(entry, { globalName });
  return file.text;
}
