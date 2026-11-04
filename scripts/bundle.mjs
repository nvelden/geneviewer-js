// esbuild settings shared by the release build (scripts/build.mjs) and the
// test build (scripts/build-test.mjs): an unminified classic script that
// defines one global and uses the page's global `d3`. Any esbuild warning
// fails the build.
import * as esbuild from "esbuild";

// Bundles entry into one script that defines the global globalName; gives its text
export async function bundleScript(entry, globalName) {
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: "iife",
    globalName,
    minify: false,
    charset: "utf8",
    target: "es2020",
    logLevel: "warning",
    write: false,
  });
  if (result.warnings.length) {
    console.error(`${entry}: ${result.warnings.length} esbuild warning(s)`);
    process.exit(1);
  }
  return result.outputFiles[0].text;
}
