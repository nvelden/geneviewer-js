// Links between the genes of clusters: GC_links() (R/chart_links.R),
// without get_links(). The spec holds the pairs, made by R or Python (by
// matching genes on group) or by hand.
import { Frame } from "./frame.js";
import { dots, order } from "./cluster.js";
import { compact } from "./r.js";

const MEASURES = ["identity", "similarity", "none"];
const LINKS = ["data", "group", "value1", "value2", "clusters", "curve", "measure", "show", "label",
  "labelPosition", "normalColor", "invertedColor", "lowColor", "vmin", "vmax", "useGroupColors",
  "colorBar", "colorBarOptions", "linkWidth", "linkStyle", "labelStyle"];

const COLOR_BAR_CHOICES = {
  position: ["bottomright", "bottomleft", "topright", "topleft", "legend"],
  orientation: ["vertical", "horizontal"],
  labels: ["inline", "below"],
  legendSide: ["left", "right"],
};

/**
 * Renames a column in place, keeping its position.
 * @param {Frame} data
 * @param {string} from
 * @param {string} to
 */
function rename(data, from, to) {
  if (!data.has(from)) return;
  data.columns = new Map([...data.columns].map(([name, values]) => [name === from ? to : name, values]));
}

/**
 * R's GC_links(): a set of links, drawn between the genes of the pairs.
 * @param {import("./chart.js").ChartState} state
 * @param {Object<string, *>} entry
 */
export function links(state, entry) {
  const measure = entry.measure ?? "identity";
  const labelPosition = entry.labelPosition ?? "gene";
  const colorBarOptions = entry.colorBarOptions ?? {};
  if (!MEASURES.includes(measure)) {
    throw new Error("Invalid measure specified. Choose 'identity', 'similarity', or 'none'.");
  }
  if (!["gene", "link"].includes(labelPosition)) throw new Error("'labelPosition' must be one of \"gene\", \"link\".");
  for (const [name, choices] of Object.entries(COLOR_BAR_CHOICES)) {
    const value = colorBarOptions[name];
    if (value != null && !choices.includes(value)) {
      throw new Error(`'colorBarOptions.${name}' must be one of ${choices.map((c) => `"${c}"`).join(", ")}.`);
    }
  }
  const vmin = entry.vmin ?? null;
  const vmax = entry.vmax ?? null;
  if ((vmin !== null || vmax !== null) && (vmin ?? 0) >= (vmax ?? 100)) {
    throw new Error("'vmin' must be smaller than 'vmax'.");
  }

  // Without a group the pairs were given by hand: they are not tied to
  // genes, so their measures can only go on the links
  const group = entry.group ?? null;
  let label = entry.label ?? true;
  if (group === null && labelPosition === "gene") label = false;
  const data = Frame.from(entry.data ?? []);
  if (data.nrow === 0) return;

  if (data.has("identity2")) rename(data, "identity2", "identity");
  if (data.has("similarity2")) rename(data, "similarity2", "similarity");
  rename(data, `${group ?? ""}1`, "group1");
  rename(data, `${group ?? ""}2`, "group2");

  let columns = ["cluster1", "group1", "start1", "end1", "cluster2", "group2", "start2", "end2"];
  if (measure !== "none") columns.push(measure);
  const useGroupColors = entry.useGroupColors ?? false;
  let colorBar = entry.colorBar;
  if (useGroupColors) {
    const groupColor = state.x.group !== undefined ? state.x.group : group;
    const values = data.get(`${groupColor ?? ""}2`);
    if (values) data.set("groupColor", values.slice());
    columns.push("groupColor");
    colorBar = false;
  }
  let pairs = data.select(columns.filter((name) => data.has(name)));
  const starts = pairs.get("start2") || [];
  pairs = pairs.rows(order(pairs.nrow, [(i) => starts[i]]));

  const options = compact({
    group,
    curve: entry.curve,
    measure,
    showLinks: entry.show ?? true,
    label,
    labelPosition,
    normalColor: entry.normalColor,
    invertedColor: entry.invertedColor,
    lowColor: entry.lowColor,
    vmin,
    vmax,
    useGroupColors,
    value1: entry.value1,
    value2: entry.value2,
    colorBar,
    colorBarOptions,
    linkWidth: entry.linkWidth,
    linkStyle: entry.linkStyle,
    labelStyle: entry.labelStyle,
    ...dots(entry, LINKS),
  });

  // Link ids are numbered by set: "0-1", "0-2", ... for the first set
  const current = state.x.links || [];
  pairs.set("linkID", Array.from({ length: pairs.nrow }, (_, i) => `${current.length}-${i + 1}`));
  state.x.links = [...current, { data: pairs, options }];
}
