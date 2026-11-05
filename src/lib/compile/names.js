// Where the spec's names differ from the names the renderer reads (decided
// by Niels on 2026-11-05): options passed through R's `...`, and the
// options of components inside a theme, which use the components' spec
// names.

// Options of a component entry: spec name to renderer name
export const OPTION_NAMES = {
  scaleBar: { unit: "scaleBarUnit" },
  labels: { labelAdjustment: "labelAdjustmentOptions" },
  links: { labelAdjustment: "labelAdjustmentOptions" },
};

// Options of a component inside a theme: spec name to renderer name. The
// other names are the same (R's names camelCased).
export const THEME_NAMES = {
  legend: { markerStyle: "legendOptions", textStyle: "legendTextOptions" },
  sequence: { lineStyle: "sequenceStyle" },
  scaleBar: { lineStyle: "scaleBarLineStyle", tickStyle: "scaleBarTickStyle", unit: "scaleBarUnit" },
  links: { show: "showLinks", labelAdjustment: "labelAdjustmentOptions" },
  labels: { labelAdjustment: "labelAdjustmentOptions" },
  scale: { autoBreaks: "scaleBreaks", autoBreakThreshold: "scaleBreakThreshold", breakPadding: "scaleBreakPadding" },
};

/**
 * Options with their keys renamed by a table, in their place.
 * @param {*} options
 * @param {Object<string, string>|undefined} names
 * @returns {*}
 */
export function renameOptions(options, names) {
  if (!names || options === null || typeof options !== "object" || Array.isArray(options)) return options;
  return Object.fromEntries(Object.entries(options).map(([key, value]) => [names[key] ?? key, value]));
}
