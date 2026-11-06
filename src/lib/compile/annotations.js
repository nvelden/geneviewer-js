// Annotations and single-element styles: GC_annotation()
// (R/chart_interaction.R) and GC_element_style() (R/element_style.R).
import { getUpdatedClusters } from "./chart.js";
import { dots } from "./cluster.js";
import { clone, compact, modifyList } from "./r.js";
import { shiftAnnotation } from "./scale.js";

// The annotation types, as createAnnotation() draws them
const ANNOTATION_TYPES = ["text", "textMarker", "line", "arrow", "symbol", "rectangle", "promoter",
  "terminator", "arc"];

/**
 * R's GC_annotation(): an annotation in each of the clusters.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function annotation(state, entry) {
  const type = entry.type ?? "text";
  if (typeof type !== "string" || !ANNOTATION_TYPES.includes(type)) {
    throw new Error(`'type' must be one of ${ANNOTATION_TYPES.map((t) => `"${t}"`).join(", ")}.`);
  }
  const extra = dots(entry, ["type", "clusters"]);
  for (const name of getUpdatedClusters(state, entry.clusters)) {
    const series = state.x.series.get(name);
    // A range axis moved the genes of the cluster; the annotation moves along
    const options = shiftAnnotation(compact({ type, ...clone(extra) }), series.positionShift);
    series.annotations = [...(series.annotations || []), options];
  }
}

// Components identified by a row of the data, those of the whole chart, and
// those moved as a whole
const ROW_COMPONENTS = ["genes", "labels", "coordinates"];
const CHART_COMPONENTS = ["legend", "title"];
const SCALE_COMPONENTS = ["scaleBar", "scale"];
const COMPONENTS = ["genes", "labels", "coordinates", "clusterTitle", "clusterFooter", "clusterLabel",
  "legend", "title", "scaleBar", "scale"];

/**
 * R's update_element_override(): one element's override merged into the
 * earlier one for the element, last; the others unchanged.
 * @param {Object<string, *>[]|undefined} items
 * @param {(item: Object<string, *>) => boolean} same
 * @param {Object<string, *>} id
 * @param {Object<string, *>} style
 * @returns {Object<string, *>[]}
 */
function updateOverride(items, same, id, style) {
  const list = Array.isArray(items) ? items : [];
  const previous = list.find(same) || {};
  const kept = list.filter((item) => !same(item));
  const override = modifyList(previous, style);
  for (const [key, value] of Object.entries(id)) override[key] = value;
  return [...kept, override];
}

/**
 * R's GC_element_style(): options of one element (a gene, label,
 * coordinate, title, legend entry, scale bar or axis).
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function elementStyle(state, entry) {
  const component = entry.component ?? "genes";
  if (!COMPONENTS.includes(component)) throw new Error(`'component' must be one of ${COMPONENTS.join(", ")}`);
  const { rowID = null, cluster = null, part = null, end = null, group = null } = entry;
  const style = clone(dots(entry, ["component", "rowID", "cluster", "part", "end", "group"]));
  const byRow = ROW_COMPONENTS.includes(component);
  const x = state.x;

  if (CHART_COMPONENTS.includes(component)) {
    if (component === "legend") {
      const column = x.legend?.group;
      if (group === null || column == null || !x.data.get(column)?.some((value) => String(value) === String(group))) {
        throw new Error("'group' must identify one group in the legend.");
      }
    }
    const id = component === "legend" ? { group, part } : { part };
    const same = (item) => item.part === part && (component === "title" || item.group === group);
    x[component].itemStyle = updateOverride(x[component].itemStyle, same, id, style);
    return;
  }

  const key = component === "clusterFooter" ? "footer" : component;
  let id;
  let same;
  let clusters;
  if (byRow) {
    if (typeof rowID !== "number" || !x.data.get("rowID").includes(rowID)) {
      throw new Error("'rowID' must identify one row in the chart's data.");
    }
    id = end === null ? { rowID } : { rowID, end };
    same = (item) => Number(item.rowID) === Number(rowID) && (item.end ?? null) === end;
    clusters = [...x.series.keys()];
  } else {
    id = SCALE_COMPONENTS.includes(component) ? {} : { part };
    same = (item) => (item.part ?? null) === part;
    clusters = getUpdatedClusters(state, cluster);
    if (!clusters.length) throw new Error("'cluster' must be the name or number of a cluster of the chart.");
  }
  for (const name of clusters) {
    const series = x.series.get(name);
    if (byRow && !series.data.get("rowID").includes(rowID)) continue;
    if (!series[key] || Array.isArray(series[key])) series[key] = {};
    series[key].itemStyle = updateOverride(series[key].itemStyle, same, id, style);
  }
}
