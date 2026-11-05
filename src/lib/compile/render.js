// What the R package did as the chart was sent to the browser: render_theme(),
// the widget's preRenderHook (R/theme.R).
import { Frame } from "./frame.js";
import { palettes, themeToJs } from "./theme.js";

// Columns sent only when an option names them, as in a tooltip formatter
// "{translation}": they hold long sequences the chart does not draw
const SEQUENCE_COLUMNS = ["translation", "sequence"];

/**
 * All text values of the options, outside tables.
 * @param {*} x
 * @param {string[]} [out]
 * @returns {string[]}
 */
function optionStrings(x, out = []) {
  if (x instanceof Frame) return out;
  if (x instanceof Map) {
    for (const value of x.values()) optionStrings(value, out);
  } else if (Array.isArray(x)) {
    for (const value of x) optionStrings(value, out);
  } else if (x !== null && typeof x === "object") {
    for (const value of Object.values(x)) optionStrings(value, out);
  } else if (typeof x === "string") {
    out.push(x);
  }
  return out;
}

/**
 * R's compact_data(): the rows go once, in the data of the clusters, and
 * the names of the chart's columns in dataColumns. Sequence columns no
 * option names are left out.
 * @param {Object<string, *>} x
 */
function compactData(x) {
  if (!x.data) return;
  const options = { ...x, data: undefined, series: new Map() };
  for (const [name, series] of x.series) options.series.set(name, { ...series, data: undefined });
  const strings = optionStrings(options);
  const names = x.data.names;
  const unused = SEQUENCE_COLUMNS.filter((column) => names.includes(column) &&
    !strings.some((text) => text.includes(column)));
  x.dataColumns = names.filter((name) => !unused.includes(name));
  delete x.data;
  for (const series of x.series.values()) {
    if (series.data instanceof Frame) {
      series.data = series.data.select(series.data.names.filter((name) => !unused.includes(name)));
    }
  }
}

/**
 * R's resolve_palette_names(): each colorScheme that names a geneviewer
 * palette becomes its colours; D3 scheme names are left for the browser.
 * @param {*} x
 * @returns {*}
 */
function resolvePaletteNames(x) {
  if (x instanceof Map) {
    for (const [key, value] of x) x.set(key, resolvePaletteNames(value));
    return x;
  }
  if (x === null || typeof x !== "object" || x instanceof Frame) return x;
  for (const [key, value] of Object.entries(x)) {
    if (key === "colorScheme" && typeof value === "string" && palettes[value]) {
      x[key] = palettes[value].slice();
    } else if (value !== null && typeof value === "object") {
      x[key] = resolvePaletteNames(value);
    }
  }
  return x;
}

/**
 * R's render_theme(): the widget's width, the theme in its form for the
 * browser, palette names as colours, and the data sent once.
 * @param {import("./chart.js").ChartState} state
 * @returns {Object<string, *>} The render model, with series as a Map.
 */
export function renderTheme(state) {
  const x = state.x;
  x.size = { width: state.width };
  const theme = themeToJs(x.theme);
  if (theme === undefined) delete x.theme;
  else x.theme = theme;
  resolvePaletteNames(x);
  compactData(x);
  return x;
}
