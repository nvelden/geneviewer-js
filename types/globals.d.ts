// The page's global d3, which the library uses (D3 7.8.5), for type checks
// of src/ (jsconfig.json). Typed loosely: the library is not type-checked
// against D3's own types.
declare const d3: any;

// The version in package.json, set by the build (scripts/bundle.mjs)
declare const __VERSION__: string;

// The stylesheet, bundled as text (scripts/bundle.mjs)
declare module "*.css" {
  const text: string;
  export default text;
}
