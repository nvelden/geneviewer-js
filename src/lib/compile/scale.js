// The axis of each cluster: GC_scale() and GC_scaleBar() (R/chart_layout.R),
// get_scale_breaks() and break_padding_bp() (R/utils.R), and the alignment
// of the clusters on one gene, apply_align() (R/chart_align.R) and
// adjust_range() (R/gene_alignment.R).
import { asCharacter, isNamedList, recycleAt } from "./r.js";
import { getUpdatedClusters } from "./chart.js";
import { dots, order } from "./cluster.js";
import { recycleDots, setClusterOptions, shiftSequence } from "./genes.js";

/**
 * R's break_padding_bp(): the base pairs of a padding such as "500bp".
 * @param {string} padding
 * @returns {number}
 */
export function breakPaddingBp(padding) {
  if (!/^\s*[0-9]*\.?[0-9]+\s*bp\s*$/.test(padding)) {
    throw new Error('scale_break_padding must be a percentage, e.g. 1, or base pairs, e.g. "500bp"');
  }
  return Number(padding.replace(/\s*bp\s*$/, ""));
}

/**
 * R's get_scale_breaks(): the gaps between genes larger than a share of the
 * region, less padding on either side.
 * @param {import("./frame.js").Frame} genes
 * @param {number} thresholdPercentage
 * @param {number|string} padding A percentage of the region shown, or "500bp".
 * @returns {Array<{start: number, end: number}>}
 */
export function getScaleBreaks(genes, thresholdPercentage = 0, padding = 0) {
  let starts = genes.get("start").slice();
  let ends = genes.get("end").slice();
  starts.forEach((s, i) => {
    if (s > ends[i]) [starts[i], ends[i]] = [ends[i], s];
  });
  const entire = Math.max(...ends) - Math.min(...starts) + 1;
  const minGap = entire * thresholdPercentage / 100;
  const sorted = order(starts.length, [(i) => starts[i]]);
  starts = sorted.map((i) => starts[i]);
  ends = sorted.map((i) => ends[i]);

  const merged = [];
  let current = { start: starts[0], end: ends[0] };
  for (let i = 1; i < starts.length; i++) {
    if (starts[i] <= current.end) {
      current.end = Math.max(current.end, ends[i]);
    } else {
      merged.push(current);
      current = { start: starts[i], end: ends[i] };
    }
  }
  merged.push(current);

  let gaps = [];
  for (let i = 0; i < merged.length - 1; i++) {
    const start = merged[i].end + 1;
    const end = merged[i + 1].start - 1;
    if (end - start + 1 >= minGap) gaps.push({ start, end });
  }
  let pad;
  if (typeof padding === "string") {
    pad = breakPaddingBp(padding);
  } else {
    const shown = entire - gaps.reduce((sum, gap) => sum + (gap.end - gap.start + 1), 0);
    pad = shown * padding / 100;
  }
  gaps = gaps.map((gap) => ({ start: gap.start + pad, end: gap.end - pad }));
  return gaps.filter((gap) => gap.start < gap.end);
}

/**
 * R's cluster_breaks(): the breaks of a cluster. A table of breaks (columns)
 * with a cluster column gives the breaks of that cluster. A range axis moved
 * the genes; the breaks move along.
 * @param {*} breaks
 * @param {string} cluster
 * @param {number|undefined} shift
 * @returns {*}
 */
function clusterBreaks(breaks, cluster, shift) {
  if (isNamedList(breaks)) {
    if (!("start" in breaks) || !("end" in breaks)) throw new Error("A data frame of breaks needs a start and an end column");
    const starts = [breaks.start].flat();
    const ends = [breaks.end].flat();
    let rows = starts.map((_, k) => k);
    if ("cluster" in breaks) {
      const clusters = [breaks.cluster].flat();
      rows = rows.filter((k) => asCharacter(clusters[k]) === cluster);
    }
    breaks = rows.map((k) => ({ start: starts[k], end: ends[k] }));
  }
  if (!shift) return breaks;
  return (breaks || []).map((gap) => ({ ...gap, start: gap.start - shift, end: gap.end - shift }));
}

/**
 * R's shift_annotation(): a range axis moved the genes; annotations move
 * along by their x, x1, x2 and position.
 * @param {Object<string, *>} options
 * @param {number|undefined} shift
 * @returns {Object<string, *>}
 */
