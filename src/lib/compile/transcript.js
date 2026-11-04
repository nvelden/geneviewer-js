// Transcripts: GC_transcript() (R/chart_genes.R) and keep_chart_settings()
// (R/utils.R), without get_introns(): the spec's data holds the exons, UTRs
// and the introns R or Python made.
import { chart, getUpdatedClusters } from "./chart.js";
import { dots } from "./cluster.js";
import { keepColorOptions, setLegendColors } from "./genes.js";
import { grid } from "./layout.js";
import { compact, recycleAt } from "./r.js";

const TRANSCRIPT = ["transcript", "type", "strand", "group", "selection", "show", "colorScheme",
  "customColors", "styleExons", "styleIntrons", "styleUTRs", "itemStyleExons", "itemStyleIntrons",
  "itemStyleUTRs", "groupStyleExons", "groupStyleIntrons", "groupStyleUTRs", "styleBy", "labelOptions"];

/**
 * Whether two values are the same, as R's identical() for plain data.
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
function identical(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * R's keep_chart_settings(): the chart made again keeps the title, legend,
 * theme, events, toolbar, zoom and width of the old one, and its GC_grid()
 * margins and direction.
 * @param {import("./chart.js").ChartState} state The chart made again.
 * @param {import("./chart.js").ChartState} old
 */
function keepChartSettings(state, old) {
  for (const key of ["title", "legend", "theme", "events", "toolbar", "zoom"]) {
    if (old.x[key] === undefined) delete state.x[key];
    else state.x[key] = old.x[key];
  }
  state.width = old.width;

  // Left and right margins are kept when all clusters had the same; top and
  // bottom are the padding of the chart
  const margins = [...old.x.series.values()].map((series) => series.container.margin);
  const same = margins.length > 0 && margins.every((m) => identical(m, margins[0]));
  let margin = same ? margins[0] : {};
  const style = Array.isArray(old.x.style) ? {} : old.x.style || {};
  if (style.paddingTop != null) margin = { ...(margin || {}), top: style.paddingTop };
  if (style.paddingBottom != null) margin = { ...(margin || {}), bottom: style.paddingBottom };
  if (margin && Object.keys(margin).length > 0) grid(state, { margin });
  if (old.x.graphContainer?.direction === "row") grid(state, { direction: "row" });
}

/**
 * R's GC_transcript(): the first call makes the chart again with one
 * cluster per transcript; every call sets the options of the transcripts.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function transcript(state, entry) {
  if (!state.x.transcript_called) {
    const params = state.x.params;
    const old = { ...state, x: state.x };
    const fields = { start: params.start, end: params.end, cluster: entry.transcript ?? "transcript" };
    if (params.group !== undefined) fields.group = params.group;
    if (entry.strand != null) fields.strand = entry.strand;
    const rebuilt = chart({
      ...state.spec,
      fields,
      width: params.width,
      height: params.height,
      style: params.style,
    });
    // GC_chart()'s save button as it was
    rebuilt.x.saveButton = params.save_button;
    rebuilt.x.params.save_button = params.save_button;
    state.x = rebuilt.x;
    state.width = rebuilt.width;
    state.height = rebuilt.height;
    keepChartSettings(state, old);
    const transcripts = [...new Set(state.x.data.get("transcript").map(String))];
    for (const name of transcripts) {
      const series = state.x.series.get(name);
      series.genes = { group: null, show: false };
      series.sequence = { show: false };
      series.transcript = { group: null, show: true };
    }
  }

  let group = entry.group ?? null;
  const show = entry.show ?? true;
  if (group === null && state.x.group !== undefined) group = state.x.group;
  if (group !== null && ![group].flat().every((g) => state.x.data.has(g))) {
    throw new Error("group column not found in data");
  }
  const extra = dots(entry, TRANSCRIPT);
  getUpdatedClusters(state, entry.selection).forEach((name, i) => {
    const series = state.x.series.get(name);
    const options = compact({
      group: recycleAt(group, i),
      show: recycleAt(show, i),
      colorScheme: entry.colorScheme,
      customColors: entry.customColors,
      styleExons: entry.styleExons,
      styleIntrons: entry.styleIntrons,
      styleUTRs: entry.styleUTRs,
      itemStyleExons: entry.itemStyleExons,
      itemStyleIntrons: entry.itemStyleIntrons,
      itemStyleUTRs: entry.itemStyleUTRs,
      groupStyleExons: entry.groupStyleExons,
      groupStyleIntrons: entry.groupStyleIntrons,
      groupStyleUTRs: entry.groupStyleUTRs,
      styleBy: entry.styleBy,
      labelOptions: entry.labelOptions,
      ...extra,
    });
    series.transcript = keepColorOptions(options, series.transcript);
  });
  if (entry.selection == null) setLegendColors(state, entry.colorScheme, entry.customColors);
  state.x.transcript_called = true;
}
