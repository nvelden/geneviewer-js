// The chart and its clusters: GC_chart() of the R package (R/geneviewer.R),
// add_strand() and getUpdatedClusters() (R/utils.R).
import { Frame } from "./frame.js";
import { asCharacter, computeSize, getRelativeHeight } from "./r.js";

/**
 * The state compile() works on, as R's chart object: the render model `x`
 * (series in a Map, in R's cluster order), and the widget's width and height.
 * @typedef {Object} ChartState
 * @property {Object<string, *>} x
 * @property {number|string} width
 * @property {number|string} height
 * @property {Object<string, *>} spec
 * @property {string[]} warnings
 */

// The tooltip of genes; protein_blast() results get their own
const DEFAULT_FORMATTER = "<b>Start:</b> {start}<br><b>End:</b> {end}";
const QUERY_FORMATTER = "<b>{protein_id}</b><br>\n        <b>Query gene</b><br>\n        <b>Location:</b> {start} - {end}<br>";
const HIT_FORMATTER = "<b>{protein_id}</b><br>\n        <b>Best hit:</b> {BlastP}<br>\n        <b>Identity:</b> {identity}%<br>\n        <b>Similarity:</b> {similarity}%<br>\n        <b>Location:</b> {start} - {end}<br>";

const FORWARD = ["1", "forward", "+", "sense"];
const REVERSE = ["-1", "0", "reverse", "-", "antisense", "complement"];

/**
 * R's add_strand(): a strand column of "forward" and "reverse", from the
 * strand column or from the order of start and end; start and end swapped
 * where they disagree with the strand.
 * @param {Frame} data
 * @param {string|null} strand
 * @returns {Frame|null}
 */
export function addStrand(data, strand = null) {
  if (!data || data.nrow === 0) return null;
  if (strand === null && data.has("strand")) strand = "strand";
  if (!data.has("start")) throw new Error("start column not found in data");
  if (!data.has("end")) throw new Error("end column not found in data");
  const start = data.get("start");
  const end = data.get("end");
  if (strand === null) {
    data.set("strand", start.map((s, i) => (s === null || end[i] === null ? null : s < end[i] ? "forward" : "reverse")));
    return data;
  }
  if (!data.has(strand)) throw new Error("strand column not found in data");
  const values = data.get(strand).map(asCharacter);
  if (!values.every((v) => FORWARD.includes(v) || REVERSE.includes(v))) {
    throw new Error("Invalid strand values found. Valid values are 1/forward/+/sense or -1/0/reverse/-/antisense/complement.");
  }
  const strands = values.map((v) => (FORWARD.includes(v) ? "forward" : "reverse"));
  data.set("strand", strands);
  const newStart = start.slice();
  const newEnd = end.slice();
  strands.forEach((s, i) => {
    if ((s === "forward" && start[i] > end[i]) || (s === "reverse" && start[i] < end[i])) {
      newStart[i] = end[i];
      newEnd[i] = start[i];
    }
  });
  data.set("start", newStart);
  data.set("end", newEnd);
  return data;
}

/**
 * R's getUpdatedClusters(): the names of the clusters an entry applies to.
 * @param {ChartState} state
 * @param {Array<string|number>|string|number|null|undefined} cluster
 *   Names or 1-based positions; none for all clusters.
 * @returns {string[]} Empty, with a warning, when a cluster is not in the chart.
 */
export function getUpdatedClusters(state, cluster) {
  const clusters = [...state.x.series.keys()];
  if (cluster === null || cluster === undefined) return clusters;
  const wanted = Array.isArray(cluster) ? cluster : [cluster];
  if (wanted.length && wanted.every((c) => typeof c === "number")) {
    if (wanted.some((c) => c > clusters.length || c < 1)) {
      state.warnings.push("Some cluster numbers provided are out of range. Please check the cluster numbers.");
      return [];
    }
    return wanted.map((c) => clusters[Math.trunc(c) - 1]);
  }
  const names = wanted.map((c) => asCharacter(c));
  if (!names.every((c) => clusters.includes(c))) {
    state.warnings.push("Some cluster names provided are not valid. Please check the cluster names.");
    return [];
  }
  return names;
}

/**
 * R's GC_chart(): the chart from the spec's data, fields, width, height and
 * style, with one series per cluster.
 * @param {Object<string, *>} spec
 * @returns {ChartState}
 */