export function shiftAnnotation(options, shift) {
  if (!shift) return options;
  const move = (x) => (typeof x === "number" ? x - shift : x);
  const moveAll = (x) => (Array.isArray(x) ? x.map(move) : move(x));
  for (const name of ["x", "x1", "x2"]) {
    if (name in options) options[name] = moveAll(options[name]);
  }
  if (options.position !== null && options.position !== undefined) {
    if (options.type === "rectangle") {
      // R's lapply() over the rectangles, then over the corners of each
      const rectangles = Array.isArray(options.position) ? options.position : [options.position];
      options.position = rectangles.map((corners) => {
        if (!Array.isArray(corners)) return [move(corners)];
        return corners.map((point) => (Array.isArray(point) ? [move(point[0]), ...point.slice(1)] : move(point)));
      });
    } else {
      options.position = moveAll(options.position);
    }
  }
  return options;
}

const SCALE = ["clusters", "start", "end", "padding", "hidden", "breaks", "tickValues", "reverse",
  "axisPosition", "axisType", "y", "autoBreaks", "autoBreakThreshold", "breakPadding",
  "ticksCount", "ticksFormat", "tickStyle", "textStyle", "lineStyle"];

/**
 * R's GC_scale().
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function scale(state, entry) {
  const x = state.x;
  const axisType = entry.axisType ?? "position";
  const hidden = entry.hidden ?? false;
  const autoBreaks = entry.autoBreaks ?? false;
  const threshold = entry.autoBreakThreshold ?? 20;
  const breakPadding = entry.breakPadding ?? 1;
  let ticksFormat = entry.ticksFormat ?? null;
  if (typeof breakPadding === "string") breakPaddingBp(breakPadding);
  let xMin = null;
  let xMax = null;
  const clusters = getUpdatedClusters(state, entry.clusters);

  if (axisType === "range") {
    if (ticksFormat === null) ticksFormat = ".2s";
    // Shift the genes of each selected cluster to start at 1
    for (const name of clusters) {
      const series = x.series.get(name);
      const data = series.data;
      const minimum = Math.min(...data.get("start"), ...data.get("end"));
      data.set("start", data.get("start").map((v) => v - minimum + 1));
      data.set("end", data.get("end").map((v) => v - minimum + 1));
      const shift = minimum - 1;
      series.sequence = shiftSequence(series.sequence, shift);
      if (series.annotations.length > 0) {
        series.annotations = series.annotations.map((options) => shiftAnnotation(options, shift));
      }
      series.positionShift = series.positionShift == null ? shift : series.positionShift + shift;
      const rowIDs = x.data.get("rowID");
      const allStarts = x.data.get("start");
      const allEnds = x.data.get("end");
      data.get("rowID").forEach((id, k) => {
        const row = rowIDs.indexOf(id);
        allStarts[row] = data.get("start")[k];
        allEnds[row] = data.get("end")[k];
      });
    }
    xMin = 1;
    xMax = Math.max(...clusters.flatMap((name) => {
      const data = x.series.get(name).data;
      return [...data.get("start"), ...data.get("end")];
    }));
  }

  const extra = dots(entry, SCALE);
  clusters.forEach((name, i) => {
    const series = x.series.get(name);
    // With a range axis, one shared axis below the last cluster
    const hiddenCurrent = axisType === "range" && !hidden && i < clusters.length - 1 ? true : hidden;
    const breaks = autoBreaks
      ? getScaleBreaks(series.data, threshold, breakPadding)
      : clusterBreaks(entry.breaks ?? [], name, series.positionShift);
    const options = {
      start: recycleAt(entry.start, i) ?? null,
      end: recycleAt(entry.end, i) ?? null,
      xMin,
      xMax,
      padding: entry.padding ?? null,
      hidden: hiddenCurrent,
      breaks,
      tickValues: entry.tickValues ?? null,
      reverse: recycleAt(entry.reverse ?? false, i),
      axisPosition: entry.axisPosition ?? null,
      axisType,
      scale_breaks: autoBreaks,
      scale_break_threshold: threshold,
      scale_break_padding: breakPadding,
      ticksCount: entry.ticksCount ?? null,
      ticksFormat,
      y: entry.y ?? null,
      tickStyle: entry.tickStyle ?? {},
      textStyle: entry.textStyle ?? {},
      lineStyle: entry.lineStyle ?? {},
    };
    series.scale = recycleDots(options, extra, i);
  });

  applyAlign(state);
}

const SCALE_BAR = ["show", "clusters", "lineStyle", "tickStyle", "labelStyle"];

/**
 * R's GC_scaleBar().
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function scaleBar(state, entry) {
  const show = entry.show ?? true;
  const extra = dots(entry, SCALE_BAR);
  setClusterOptions(state, entry.clusters, "scaleBar", (i) => recycleDots({
    show: recycleAt(show, i),
    scaleBarLineStyle: entry.lineStyle ?? {},
    scaleBarTickStyle: entry.tickStyle ?? {},
    labelStyle: entry.labelStyle ?? {},
  }, extra, i));
}

/**
 * R's get_align_position(): where on the gene the clusters line up.
 * @param {string} align
 * @param {number} start
 * @param {number} end
 * @param {boolean} reversed
 * @returns {number}
 */
