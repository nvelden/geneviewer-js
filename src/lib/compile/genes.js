// Genes and what is drawn with them: GC_labels(), GC_genes(), GC_color(),
// GC_pattern() and GC_legend() (R/chart_genes.R), GC_sequence() and
// GC_coordinates() (R/chart_layout.R), GC_tooltip()
// (R/chart_interaction.R).
import { getUpdatedClusters } from "./chart.js";
import { dots } from "./cluster.js";
import { R_COLORS, R_PALETTE } from "./rcolors.js";
import { arg, compact, isNamedList, mergeOptions, recycleAt } from "./r.js";

/**
 * Sets obj[path] to value as R's `x$a$b <- value`: NULL removes the value
 * and never makes the objects on the way.
 * @param {Object<string, *>} obj
 * @param {string[]} path
 * @param {*} value
 */
export function setPath(obj, path, value) {
  const last = path[path.length - 1];
  let node = obj;
  for (const key of path.slice(0, -1)) {
    if (!isNamedList(node[key])) {
      if (value === null || value === undefined) return;
      node[key] = {};
    }
    node = node[key];
  }
  if (value === null || value === undefined) delete node[last];
  else node[last] = value;
}

/**
 * R's recycle_dots(): the options passed through `...`, each recycled over
 * the clusters; a NULL removes the option.
 * @param {Object<string, *>} options
 * @param {Object<string, *>} extra
 * @param {number} i
 * @returns {Object<string, *>}
 */
export function recycleDots(options, extra, i) {
  for (const [name, value] of Object.entries(extra)) {
    const recycled = recycleAt(value, i);
    if (recycled === undefined) delete options[name];
    else options[name] = recycled;
  }
  return options;
}

/**
 * R's set_cluster_options(): a component's options for each cluster.
 * @param {import("./chart.js").ChartState} state
 * @param {*} clusters
 * @param {string} slot
 * @param {(i: number, series: Object<string, *>) => Object<string, *>} optionsFor
 */
export function setClusterOptions(state, clusters, slot, optionsFor) {
  getUpdatedClusters(state, clusters).forEach((name, i) => {
    const series = state.x.series.get(name);
    series[slot] = optionsFor(i, series);
  });
}

/**
 * The column names a column option names: one or several.
 * @param {*} x
 * @returns {Array<*>}
 */
const columnsOf = (x) => (Array.isArray(x) ? x : [x]);

/**
 * Throws when a column is not in the chart's data.
 * @param {import("./chart.js").ChartState} state
 * @param {*} columns
 * @param {string} message
 */
function checkColumns(state, columns, message) {
  const names = state.x.data.names;
  if (!columnsOf(columns).every((column) => names.includes(column))) throw new Error(message);
}

const LABELS = ["label", "show", "clusters", "itemStyle", "groupStyle", "styleBy"];

/**
 * R's GC_labels().
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function labels(state, entry) {
  let label = entry.label ?? null;
  const show = entry.show ?? true;
  if (label === null && state.x.group === undefined) throw new Error("Please define labels");
  if (label === null) label = state.x.group;
  checkColumns(state, label, "label column not found in data");
  const extra = dots(entry, LABELS);
  getUpdatedClusters(state, entry.clusters).forEach((name, i) => {
    const series = state.x.series.get(name);
    const options = compact({
      label: recycleAt(label, i),
      show: recycleAt(show, i),
      itemStyle: entry.itemStyle,
      groupStyle: entry.groupStyle,
      styleBy: entry.styleBy,
      ...extra,
    });
    series.labels = mergeOptions(series.labels, options);
  });
}

/**
 * R's keep_color_options(): the colours and pattern of the old options,
 * unless new ones are given.
 * @param {Object<string, *>} options
 * @param {Object<string, *>|undefined} old
 * @returns {Object<string, *>}
 */
export function keepColorOptions(options, old) {
  if (options.colorScheme == null && options.customColors == null) {
    setPath(options, ["colorScheme"], old?.colorScheme);
    setPath(options, ["customColors"], old?.customColors);
  }
  if (options.pattern == null) setPath(options, ["pattern"], old?.pattern);
  return options;
}

/**
 * R's set_legend_colors(): the legend takes colours set for all clusters.
 * @param {import("./chart.js").ChartState} state
 * @param {*} colorScheme
 * @param {*} customColors
 */
export function setLegendColors(state, colorScheme, customColors) {
  if (colorScheme == null && customColors == null) return;
  setPath(state.x, ["legend", "legendOptions", "colorScheme"], colorScheme);
  setPath(state.x, ["legend", "legendOptions", "customColors"], customColors);
}