export function chart(spec) {
  const fields = spec.fields || {};
  const start = fields.start ?? "start";
  const end = fields.end ?? "end";
  const cluster = fields.cluster ?? null;
  const group = fields.group ?? null;
  const strand = fields.strand ?? null;
  const width = spec.width ?? "100%";
  const height = spec.height ?? "400px";
  const style = spec.style ?? {};
  // save_button = FALSE is the toolbar without the save button
  const buttons = spec.toolbar && !Array.isArray(spec.toolbar) ? spec.toolbar.buttons : undefined;
  const saveButton = !(Array.isArray(buttons) && !buttons.includes("save"));

  /** @type {Object<string, *>} */
  const x = {};
  // The arguments of GC_chart() but the data, without NULL and empty values
  x.params = { start, end };
  if (cluster !== null) x.params.cluster = cluster;
  if (group !== null) x.params.group = group;
  if (strand !== null) x.params.strand = strand;
  x.params.width = width;
  x.params.height = height;
  if (Object.keys(style).length) x.params.style = style;
  x.params.save_button = saveButton;

  let data = Frame.from(spec.data);
  for (const [column, label] of [[start, "start"], [end, "end"], [cluster, "cluster"], [group, "group"], [strand, "strand"]]) {
    if (column !== null && !data.has(column)) throw new Error(`${label} column not found in data`);
  }
  const columnNames = data.names;

  // Rows without a start or end are left out
  const startValues = data.get(start);
  const endValues = data.get(end);
  const kept = data.filter((i) => startValues[i] !== null && endValues[i] !== null);
  const warnings = [];
  if (kept.nrow < data.nrow) {
    warnings.push("Rows with NA values in 'start' or 'end' columns have been filtered out.");
  }
  data = kept;

  data.set("rowID", Array.from({ length: data.nrow }, (_, i) => i + 1));
  const original = data.copy();
  data.set("start", original.get(start).slice());
  data.set("end", original.get(end).slice());
  if (cluster !== null) data.set(cluster, data.get(cluster).map(asCharacter));
  data = addStrand(data, strand);

  x.data = data;
  if (group !== null) x.group = group;
  if (cluster !== null) x.cluster = cluster;
  x.graphContainer = { direction: "column" };
  x.style = style;
  x.title = { style: { width: "100%" } };
  x.legend = { group, show: group !== null, width };
  x.legend.style = { width: "100%", backgroundColor: style.backgroundColor ?? null };
  x.saveButton = saveButton;

  const clusters = cluster === null ? ["cluster"] : [...new Set(data.get(cluster))];
  const blast = columnNames.includes("BlastP") && columnNames.includes("protein_id");
  /** @type {Map<string, Object<string, *>>} */
  const series = new Map();
  for (const name of clusters) {
    const subset = cluster === null ? data.copy() : data.filter((i) => data.get(cluster)[i] === name);
    subset.set("cluster", name);
    const clusterHeight = typeof height === "string" && /%$/.test(height)
      ? computeSize(height, clusters.length)
      : Number(getRelativeHeight(height, height)) / clusters.length;
    const starts = subset.get("start");
    const ends = subset.get("end");
    const positions = [...starts, ...ends].filter((v) => v !== null);
    let formatter = DEFAULT_FORMATTER;
    if (blast) {
      const hits = subset.get("BlastP");
      const ids = subset.get("protein_id");
      const query = hits.some((hit, i) => hit !== null && ids[i] !== null && hit === ids[i]) &&
        hits.every((hit) => hit === null || hit === "No Hit" || ids.includes(hit));
      formatter = query ? QUERY_FORMATTER : HIT_FORMATTER;
    }
    series.set(name, {
      clusterName: name,
      data: subset,
      cluster: {},
      container: {
        height: clusterHeight,
        width,
        style: { width: "100%", backgroundColor: style.backgroundColor ?? null },
      },
      genes: { group, show: true },
      sequence: { show: true },
      scale: { xMin: Math.min(...positions), xMax: Math.max(...positions) },
      transcript: { group, show: false },
      labels: { group, show: true },
      coordinates: { show: false },
      scaleBar: {},
      footer: {},
      clusterLabel: {},
      clusterTitle: {},
      annotations: [],
      trackMouse: { show: false },
      tooltip: { show: true, formatter },
    });
  }
  x.series = series;

  return { x, width, height, spec, warnings };
}
