// How chart.update() changes a chart's spec.

const isObject = (x) => x !== null && typeof x === "object" && !Array.isArray(x);

/**
 * A spec with a partial spec merged into it: objects are merged key by key,
 * at every level; arrays, scalars and null replace the value. Neither input
 * is changed.
 * @param {Object<string, *>} spec
 * @param {Object<string, *>} partial
 * @returns {Object<string, *>}
 */
export function mergeSpec(spec, partial) {
  const out = { ...spec };
  for (const [key, value] of Object.entries(partial || {})) {
    if (value === undefined) continue;
    out[key] = isObject(out[key]) && isObject(value) ? mergeSpec(out[key], value) : structuredClone(value);
  }
  return out;
}
