// compile(spec): the render model the chart draws, from a spec. It does what
// the R package's GC_* functions did before the chart reached the browser:
// split the data into clusters, apply each component's options per cluster,
// resolve the theme. See docs/design/api.md, Decision 1.
import { Frame } from "./frame.js";
import { chart } from "./chart.js";
import { renderTheme } from "./render.js";
import { cluster } from "./cluster.js";
import { color, coordinates, genes, labels, legend, pattern, sequence, tooltip } from "./genes.js";
import { clusterFooter, clusterLabel, clusterTitle, grid, title } from "./layout.js";
import { clone } from "./r.js";
import { OPTION_NAMES, renameOptions } from "./names.js";
import { align, scale, scaleBar } from "./scale.js";
import { links } from "./links.js";
import { transcript } from "./transcript.js";
import { annotation, elementStyle } from "./annotations.js";
import { theme } from "./theme.js";
import { events, toolbar, trackMouse, zoom } from "./interaction.js";

/**
 * How each spec key changes the chart. The keys of a spec are applied in
 * their own order (the order R recorded the calls in), and each key's
 * entries in array order.
 * @type {Object<string, (state: import("./chart.js").ChartState, entry: Object<string, *>) => void>}
 */
const handlers = {
  cluster,
  labels,
  genes,
  color,
  pattern,
  legend,
  sequence,
  coordinates,
  tooltip,
  title,
  clusterTitle,
  clusterLabel,
  clusterFooter,
  grid,
  scale,
  scaleBar,
  align,
  links,
  transcript,
  annotation,
  elementStyle,
  theme,
  zoom,
  toolbar,
  events,
  trackMouse,
};

// The version of the spec this library reads
const SPEC_VERSION = 1;

// Keys GC_chart() itself reads
const CHART_KEYS = new Set(["version", "data", "fields", "width", "height", "style"]);

/**
 * The entries of a component: one entry or an array of entries.
 * @param {*} value
 * @returns {Object<string, *>[]}
 */
export function entries(value) {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Turns a spec into the render model that newChart() draws.
 * @param {Object<string, *>} spec A chart spec (schema/spec-v1.schema.json).
 * @returns {Object<string, *>} The render model.
 */
export function compile(spec) {
  if (!spec || typeof spec !== "object") throw new Error("compile() needs a spec object");
  // A newer spec draws what this version knows of it
  if (typeof spec.version === "number" && spec.version > SPEC_VERSION) {
    console.warn(`geneviewer: spec version ${spec.version} is newer than this library's (${SPEC_VERSION}); drawing what it knows`);
  }
  // The options of the render model are copies: drawing never changes the spec
  spec = clone(spec);
  const state = chart(spec);
  for (const [key, value] of Object.entries(spec)) {
    if (CHART_KEYS.has(key)) continue;
    const apply = handlers[key];
    if (!apply) continue;
    for (const entry of entries(value)) apply(state, renameOptions(entry, OPTION_NAMES[key]));
  }
  return toModel(renderTheme(state));
}

/**
 * The render model as plain data: series as an object, tables as objects of
 * columns.
 * @param {*} value
 * @returns {*}
 */
function toModel(value) {
  if (value instanceof Frame) return value.toJSON();
  if (value instanceof Map) {
    const out = {};
    for (const [key, item] of value) out[key] = toModel(item);
    return out;
  }
  if (Array.isArray(value)) return value.map(toModel);
  if (value !== null && typeof value === "object") {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) out[key] = toModel(item);
    }
    return out;
  }
  return value;
}
