// Compiled by the types smoke test against the installed package.
import { newChart, compile, type Spec, type Chart } from "geneviewer";

const spec: Spec = {
  version: 1,
  data: [{ cluster: "A", start: 100, end: 900, class: "kinase" }],
  fields: { cluster: "cluster", group: "class" },
  labels: { label: "class" },
};
const chart: Chart = newChart(document.createElement("div"), spec, { injectStyles: false });
chart.update({ title: { title: "Types" } });
const model: Record<string, any> = compile(spec);
console.log(model, chart.getSpec());
