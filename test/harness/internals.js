// Library functions that tests call directly, though they are not public.
// scripts/build-test.mjs bundles this file into build/internals.js with the
// global name `geneviewerInternals`; a test adds it to its page.
export { getColorScale } from "../../src/lib/color.js";
