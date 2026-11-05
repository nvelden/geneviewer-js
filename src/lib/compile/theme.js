// Themes: GC_theme(), resolve_theme(), merge_theme_settings(),
// theme_global_options() and theme_to_js() (R/theme.R). The built-in themes
// and palettes are in src/themes.json, as the R package defines them.
import themes from "../../themes.json" with { type: "json" };
import { patternToJs } from "./genes.js";
import { clone, isNamedList } from "./r.js";
import { THEME_NAMES, renameOptions } from "./names.js";

// Components of a theme, with their key in the browser, in R's order
const THEME_COMPONENTS = {
  chart: "chartOptions",
  grid: "containerOptions",
  cluster: "clusterOptions",
  title: "titleOptions",
  clusterTitle: "clusterTitleOptions",
  clusterFooter: "footerOptions",
  clusterLabel: "clusterLabelOptions",
  sequence: "sequenceOptions",
  genes: "geneOptions",
  transcript: "transcriptOptions",
  labels: "labelsOptions",
  coordinates: "coordinatesOptions",
  scale: "scaleOptions",
  scaleBar: "scaleBarOptions",
  legend: "legendOptions",
  links: "linkOptions",
  tooltip: "tooltipOptions",
  trackMouse: "trackMouseOptions",
  toolbar: "toolbarOptions",
};

const ANNOTATION_TYPES = {
  text: "textAnnotationOptions",
  line: "lineAnnotationOptions",
  arrow: "arrowAnnotationOptions",
  textMarker: "textMarkerAnnotationOptions",
  symbol: "symbolAnnotationOptions",
  rectangle: "rectangleAnnotationOptions",
  promoter: "promoterAnnotationOptions",
  terminator: "terminatorAnnotationOptions",
  arc: "curveAnnotationOptions",
};

/** The built-in themes, as R defines them. */
export const builtinThemes = themes.themes;
/** The geneviewer palettes: their colours by name. */
export const palettes = themes.palettes;

/**
 * R's snake_to_camel(): normal_color becomes normalColor.
 * @param {string} name
 * @returns {string}
 */
const snakeToCamel = (name) => name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

/**
 * R's camel_case_names(): option names as in the browser.
 * @param {*} options
 * @returns {*}
 */
function camelCaseNames(options) {
  if (!isNamedList(options)) return options;
  return Object.fromEntries(Object.entries(options).map(([name, value]) => [snakeToCamel(name), value]));
}

/**
 * The options of a theme's components named as in the browser, as the spec
 * names them.
 * @param {Object<string, *>} theme
 * @returns {Object<string, *>}
 */
function themeNames(theme) {
  const out = { ...theme };
  for (const name of Object.keys(out)) {
    if (name === "annotations") {
      if (isNamedList(out[name])) {
        out[name] = Object.fromEntries(Object.entries(out[name]).map(([type, o]) => [type, camelCaseNames(o)]));
      }
    } else if (name in THEME_COMPONENTS) {
      out[name] = camelCaseNames(out[name]);
    }
  }
  return out;
}

/**
 * R's merge_theme_settings(): objects merged at every level, other values
 * (arrays included) replace the old value, and null removes it.
 * @param {Object<string, *>} x
 * @param {Object<string, *>} y
 * @returns {Object<string, *>}
 */
export function mergeThemeSettings(x, y) {
  const out = { ...x };
  for (const [name, value] of Object.entries(y || {})) {
    if (value === null || value === undefined) delete out[name];
    else if (isNamedList(out[name]) && isNamedList(value)) out[name] = mergeThemeSettings(out[name], value);
    else out[name] = value;
  }
  return out;
}

/**
 * R's GC_theme(): the theme, from a built-in theme or the settings given.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>|string} entry A theme's name, or theme settings.
 */
export function theme(state, entry) {
  const settings = typeof entry === "string" ? { base: entry } : clone(entry);
  const name = settings.base;
  delete settings.base;
  let base;
  if (name == null) {
    base = state.x.theme || {};
  } else {
    if (!(name in builtinThemes)) {
      throw new Error(`name must be one of: ${Object.keys(builtinThemes).map((t) => `"${t}"`).join(", ")}`);
    }
    base = themeNames(clone(builtinThemes[name]));
  }
  // The spec names of components' options, as the renderer reads them
  for (const name of Object.keys(settings)) {
    if (name in THEME_NAMES) settings[name] = renameOptions(settings[name], THEME_NAMES[name]);
  }
  const removePattern = settings.pattern === false;
  if (removePattern) delete settings.pattern;
  state.x.theme = mergeThemeSettings(base, settings);
  if (removePattern) delete state.x.theme.pattern;
}

