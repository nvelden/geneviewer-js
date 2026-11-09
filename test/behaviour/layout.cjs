// Layout: titles, the legend, cluster labels and footers, links, and the
// data-component marks and clicks of every part.

// Left and right edges of the legend items in their SVG
const legendMargins = () => {
  const svg = document.querySelector("[id^=geneviewer-legend-container] svg");
  const items = [...svg.querySelectorAll(".legend")];
  const box = svg.getBoundingClientRect();
  const left = Math.min(...items.map((d) => d.getBoundingClientRect().left));
  const right = Math.max(...items.map((d) => d.getBoundingClientRect().right));
  return [left - box.left, box.right - right];
};

// Left and right edges of a text
const edges = (text) => {
  const node = [...document.querySelectorAll("text")].find((d) => d.textContent === text);
  const rect = node.getBoundingClientRect();
  return { left: rect.left, right: rect.right };
};

// Left and right edges of each line of the wrapped label, from the left of its SVG
const labelLines = () => {
  const lines = [...document.querySelectorAll("tspan.wrap-line")]
    .filter((d) => d.closest("text").textContent.startsWith("A long"))
    .map((d) => d.getBoundingClientRect());
  const svg = document.querySelector("tspan.wrap-line").ownerSVGElement.getBoundingClientRect();
  return { left: lines.map((d) => d.left - svg.left), right: lines.map((d) => d.right - svg.left) };
};

// The middle of each line of the cluster label texts (from y and dy), with
// their boxes and fonts
const labelMiddles = () => [...document.querySelectorAll("text[dominant-baseline=central]")].map((n) => ({
  text: n.textContent,
  middles: [...n.querySelectorAll("tspan.wrap-line")].map((l) =>
    parseFloat(l.getAttribute("y")) + parseFloat(l.getAttribute("dy")) * parseFloat(getComputedStyle(n).fontSize)),
  top: n.getBoundingClientRect().top, bottom: n.getBoundingClientRect().bottom,
  fontStyle: getComputedStyle(n).fontStyle, fontWeight: getComputedStyle(n).fontWeight,
}));

const linkTexts = () => [...document.querySelectorAll(".link-text")].map((n) => ({ text: n.textContent, fill: n.style.fill, id: n.id }));

// The middle of the label "pQEB1" without a subtitle, drawn in place of the
// chart's label: on the middle of the cluster
const plainMiddle = async (page) => {
  await page.evaluate(() => {
    const x = input();
    x.spec.clusterLabel = { title: "pQEB1" };
    widget.renderValue(x);
  });
  return (await page.evaluate(labelMiddles))[0].middles[0];
};

