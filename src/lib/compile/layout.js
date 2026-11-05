// Titles and the layout of the clusters: GC_title(), GC_clusterTitle(),
// GC_clusterLabel(), GC_clusterFooter() and GC_grid() (R/chart_layout.R).
import { getUpdatedClusters } from "./chart.js";
import { dots } from "./cluster.js";
import { recycleDots, setClusterOptions, setPath } from "./genes.js";
import {
  asCharacter, compact, computeSize, dropNull, getRelativeHeight, isEmpty, mergeOptions, recycleAt,
} from "./r.js";

const TITLE = ["title", "subtitle", "style", "subtitleFont", "titleFont", "show", "height", "align", "spacing"];

/**
 * R's GC_title(): the title of the chart.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function title(state, entry) {
  const show = entry.show ?? true;
  if (!show || (entry.title == null && entry.subtitle == null)) return;
  const options = compact({
    title: entry.title,
    subtitle: entry.subtitle,
    subtitleFont: entry.subtitleFont,
    titleFont: entry.titleFont,
    style: entry.style,
    height: entry.height,
    show,
    align: entry.align,
    spacing: entry.spacing,
    ...dots(entry, TITLE),
  });
  state.x.title = mergeOptions(state.x.title, options);
}

const CLUSTER_TITLE = ["title", "subtitle", "subtitleFont", "titleFont", "show", "height", "clusters",
  "align", "spacing"];

/**
 * R's GC_clusterTitle(): a title above each cluster.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function clusterTitle(state, entry) {
  const show = entry.show ?? true;
  const extra = dots(entry, CLUSTER_TITLE);
  getUpdatedClusters(state, entry.clusters).forEach((name, i) => {
    const series = state.x.series.get(name);
    const options = {
      title: recycleAt(entry.title, i) ?? null,
      subtitle: recycleAt(entry.subtitle, i) ?? null,
      subtitleFont: entry.subtitleFont ?? {},
      titleFont: entry.titleFont ?? {},
      show: recycleAt(show, i),
    };
    setPath(options, ["align"], recycleAt(entry.align, i));
    setPath(options, ["spacing"], recycleAt(entry.spacing, i));
    recycleDots(options, extra, i);
    setPath(series, ["grid", "margin", "top"], recycleAt(entry.height, i));
    series.clusterTitle = options;
  });
}

const CLUSTER_LABEL = ["title", "show", "width", "clusters", "position", "align", "wrapLabel",
  "wrapOptions", "subtitle", "subtitleFont", "spacing"];

/**
 * R's GC_clusterLabel(): a label beside each cluster, by default its name.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function clusterLabel(state, entry) {
  const show = entry.show ?? true;
  const extra = dots(entry, CLUSTER_LABEL);
  const clusters = getUpdatedClusters(state, entry.clusters);
  let labelTitle = entry.title ?? null;
  if (state.x.cluster !== undefined && labelTitle === null) labelTitle = clusters;
  clusters.forEach((name, i) => {
    const series = state.x.series.get(name);
    const options = dropNull({
      title: recycleAt(labelTitle, i),
      show: recycleAt(show, i),
      width: recycleAt(entry.width, i),
      wrapLabel: entry.wrapLabel,
      wrapOptions: entry.wrapOptions ?? {},
      position: recycleAt(entry.position, i),
      align: recycleAt(entry.align, i),
      subtitle: recycleAt(entry.subtitle, i),
      spacing: recycleAt(entry.spacing, i),
    });
    if (!isEmpty(entry.subtitleFont)) options.subtitleFont = entry.subtitleFont;
    series.clusterLabel = recycleDots(options, extra, i);
  });
}

const CLUSTER_FOOTER = ["title", "subtitle", "show", "clusters", "subtitleFont", "titleFont", "align", "spacing"];

/**
 * R's GC_clusterFooter(): a footer below each cluster.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function clusterFooter(state, entry) {
  const show = entry.show ?? true;
  const extra = dots(entry, CLUSTER_FOOTER);
  setClusterOptions(state, entry.clusters, "footer", (i) => {
    const options = {
      title: recycleAt(entry.title, i) ?? null,
      subtitle: recycleAt(entry.subtitle, i) ?? null,
      show: recycleAt(show, i),
      subtitleFont: entry.subtitleFont ?? {},
      titleFont: entry.titleFont ?? {},
    };
    setPath(options, ["align"], recycleAt(entry.align, i));
    setPath(options, ["spacing"], recycleAt(entry.spacing, i));
    return recycleDots(options, extra, i);
  });
}

/**
 * R's round(x, digits) for the widths of clusters side by side.
 * @param {number} x
 * @param {number} digits
 * @returns {number}
 */
function round(x, digits) {
  const factor = 10 ** digits;
  return Math.round(x * factor) / factor;
}

/**
 * R's GC_grid(): margins, sizes and direction of the clusters.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function grid(state, entry) {
  const x = state.x;
  const allClusters = [...x.series.keys()];
  const updateClusters = getUpdatedClusters(state, entry.clusters);
  const chartHeight = state.height;
  const perCluster = entry.clusters != null;
  let margin = entry.margin == null ? null : { ...entry.margin };
  const width = entry.width ?? null;
  const height = entry.height ?? null;

  if (width !== null && !perCluster) state.width = getRelativeHeight(state.width, width);

  if ((entry.direction ?? "column") === "row") {
    x.graphContainer.direction = "row";
    if (updateClusters.length > 0) {
      const percent = `${asCharacter(round(100 / updateClusters.length, 3))}%`;
      for (const name of updateClusters) {
        const container = x.series.get(name).container;
        container.style = { ...(container.style || {}), width: percent };
        container.width = percent;
      }
    }
  }

  if (margin !== null && !perCluster) {
    const paddingTop = margin.top != null ? getRelativeHeight(chartHeight, margin.top) : 0;
    const paddingBottom = margin.bottom != null ? getRelativeHeight(chartHeight, margin.bottom) : 0;
    if (typeof paddingTop !== "number" || typeof paddingBottom !== "number") {
      throw new Error("Use pixel values for the top and bottom margins when the chart height is a percentage.");
    }
    delete margin.top;
    delete margin.bottom;
    x.legend.margin = mergeOptions(x.legend.margin, margin);
    x.title.margin = mergeOptions(x.title.margin, margin);
    if (Array.isArray(x.style)) x.style = {};
    if (paddingTop > 0) x.style.paddingTop = `${asCharacter(paddingTop)}px`;
    if (paddingBottom > 0) x.style.paddingBottom = `${asCharacter(paddingBottom)}px`;
    if (paddingTop > 0 || paddingBottom > 0) {
      state.height = "100%";
      for (const name of allClusters) {
        const container = x.series.get(name).container;
        if (typeof container.height === "string" && /%$/.test(container.height)) continue;
        const current = Number(getRelativeHeight(container.height, container.height));
        container.height = current - (paddingTop + paddingBottom) / allClusters.length;
      }
    }
  }

  updateClusters.forEach((name, i) => {
    const container = x.series.get(name).container;
    if (margin !== null) container.margin = mergeOptions(container.margin, margin);
    if (width !== null && perCluster) {
      const current = getRelativeHeight(state.width, recycleAt(width, i));
      container.style = { ...(container.style || {}), width: current };
      container.width = current;
    }
    if (height !== null) {
      container.height = perCluster
        ? getRelativeHeight(chartHeight, recycleAt(height, i))
        : computeSize(height, allClusters.length);
    }
  });
}