/**
 * Objects without the empty ones, so they do not replace defaults in the
 * browser (R's drop_empty()).
 * @param {*} x
 * @returns {*}
 */
function dropEmpty(x) {
  if (!isNamedList(x) && !Array.isArray(x)) return x;
  if (Array.isArray(x)) return x.map(dropEmpty).filter((y) => !((isNamedList(y) || Array.isArray(y)) && !Object.keys(y).length));
  const out = {};
  for (const [key, value] of Object.entries(x)) {
    const y = dropEmpty(value);
    if ((isNamedList(y) || Array.isArray(y)) && Object.keys(y).length === 0) continue;
    out[key] = y;
  }
  return out;
}

/**
 * R's theme_global_options(): the options of each component set by the
 * theme's global settings.
 * @param {Object<string, *>} theme
 * @returns {Object<string, *>}
 */
function globalOptions(theme) {
  const font = theme.fontFamily != null ? { fontFamily: theme.fontFamily } : {};
  const text = { ...font, ...(theme.textColor != null ? { fill: theme.textColor } : {}) };
  const htmlText = { ...font, ...(theme.textColor != null ? { color: theme.textColor } : {}) };
  const line = theme.lineColor != null ? { stroke: theme.lineColor } : {};

  // A scheme or palette name, or colours (an array, also for one colour)
  let palette = theme.palette ?? null;
  if (palette !== null && !(typeof palette === "string" && (palette.startsWith("scheme") || palette in palettes))) {
    palette = Array.isArray(palette) ? palette : [palette];
  }
  const colors = palette !== null ? { colorScheme: palette } : {};
  const pattern = theme.pattern != null ? { pattern: patternToJs(theme.pattern) } : {};
  const background = theme.background != null ? { backgroundColor: theme.background } : {};

  return dropEmpty({
    chart: { style: background },
    title: { titleFont: text, subtitleFont: text },
    clusterTitle: { titleFont: text, subtitleFont: text },
    clusterFooter: { titleFont: text, subtitleFont: text },
    clusterLabel: { ...text, subtitleFont: text },
    sequence: { sequenceStyle: line, markerStyle: line },
    genes: { ...colors, ...pattern },
    // UTRs are open boxes, filled with the background
    transcript: {
      ...colors, ...pattern, labelOptions: htmlText,
      styleUTRs: theme.background != null ? { fill: theme.background } : {},
    },
    labels: { ...text, leaderLine: line },
    coordinates: { textStyle: text, tickStyle: line },
    scale: { textStyle: text, tickStyle: line, lineStyle: line },
    scaleBar: { labelStyle: text, scaleBarLineStyle: line, scaleBarTickStyle: line },
    legend: { legendOptions: { ...colors, ...pattern }, legendTextOptions: text },
    links: { labelStyle: text, colorBarOptions: { labelOptions: text, titleOptions: text } },
    tooltip: htmlText,
    trackMouse: htmlText,
    toolbar: font,
    annotations: { text: { style: text }, textMarker: { textStyle: text }, arc: { textStyle: text } },
  });
}

/**
 * R's theme_to_js(): the theme as the browser reads it, the options of each
 * component under its key there, with the global settings applied.
 * @param {Object<string, *>|undefined} theme
 * @returns {Object<string, *>|undefined}
 */
export function themeToJs(theme) {
  if (!theme || Object.keys(theme).length === 0) return undefined;
  const components = {};
  for (const name of Object.keys(theme)) {
    if (name in THEME_COMPONENTS) components[name] = camelCaseNames(theme[name]);
  }
  if (theme.annotations != null) {
    components.annotations = Object.fromEntries(Object.entries(theme.annotations)
      .map(([type, options]) => [type, camelCaseNames(options)]));
  }
  // Options of a component take precedence over the global settings
  const options = mergeThemeSettings(globalOptions(theme), components);
  const js = {};
  for (const [name, key] of Object.entries(THEME_COMPONENTS)) {
    if (name in options) js[key] = options[name];
  }
  for (const type of Object.keys(options.annotations || {})) {
    if (type in ANNOTATION_TYPES) js[ANNOTATION_TYPES[type]] = options.annotations[type];
  }
  if (theme.textScale != null) js.textScale = theme.textScale;
  return js;
}