const GENES = ["group", "marker", "markerSize", "show", "colorScheme", "customColors",
  "clusters", "itemStyle", "groupStyle", "styleBy", "cornerRadius"];

/**
 * R's GC_genes().
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function genes(state, entry) {
  let group = entry.group ?? null;
  const show = entry.show ?? true;
  if (group === null && state.x.group !== undefined) group = state.x.group;
  if (group !== null) checkColumns(state, group, "group column not found in data");
  const extra = dots(entry, GENES);
  getUpdatedClusters(state, entry.clusters).forEach((name, i) => {
    const series = state.x.series.get(name);
    const options = compact({
      group: recycleAt(group, i),
      marker: recycleAt(entry.marker, i),
      cornerRadius: entry.cornerRadius,
      markerSize: entry.markerSize,
      show: recycleAt(show, i),
      colorScheme: entry.colorScheme,
      customColors: entry.customColors,
      itemStyle: entry.itemStyle,
      groupStyle: entry.groupStyle,
      styleBy: entry.styleBy,
      ...extra,
    });
    series.genes = keepColorOptions(options, series.genes);
  });
  if (entry.clusters == null) setLegendColors(state, entry.colorScheme, entry.customColors);
}

/**
 * R's GC_color(): colours of the genes, transcripts and legend.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function color(state, entry) {
  const colorScheme = entry.colorScheme ?? null;
  const customColors = entry.customColors ?? null;
  if (colorScheme !== null && customColors !== null && !isNamedList(customColors)) {
    state.warnings.push("Both colorScheme and customColors are selected. Use an object of customColors, by group, to set the colours of some groups, or choose only one.");
    return;
  }
  setPath(state.x, ["legend", "legendOptions", "colorScheme"], colorScheme);
  setPath(state.x, ["legend", "legendOptions", "customColors"], customColors);
  for (const series of state.x.series.values()) {
    for (const slot of ["genes", "transcript"]) {
      setPath(series, [slot, "colorScheme"], colorScheme);
      setPath(series, [slot, "customColors"], customColors);
    }
  }
}

const PATTERNS = ["none", "solid", "horizontal", "vertical", "diagonal", "antidiagonal", "grid",
  "crosshatch", "dots", "zigzag", "checkerboard", "rings", "bricks", "plus", "wideStripes",
  "inverseDots"];

/**
 * R's colour as CSS, as col2rgb() and rgb() give it: "#RRGGBB", with "AA"
 * when it is not opaque. Colours R does not know stay as they are.
 * @param {*} col
 * @returns {*}
 */
function asCssColor(col) {
  if (col === null || col === undefined) return "#FFFFFF00";
  const text = String(col);
  const hex2 = (n) => n.toString(16).toUpperCase().padStart(2, "0");
  let match = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(text);
  if (match) {
    let digits = match[1];
    if (digits.length <= 4) digits = digits.split("").map((d) => d + d).join("");
    digits = digits.toUpperCase();
    return digits.length === 8 && digits.endsWith("FF") ? `#${digits.slice(0, 6)}` : `#${digits}`;
  }
  const name = text.toLowerCase();
  if (name === "transparent") return "#FFFFFF00";
  if (R_COLORS[name]) return R_COLORS[name];
  if (/^[1-9][0-9]*$/.test(text)) return R_PALETTE[(Number(text) - 1) % R_PALETTE.length];
  return col;
}

/**
 * R's pattern_to_js(): pattern settings as sent to the browser, colours as
 * CSS, NULL settings left out.
 * @param {Object<string, *>} pattern
 * @returns {Object<string, *>}
 */
export function patternToJs(pattern) {
  const named = isNamedList(pattern.patterns) ? Object.values(pattern.patterns) : [pattern.patterns ?? []].flat();
  const unknown = named.filter((p) => p !== null && !PATTERNS.includes(p));
  if (unknown.length) {
    throw new Error(`Unknown pattern(s): ${unknown.join(", ")}. Available patterns: ${PATTERNS.join(", ")}`);
  }
  const toCss = (x) => {
    if (x === null || x === undefined) return undefined;
    if (isNamedList(x)) return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, asCssColor(v)]));
    if (Array.isArray(x)) return x.map(asCssColor);
    return asCssColor(x);
  };
  const out = {};
  for (const [key, value] of Object.entries({
    patterns: pattern.patterns,
    color: toCss(pattern.color),
    background: toCss(pattern.background),
    size: pattern.size,
    strokeWidth: pattern.strokeWidth,
  })) {
    if (value !== null && value !== undefined) out[key] = value;
  }
  return out;
}

