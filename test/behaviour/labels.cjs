// Where gene labels go: turned, hidden, spread with leader lines, and the
// measures on links.

const viewport = { width: 800, height: 400 };

// The labels as drawn: how many are hidden, turned, outside their SVG or
// overlapping, and the measures on the links
const placement = () => {
  const el = document.querySelector(".geneviewer");
  const labels = Array.from(el.querySelectorAll("text.label"));
  const shown = labels.filter((n) => n.style.display !== "none");
  const outside = shown.filter((n) => {
    const svg = n.ownerSVGElement.getBoundingClientRect(), b = n.getBoundingClientRect();
    return b.top < svg.top - 0.5 || b.bottom > svg.bottom + 0.5 ||
      b.left < svg.left - 0.5 || b.right > svg.right + 0.5;
  }).length;
  const boxes = shown.map((n) => n.getBoundingClientRect());
  let overlapping = 0;
  boxes.forEach((a, i) => boxes.slice(i + 1).forEach((b) => {
    if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) overlapping++;
  }));
  return {
    total: labels.length,
    hidden: labels.length - shown.length,
    turned: shown.filter((n) => /rotate\((?!0,)/.test(n.getAttribute("transform") || "")).length,
    outside, overlapping,
    measures: Array.from(el.querySelectorAll("text.link-measure"), (n) => n.textContent),
    geneMeasures: el.querySelectorAll(".link-text").length,
  };
};

// Spread labels and their lines, also after a label is moved as a drag moves it
const spread = () => new Promise((resolve) => {
  const el = document.querySelector(".geneviewer");
  const labels = Array.from(el.querySelectorAll("text.label"));
  const lines = Array.from(el.querySelectorAll(".leader-lines line"));
  const boxes = labels.map((n) => n.getBoundingClientRect());
  let overlapping = 0;
  boxes.forEach((a, i) => boxes.slice(i + 1).forEach((b) => {
    if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) overlapping++;
  }));
  const genes = Array.from(el.querySelectorAll(".gene"), (g) => g.getBoundingClientRect());
  const genesBottom = Math.max(...genes.map((g) => g.bottom));
  const genesTop = Math.min(...genes.map((g) => g.top));
  const svg = el.querySelector("svg").getBoundingClientRect();
  const result = {
    labels: labels.length, lines: lines.length, overlapping,
    turned: labels.filter((n) => /rotate\((?!0,)/.test(n.getAttribute("transform") || "")).length,
    oneLine: new Set(boxes.map((b) => Math.round(b.top))).size === 1,
    belowGenes: boxes.every((b) => b.top > genesBottom),
    aboveGenes: boxes.every((b) => b.bottom < genesTop),
    inside: boxes.every((b) => b.left >= svg.left - 0.5 && b.right <= svg.right + 0.5),
    lineStyle: lines.length ? [getComputedStyle(lines[0]).stroke, getComputedStyle(lines[0]).strokeWidth] : null,
  };
  if (!lines.length) return resolve(result);
  // Labels with a line, in the order of their lines
  const led = labels.filter((n) => n.__leader__);
  result.unled = labels.filter((n) => !n.__leader__ && n.textContent.trim() !== "").length;
  // The line ends at the side of the label that faces the genes, also after
  // the label is moved
  const ends = lines.map((l) => [+l.getAttribute("x2"), +l.getAttribute("y2")]);
  const near = (i) => {
    const b = led[i].getBBox(), m = lines[i].parentNode.getScreenCTM().inverse().multiply(led[i].getScreenCTM());
    const top = new DOMPoint(b.x + b.width / 2, b.y).matrixTransform(m);
    const bottom = new DOMPoint(b.x + b.width / 2, b.y + b.height).matrixTransform(m);
    const y2 = +lines[i].getAttribute("y2");
    const edge = y2 < +lines[i].getAttribute("y1") ? bottom : top;
    return Math.abs(edge.x - +lines[i].getAttribute("x2")) < 1 && Math.abs(edge.y - y2) < 4;
  };
  result.atLabels = led.every((_, i) => near(i));
  led[0].setAttribute("transform", "translate(30, 10) " + led[0].getAttribute("transform"));
  setTimeout(() => {
    result.followsX = +lines[0].getAttribute("x2") - ends[0][0];
    result.followsY = +lines[0].getAttribute("y2") - ends[0][1];
    // A label dragged to the other side of the genes takes the line from the
    // other side of its gene
    if (led.length < 2) return resolve(result);
    const shift = result.aboveGenes ? 150 : -150;
    led[1].setAttribute("transform", `translate(0, ${shift}) ` + led[1].getAttribute("transform"));
    setTimeout(() => {
      result.flippedUp = +lines[1].getAttribute("y2") < +lines[1].getAttribute("y1");
      result.flippedAtLabel = near(1);
      resolve(result);
    }, 50);
  }, 50);
});

