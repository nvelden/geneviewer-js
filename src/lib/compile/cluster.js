// GC_cluster() (R/chart_layout.R) and add_gene_track() (R/utils.R): the
// options of each cluster, and gene tracks so genes do not overlap.
import { getUpdatedClusters } from "./chart.js";
import { compact, mergeOptions } from "./r.js";

/**
 * The options of an entry passed through R's `...`: those that are not
 * among the named ones.
 * @param {Object<string, *>} entry
 * @param {string[]} named
 * @returns {Object<string, *>}
 */
export function dots(entry, named) {
  const out = {};
  for (const [key, value] of Object.entries(entry)) {
    if (!named.includes(key)) out[key] = value;
  }
  return out;
}

/**
 * The 0-based row order of R's order(...keys): ascending, stable, NA last.
 * @param {number} n
 * @param {Array<(i: number) => number|null>} keys
 * @returns {number[]}
 */
export function order(n, keys) {
  const indices = Array.from({ length: n }, (_, i) => i);
  return indices.sort((a, b) => {
    for (const key of keys) {
      const x = key(a);
      const y = key(b);
      const xNA = x === null || Number.isNaN(x);
      const yNA = y === null || Number.isNaN(y);
      if (xNA || yNA) {
        if (xNA !== yNA) return xNA ? 1 : -1;
        continue;
      }
      if (x < y) return -1;
      if (x > y) return 1;
    }
    return a - b;
  });
}

/**
 * R's add_gene_track(): a geneTrack column, so that genes that overlap go on
 * different tracks.
 * @param {import("./frame.js").Frame} data Genes in the order they are placed.
 * @param {boolean} nested Only genes inside another gene leave the first track.
 * @param {number|string} overlapMin Base pairs, or a share of the shorter gene ("10%").
 * @returns {import("./frame.js").Frame|null}
 */
function addGeneTrack(data, nested = false, overlapMin = 0) {
  if (!data || data.nrow === 0) return null;
  const starts = data.get("start");
  const ends = data.get("end");
  const low = starts.map((s, i) => Math.min(s, ends[i]));
  const high = starts.map((s, i) => Math.max(s, ends[i]));
  const share = typeof overlapMin === "string";
  const limit = share ? Number(overlapMin.replace(/%$/, "")) / 100 : overlapMin;

  const clash = (i, j) => {
    const overlap = Math.min(high[i], high[j]) - Math.max(low[i], low[j]) + 1;
    if (overlap <= 0) return false;
    const threshold = share
      ? limit * Math.min(high[i] - low[i] + 1, high[j] - low[j] + 1)
      : limit;
    return overlap > threshold;
  };
  // A gene inside another one; of two equal genes, the second
  const inside = low.map((_, i) => low.some((__, j) =>
    j !== i && low[j] <= low[i] && high[j] >= high[i] &&
    (low[j] < low[i] || high[j] > high[i] || j < i)));

  const track = [];
  const placed = new Map();
  for (let i = 0; i < low.length; i++) {
    if (nested && !inside[i]) {
      track[i] = 1;
      continue;
    }
    let candidate = nested ? 2 : 1;
    while ((placed.get(candidate) || []).some((j) => clash(i, j))) candidate++;
    track[i] = candidate;
    placed.set(candidate, [...(placed.get(candidate) || []), i]);
  }
  data.set("geneTrack", track);
  return data;
}

const NAMED = ["separateStrands", "strandSpacing", "preventGeneOverlap", "overlapMin",
  "overlapSpacing", "clusters", "style"];

/**
 * R's GC_cluster(): options of the clusters, and gene tracks.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function cluster(state, entry) {
  let separateStrands = entry.separateStrands ?? null;
  let preventGeneOverlap = entry.preventGeneOverlap ?? null;
  const overlapMin = entry.overlapMin ?? null;
  if (separateStrands === true && preventGeneOverlap !== null && preventGeneOverlap !== false) {
    state.warnings.push("Setting both separateStrands and preventGeneOverlap is not supported. Neither is applied.");
    separateStrands = null;
    preventGeneOverlap = null;
  }
  const extra = dots(entry, NAMED);
  for (const name of getUpdatedClusters(state, entry.clusters)) {
    const series = state.x.series.get(name);
    if (preventGeneOverlap !== null && preventGeneOverlap !== false) {
      const data = series.data;
      const starts = data.get("start");
      const ends = data.get("end");
      const rows = order(data.nrow, [
        (i) => -Math.max(starts[i], ends[i]),
        (i) => Math.abs(ends[i] - starts[i]),
      ]);
      series.data = addGeneTrack(data.rows(rows), preventGeneOverlap === "nested",
        overlapMin === null ? 0 : overlapMin);
    }
    series.container.style = mergeOptions(series.container.style, entry.style ?? {});
    const clusterOptions = compact({
      separateStrands,
      strandSpacing: entry.strandSpacing,
      preventGeneOverlap: preventGeneOverlap !== null ? preventGeneOverlap !== false : null,
      overlapSpacing: entry.overlapSpacing,
      ...extra,
    });
    series.cluster = mergeOptions(series.cluster, clusterOptions);
    series.container = mergeOptions(series.container, compact({ ...extra }));
  }
}