module.exports = [
  {
    name: "a title of the default height is not cut off",
    fixture: "beh-title-descenders",
    async run(page, t) {
      const overflow = await page.evaluate(() => {
        const svg = document.querySelector("[id^=geneviewer-title-container] svg");
        return svg.querySelector("text").getBoundingClientRect().bottom - svg.getBoundingClientRect().bottom;
      });
      t.ok(overflow <= 0, `overflow ${overflow}`);
    },
  },
  {
    name: "the legend of a chart with a fixed width is not scaled down",
    fixture: "beh-legend-fixed-width", viewport: { width: 1600, height: 600 },
    async run(page, t) {
      const scale = await page.evaluate(() => {
        const svg = document.querySelector("[id^=geneviewer-legend-container] svg");
        return svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      });
      t.equal(scale, 1, "scale");
    },
  },
  {
    name: "GC_legend(align = 'left') puts the legend rows left",
    fixture: "beh-legend-align-left",
    async run(page, t) {
      const [left, right] = await page.evaluate(legendMargins);
      t.ok(left < right, `left ${left}, right ${right}`);
    },
  },
  {
    name: "GC_legend(align = 'center') centres the legend rows",
    fixture: "beh-legend-align-center",
    async run(page, t) {
      const [left, right] = await page.evaluate(legendMargins);
      t.near(left, right, 1, "centred");
    },
  },
  {
    name: "GC_legend(align = 'right') puts the legend rows right",
    fixture: "beh-legend-align-right",
    async run(page, t) {
      const [left, right] = await page.evaluate(legendMargins);
      t.ok(right < left, `left ${left}, right ${right}`);
    },
  },
  {
    name: "a left-aligned cluster footer lines up with the cluster title beside a cluster label",
    fixture: "beh-footer-align-left",
    async run(page, t) {
      t.near(await page.evaluate(edges, "Footer").then((e) => e.left),
        await page.evaluate(edges, "Title").then((e) => e.left), 1, "left edges");
    },
  },
  {
    name: "a right-aligned cluster footer lines up with the cluster title beside a cluster label",
    fixture: "beh-footer-align-right",
    async run(page, t) {
      t.near(await page.evaluate(edges, "Footer").then((e) => e.right),
        await page.evaluate(edges, "Title").then((e) => e.right), 1, "right edges");
    },
  },
  // The boxes of the letters stick out a pixel or so past where the text
  // starts, depending on the font
  {
    name: "GC_clusterLabel(align = 'left') starts each line of a label at the left edge",
    fixture: "beh-cluster-label-left",
    async run(page, t) {
      const v = await page.evaluate(labelLines);
      t.ok(v.left.length > 1, "wrapped");
      t.ok(v.left.every((x) => Math.abs(x) < 2), `left edges ${v.left}`);
    },
  },
  {
    name: "GC_clusterLabel(align = 'center') centres each line of a label in its margin",
    fixture: "beh-cluster-label-center",
    async run(page, t) {
      const v = await page.evaluate(labelLines);
      t.ok(v.left.every((x, i) => Math.abs((x + v.right[i]) / 2 - 60) < 2), `lines ${v.left} - ${v.right}`);
    },
  },
  {
    name: "GC_clusterLabel(align = 'right') ends each line of a label at the margin",
    fixture: "beh-cluster-label-right",
    async run(page, t) {
      const v = await page.evaluate(labelLines);
      t.ok(v.right.every((x) => Math.abs(x - 120) < 2), `right edges ${v.right}`);
    },
  },
  {
    name: "a wrapped cluster label keeps <i> styles over its lines",
    fixture: "beh-cluster-label-italic",
    async run(page, t) {
      const v = await page.evaluate(() => {
        const text = [...document.querySelectorAll("text")].find((d) => d.textContent.startsWith("pQEB1"));
        return {
          lines: [...text.querySelectorAll("tspan.wrap-line")].map((d) => d.textContent),
          styles: Object.fromEntries([...text.querySelectorAll("tspan.wrap-line tspan")]
            .map((d) => [d.textContent.trim(), getComputedStyle(d).fontStyle])),
        };
      });
      t.ok(v.lines.length > 1, "wrapped");
      t.ok(!v.lines.some((l) => /<|>/.test(l)), "no tags");
      t.equal(v.lines.join(" "), "pQEB1_inv3 Enterobacter cloacae ECL-21", "text");
      t.equal(v.styles["pQEB1_inv3"], "normal", "plain part");
      t.equal(["Enterobacter", "cloacae", "ECL-21"].map((w) => v.styles[w]), ["italic", "italic", "italic"], "italic part");
    },
  },
  {
    name: "a cluster label subtitle sits below the title, centred together on the cluster",
    fixture: "beh-cluster-label-subtitle",
    async run(page, t) {
      const [title, subtitle] = await page.evaluate(labelMiddles);
      t.ok(subtitle, "subtitle drawn");
      t.equal([subtitle.text, subtitle.fontStyle, subtitle.fontWeight], ["E. cloacae", "italic", "400"], "subtitle");
      // Default spacing: 1.2 times the mean font size of 12px and 11px
      t.near(subtitle.middles[0] - title.middles[0], 1.2 * (12 + 11) / 2, 1e-6, "spacing");
      t.near((title.middles[0] + subtitle.middles[0]) / 2, await plainMiddle(page), 1e-6, "centred");
      t.ok(subtitle.top > title.top, "below");
    },
  },
  {
    name: "the subtitle of a wrapped cluster label is spacing below its last line",
    fixture: "beh-cluster-label-wrapped-subtitle",
    async run(page, t) {
      const [title, subtitle] = await page.evaluate(labelMiddles);
      t.ok(title.middles.length > 1, "wrapped");
      t.near(subtitle.middles[0] - Math.max(...title.middles), 20, 1e-6, "spacing");
      t.near((Math.min(...title.middles) + subtitle.middles[0]) / 2, await plainMiddle(page), 1e-6, "centred");
      t.ok(subtitle.top >= title.bottom - 1, "below");
    },
  },
  {
    name: "links fade from nearly white at vmin to the link colour at vmax",
    fixture: "beh-links-fade",
    async run(page, t) {
      const v = await page.evaluate(() => ({
        fills: [...document.querySelectorAll("path.GeneLink")].map((p) => p.style.fill),
        labels: [...document.querySelectorAll(".color-bar text")].map((n) => n.textContent),
      }));
      // 10% black on white is rgb(230, 230, 230); 40 is clamped to vmin
      t.equal(v.fills, ["rgb(230, 230, 230)", "rgb(230, 230, 230)", "rgb(115, 115, 115)", "rgb(0, 0, 0)"], "fills");
      t.ok(["60%", "100%"].every((l) => v.labels.includes(l)), "color bar labels");
    },
  },
  {
    name: "each GC_links() call labels its links with its own options",
    fixture: "beh-links-own-labels",
    async run(page, t) {
      const v = await page.evaluate(linkTexts);
      t.equal(v.map((d) => d.text), ["90%", "70%"], "texts");
      t.equal(v.map((d) => d.fill), ["red", "blue"], "fills");
      t.equal(new Set(v.map((d) => d.id)).size, v.length, "ids unique");
    },
  },
  {
    name: "a gene in two link sets gets one label",
    fixture: "beh-links-shared-labels",
    async run(page, t) {
      t.equal((await page.evaluate(linkTexts)).map((d) => d.text), ["90%", "70%"], "texts");
    },
  },
  {
    name: "every part of the chart is marked with data-component",
    fixture: "beh-every-part",
    async run(page, t) {
      const v = await page.evaluate(() => ({
        components: [...new Set([...document.querySelectorAll("[data-component]")]
          .map((e) => e.getAttribute("data-component")))].sort(),
        clusters: [...document.querySelectorAll("[data-cluster]")].map((e) => e.getAttribute("data-cluster")),
        highlight: document.querySelector(".geneviewer").classList.contains("geneviewer-highlight"),
      }));
      t.equal(v.components, ["annotations", "clusterFooter", "clusterLabel", "clusterTitle", "coordinates",
        "genes", "labels", "legend", "links", "scale", "scaleBar", "sequence", "title"], "components");
      t.equal(v.clusters, ["A", "B"], "clusters");
      // Without GC_events() nothing is highlighted
      t.equal(v.highlight, false, "no highlight");
    },
  },
  {
    name: "GC_events() reports the clicked part, cluster and data to Shiny",
    fixture: "beh-every-part-events",
    async run(page, t) {
      const v = await page.evaluate(() => {
        const clicks = [];
        window.Shiny = { setInputValue: (name, value, opts) => clicks.push({ name, value, opts }) };
        HTMLWidgets.shinyMode = true;
        widget.renderValue(input());
        const click = (selector) => document.querySelector(selector).dispatchEvent(new MouseEvent("click", { bubbles: true }));
        click('[data-cluster="B"] .gene');
        click('[data-cluster="A"] text.label');
        click(".legend");
        click('[data-cluster="A"] [data-component="scale"] text');
        click("path.GeneLink");
        return JSON.stringify({
          id: el.id,
          highlight: el.classList.contains("geneviewer-highlight"),
          clicks: clicks.map((c) => ({ name: c.name, priority: c.opts.priority,
            component: c.value.component, cluster: c.value.cluster ?? null, data: c.value.data })),
        });
      }).then(JSON.parse);
      const c = v.clicks;
      t.equal(c.map((d) => d.name), Array(5).fill(`${v.id}_click`), "input names");
      t.ok(c.every((d) => d.priority === "event"), "priority");
      t.equal(c.map((d) => d.component), ["genes", "labels", "legend", "scale", "links"], "components");
      t.equal(c.map((d) => d.cluster), ["B", "A", null, "A", null], "clusters");
      t.equal([c[0].data.name, c[1].data.name, c[2].data], ["a", "a", "a"], "data");
      // The scale reports no data (d3 binds tick values to its ticks)
      t.equal(c[3].data ?? null, null, "scale data");
      t.equal(c[4].data.cluster1, "A", "link data");
      t.ok(v.highlight, "highlight");
    },
  },
];