// The shown labels, once ready() holds: how many are shown and hidden, whether
// they overlap, are turned, lie on one line and fit in the SVG of the cluster,
// and the width of the first line
const fit = (ready) => new Promise((resolve, reject) => {
  const deadline = performance.now() + 5000;
  setTimeout(function measure() {
    const el = document.querySelector(".geneviewer");
    if (!new Function("el", "return " + ready)(el)) {
      if (performance.now() >= deadline) return reject(new Error("Label layout did not finish"));
      return setTimeout(measure, 25);
    }
    const all = Array.from(el.querySelectorAll("text.label"));
    const shown = all.filter((n) => getComputedStyle(n).display !== "none");
    const boxes = shown.map((n) => n.getBoundingClientRect());
    let overlapping = 0;
    boxes.forEach((a, i) => boxes.slice(i + 1).forEach((b) => {
      if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) overlapping++;
    }));
    const area = all[0].ownerSVGElement.getBoundingClientRect();
    const line = el.querySelector(".leader-lines line");
    resolve({
      shown: shown.length, hidden: all.length - shown.length, overlapping,
      turned: shown.filter((n) => /rotate\((?!0,)/.test(n.getAttribute("transform") || "")).length,
      oneLine: new Set(boxes.map((b) => Math.round(b.top))).size === 1,
      inside: boxes.every((b) => b.left >= area.left - 0.5 && b.right <= area.right + 0.5 &&
        b.top >= area.top - 0.5 && b.bottom <= area.bottom + 0.5),
      lineWidth: line ? getComputedStyle(line).strokeWidth : null,
    });
  }, 200);
});

const measuresOf = async (page) => (await page.evaluate(placement)).measures;

