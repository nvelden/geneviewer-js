// The zoom slider: zooming, reporting the window, keeping it over redraws, and
// leaving it out of saved images.

const viewport = { width: 1000, height: 600 };

// Drags the window of the slider by a share of its width
const dragWindow = (share) => {
  const node = el.querySelector("[data-zoom-part=window]");
  const box = node.getBoundingClientRect();
  const x = box.left + box.width / 2, y = box.top + box.height / 2;
  node.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: x, clientY: y, pointerId: 1, button: 0 }));
  window.dispatchEvent(new PointerEvent("pointermove", { clientX: x + box.width * share, clientY: y, pointerId: 1 }));
  window.dispatchEvent(new PointerEvent("pointerup", { clientX: x + box.width * share, clientY: y, pointerId: 1 }));
};
const defineDrag = (page) => page.evaluate(`window.dragWindow = ${dragWindow}`);

module.exports = [
  {
    name: "the zoom slider zooms, clips, reports and is left out of saved images",
    fixture: "beh-zoom-slider", viewport,
    async run(page, t) {
      await defineDrag(page);
      const v = await page.evaluate(() => {
        const slider = el.querySelector(".geneviewer-zoom-slider");
        const windowNode = slider.querySelector("[data-zoom-part=window]");
        const before = {
          clips: el.querySelectorAll(".geneviewer-zoom-clip").length,
          left: windowNode.style.left,
          width: windowNode.style.width,
          overview: slider.querySelectorAll(".geneviewer-zoom-overview rect").length,
          linksClipped: !!el.querySelector("svg.GeneLink g[clip-path]"),
          resetHidden: el.querySelector(".geneviewer-zoom-buttons").hidden,
          exported: widget.getChart().toSVG().includes("geneviewer-zoom-overview"),
        };
        const reports = [];
        el.addEventListener("geneviewer:zoom", (event) => reports.push(event.detail));
        dragWindow(1);
        const moved = reports[0];
        slider.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
        return JSON.stringify({ before, moved, reset: reports[1],
          clipsAfterReset: el.querySelectorAll(".geneviewer-zoom-clip").length });
      }).then(JSON.parse);
      t.equal(v.before.clips, 2, "clips");
      t.equal([v.before.left, v.before.width], ["25%", "25%"], "window");
      t.ok(v.before.overview > 10, "overview");
      t.ok(v.before.linksClipped, "links clipped");
      t.equal(v.before.resetHidden, false, "reset shown");
      t.equal(v.before.exported, false, "not in saved images");
      const m = v.moved;
      t.equal([m.mode, m.start, m.end, m.zoomed, m.clusters.length], ["relative", 0.5, 0.75, true, 2], "moved");
      t.equal(v.reset.zoomed, false, "double-click resets");
      t.equal(v.clipsAfterReset, 0, "no clips after reset");
    },
  },
  {
    name: "redraws keep the window, and every change of it is reported",
    fixture: "beh-zoom-redraw", viewport,
    async run(page, t) {
      await defineDrag(page);
      const steps = await page.evaluate(() => {
        // The spec R sent, with some keys changed (null leaves a key out)
        const copy = (change) => {
          const spec = Object.assign(input().spec, change);
          Object.keys(spec).forEach((key) => { if (spec[key] === null) delete spec[key]; });
          return { spec };
        };
        const reports = [];
        el.addEventListener("geneviewer:zoom", (event) => reports.push(event.detail));
        const width = () => el.querySelector("[data-zoom-part=window]")?.style.width ?? null;
        const steps = {};
        dragWindow(0.5);
        steps.dragged = { width: width(), reports: reports.splice(0) };
        // The same settings again, e.g. another option changed in an app
        widget.renderValue(copy({ title: { title: "Again", show: true } }));
        steps.same = { width: width(), left: el.querySelector("[data-zoom-part=window]").style.left, reports: reports.splice(0) };
        // A new range from R
        widget.renderValue(copy({ zoom: { show: true, range: [0.5, 1] } }));
        steps.range = { width: width(), reports: reports.splice(0) };
        // The slider off and on again: the window is reported again
        widget.renderValue(copy({ zoom: null }));
        steps.off = { width: width(), reports: reports.splice(0) };
        widget.renderValue(copy({ zoom: { show: true, range: [0.5, 1] } }));
        steps.on = { width: width(), reports: reports.splice(0) };
        return JSON.stringify(steps);
      }).then(JSON.parse);
      t.equal(steps.dragged.reports[0].action, "drag", "drag reported");
      t.equal(steps.dragged.reports[0].range, [0.375, 0.625], "dragged range");
      t.equal([steps.same.width, steps.same.left, steps.same.reports.length], ["25%", "37.5%", 0], "same settings");
      t.equal(steps.range.width, "50%", "new range");
      t.equal([steps.range.reports[0].action, steps.range.reports[0].range], ["render", [0.5, 1]], "new range reported");
      t.equal([steps.off.width, steps.off.reports.length], [null, 0], "slider off");
      t.equal(steps.on.reports.length, 1, "slider on again");
    },
  },
  {
    name: "a new render_id starts at the range again, also without rendered = TRUE",
    fixture: "beh-zoom-render-id", viewport,
    async run(page, t) {
      await defineDrag(page);
      const steps = await page.evaluate(() => {
        const copy = (renderId) => {
          const next = input();
          next.spec.events.renderId = renderId;
          return next;
        };
        const reports = [];
        el.addEventListener("geneviewer:zoom", (event) => reports.push(event.detail));
        const zoomWindow = () => {
          const node = el.querySelector("[data-zoom-part=window]");
          return { left: node.style.left, width: node.style.width };
        };
        dragWindow(0.5);
        const steps = { dragged: zoomWindow() };
        reports.splice(0);
        // The same load drawn again keeps the window the user picked
        widget.renderValue(copy("load-1"));
        steps.same = { ...zoomWindow(), reports: reports.splice(0) };
        // A new load of the same data and range starts at the range again
        widget.renderValue(copy("load-2"));
        steps.load = { ...zoomWindow(), reports: reports.splice(0) };
        return JSON.stringify(steps);
      }).then(JSON.parse);
      t.equal(steps.dragged.left, "37.5%", "dragged");
      t.equal([steps.same.left, steps.same.reports.length], ["37.5%", 0], "same load");
      t.equal([steps.load.left, steps.load.width], ["25%", "25%"], "new load");
      t.equal([steps.load.reports[0].action, steps.load.reports[0].range], ["render", [0.25, 0.5]], "new load reported");
    },
  },
  {
    name: "saved images leave out the slider and its room",
    fixture: "beh-zoom-saved", viewport,
    async run(page, t) {
      const v = await page.evaluate(() => {
        const box = el.getBoundingClientRect();
        const row = el.querySelector(".geneviewer-zoom-row");
        const style = getComputedStyle(row);
        const band = row.getBoundingClientRect().height + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
        const top = (node) => node.getBoundingClientRect().top;
        const label = [...el.querySelectorAll("text")].find((n) => n.textContent === "Monooxygenase");
        const legendTop = top(el.querySelector("[id^=geneviewer-legend-container] svg")) - box.top;
        const titleTop = top(el.querySelector("[id^=geneviewer-title-container] svg")) - box.top;
        // Draw the saved SVG on the page to measure it
        const holder = document.createElement("div");
        holder.innerHTML = widget.getChart().toSVG().replace(/^<\?xml[^>]*>/, "");
        document.body.appendChild(holder);
        const saved = holder.querySelector("svg");
        const savedBox = saved.getBoundingClientRect();
        const parts = [...saved.children].filter((n) => n.tagName === "svg");
        const savedLabel = [...saved.querySelectorAll("text")].find((n) => n.textContent === "Monooxygenase");
        return {
          band, elHeight: box.height, savedHeight: +saved.getAttribute("height"),
          legendShift: legendTop - Math.min(...parts.map((n) => +n.getAttribute("y"))
            .filter((y) => Math.abs(y - (legendTop - band)) < 1).concat([1e9])),
          titleKept: parts.some((n) => Math.abs(+n.getAttribute("y") - titleTop) < 0.5),
          labelShift: (top(label) - box.top) - (top(savedLabel) - savedBox.top),
          slider: holder.innerHTML.includes("geneviewer-zoom"),
        };
      });
      t.ok(v.band > 20, "the slider takes room");
      t.equal(v.savedHeight, Math.ceil(v.elHeight - v.band), "saved height");
      t.near(v.legendShift, v.band, 0.01, "legend moves up");
      t.ok(v.titleKept, "title stays");
      // A moved legend label is drawn above the chart, below the slider
      t.near(v.labelShift, v.band, 0.5, "moved label moves up");
      t.equal(v.slider, false, "no slider");
    },
  },
];