/**
 * R's GC_pattern(): patterns of the genes, transcripts and legend.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function pattern(state, entry) {
  const settings = patternToJs({
    patterns: entry.patterns,
    color: arg(entry, "color", "black"),
    background: arg(entry, "background", "white"),
    size: arg(entry, "size", 6),
    strokeWidth: arg(entry, "strokeWidth", 1),
  });
  setPath(state.x, ["legend", "legendOptions", "pattern"], settings);
  for (const series of state.x.series.values()) {
    series.genes.pattern = settings;
    series.transcript.pattern = settings;
  }
}

const LEGEND = ["group", "show", "backgroundColor", "order", "position", "align", "style",
  "markerStyle", "textStyle", "cornerRadius", "groupStyle"];

/**
 * R's GC_legend().
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function legend(state, entry) {
  let group = entry.group ?? null;
  const show = entry.show ?? true;
  if (show === true && group === null && state.x.group === undefined) throw new Error("Please define a group");
  if (group === null && state.x.group !== undefined) group = state.x.group;
  if (group !== null) checkColumns(state, group, "group column not found in data");
  const style = { ...(entry.style ?? {}) };
  if (entry.backgroundColor != null && style.backgroundColor == null) style.backgroundColor = entry.backgroundColor;
  const options = compact({
    group,
    show,
    order: entry.order,
    position: entry.position,
    align: entry.align,
    cornerRadius: entry.cornerRadius,
    style,
    legendOptions: entry.markerStyle,
    legendTextOptions: entry.textStyle,
    groupStyle: entry.groupStyle,
    ...dots(entry, LEGEND),
  });
  state.x.legend = mergeOptions(state.x.legend, options);
}

const SEQUENCE = ["show", "clusters", "y", "lineStyle", "markerStyle"];

/**
 * R's shift_sequence(): a range axis moved the genes; the line moves along.
 * @param {Object<string, *>} options
 * @param {number|undefined} shift
 * @returns {Object<string, *>}
 */
export function shiftSequence(options, shift) {
  if (!options || !shift) return options;
  for (const name of ["start", "end"]) {
    if (typeof options[name] === "number") options[name] -= shift;
  }
  return options;
}

/**
 * R's GC_sequence().
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function sequence(state, entry) {
  const show = entry.show ?? true;
  const extra = dots(entry, SEQUENCE);
  setClusterOptions(state, entry.clusters, "sequence", (i, series) => {
    const options = {
      show: recycleAt(show, i),
      y: recycleAt(entry.y, i) ?? null,
      sequenceStyle: entry.lineStyle ?? {},
      markerStyle: entry.markerStyle ?? {},
    };
    return shiftSequence(recycleDots(options, extra, i), series.positionShift);
  });
}

const COORDINATES = ["show", "tickValuesTop", "tickValuesBottom", "ticksFormat", "tickStyle",
  "textStyle", "clusters", "groupStyle", "styleBy"];

/**
 * R's GC_coordinates().
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function coordinates(state, entry) {
  const show = entry.show ?? true;
  let styleBy = entry.styleBy ?? null;
  if (styleBy === null && state.x.group !== undefined) styleBy = state.x.group;
  if (entry.groupStyle != null && styleBy === null) {
    throw new Error("groupStyle needs fields.group or a styleBy column");
  }
  const extra = dots(entry, COORDINATES);
  setClusterOptions(state, entry.clusters, "coordinates", (i) => {
    const options = {
      show: recycleAt(show, i),
      ticksFormat: entry.ticksFormat ?? null,
      tickStyle: entry.tickStyle ?? {},
      textStyle: entry.textStyle ?? {},
    };
    if (entry.groupStyle != null) {
      options.groupStyle = entry.groupStyle;
      options.styleBy = styleBy;
    }
    recycleDots(options, extra, i);
    setPath(options, ["tickValuesTop"], entry.tickValuesTop);
    setPath(options, ["tickValuesBottom"], entry.tickValuesBottom);
    return options;
  });
}

const TOOLTIP = ["formatter", "show", "clusters"];

/**
 * R's GC_tooltip().
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function tooltip(state, entry) {
  const formatter = entry.formatter ?? "<b>Start:</b> {start}<br><b>End:</b> {end}";
  const show = entry.show ?? true;
  const extra = dots(entry, TOOLTIP);
  setClusterOptions(state, entry.clusters, "tooltip", (i) =>
    recycleDots({ formatter, show: recycleAt(show, i) }, extra, i));
}
