// Compiles against dist/geneviewer.d.ts and dist/spec.d.ts (npm run types:test).
// Not run: a type error here means the published types changed shape.
import * as geneviewer from "../../dist/geneviewer";
import type { Chart, ChartEventObject, SelectionItem, Spec } from "../../dist/geneviewer";

const spec: Spec = {
  version: 1,
  data: { start: [1, 600], end: [500, 1200], cluster: ["A", "A"], class: ["x", "y"] },
  fields: { cluster: "cluster", group: "class" },
  labels: [{ label: "class" }, { clusters: ["A", 2], show: false, fontSize: "10px" }],
  color: { customColors: { x: "#1f77b4" } },
  scale: { autoBreaks: true, breaks: [{ start: 500, end: 600 }] },
  annotation: [{ type: "text", x: 100, text: "here" }],
  theme: "dark",
  zoom: { range: [0.2, 0.8], mode: "relative" },
};

const el = document.createElement("div");
const chart: Chart = geneviewer.newChart(el, spec, {
  on: { select: (event: ChartEventObject) => console.log(event.detail) },
  saveAs: (blob: Blob, filename: string) => console.log(blob.size, filename),
});
const off: () => void = chart.on("zoom", (event) => console.log(event.type));
off();
// Each event's detail has its own type
chart.on("zoom", (event) => {
  const shown: number = event.detail.end - event.detail.start;
  const cluster: string = event.detail.clusters[0].cluster;
  console.log(shown, cluster, event.detail.action);
});
chart.on("click", (event) => console.log(event.detail.component, event.detail.cluster, event.detail.data));
chart.on("select", (event) => console.log(event.detail?.part));
chart.on("selection", (event) => console.log(event.detail.length));
chart.on("drag", (event) => console.log(event.detail.position.moveX, event.detail.action));
chart.on("moves", (event) => console.log(event.detail.moves.map((move) => move.position.moveY)));
chart.on("rendered", (event) => console.log(event.detail.width, event.detail.id));
chart.zoomTo([1000, 2000]);
chart.zoomTo(null);
const svg: string = chart.toSVG();
const png: Promise<Blob> = chart.toPNG();
chart.update({ title: { title: "Clusters" } });
chart.setSpec({ ...spec, align: { idColumn: "class", id: "x" } });
const current: Spec = chart.getSpec();
chart.select([{ component: "genes", data: { rowID: 3 } }]);
chart.select(null);
const selected: SelectionItem[] = chart.getSelection();
chart.select(selected);
chart.undo();
chart.redo();
const saved: Promise<void> = chart.download("png", "clusters.png");
const model: Record<string, any> = geneviewer.compile(spec);
const dark: Record<string, any> = geneviewer.themes.dark;
const colors: string[] = geneviewer.palettes.okabeIto;
const version: string = geneviewer.version;
chart.destroy();

// @ts-expect-error: not an event
chart.on("hover", () => {});
// @ts-expect-error: a zoom reports no position
chart.on("zoom", (event) => console.log(event.detail.position));
// @ts-expect-error: select is null when the selection is cleared
chart.on("select", (event) => console.log(event.detail.component));
// @ts-expect-error: download() saves SVG or PNG
chart.download("pdf");
const noVersion: Spec = { data: [] };
// @ts-expect-error: the spec version is 1
const wrongVersion: Spec = { version: 2, data: [] };
// @ts-expect-error: unknown top-level key
const unknownKey: Spec = { version: 1, data: [], colors: {} };
// @ts-expect-error: zoom takes no other options (R's GC_zoom() has no ...)
const oldName: Spec = { version: 1, data: [], zoom: { window: [0, 1] } };

export { svg, png, saved, version, noVersion, wrongVersion, unknownKey, oldName };