module.exports = [
  {
    name: "turned labels stay inside the chart, hiding one that would run past the right end",
    fixture: "beh-labels-turned", viewport,
    async run(page, t) {
      const v = await page.evaluate(placement);
      t.ok(v.turned > 0, "turned");
      // The last label would run out of the plot area when turned
      t.equal(v.hidden, 1, "hidden");
      t.equal(v.outside, 0, "outside");
    },
  },
  {
    name: "labels too long to turn within their cluster are hidden, not cut off",
    fixture: "beh-labels-too-long", viewport,
    async run(page, t) {
      const v = await page.evaluate(placement);
      t.ok(v.hidden > 0, "hidden");
      t.equal([v.outside, v.overlapping], [0, 0], "outside, overlapping");
    },
  },
  {
    name: "adjustLabels = 'hide' hides labels that overlap instead of turning them",
    fixture: "beh-labels-hide", viewport,
    async run(page, t) {
      const v = await page.evaluate(placement);
      t.ok(v.hidden > 0, "hidden");
      t.equal([v.turned, v.overlapping], [0, 0], "turned, overlapping");
    },
  },
  {
    name: "measures go on the links where they fit",
    fixture: "beh-labels-link-measures", viewport,
    async run(page, t) {
      const v = await page.evaluate(placement);
      // The wide links carry their measure, the narrow ones do not; no
      // measures are added to the gene labels
      t.ok(["91.3%", "64%"].every((m) => v.measures.includes(m)), `wide links: ${v.measures}`);
      t.ok(v.measures.length < 6, "not on the narrow links");
      t.equal(v.geneMeasures, 0, "none on the genes");
    },
  },
  {
    name: "more measures go on the links when zoomed in",
    fixture: "beh-labels-link-measures-zoomed", viewport,
    async run(page, t) {
      const zoomed = await measuresOf(page);
      // The same chart without the zoom
      await page.evaluate(() => {
        const x = input();
        delete x.spec.zoom;
        widget.renderValue(x);
      });
      const whole = await measuresOf(page);
      t.ok(zoomed.length > whole.length, `${zoomed.length} zoomed, ${whole.length} not`);
    },
  },
  {
    name: "adjustLabels = 'spread' puts labels on one line below the genes, apart, with lines",
    fixture: "beh-labels-spread", viewport,
    async run(page, t) {
      const v = await page.evaluate(spread);
      t.equal([v.overlapping, v.turned], [0, 0], "overlapping, turned");
      t.ok(v.oneLine && v.belowGenes && v.inside, "one line below the genes, inside");
      t.equal(v.lines, v.labels, "a line per label");
      t.ok(v.atLabels, "lines end at the labels");
      // A dragged label takes its line along
      t.near(v.followsX, 30, 0.01, "line follows x");
      t.near(v.followsY, 10, 0.01, "line follows y");
      // Dragged above the genes, the line goes up from the top of the gene
      t.ok(v.flippedUp && v.flippedAtLabel, "line flips");
    },
  },
  {
    name: "spreadPosition = 'top' puts spread labels on one line above the genes",
    fixture: "beh-labels-spread-top", viewport,
    async run(page, t) {
      const v = await page.evaluate(spread);
      t.equal(v.overlapping, 0, "overlapping");
      t.ok(v.oneLine && v.aboveGenes, "one line above the genes");
      t.equal(v.lines, v.labels, "a line per label");
      t.ok(v.atLabels, "lines end at the labels");
      t.near(v.followsY, 10, 0.01, "line follows y");
      // Dragged below the genes, the line goes down from the bottom of the gene
      t.equal(v.flippedUp, false, "line flips down");
      t.ok(v.flippedAtLabel, "flipped line ends at the label");
    },
  },
  {
    name: "genes without label text get no line when labels are spread",
    fixture: "beh-labels-spread-empty", viewport,
    async run(page, t) {
      const v = await page.evaluate(spread);
      t.equal([v.lines, v.unled], [2, 0], "lines, labels without");
      t.ok(v.atLabels, "lines end at the labels");
    },
  },
  {
    name: "leaderLine = FALSE spreads the labels without lines",
    fixture: "beh-labels-spread-no-lines", viewport,
    async run(page, t) {
      const v = await page.evaluate(spread);
      t.equal([v.lines, v.overlapping], [0, 0], "lines, overlapping");
    },
  },
  {
    name: "spread labels and their lines are only drawn for the genes in view when zoomed",
    fixture: "beh-labels-spread-zoomed", viewport,
    async run(page, t) {
      const v = await page.evaluate(spread);
      // The first gene, cut off by the left end of the window, gets its label too
      t.equal([v.lines, v.overlapping], [5, 0], "lines, overlapping");
      t.ok(v.inside && v.oneLine, "inside, on one line");
    },
  },
  {
    name: "the lines of spread labels are drawn in the style of the theme",
    fixture: "beh-labels-spread", viewport,
    async run(page, t) {
      t.equal((await page.evaluate(spread)).lineStyle, ["rgb(153, 153, 153)", "0.75px"], "default");
    },
  },
  {
    name: "the lines of spread labels take the style of a theme",
    fixture: "beh-labels-spread-vintage", viewport,
    async run(page, t) {
      t.equal((await page.evaluate(spread)).lineStyle, ["rgb(201, 194, 181)", "1px"], "vintage");
    },
  },
  {
    name: "the lines of spread labels take GC_labels() over the theme",
    fixture: "beh-labels-spread-own-line", viewport,
    async run(page, t) {
      t.equal((await page.evaluate(spread)).lineStyle, ["rgb(255, 0, 0)", "1px"], "own stroke");
    },
  },
  {
    name: "spread labels too many for the plot are hidden rather than cut off",
    fixture: "beh-labels-spread-many", viewport,
    async run(page, t) {
      const v = await page.evaluate(fit, "true");
      t.ok(v.hidden > 0 && v.shown > 0, "some hidden, some shown");
      t.equal(v.overlapping, 0, "overlapping");
      t.ok(v.inside, "inside");
    },
  },
  {
    name: "spread labels come closer to the genes when the cluster has no room below them",
    fixture: "beh-labels-spread-no-room", viewport,
    async run(page, t) {
      const v = await page.evaluate(fit, "true");
      t.ok(v.inside && v.oneLine, "inside, on one line");
    },
  },
  {
    name: "spread labels come closer to the genes when the cluster has no room above them",
    fixture: "beh-labels-spread-no-room-top", viewport,
    async run(page, t) {
      t.ok((await page.evaluate(fit, "true")).inside, "inside");
    },
  },
  {
    name: "labels that are not spread make room only for where spread labels end up",
    fixture: "beh-labels-spread-one-group", viewport,
    async run(page, t) {
      // Gene a's label is first drawn where it would overlap that of gene b
      const v = await page.evaluate(fit, "true");
      t.equal([v.turned, v.hidden], [0, 0], "turned, hidden");
    },
  },
  {
    name: "labels of a chart drawn while hidden are spread once it is shown",
    fixture: "beh-labels-spread", viewport, mount: false,
    async run(page, t) {
      await page.evaluate(() => {
        const tab = document.createElement("div");
        tab.style.display = "none";
        el.parentNode.insertBefore(tab, el);
        tab.appendChild(el);
        el.style.width = "700px";
        window.widget = mountChart(fixture, { ...fixtureMeta, width: 700 });
        tab.style.display = "block";
      });
      // ResizeObserver runs after the tab is shown: wait for the leader lines
      const v = await page.evaluate(fit, "el.querySelectorAll('.leader-lines line').length === 5");
      t.equal([v.shown, v.hidden, v.overlapping], [5, 0, 0], "shown, hidden, overlapping");
      t.ok(v.oneLine && v.inside, "on one line, inside");
    },
  },
  {
    name: "lines set again after a theme turns them off keep the default style",
    fixture: "beh-labels-spread-theme-off", viewport,
    async run(page, t) {
      t.equal((await page.evaluate(fit, "true")).lineWidth, "0.75px", "line width");
    },
  },
];
