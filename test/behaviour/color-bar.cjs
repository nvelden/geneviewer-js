// Where the color bar of the links goes, and how it is drawn.

const viewport = { width: 800, height: 400 };

// The color bar as drawn: in the legend or over the chart, its box and size,
// its texts and ticks, and the boxes of the first and last legend items and
// of the plot. Clicking a bar in the legend must hide no genes.
const drawn = () => {
  const el = document.querySelector(".geneviewer");
  const overlay = el.querySelector("svg.color-bar");
  const inLegend = el.querySelector(".legend-color-bar");
  const host = overlay ?? inLegend;
  const bar = host?.querySelector("rect");
  const box = (node) => { const b = node.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; };
  // All bars: links of both directions get a bar each, of half the height
  const bars = () => {
    const b = Array.from(host.querySelectorAll("rect"), (r) => r.getBoundingClientRect());
    const left = Math.min(...b.map((r) => r.left)), top = Math.min(...b.map((r) => r.top));
    return [left, top, Math.max(...b.map((r) => r.right)) - left, Math.max(...b.map((r) => r.bottom)) - top];
  };
  const texts = Array.from(host?.querySelectorAll("text") ?? []);
  const items = el.querySelectorAll(".legend rect");
  let hidden = null;
  if (inLegend) {
    inLegend.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    hidden = el.querySelectorAll(".legend.unselected").length;
  }
  return {
    overlay: !!overlay,
    inLegend: !!inLegend,
    barSize: bar ? [+bar.getAttribute("width"), +bar.getAttribute("height")] : null,
    bar: bar ? bars() : null,
    legendItem: items.length ? box(items[0]) : null,
    lastLegendItem: items.length ? box(items[items.length - 1]) : null,
    plot: box(el.querySelector("[id^=geneviewer-graph-container]")),
    texts: texts.map((n) => n.textContent),
    titleWeight: texts[0] ? getComputedStyle(texts[0]).fontWeight : null,
    barStroke: bar ? getComputedStyle(bar).stroke : null,
    ticks: host?.querySelectorAll("line").length ?? 0,
    tickLabels: texts.filter((n) => n.getAttribute("text-anchor") === "middle").map(box),
    hidden,
    exported: widget.getChart().toSVG().includes("identity"),
  };
};

// Whether the bar lies right of and below the middle of the plot
const side = (v) => [v.bar[0] > v.plot[0] + v.plot[2] / 2, v.bar[1] > v.plot[1] + v.plot[3] / 2];

module.exports = [
  {
    name: "the color bar goes in the legend, lying down before the groups",
    fixture: "beh-color-bar-legend", viewport,
    async run(page, t) {
      const v = await page.evaluate(drawn);
      t.equal([v.overlay, v.inLegend], [false, true], "in the legend");
      t.equal(v.texts, ["identity", "0%", "100%"], "texts");
      // Wider than tall, as tall as the markers, and left of the first group
      // of the legend, with a gap wider than between the groups
      t.ok(v.barSize[0] > v.barSize[1], "lying");
      t.near(v.bar[3], v.legendItem[3], 1, "as tall as the markers");
      t.ok(v.legendItem[0] - (v.bar[0] + v.bar[2]) > 30, "gap before the groups");
      t.ok(["bold", "700"].includes(v.titleWeight), "bold title");
      // Clicking it hides no genes, and saved images keep it
      t.equal(v.hidden, 0, "click hides nothing");
      t.ok(v.exported, "in saved images");
    },
  },
  {
    name: "by default the color bar stands in the bottom right corner",
    fixture: "beh-color-bar-default", viewport,
    async run(page, t) {
      const v = await page.evaluate(drawn);
      t.ok(v.overlay, "over the chart");
      t.equal(v.barSize, [10, 60], "size");
      t.equal(side(v), [true, true], "bottom right");
    },
  },
  {
    name: "the color bar lies in the top left corner",
    fixture: "beh-color-bar-topleft", viewport,
    async run(page, t) {
      const v = await page.evaluate(drawn);
      t.equal(v.barSize, [80, 8], "size");
      t.equal(side(v), [false, false], "top left");
    },
  },
  {
    name: "the color bar stands in the bottom left corner",
    fixture: "beh-color-bar-bottomleft", viewport,
    async run(page, t) {
      t.equal(side(await page.evaluate(drawn)), [false, true], "bottom left");
    },
  },
  {
    name: "the color bar stands in the top right corner",
    fixture: "beh-color-bar-topright", viewport,
    async run(page, t) {
      t.equal(side(await page.evaluate(drawn)), [true, false], "top right");
    },
  },
  {
    name: "a color bar for the legend stands bottom right without a legend",
    fixture: "beh-color-bar-no-legend", viewport,
    async run(page, t) {
      const v = await page.evaluate(drawn);
      t.equal([v.overlay, v.inLegend], [true, false], "over the chart");
      t.equal(v.barSize, [10, 60], "size");
    },
  },
  {
    name: "the legend outlines a color bar the theme leaves without one",
    fixture: "beh-color-bar-publication", viewport,
    async run(page, t) {
      const v = await page.evaluate(drawn);
      t.ok(!["none", ""].includes(v.barStroke), `stroke ${v.barStroke}`);
    },
  },
  {
    name: "a lying color bar takes its labels below, with as many ticks as fit",
    fixture: "beh-color-bar-labels-below", viewport,
    async run(page, t) {
      const v = await page.evaluate(drawn);
      t.equal(v.barSize, [120, 8], "size");
      t.equal(v.texts[0], "identity", "title");
      t.ok(v.ticks > 2, "ticks");
      t.equal(v.tickLabels.length, v.ticks, "a label per tick");
      // The measures stand side by side without overlapping
      t.ok(v.tickLabels.every((b, i) => i === 0 || b[0] > v.tickLabels[i - 1][0] + v.tickLabels[i - 1][2]),
        "labels apart");
    },
  },
  {
    name: "a lying color bar has its labels inline by default",
    fixture: "beh-color-bar-horizontal", viewport,
    async run(page, t) {
      const v = await page.evaluate(drawn);
      t.equal(v.ticks, 0, "no ticks");
      t.equal(v.barSize, [80, 8], "size");
    },
  },
  {
    name: "the color bar goes after the groups of the legend with legendSide = 'right'",
    fixture: "beh-color-bar-legend-right", viewport,
    async run(page, t) {
      const v = await page.evaluate(drawn);
      t.ok(v.inLegend, "in the legend");
      // Right of the last group, on its row, with the same wider gap
      t.ok(v.bar[0] > v.lastLegendItem[0] + 30, "after the last group");
      t.near(v.bar[1] + v.bar[3] / 2, v.lastLegendItem[1] + v.lastLegendItem[3] / 2, 1, "on its row");
    },
  },
  {
    name: "a color bar that does not fit after the groups starts a new row",
    fixture: "beh-color-bar-legend-right-wrap", viewport,
    async run(page, t) {
      const v = await page.evaluate(drawn);
      t.ok(v.bar[1] > v.lastLegendItem[1] + v.lastLegendItem[3] / 2, "below the last group");
    },
  },
];
