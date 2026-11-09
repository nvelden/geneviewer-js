// The element editor: selection, legend toggles, drags, undo and the toolbar.
// Events are dispatched on the page; Shiny is a stand-in that records
// setInputValue().

// Mouse, pointer and key events, defined on the page by each case
const helpers = () => {
  window.click = (node, detail = 1, mods = {}) =>
    node.dispatchEvent(new MouseEvent("click", Object.assign({ bubbles: true, detail }, mods)));
  window.pointer = (target, type, x, y, mods = {}) => target.dispatchEvent(new PointerEvent(type, Object.assign({
    pointerId: 1, isPrimary: true, button: 0, bubbles: true, clientX: x, clientY: y }, mods)));
  window.key = (k, mods = {}) => document.body.dispatchEvent(new KeyboardEvent("keydown",
    Object.assign({ key: k, bubbles: true, cancelable: true }, mods)));
};

const run = async (page, fn, arg) => {
  await page.evaluate(helpers);
  return JSON.parse(await page.evaluate(fn, arg));
};

const pick = (object, keys) => Object.fromEntries(keys.map((k) => [k, object[k]]));

const scaleDrag = (component) => ({
  name: `${component} drags as a whole group and keeps the offsets of each cluster`,
  fixture: `beh-editor-drag-${component}`,
  async run(page, t) {
    const v = await run(page, (component) => {
      const bars = () => [...el.querySelectorAll(`[data-component="${component}"]`)];
      const bar = () => bars().find((n) => n.closest("[data-cluster]").dataset.cluster === "A");
      const other = bars().find((n) => n !== bar());
      const otherTransform = other.getAttribute("transform");
      const children = [...bar().querySelectorAll("line, text, path")];
      const geometry = children.map((n) => n.outerHTML);
      const drags = [];
      el.addEventListener("geneviewer:drag", (e) => drags.push(e.detail));
      // The main line, both ticks and the label all move the same group
      children.forEach((node) => {
        pointer(node, "pointerdown", 100, 100);
        pointer(window, "pointermove", 120, 110);
        pointer(window, "pointerup", 120, 110);
      });
      const moved = bar().getAttribute("transform");
      pointer(children[0], "pointerdown", 100, 100);
      pointer(window, "pointermove", 130, 120);
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      const cancelled = bar().getAttribute("transform") === moved;
      const intact = children.every((n, i) => n.outerHTML === geometry[i] && bar().contains(n));
      const isolated = other.getAttribute("transform") === otherTransform;
      const selected = el.querySelectorAll(".geneviewer-selected").length;
      // GC_element_style() with the reported position, as an app does
      const x = input();
      x.spec.elementStyle = [{ component, cluster: "A", ...drags.at(-1).position }];
      widget.renderValue(x);
      widget.resize(700, 450);
      const restored = bar().__drawn__;
      x.spec.events.drag = false;
      widget.renderValue(x);
      pointer(bar().querySelector("text"), "pointerdown", 100, 100);
      pointer(window, "pointermove", 140, 120);
      pointer(window, "pointerup", 140, 120);
      return JSON.stringify({ drags, intact, isolated, cancelled, selected, restored });
    }, component);
    const n = v.drags.length;
    t.ok(n > 0, "drags reported");
    t.ok(v.intact, "the parts keep their geometry");
    t.ok(v.isolated, "the other cluster stays");
    t.ok(v.cancelled, "Escape cancels");
    t.equal(v.selected, 1, "selected");
    t.equal(v.restored, { moveX: 5 + 20 * n, moveY: -5 + 10 * n }, "restored after redraw");
    v.drags.forEach((d, i) => {
      t.equal([d.component, d.cluster, d.part], [component, "A", undefined], `drag ${i + 1}`);
      t.equal(d.position, { moveX: 5 + 20 * (i + 1), moveY: -5 + 10 * (i + 1) }, `drag ${i + 1} position`);
    });
  },
});

// The toolbar as drawn
const inspectToolbar = () => {
  const bar = el.querySelector(".geneviewer-toolbar");
  if (!bar) return JSON.stringify({ bar: false });
  const style = getComputedStyle(bar), box = bar.getBoundingClientRect(), chart = el.getBoundingClientRect();
  const save = el.querySelector(".geneviewer-save-icon");
  return JSON.stringify({ bar: true, classes: bar.className, opacity: style.opacity,
    buttons: Array.from(bar.querySelectorAll("button"), (b) => b.className.replace("geneviewer-toolbar-button ", "")),
    // A Font Awesome icon by its classes; a default icon drawn as inline SVG
    icons: Array.from(bar.querySelectorAll("button > i, button > .geneviewer-icon, .geneviewer-save-icon"),
      (i) => (i.tagName === "I" ? i.className.replace(" geneviewer-save-icon", "") : "svg")),
    divider: !!bar.querySelector(".geneviewer-toolbar-divider"),
    saveColor: save && getComputedStyle(save).color, saveSize: save && getComputedStyle(save).fontSize,
    tip: getComputedStyle(bar).getPropertyValue("--gv-toolbar-tip-background").trim(),
    left: Math.round(box.left - chart.left), bottom: Math.round(chart.bottom - box.bottom) });
};