function alignPosition(align, start, end, reversed) {
  if ((align === "left" && !reversed) || (align === "right" && reversed)) return start;
  if ((align === "right" && !reversed) || (align === "left" && reversed)) return end;
  if (align === "center") return (start + end) / 2;
  return start;
}

/**
 * R's GC_align(): aligns the clusters on one gene.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function align(state, entry) {
  const x = state.x;
  if (x.cluster === undefined) {
    state.warnings.push("Could not align selected gene. Please define cluster in the GC_chart function.");
    return;
  }
  if (!x.data.has(entry.idColumn)) {
    state.warnings.push(`Column ${entry.idColumn} not found in the data.`);
    return;
  }
  const id = asCharacter(entry.id);
  if (!x.data.get(entry.idColumn).some((value) => asCharacter(value) === id)) {
    state.warnings.push(`ID ${entry.id} not found in the ${entry.idColumn} column.`);
    return;
  }
  state.align = { idColumn: entry.idColumn, id: entry.id, align: entry.align ?? "left" };
  x.align = { id_column: entry.idColumn, id: entry.id, align: state.align.align };
  applyAlign(state);
}

/**
 * R's apply_align() with adjust_range(): the start and end of each
 * cluster's scale, so the gene is at the same place in every cluster, the
 * scale breaks and reversed clusters included.
 * @param {import("./chart.js").ChartState} state
 */
export function applyAlign(state) {
  const options = state.align;
  if (!options) return;
  const x = state.x;
  const data = x.data;
  const clusterColumn = x.cluster;
  const clusterOf = data.get(clusterColumn);
  const clusters = [...new Set(clusterOf)];
  const reversed = new Set(clusters.filter((cl) => x.series.get(cl)?.scale?.reverse === true));
  const starts = data.get("start").map((s, i) => Math.min(s, data.get("end")[i]));
  const ends = data.get("start").map((s, i) => Math.max(s, data.get("end")[i]));

  const ids = data.get(options.idColumn);
  const id = asCharacter(options.id);
  const rows = [];
  for (let i = 0; i < data.nrow; i++) if (ids[i] !== null && asCharacter(ids[i]) === id) rows.push(i);
  if (!rows.length) {
    state.warnings.push(`Selected gene coud not be aligned. Gene ${options.id} not found in the ${options.idColumn} column.`);
    return;
  }
  if (new Set(rows.map((i) => clusterOf[i])).size < rows.length) {
    state.warnings.push(`The selected gene ${options.id} appears multiple times in some clusters. Please make sure to use a unique gene id.`);
    return;
  }

  const range = new Map();
  clusterOf.forEach((cl, i) => {
    const r = range.get(cl) || { start: Infinity, end: -Infinity };
    range.set(cl, { start: Math.min(r.start, starts[i]), end: Math.max(r.end, ends[i]) });
  });
  const gaps = (from, to, cl) => (x.series.get(cl)?.scale?.breaks || [])
    .reduce((sum, gap) => sum + Math.max(0, Math.min(gap.end, to) - Math.max(gap.start, from)), 0);

  const genes = rows.map((i) => {
    const cl = clusterOf[i];
    const isReversed = reversed.has(cl);
    const position = alignPosition(options.align, starts[i], ends[i], isReversed);
    const { start: clusterStart, end: clusterEnd } = range.get(cl);
    const gapsBelow = gaps(clusterStart, position, cl);
    const gapsAbove = gaps(position, clusterEnd, cl);
    const below = position - clusterStart - gapsBelow;
    const above = clusterEnd - position - gapsAbove;
    return {
      cl, isReversed, position, gapsBelow, gapsAbove,
      left: isReversed ? above : below,
      right: isReversed ? below : above,
    };
  });
  const maxLeft = Math.max(...genes.map((g) => g.left));
  const maxRight = Math.max(...genes.map((g) => g.right));
  for (const g of genes) {
    const series = x.series.get(g.cl);
    series.scale.start = g.position - (g.isReversed ? maxRight : maxLeft) - g.gapsBelow;
    series.scale.end = g.position + (g.isReversed ? maxLeft : maxRight) + g.gapsAbove;
  }
}
