// Interaction settings: GC_trackMouse(), GC_events(), GC_toolbar() and
// GC_zoom() (R/chart_interaction.R).
import { getUpdatedClusters } from "./chart.js";
import { dots } from "./cluster.js";
import { clone, dropNull, modifyList, recycleAt } from "./r.js";

/**
 * R's GC_trackMouse(): a line that follows the mouse, with its position.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function trackMouse(state, entry) {
  const show = entry.show ?? true;
  const extra = dots(entry, ["show", "clusters"]);
  getUpdatedClusters(state, entry.clusters).forEach((name, i) => {
    state.x.series.get(name).trackMouse = { show: recycleAt(show, i), ...clone(extra) };
  });
}

/**
 * R's GC_events(): which interactions the chart reports.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function events(state, entry) {
  const settings = { click: entry.click ?? true, highlight: entry.highlight ?? false };
  if (entry.dblclick) settings.dblclick = true;
  if (entry.select) settings.select = true;
  if (entry.drag) settings.drag = true;
  if (entry.legendClick === false) settings.legendClick = false;
  if (entry.zoom) settings.zoom = true;
  if (entry.rendered) settings.rendered = true;
  if (entry.renderId != null) settings.renderId = entry.renderId;
  state.x.events = settings;
}

const TOOLBAR = ["show", "position", "buttons", "size", "color", "hoverColor", "tooltipBackground",
  "tooltipColor", "tooltipBorder", "tooltipRadius", "tooltipShadow", "fontFamily", "icons"];

/**
 * R's GC_toolbar(): the toolbar's buttons and look.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function toolbar(state, entry) {
  const options = dropNull(Object.fromEntries(TOOLBAR.map((name) => [name, clone(entry[name])])));
  if (options.buttons !== undefined && !Array.isArray(options.buttons)) options.buttons = [options.buttons];
  state.x.toolbar = modifyList(state.x.toolbar || {}, options);
}

const ZOOM = ["show", "range", "mode", "min", "update", "height", "overview", "color", "style",
  "windowStyle", "handleStyle"];

/**
 * R's GC_zoom(): a slider to zoom in on part of the clusters.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function zoom(state, entry) {
  const options = dropNull(Object.fromEntries(ZOOM.map((name) => [name, clone(entry[name])])));
  if (options.show === undefined) options.show = true;
  const old = { ...(state.x.zoom || {}) };
  // A new mode does not keep a range or minimum of the old one
  if (options.mode !== undefined && options.mode !== old.mode) {
    delete old.range;
    delete old.min;
  }
  if (options.range !== undefined) options.range = [options.range].flat().map(Number).sort((a, b) => a - b);
  state.x.zoom = modifyList(old, options);
}