module.exports = [
  {
    name: "selection and legend toggles stay independent across redraws",
    fixture: "beh-editor-toggles",
    async run(page, t) {
      const v = await run(page, () => {
        const x = input();
        const messages = [], dom = [];
        window.Shiny = { setInputValue: (name, value) => messages.push({ name, value }) };
        HTMLWidgets.shinyMode = true;
        el.addEventListener("geneviewer:dblclick", (e) => dom.push(e.detail));
        const gene = () => el.querySelector('.gene[rowID="1"]');
        const double = (node) => {
          click(node); click(node, 2);
          node.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, detail: 2 }));
        };
        const fill = getComputedStyle(gene()).fill;
        const text = el.querySelector('text.label[rowID="1"]').textContent;
        double(el.querySelector(".legend-marker"));
        double(gene());
        widget.resize(700, 400);
        widget.renderValue(x);
        const hidden = gene().style.display;
        const selected = el.querySelector(".geneviewer-selected").getAttribute("rowID");
        click(el.querySelector(".legend-marker"));
        gene().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        gene().dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        const cleared = el.querySelectorAll(".geneviewer-selected").length;
        // A second click on the selected gene ends its selection
        click(gene());
        const toggled = [el.querySelectorAll(".geneviewer-selected").length];
        click(gene());
        toggled.push(el.querySelectorAll(".geneviewer-selected").length);
        // Another part of the chart ends the selection, as empty space does
        const others = [".legend-marker", '[data-component="sequence"] line'].map((part) => {
          click(gene());
          click(el.querySelector(part));
          return el.querySelectorAll(".geneviewer-selected").length;
        });
        click(el.querySelector(".legend-marker"));
        click(gene());
        x.spec.data.name[0] = "Replacement";
        widget.renderValue(x);
        const replaced = el.querySelectorAll(".geneviewer-selected").length;
        x.spec.events = { click: true };
        widget.renderValue(x);
        click(gene());
        return JSON.stringify({ fill, text, hidden, selected, cleared, toggled, others, replaced, dom,
          clicks: messages.filter((m) => m.name.endsWith("_click")).length,
          doubles: messages.filter((m) => m.name.endsWith("_dblclick")).length });
      });
      t.equal(v.fill, "rgb(255, 0, 0)", "fill");
      t.equal(v.text, "Edited", "text");
      t.equal(v.hidden, "", "legend double-click hides nothing");
      t.equal(v.selected, "1", "selected");
      t.equal(v.cleared, 0, "Escape clears");
      t.equal(v.toggled, [1, 0], "second click ends the selection");
      t.equal(v.others, [1, 0], "other parts end the selection");
      t.equal(v.replaced, 0, "new data clears the selection");
      t.equal(v.clicks, 1, "clicks");
      t.equal(v.doubles, 3, "double-clicks");
      t.equal(v.dom.length, 3, "dblclick events");
      t.equal(v.dom[0].part, "marker", "first dblclick part");
      t.equal(v.dom[1].data.rowID, 1, "second dblclick row");
      // How the gene is drawn: its own fill, the default arrow
      const style = v.dom[1].style;
      t.equal(style.fill, "#ff0000", "reported fill");
      t.equal(pick(style, ["marker", "markerSize", "markerHeight", "arrowheadWidth", "y"]),
        { marker: "arrow", markerSize: "medium", markerHeight: 15, arrowheadWidth: 10, y: 50 }, "reported marker");
      t.equal(style.stroke, "#000000", "reported stroke");
    },
  },
  {
    // Links are drawn in an SVG below the cluster SVGs, which take the mouse
    // over their whole area: a real mouse click on a link must still report it
    name: "links below the cluster SVGs report clicks and are highlighted",
    fixture: "beh-editor-link-click",
    async run(page, t) {
      await page.evaluate(() => {
        window.messages = [];
        window.Shiny = { setInputValue: (name, value) => messages.push({ name, value }) };
        HTMLWidgets.shinyMode = true;
        widget.renderValue(input());
      });
      // A point where only the cluster SVG lies above a link
      const point = await page.evaluate(() => {
        for (const link of document.querySelectorAll('path[data-component="links"]')) {
          const r = link.getBoundingClientRect();
          for (let fy = 0.3; fy < 0.8; fy += 0.1) {
            const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height * fy);
            const stack = document.elementsFromPoint(x, y);
            const top = stack.find((e) => e.matches('path[data-component="links"]'));
            if (stack[0].classList.contains("geneviewer-svg-content") && top) {
              return { x, y, data: JSON.stringify(top.__data__) };
            }
          }
        }
        return null;
      });
      t.ok(point, "a link under the cluster SVG");
      if (!point) return;
      const count = (selector) => page.evaluate((s) => document.querySelectorAll(s).length, selector);
      await page.evaluate(() => document.querySelector(".gene")
        .dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 })));
      t.equal(await count(".geneviewer-selected"), 1, "gene selected");
      await page.mouse.move(point.x, point.y);
      await page.mouse.down();
      await page.mouse.up();
      const clicked = await page.evaluate(() =>
        JSON.stringify(messages.filter((m) => m.name.endsWith("_click")).at(-1)?.value));
      const value = JSON.parse(clicked);
      t.equal(value.component, "links", "component");
      t.equal(value.data, JSON.parse(point.data), "data");
      t.equal(await count(".geneviewer-hover"), 1, "highlighted");
      // A click on a link ends the selection of a gene
      t.equal(await count(".geneviewer-selected"), 0, "selection ended");
      // GC_trackMouse() still follows the mouse over the cluster SVG
      t.equal(await page.evaluate(() => document.querySelector(".coordinate-tooltip").style.visibility),
        "visible", "mouse tracked");
      // Leaving the link, e.g. for the save button, removes the highlight
      await page.mouse.move(2, 2);
      t.equal(await count(".geneviewer-hover"), 0, "highlight removed");
    },
  },
  {
    // With a pattern for some groups, every gene is filled with a pattern: one
    // of a single rect for the groups without stripes
    name: "a gene without stripes reports its colour when other groups have a pattern",
    fixture: "beh-editor-pattern-fill",
    async run(page, t) {
      const fills = await run(page, () => {
        const fills = [];
        el.addEventListener("geneviewer:select", (e) => fills.push(e.detail.style.fill));
        el.querySelectorAll(".gene").forEach((gene) => click(gene));
        return JSON.stringify(fills);
      });
      t.equal(fills[0], "#c7e02c", "plain fill");
      t.match(fills[1], /^url\(/, "pattern fill");
    },
  },
  {
    name: "cluster titles, footers, labels and coordinates are styled and selected one by one",
    fixture: "beh-editor-cluster-parts",
    async run(page, t) {
      const v = await run(page, () => {
        const [a, b] = el.querySelectorAll(".geneviewer-svg-content");
        const css = (n) => n && getComputedStyle(n);
        const part = (svg, component, p) => svg.querySelector(
          `[data-component="${component}"][data-part="${p}"], [data-component="${component}"] [data-part="${p}"]`);
        const subtitleA = part(a, "clusterTitle", "subtitle");
        const coordinates = [...a.querySelectorAll("text.coordinate")];
        const drawn = {
          subtitleA: [subtitleA.textContent, css(subtitleA).fill, css(subtitleA).fontStyle],
          subtitleB: part(b, "clusterTitle", "subtitle").textContent,
          footerTitleA: !!part(a, "clusterFooter", "title"),
          footerTitleB: part(b, "clusterFooter", "title").textContent,
          labelB: css(part(b, "clusterLabel", "title")).fontSize,
          labelA: css(part(a, "clusterLabel", "title")).fontSize,
          labelSubB: css(part(b, "clusterLabel", "subtitle")).fill,
          coordinateRed: coordinates.filter((n) => css(n).fill === "rgb(255, 0, 0)").map((n) => [n.__data__.rowID, n.__data__.end]),
          coordinateRow2: coordinates.filter((n) => n.__data__.rowID === 2).length,
        };
        const selections = [];
        el.addEventListener("geneviewer:select", (e) => selections.push(e.detail));
        click(subtitleA);
        click(part(b, "clusterLabel", "title"));
        click(coordinates.find((n) => n.__data__.rowID === 1 && n.__data__.end === "start"));
        const outlined = el.querySelectorAll(".geneviewer-selected").length;
        click(a.querySelector('[data-component="sequence"] line'));
        return JSON.stringify({ drawn, outlined, selections: selections.map((s) => s && {
          component: s.component, cluster: s.cluster, part: s.part ?? null,
          row: s.data?.rowID ?? null, end: s.data?.end ?? null, text: s.style?.text, fill: s.style?.fill }) });
      });
      const d = v.drawn;
      t.equal(d.subtitleA, ["Edited", "rgb(255, 0, 0)", "italic"], "edited subtitle");
      t.equal(d.subtitleB, "Sub", "other subtitle");
      t.equal(d.footerTitleA, false, "emptied footer title");
      t.equal(d.footerTitleB, "Foot", "other footer");
      t.equal([d.labelA, d.labelB], ["12px", "20px"], "label sizes");
      t.equal(d.labelSubB, "rgb(0, 0, 255)", "label subtitle fill");
      t.equal(d.coordinateRed, [[1, "start"]], "red coordinate");
      t.equal(d.coordinateRow2, 0, "hidden coordinates");
      t.equal(v.outlined, 1, "one outlined");
      const s = v.selections;
      t.equal(s.length, 4, "selections");
      t.equal(pick(s[0], ["component", "cluster", "part", "text", "fill"]),
        { component: "clusterTitle", cluster: "ophA", part: "subtitle", text: "Edited", fill: "#ff0000" }, "title");
      t.equal(pick(s[1], ["component", "cluster", "part", "text"]),
        { component: "clusterLabel", cluster: "dbophA", part: "title", text: "Label B" }, "label");
      t.equal(pick(s[2], ["component", "row", "end", "fill"]),
        { component: "coordinates", row: 1, end: "start", fill: "#ff0000" }, "coordinate");
      t.equal(s[3], null, "cleared");
    },
  },
  {
    name: "legend parts report editing events and normal mode keeps visibility toggles",
    fixture: "beh-editor-legend-parts",
    async run(page, t) {
      const v = await run(page, () => {
        const x = input();
        const messages = [], selections = [], doubles = [];
        window.Shiny = { setInputValue: (name, value) => messages.push({ name, value }) };
        HTMLWidgets.shinyMode = true;
        widget.renderValue(x);
        el.addEventListener("geneviewer:select", (e) => selections.push(e.detail));
        el.addEventListener("geneviewer:dblclick", (e) => doubles.push(e.detail));
        const label = () => el.querySelector(".legend-label");
        const marker = () => el.querySelector(".legend-marker");
        const hidden = () => el.querySelector(".gene").style.display;
        click(label());
        click(marker());
        marker().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        const editingHidden = hidden();
        widget.resize(700, 400);
        const preserved = el.querySelector(".geneviewer-selected")?.getAttribute("data-part");
        label().dispatchEvent(new MouseEvent("dblclick", { bubbles: true, detail: 2 }));
        // A chart without GC_events()
        delete x.spec.events;
        widget.renderValue(x);
        click(label());
        const normalHidden = hidden();
        widget.resize(650, 400);
        const hiddenAfterResize = hidden();
        click(marker());
        const shown = hidden();
        // Legacy click reporting alone also edits, without a selection outline
        x.spec.events = { click: true };
        widget.renderValue(x);
        click(label());
        const clickOnlyHidden = hidden();
        const lastClick = messages.filter((m) => m.name.endsWith("_click")).at(-1).value;
        x.spec.events = { click: true, legendClick: false };
        widget.renderValue(x);
        click(marker());
        return JSON.stringify({ selections, doubles, editingHidden, preserved,
          normalHidden, hiddenAfterResize, shown, clickOnlyHidden, lastClick,
          optedOutHidden: hidden(), label: label().textContent });
      });
      const [s1, s2] = v.selections;
      t.equal([s1.part, s1.data, s1.style.text, s1.style.fill], ["label", "A", "Edited", "#ff0000"], "label selection");
      t.equal([s2.part, s2.style.fill, s2.style.strokeWidth, s2.style.text], ["marker", "#0000ff", 3, undefined], "marker selection");
      t.equal(v.doubles.map((d) => d.part), ["marker", "label"], "double-clicks");
      t.equal(v.editingHidden, "", "editing hides nothing");
      t.equal(v.preserved, "marker", "selection kept on resize");
      t.equal(v.normalHidden, "none", "normal mode hides");
      t.equal(v.hiddenAfterResize, "none", "hidden after resize");
      t.equal(v.shown, "", "shown again");
      t.equal(v.clickOnlyHidden, "", "click reporting edits");
      t.equal([v.lastClick.part, v.lastClick.data], ["label", "A"], "last click");
      t.equal(v.optedOutHidden, "none", "legendClick = false toggles");
      t.equal(v.label, "Edited", "label text");
    },
  },
  {
    name: "dragging works without selection and Escape cancels before reporting",
    fixture: "beh-editor-drag-escape",
    async run(page, t) {
      const v = await run(page, () => {
        const node = el.querySelector("text.label");
        const drags = [];
        el.addEventListener("geneviewer:drag", (event) => drags.push(event.detail));
        el.style.transform = "scale(0.5)"; el.style.transformOrigin = "top left";
        const r = node.getBoundingClientRect(), x = r.left, y = r.top;
        pointer(node, "pointerdown", x, y);
        pointer(window, "pointermove", x + 10, y + 5);
        pointer(window, "pointerup", x + 10, y + 5);
        const committed = node.getAttribute("transform");
        pointer(node, "pointerdown", x, y);
        pointer(window, "pointermove", x + 20, y + 10);
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        pointer(window, "pointerup", x + 20, y + 10);
        const cancelled = node.getAttribute("transform");
        pointer(el.querySelector(".gene"), "pointerdown", x, y);
        pointer(window, "pointermove", x + 20, y + 10);
        pointer(window, "pointerup", x + 20, y + 10);
        const initialDrags = drags.slice();
        const x0 = input();
        pointer(node, "pointerdown", x, y);
        widget.renderValue(x0);
        const deferredStart = el.contains(node);
        pointer(window, "pointermove", x + 10, y + 5);
        widget.renderValue(x0);
        const deferred = el.contains(node);
        pointer(window, "pointerup", x + 10, y + 5);
        const flushed = !el.contains(node);
        return JSON.stringify({ drags: initialDrags, committed, cancelled, deferredStart, deferred, flushed,
          totalDrags: drags.length, dragging: el.classList.contains("geneviewer-dragging") });
      });
      t.equal(v.drags.length, 1, "one drag");
      t.equal([v.drags[0].component, v.drags[0].data.rowID], ["labels", 1], "dragged label");
      t.equal(v.drags[0].position, { moveX: 20, moveY: 10 }, "position on the scaled chart");
      t.equal(v.cancelled, v.committed, "Escape cancels");
      t.equal(v.dragging, false, "no longer dragging");
      t.ok(v.deferredStart && v.deferred && v.flushed, "redraws wait for the drop");
      t.equal(v.totalDrags, 2, "drags");
    },
  },
  {
    name: "selection reports final label styles and clears when data changes during a drag",
    fixture: "beh-editor-label-style",
    async run(page, t) {
      const v = await run(page, () => {
        const x = input();
        const selections = [], drags = [];
        el.addEventListener("geneviewer:select", (e) => selections.push(e.detail));
        el.addEventListener("geneviewer:drag", (e) => drags.push(e.detail));
        const label = () => el.querySelector('text.label[rowID="1"]');
        click(label());
        const rotation = selections.at(-1).style.rotate;
        const transform = label().getAttribute("transform");
        // GC_element_style(reset = TRUE) for the labels
        x.spec.elementStyle = (x.spec.elementStyle || []).filter((s) => s.component !== "labels");
        widget.renderValue(x);
        const reset = selections.at(-1).style;
        pointer(label(), "pointerdown", 100, 100);
        pointer(window, "pointermove", 120, 110);
        // Drop any deferred settings redraw before replacing the dataset
        widget.renderValue(x);
        x.spec.data.name = ["new alpha", "new beta", "new gamma"];
        widget.renderValue(x);
        pointer(window, "pointerup", 120, 110);
        return JSON.stringify({ rotation, transform, reset,
          selected: el.querySelectorAll(".geneviewer-selected").length,
          cleared: selections.at(-1) === null, drags: drags.length });
      });
      t.equal(v.rotation, -65, "rotation");
      t.match(v.transform, /rotate\(-65,/, "transform");
      t.equal([v.reset.moveX, v.reset.moveY], [0, 0], "reset position");
      t.ok(v.reset.fill !== "#ff0000", "reset fill");
      t.equal(v.selected, 0, "nothing outlined");
      t.ok(v.cleared, "selection cleared");
      t.equal(v.drags, 0, "no drag reported");
    },
  },
  scaleDrag("scaleBar"),
  scaleDrag("scale"),
  {
    name: "moves are undone, redone and reset from the toolbar, keys and arrow keys",
    fixture: "beh-editor-undo",
    async run(page, t) {
      const v = await run(page, () => {
        const label = (row = 1) => el.querySelector(`text.label[rowID="${row}"]`);
        const at = (row = 1) => label(row).__drawn__.moveX + "," + label(row).__drawn__.moveY;
        const drags = [], multi = [];
        el.addEventListener("geneviewer:drag", (event) => drags.push(event.detail));
        el.addEventListener("geneviewer:moves", (event) => multi.push(event.detail));
        const shown = (name) => {
          const b = el.querySelector(".geneviewer-" + name);
          return !b.closest(".geneviewer-history").hidden && !b.disabled;
        };
        const drag = (dx, dy, row = 1) => {
          const r = label(row).getBoundingClientRect(), x = r.left + 2, y = r.top + 2;
          pointer(label(row), "pointerdown", x, y);
          pointer(window, "pointermove", x + dx, y + dy);
          pointer(window, "pointerup", x + dx, y + dy);
        };
        const order = Array.from(el.querySelectorAll(".geneviewer-toolbar button, .geneviewer-toolbar-divider, [id^=saveMenu]"),
          (n) => n.className || n.id);
        const before = { undo: shown("undo"), redo: shown("redo"), reset: shown("reset"),
          group: el.querySelector(".geneviewer-history").hidden };
        drag(10, 5); drag(20, 0);
        const dragged = at();
        el.querySelector(".geneviewer-undo").click();
        const undone = at(), afterUndo = { undo: shown("undo"), redo: shown("redo") };
        key("z", { ctrlKey: true });
        const undoneTwice = at(), empty = { undo: shown("undo"), redo: shown("redo") };
        key("z", { ctrlKey: true, shiftKey: true });
        key("y", { ctrlKey: true });
        const redone = at();
        // Arrow keys move the selected label; a run of them is one step
        key("ArrowRight"); key("ArrowRight"); key("ArrowDown", { shiftKey: true });
        const nudged = at();
        key("z", { metaKey: true });
        const nudgeUndone = at();
        // Reset moves everything back to where it was first drawn, in one step
        drag(10, 0, 2);
        const second = at(2);
        el.querySelector(".geneviewer-reset").click();
        const reset1 = at(), reset2 = at(2), afterReset = shown("reset");
        el.querySelector(".geneviewer-undo").click();
        const resetUndone = at() + " " + at(2);
        // Kept on resize outside Shiny
        widget.resize(el.clientWidth, el.clientHeight);
        const resized = at(), keptSteps = shown("undo");
        // Moved elsewhere by new settings: the steps no longer apply
        const x = input();
        x.spec.elementStyle = [{ component: "labels", rowID: 1, moveX: 3, moveY: 3 }];
        widget.renderValue(x);
        const reset = { at: at(), undo: shown("undo"), redo: shown("redo") };
        return JSON.stringify({ order, before, dragged, undone, afterUndo, undoneTwice, empty, redone,
          nudged, nudgeUndone, second, reset1, reset2, afterReset, resetUndone, resized, keptSteps, reset,
          actions: drags.map((d) => d.action), last: drags.at(-1).position,
          multi: multi.map((m) => ({ action: m.action, n: m.moves.length, rows: m.moves.map((d) => d.data.rowID).sort() })) });
      });
      // Undo, redo and reset, then a divider before the save icon
      t.equal(v.order.slice(0, 4), ["geneviewer-toolbar-button geneviewer-undo",
        "geneviewer-toolbar-button geneviewer-redo", "geneviewer-toolbar-button geneviewer-reset",
        "geneviewer-toolbar-divider"], "toolbar order");
      t.match(v.order[4], /^saveMenu-/, "save menu last");
      t.equal(v.before, { undo: false, redo: false, reset: false, group: true }, "before");
      t.equal(v.dragged, "30,5", "dragged");
      t.equal(v.undone, "10,5", "undone");
      t.equal(v.afterUndo, { undo: true, redo: true }, "after undo");
      t.equal(v.undoneTwice, "0,0", "undone twice");
      t.equal(v.empty, { undo: false, redo: true }, "nothing to undo");
      t.equal(v.redone, "30,5", "redone");
      t.equal(v.nudged, "32,15", "nudged");
      t.equal(v.nudgeUndone, "30,5", "nudge undone");
      t.equal(v.second, "15,5", "second label");
      t.equal([v.reset1, v.reset2], ["0,0", "5,5"], "reset keeps the position from R");
      t.equal(v.afterReset, false, "reset disabled");
      t.equal(v.resetUndone, "30,5 15,5", "reset undone");
      t.equal(v.resized, "30,5", "kept on resize");
      t.ok(v.keptSteps, "steps kept on resize");
      t.equal(v.reset, { at: "3,3", undo: false, redo: false }, "new settings drop the steps");
      t.equal(v.actions, ["drag", "drag", "undo", "undo", "redo", "redo", "undo", "drag"], "actions");
      t.equal(v.last, { moveX: 15, moveY: 5 }, "last position");
      // A step of more elements is reported once
      t.equal(v.multi, [{ action: "reset", n: 2, rows: [1, 2] }, { action: "undo", n: 2, rows: [1, 2] }], "moves");
    },
  },
  {
    name: "drags on a scaled chart move by whole pixels",
    fixture: "beh-editor-scaled-drag",
    async run(page, t) {
      const v = await run(page, () => {
        const node = el.querySelector("text.label");
        const drags = [];
        el.addEventListener("geneviewer:drag", (event) => drags.push(event.detail.position));
        el.style.transform = "scale(0.3)"; el.style.transformOrigin = "top left";
        const r = node.getBoundingClientRect(), x = r.left + 1, y = r.top + 1;
        pointer(node, "pointerdown", x, y);
        pointer(window, "pointermove", x + 10, y + 7);
        pointer(window, "pointerup", x + 10, y + 7);
        return JSON.stringify({ drag: drags[0], drawn: node.__drawn__ });
      });
      // 10 / 0.3 and 7 / 0.3 pixels
      t.equal(v.drag, { moveX: 33, moveY: 23 }, "reported");
      t.equal(pick(v.drawn, ["moveX", "moveY"]), { moveX: 33, moveY: 23 }, "drawn");
    },
  },
  {
    name: "legend labels and markers drag on their own and keep their offsets",
    fixture: "beh-editor-legend-drag",
    async run(page, t) {
      const v = await run(page, () => {
        const part = (group, name) => Array.from(el.querySelectorAll(".legend-" + name)).find((n) => n.__data__ === group);
        const drags = [];
        el.addEventListener("geneviewer:drag", (event) => drags.push(event.detail));
        const drag = (node, dx, dy) => {
          const r = node.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
          pointer(node, "pointerdown", x, y);
          pointer(window, "pointermove", x + dx, y + dy);
          pointer(window, "pointerup", x + dx, y + dy);
          // The click a browser sends after the pointer is released
          click(node);
        };
        const label = part("A", "label"), marker = part("A", "marker");
        const labelBefore = label.getBoundingClientRect().toJSON();
        drag(marker, 30, 20);
        const markerMoved = marker.__drawn__, labelStays = label.getBoundingClientRect().toJSON();
        drag(label, -10, 15);
        const fromR = part("B", "marker").__drawn__;
        const shown = el.querySelectorAll(".legend.unselected").length === 0 &&
          Array.from(el.querySelectorAll(".gene")).every((n) => n.style.display !== "none");
        // A click that is not the end of a drag still toggles the group, also
        // on a moved part, which is dimmed with the rest of its item
        click(part("A", "label"));
        const dimmed = getComputedStyle(part("A", "marker")).opacity;
        return JSON.stringify({ dimmed, markerMoved,
          labelSame: labelBefore.x === labelStays.x && labelBefore.y === labelStays.y,
          labelMoved: label.__drawn__, fromR, shown, toggled: el.querySelectorAll(".legend.unselected").length,
          drags: drags.map((d) => ({ part: d.part, group: d.data, position: d.position })) });
      });
      t.equal(pick(v.markerMoved, ["moveX", "moveY"]), { moveX: 30, moveY: 20 }, "marker moved");
      t.ok(v.labelSame, "label stays");
      t.equal(pick(v.labelMoved, ["moveX", "moveY"]), { moveX: -10, moveY: 15 }, "label moved");
      t.equal(pick(v.fromR, ["moveX", "moveY"]), { moveX: 4, moveY: -3 }, "offset from R");
      t.ok(v.shown, "drags toggle nothing");
      t.equal(v.toggled, 1, "a click toggles");
      t.equal(v.dimmed, "0.5", "moved part dimmed");
      t.equal(v.drags, [
        { part: "marker", group: "A", position: { moveX: 30, moveY: 20 } },
        { part: "label", group: "A", position: { moveX: -10, moveY: 15 } }], "drags");
    },
  },
  {
    name: "several elements are selected, moved together and undone as one step",
    fixture: "beh-editor-multi-select",
    async run(page, t) {
      const v = await run(page, () => {
        const label = (row) => el.querySelector(`text.label[rowID="${row}"]`);
        const at = (row) => label(row).__drawn__.moveX + "," + label(row).__drawn__.moveY;
        const selections = [], selects = [], moves = [];
        el.addEventListener("geneviewer:selection", (e) => selections.push(
          e.detail.map((d) => d.component + ":" + (d.data?.rowID ?? d.data) + ":" + (d.part ?? ""))));
        el.addEventListener("geneviewer:select", (e) => selects.push(e.detail && (e.detail.data?.rowID ?? e.detail.data)));
        el.addEventListener("geneviewer:moves", (e) => moves.push({ action: e.detail.action, n: e.detail.moves.length }));
        el.dispatchEvent(new Event("focusin"));
        click(label(1));
        click(label(2), 1, { shiftKey: true });
        const two = selections.at(-1), primary = selects.at(-1);
        const outlined = el.querySelectorAll(".geneviewer-selected").length;
        // Dragging one of them moves both
        const r = label(1).getBoundingClientRect(), x = r.left + 2, y = r.top + 2;
        pointer(label(1), "pointerdown", x, y);
        pointer(window, "pointermove", x + 10, y + 5);
        pointer(window, "pointerup", x + 10, y + 5);
        click(label(1));
        const dragged = [at(1), at(2)], stillTwo = selections.at(-1).length;
        key("z", { ctrlKey: true });
        const undone = [at(1), at(2)];
        key("ArrowRight"); key("ArrowRight");
        const nudged = [at(1), at(2)];
        key("z", { ctrlKey: true });
        const nudgeUndone = [at(1), at(2)];
        // Shift-click takes one out again
        click(label(2), 1, { shiftKey: true });
        const one = selections.at(-1);
        // A box around the legend selects its labels and markers, not the genes
        const legend = el.querySelector('[data-component="legend"]').getBoundingClientRect();
        const x0 = legend.left - 6, y0 = legend.top - 6, x1 = legend.right + 6, y1 = legend.bottom + 6;
        const start = document.elementFromPoint(x0, y0);
        pointer(start, "pointerdown", x0, y0);
        pointer(window, "pointermove", (x0 + x1) / 2, (y0 + y1) / 2);
        const box = !!el.querySelector(".geneviewer-marquee");
        pointer(window, "pointermove", x1, y1);
        pointer(window, "pointerup", x1, y1);
        click(start);
        const boxed = selections.at(-1);
        const boxGone = !el.querySelector(".geneviewer-marquee");
        el.querySelector(".geneviewer-selected").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        return JSON.stringify({ two, primary, outlined, dragged, stillTwo, undone, nudged, nudgeUndone, one,
          box, boxed, boxGone, cleared: selections.at(-1), moves });
      });
      t.equal(v.two, ["labels:1:", "labels:2:"], "two selected");
      t.equal(v.primary, 2, "primary");
      t.equal(v.outlined, 2, "outlined");
      t.equal(v.dragged, ["10,5", "10,5"], "moved together");
      t.equal(v.stillTwo, 2, "still two");
      t.equal(v.undone, ["0,0", "0,0"], "undone together");
      t.equal(v.nudged, ["2,0", "2,0"], "nudged together");
      t.equal(v.nudgeUndone, ["0,0", "0,0"], "nudge undone");
      t.equal(v.one, ["labels:1:"], "shift-click removes");
      t.ok(v.box, "selection box drawn");
      t.equal([...v.boxed].sort(), ["legend:A:label", "legend:A:marker", "legend:B:label", "legend:B:marker"], "boxed");
      t.ok(v.boxGone, "box removed");
      t.equal(v.cleared, [], "Escape clears");
      t.equal(v.moves.slice(0, 2), [{ action: "drag", n: 2 }, { action: "undo", n: 2 }], "moves");
    },
  },
  {
    name: "Escape cancels a selection box and a held-back redraw keeps a drop",
    fixture: "beh-editor-box-escape",
    async run(page, t) {
      const v = await run(page, () => {
        const label = (row) => el.querySelector(`text.label[rowID="${row}"]`);
        const selects = [];
        el.addEventListener("geneviewer:select", (e) => selects.push(e.detail && e.detail.data.rowID));
        click(label(1));
        label(1).focus();
        // Escape on the focused element while a box adds to the selection:
        // only the box ends, and the selection before it stays
        const box = el.getBoundingClientRect();
        const x0 = box.left + 2, y0 = box.bottom - 2;
        pointer(document.elementFromPoint(x0, y0), "pointerdown", x0, y0, { shiftKey: true });
        pointer(window, "pointermove", x0 + 40, y0 - 40);
        document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        pointer(window, "pointerup", x0 + 40, y0 - 40);
        const afterEscape = { selects: selects.slice(), outlined: el.querySelectorAll(".geneviewer-selected").length };
        // A settings redraw that arrives during a drag waits for the drop and
        // does not move the element back
        const r = label(2).getBoundingClientRect(), x = r.left + 2, y = r.top + 2;
        pointer(label(2), "pointerdown", x, y);
        pointer(window, "pointermove", x + 12, y + 7);
        widget.renderValue(input());
        pointer(window, "pointerup", x + 12, y + 7);
        return JSON.stringify({ afterEscape, dropped: label(2).__drawn__,
          transform: label(2).getAttribute("transform"),
          undo: !el.querySelector(".geneviewer-undo").disabled });
      });
      t.equal(v.afterEscape, { selects: [1], outlined: 1 }, "selection kept");
      t.equal(pick(v.dropped, ["moveX", "moveY"]), { moveX: 12, moveY: 7 }, "dropped");
      t.match(v.transform, /^translate\(12, 7\)/, "transform");
      t.ok(v.undo, "undo enabled");
    },
  },
  {
    name: "GC_toolbar() over a theme sets the buttons, icons, corner and colours",
    fixture: "beh-toolbar-custom",
    async run(page, t) {
      const v = JSON.parse(await page.evaluate(inspectToolbar));
      t.match(v.classes, /geneviewer-toolbar-bottomleft/, "corner");
      t.match(v.classes, /geneviewer-toolbar-always/, "always shown");
      t.equal(v.opacity, "1", "opacity");
      t.equal(v.buttons, ["geneviewer-undo"], "buttons");
      t.equal(v.icons, ["fa-regular fa-circle-left", "fa-solid fa-camera"], "icons");
      t.ok(v.divider, "divider");
      t.equal([v.saveColor, v.saveSize, v.tip], ["rgb(1, 2, 3)", "16px", "rgb(4, 5, 6)"], "colours over the theme");
      t.equal([v.left, v.bottom], [10, 10], "position");
    },
  },
  {
    name: "the toolbar takes its colours from the theme",
    fixture: "beh-toolbar-themed",
    async run(page, t) {
      const v = JSON.parse(await page.evaluate(inspectToolbar));
      t.equal(v.buttons, ["geneviewer-undo", "geneviewer-redo", "geneviewer-reset"], "buttons");
      t.equal(v.icons[3], "svg", "default save icon");
      t.equal(v.saveColor, "rgb(153, 153, 153)", "colour");
      t.equal(v.opacity, "0", "shown on hover");
    },
  },
  {
    name: "GC_toolbar(show = 'never') draws no toolbar",
    fixture: "beh-toolbar-never",
    async run(page, t) {
      t.equal(JSON.parse(await page.evaluate(inspectToolbar)).bar, false, "no toolbar");
    },
  },
  {
    name: "without moves the toolbar has no undo, redo or reset",
    fixture: "beh-toolbar-save-only",
    async run(page, t) {
      const v = JSON.parse(await page.evaluate(inspectToolbar));
      t.equal(v.buttons, [], "buttons");
      t.equal(v.divider, false, "divider");
    },
  },
];
