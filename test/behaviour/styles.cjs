// Group styles (groupStyle, style_by) of genes, labels, the legend,
// transcripts and coordinates; styles by gene track; tooltips.

// The coordinates drawn: text, text fill and tick stroke
const coordinates = () => [...document.querySelectorAll(".tick")].filter((n) => n.querySelector(".coordinate")).map((n) =>
  [n.querySelector("text").textContent, getComputedStyle(n.querySelector("text")).fill,
    getComputedStyle(n.querySelector("line")).stroke]);
const values = async (page) => (await page.evaluate(coordinates)).map((c) => c[0]);

const red = "rgb(255, 0, 0)", blue = "rgb(0, 0, 255)", green = "rgb(0, 128, 0)";

module.exports = [
  {
    name: "GC_genes() draws the groups of groupStyle, matched by style_by",
    fixture: "beh-genes-style-by",
    async run(page, t) {
      const fills = await page.evaluate(() => [...document.querySelectorAll(".gene")].map((e) => getComputedStyle(e).fill));
      // Genes in start order: a1 (x), b1 (y), a2 (y, own itemStyle), c1 (x)
      t.equal([fills[1], fills[2]], [red, blue], "styled");
      t.ok(![red, blue].includes(fills[0]) && ![red, blue].includes(fills[3]), "others");
    },
  },
  {
    name: "GC_labels() styles labels by their text with style_by",
    fixture: "beh-labels-style-by",
    async run(page, t) {
      const labels = await page.evaluate(() => [...document.querySelectorAll("text.label")].map((e) =>
        [e.textContent, getComputedStyle(e).fill, getComputedStyle(e).fontWeight]));
      t.equal(labels.find((l) => l[0] === "b1").slice(1), [red, "700"], "styled");
      t.ok(labels.filter((l) => l[0] !== "b1").every((l) => l[1] !== red), "others");
    },
  },
  {
    name: "GC_legend() styles the text and marker of a group",
    fixture: "beh-legend-group-style",
    async run(page, t) {
      const legend = await page.evaluate(() => [...document.querySelectorAll(".legend")].map((g) => {
        const text = g.querySelector("text"), rect = g.querySelector("rect");
        return [text.textContent, getComputedStyle(text).fontStyle, getComputedStyle(text).fill, getComputedStyle(rect).stroke];
      }));
      const entry = (group) => legend.find((l) => l[0] === group);
      t.equal(entry("A")[1], "italic", "A");
      t.equal(entry("B").slice(2), [red, green], "B");
      // Other groups keep the defaults
      t.equal(entry("C")[1], "normal", "C font style");
      t.ok(entry("C")[2] !== red, "C fill");
    },
  },
  {
    name: "a larger legend text from groupStyle does not overlap the next entry",
    fixture: "beh-legend-large-text",
    async run(page, t) {
      const boxes = await page.evaluate(() => [...document.querySelectorAll(".legend")].map((g) => {
        const r = g.getBoundingClientRect();
        return [r.left, r.right, Math.round(r.top)];
      }));
      // Entries on the same row, in order, each starting after the previous ends
      const rows = {};
      boxes.forEach((b) => (rows[b[2]] = rows[b[2]] || []).push(b));
      Object.values(rows).forEach((row) => {
        row.sort((a, b) => a[0] - b[0]);
        row.slice(1).forEach((b, k) => t.ok(b[0] >= row[k][1] - 0.5, `entry ${k + 2} after entry ${k + 1}`));
      });
    },
  },
  {
    name: "GC_transcript() styles exons, introns and UTRs by group",
    fixture: "beh-transcript-styles",
    async run(page, t) {
      const parts = await page.evaluate(() => [...document.querySelectorAll(".exon, .intron, .utr")].map((e) =>
        [e.getAttribute("class"), e.getAttribute("id"), getComputedStyle(e).fill, getComputedStyle(e).stroke]));
      const part = (cls, id) => parts.find((p) => p[0] === cls && p[1] === id);
      // tx1: two exons (the second has its own itemStyle), one intron and two UTRs
      t.equal(part("exon", "tx1-exon-0")[2], red, "tx1 exon");
      t.equal(part("exon", "tx1-exon-1")[2], "rgb(0, 0, 0)", "tx1 exon with itemStyle");
      t.equal(part("intron", "tx1-intron-0")[3], blue, "tx1 intron");
      t.ok(part("utr", "tx1-utr-0")[2] !== green, "tx1 UTR");
      // tx2: its exon is not styled, its UTRs are
      t.ok(![red, "rgb(0, 0, 0)"].includes(part("exon", "tx2-exon-0")[2]), "tx2 exon");
      t.equal([part("utr", "tx2-utr-0")[2], part("utr", "tx2-utr-1")[2]], [green, green], "tx2 UTRs");
    },
  },
  {
    name: "GC_transcript() group styles can change the marker of a group",
    fixture: "beh-transcript-marker",
    async run(page, t) {
      const heights = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll(".exon")].map((e) =>
        [e.getAttribute("id"), e.getBBox().height])));
      t.ok(heights["tx2-exon-0"] > heights["tx1-exon-0"], "taller");
    },
  },
  {
    name: "GC_coordinates() leaves out and styles the coordinates of a group",
    fixture: "beh-coordinates-groups",
    async run(page, t) {
      const ticks = await page.evaluate(coordinates);
      const shown = ticks.map((c) => c[0]);
      // B (b1, 50 - 80) is left out, the others are there
      t.ok(!["50", "80"].some((v) => shown.includes(v)), "B left out");
      t.ok(["10", "40", "90", "120", "130", "160"].every((v) => shown.includes(v)), "others shown");
      const tick = (value) => ticks.find((c) => c[0] === value);
      // C (c1, 130 - 160) has red text and a blue tick, A keeps the defaults
      t.equal([tick("130")[1], tick("160")[2]], [red, blue], "C styled");
      t.ok(tick("10")[1] !== red && tick("10")[2] !== blue, "A default");
    },
  },
  {
    name: "a coordinate a hidden group shares with a shown one is kept",
    fixture: "beh-coordinates-shared",
    async run(page, t) {
      // b1 ends where a2 starts
      const shown = await values(page);
      t.ok(shown.includes("80") && !shown.includes("50"), `coordinates ${shown}`);
    },
  },
  {
    name: "GC_coordinates() matches groupStyle against style_by",
    fixture: "beh-coordinates-style-by",
    async run(page, t) {
      // Family y: b1 (50 - 80) and a2 (90 - 120)
      const shown = await values(page);
      t.ok(!["50", "80", "90", "120"].some((v) => shown.includes(v)), "family y left out");
      t.ok(["10", "40", "130", "160"].every((v) => shown.includes(v)), "others shown");
    },
  },
  {
    name: "charts without group styles draw every coordinate",
    fixture: "beh-coordinates-plain",
    async run(page, t) {
      t.equal((await values(page)).sort(), ["10", "120", "130", "160", "40", "50", "80", "90"], "coordinates");
    },
  },
  {
    name: "genes and labels can be styled by their track",
    fixture: "beh-tracks-style", viewport: { width: 800, height: 300 },
    async run(page, t) {
      const v = await page.evaluate(() => {
        const genes = Array.from(document.querySelectorAll(".gene"));
        const labels = Array.from(document.querySelectorAll("text.label"));
        const height = (name) => genes.find((g) => g.__data__.name === name).getBBox().height;
        const font = (name) => labels.find((n) => n.textContent === name).style.fontSize;
        return { B: height("B"), B2: height("B2"), B3: height("B3"), fontB: font("B"), fontB2: font("B2") };
      });
      // The genes of the second track are drawn smaller, the others as before
      t.ok(v.B2 < v.B, "track 2 smaller");
      t.equal(v.B3, v.B, "track 3 as before");
      t.equal(v.fontB2, "8px", "track 2 font");
      t.ok(v.fontB !== "8px", "track 1 font");
    },
  },
  {
    name: "tooltips show the values of the data as text, the formatter as HTML",
    fixture: "beh-tooltip-escape",
    async run(page, t) {
      const tips = await page.evaluate(() => {
        const tips = [];
        d3.selectAll("[data-component=genes] *").filter((d) => d && d.product).each(function () {
          this.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
          const tip = Array.from(document.querySelectorAll(".cluster-tooltip"))
            .find((n) => n.innerText.includes("Product"));
          tips.push({ text: tip.innerText, bold: tip.querySelectorAll("b").length,
                      img: tip.querySelectorAll("img").length, italic: tip.querySelectorAll("i").length });
          this.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
        });
        return { tips, hacked: window.hacked === true };
      });
      t.equal(tips.tips.length, 2, "two tooltips");
      t.match(tips.tips[0].text, /<img src=x onerror=/, "markup in the data shows as text");
      t.equal(tips.tips[0].img, 0, "no image element");
      t.ok(!tips.hacked, "no script ran");
      t.match(tips.tips[1].text, /A & B <i>/, "& and < show as written");
      t.equal(tips.tips[1].italic, 0, "no italic element");
      t.equal(tips.tips[0].bold, 1, "the formatter stays HTML");
    },
  },
  {
    name: "BlastP tooltips leave out lines without values",
    fixture: "beh-blast-tooltips",
    async run(page, t) {
      const tips = await page.evaluate(() => {
        const tips = {};
        d3.selectAll("[data-component=genes] *").filter((d) => d && d.protein_id).each(function (d) {
          this.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
          tips[d.cluster + d.protein_id] = Array.from(document.querySelectorAll(".cluster-tooltip"))
            .map((n) => n.innerText).find((n) => n.includes(d.protein_id));
          this.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
        });
        return tips;
      });
      t.match(tips.AA1, /Query gene/, "query gene");
      t.match(tips.AA2, /Query gene/, "query gene without hit");
      t.ok(!/No Hit|Identity/.test(tips.AA2), "query gene: no hit lines");
      t.match(tips.BB1, /Best hit: A1/, "best hit");
      t.match(tips.BB1, /Identity: 55.4%/, "identity");
      t.match(tips.BB1, /Similarity: 68.2%/, "similarity");
      t.match(tips.BB2, /Best hit: No Hit/, "no hit");
      t.ok(!/Identity|Similarity/.test(tips.BB2), "no hit: no measures");
      t.match(tips.BB2, /Location: 200 - 350/, "location");
    },
  },
];
