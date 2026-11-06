// Gene labels: container.prototype.labels and spreadLabels.
import { container } from "../container.js";
import { applyMove, applyStyleToElement, changesSize, extractAdditionalOptions, setStyleFromOptions, withGroupStyles } from "../style.js";
import { createLabelAdjuster } from "../text.js";
import { isPlainObject, mergeOptions, sanitizeId } from "../util.js";

// Adds the link label of the same gene (e.g. the identity % from links()) to a
// gene label, as a second line below the name, and removes the link label.
// Gene and link labels were drawn at the same place above the gene.
function addLinkLabelLine(label, linkLabel) {
  const text = d3.select(label);
  const name = label.textContent;
  label.textContent = "";
  text.append("tspan").attr("class", "label-name").text(name);
  const measure = text.append("tspan")
    .attr("class", "label-measure")
    .text(linkLabel.textContent);
  // Keep the font and other styles of the link label; the gene label sets the
  // alignment (the link label may have been rotated by its own overlap check)
  for (const property of linkLabel.style) {
    if (property === "text-anchor") continue;
    measure.style(property, linkLabel.style.getPropertyValue(property));
  }
  linkLabel.remove();

  if (name) {
    // Second line below the name; move the label up a line so the link label
    // stays where it was, just above the gene
    measure.attr("x", text.attr("x")).attr("dy", "1.1em");
    const lineHeight = 1.1 * parseFloat(getComputedStyle(measure.node()).fontSize);
    text.attr("y", parseFloat(text.attr("y")) - lineHeight);
  }
}

// A rotated two-line gene label becomes one line ("name 64%"), so rotated
// labels next to each other stay one line thick
function linkLabelLineToInline(label) {
  const text = d3.select(label);
  const measure = text.select(".label-measure");
  if (measure.empty()) return;
  measure.attr("x", null).attr("dy", null)
    .attr("dx", text.select(".label-name").text() ? "0.3em" : null);
}

// The centres of labels of the given widths, as close as they can be to the
// centres they want without overlapping and inside left to right. From left
// to right, a label that would overlap the one before joins its block, and
// each block is centred on where its labels want to be.
function spreadLabelCentres(wanted, widths, gap, left, right) {
  const order = wanted.map((_, i) => i).sort((a, b) => wanted[a] - wanted[b]);
  const blocks = [];
  const place = block => {
    block.start = Math.max(left, Math.min(block.total / block.members.length, right - block.width));
  };
  for (const i of order) {
    // total: the sum of where the labels want the block to start
    let block = { members: [{ i, offset: 0 }], width: widths[i], total: wanted[i] - widths[i] / 2 };
    place(block);
    let previous = blocks[blocks.length - 1];
    while (previous && previous.start + previous.width + gap > block.start) {
      const shift = previous.width + gap;
      block.members.forEach(member => { member.offset += shift; });
      previous.members.push(...block.members);
      previous.total += block.total - block.members.length * shift;
      previous.width += gap + block.width;
      block = blocks.pop();
      place(block);
      previous = blocks[blocks.length - 1];
    }
    blocks.push(block);
  }
  const centres = new Array(wanted.length);
  blocks.forEach(block => block.members.forEach(({ i, offset }) => {
    centres[i] = block.start + offset + widths[i] / 2;
  }));
  return centres;
}

// Draws the leader line of a spread label (adjustLabels = "spread") from the
// side of its gene that faces the label: from the bottom of the gene to just
// above a label below it, or from the top of the gene to just below a label
// above it, wherever the label was moved or dragged to
function updateLeaderLine(label) {
  const leader = label.__leader__;
  if (!leader || !leader.line.isConnected) return;
  const hidden = !label.isConnected || getComputedStyle(label).display === "none";
  leader.line.style.display = hidden ? "none" : null;
  if (hidden) return;
  // Dragged labels are drawn in another SVG, above the clusters
  const from = label.getScreenCTM?.();
  const to = leader.line.parentNode.getScreenCTM?.();
  const own = label.transform?.baseVal?.consolidate();
  const matrix = from && to ? to.inverse().multiply(from) : (own ? own.matrix : new DOMMatrix());
  const box = label.getBBox();
  const top = new DOMPoint(box.x + box.width / 2, box.y).matrixTransform(matrix);
  const bottom = new DOMPoint(box.x + box.width / 2, box.y + box.height).matrixTransform(matrix);
  const above = bottom.y <= (leader.geneTop + leader.geneBottom) / 2;
  const end = above ? bottom : top;
  leader.line.setAttribute("y1", above ? leader.geneTop - leader.gap : leader.geneBottom + leader.gap);
  leader.line.setAttribute("x2", end.x);
  leader.line.setAttribute("y2", above ? end.y + leader.gap : end.y - leader.gap);
}

container.prototype.labels = function (label, show = true, options = {}) {

  if (!show) {
    return this;
  }

    if (!label) {
    return this;
  }

  const defaultOptions = {
    x: 0,
    y: 55,
    dy: "0em",
    dx: "0em",
    rotate: 0,
    start: null,
    end: null,
    adjustLabels: true,
    // adjustLabels "spread": the side of the genes the labels go ("bottom" or
    // "top"), the distance from the genes to the labels, and the style of the
    // lines from the labels to their genes (or false)
    spreadPosition: "bottom",
    leaderLine: {
      length: 20,
      stroke: "#999999",
      strokeWidth: 0.75
    },
    fontSize: "12px",
    fontStyle: "italic",
    fontFamily: "sans-serif",
    textAnchor: "middle",
    cursor: "default",
    labelAdjustmentOptions: {
      rotation: 65,
      offsetX: 0,
      offsetY: 0,
      dx: "0em",
      dy: "0em"
    },
      itemStyle: [], // [{"index": 3,"y": 20}]
      groupStyle: {},
      styleBy: null,
      group: null
  };

  const combinedOptions = mergeOptions.call(this, defaultOptions, 'labelsOptions', options);
  const { x, y, start, end, adjustLabels, labelAdjustmentOptions, spreadPosition, leaderLine, groupStyle, styleBy, group, dx, dy, anchor, rotate, fontSize, fontStyle, fontFamily, textAnchor, cursor } = combinedOptions;

  // Extract additional options that are not in defaultOptions
  const additionalOptions = extractAdditionalOptions(combinedOptions, defaultOptions);

  // Create the group
  const g = this.svg.append("g")
    .attr("data-component", "labels")
    .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

  // Sort the data first by the minimum value of start and end.
  this.data.sort((a, b) => Math.min(a.start, a.end) - Math.min(b.start, b.end));

  // The style of each label: that of the group of its gene (groupStyle, by the
  // column in styleBy or else group), with the style of the label itself
  // (itemStyle, by index) on top
  const itemStyle = withGroupStyles(this.data, styleBy ?? group, groupStyle, combinedOptions.itemStyle);
  const styleByIndex = new Map(itemStyle.map(s => [s.index, s]));

  const getAttributesForIndex = (d, i) => {
    const style = styleByIndex.get(i) || {};
    const currentX = style.x ?? x;
    const currentY = style.y ?? y;

    const currentDx = style.dx ?? dx;
    const currentDy = style.dy ?? dy;
    const currentAdjustLabels = style.adjustLabels !== undefined ? style.adjustLabels : adjustLabels;
    // Spread labels lie flat on one line below the genes (see below)
    const spread = currentAdjustLabels === "spread";
    const currentRotate = spread ? 0 : (style.rotate ?? rotate);
    // Labels of genes on a lower track (prevent_gene_overlap) go below their
    // gene, so they don't run into the genes of the track above
    // (placeLabel() below moves them back above when that side is free)
    const below = !spread && d.geneTrack > 1;
    const currentLabelAdjustmentOptions = { ...(style.labelAdjustmentOptions ?? labelAdjustmentOptions) };
    currentLabelAdjustmentOptions.rotation = -Math.abs(currentLabelAdjustmentOptions.rotation);

      // Calculate Y position based on geneTrack
    const currentGeneStrandSpacing = (d.strand == "forward" && this.geneStrandSpacing !== 0)
                                 ? this.geneStrandSpacing
                                 : -this.geneStrandSpacing;
    var currentOverlapSpacing = d.geneTrack ? (d.geneTrack - 1) * this.geneOverlapSpacing : 0;

    // Below the gene: the same gap to the gene as a label above it
    const geneY = this.yScale(this.markerY ?? 50);
    const yAbove = this.yScale(currentY) - (this.markerHeight / 2) - currentGeneStrandSpacing + currentOverlapSpacing;
    const yBelow = 2 * geneY - this.yScale(currentY) + (this.markerHeight / 2) - currentGeneStrandSpacing + currentOverlapSpacing;
    const yPos = below ? yBelow : yAbove;
    const xPos = this.xScale((d.start + d.end) / 2) + currentX;

    return {
      xPos,
      yPos,
      dx: currentDx,
      dy: currentDy,
      rotate: currentRotate,
      labelAdjustmentOptions: currentLabelAdjustmentOptions,
      adjustLabels: currentAdjustLabels,
      spread,
      below,
      yAbove
    };
  };

  // Pixel x ranges of the genes on each track
  const genesByTrack = d3.group(this.data, d => d.geneTrack ?? 1);
  const trackHasGeneIn = (track, left, right) => (genesByTrack.get(track) || []).some(gene => {
    const [geneLeft, geneRight] = [this.xScale(gene.start), this.xScale(gene.end)].sort((a, b) => a - b);
    return geneLeft < right && geneRight > left;
  });

  // A label below its gene that runs into a gene of the next track goes back
  // above its gene when no gene of the track above is in the way there
  const placeLabel = (element, d, attributes) => {
    if (!attributes.below) return;
    const bbox = element.getBBox();
    const left = bbox.x;
    const right = bbox.x + bbox.width;
    if (trackHasGeneIn(d.geneTrack + 1, left, right) && !trackHasGeneIn(d.geneTrack - 1, left, right)) {
      attributes.below = false;
      attributes.yPos = attributes.yAbove;
      d3.select(element)
        .attr("dominant-baseline", null)
        .attr("y", attributes.yPos)
        .attr("transform", `rotate(${attributes.rotate}, ${attributes.xPos}, ${attributes.yPos})`);
    }
  };

  const attributesByIndex = this.data.map((d, i) => getAttributesForIndex(d, i));
  // Turned labels stay in the plot area, where zoomed charts cut them off, and
  // in the SVG of the cluster, which cuts off what runs out of it
  const labelAdjuster = createLabelAdjuster(this, "text.label", {
    left: 0,
    right: this.width - this.margin.left - this.margin.right,
    top: -this.margin.top,
    bottom: this.height - this.margin.top
  });
  // Link labels (e.g. identity %) drawn by links() for the genes of this cluster
  const linkLabelsByRow = new Map(
    this.svg.selectAll(".link-text").nodes().map(node => [node.getAttribute("rowID"), node])
  );

  // Adding the Label
  g.selectAll("text.label")
    .data(this.data)
    .enter()
    .append("text")
    .attr("id", (d, i) => `cluster-${sanitizeId(d.cluster)}-label-${i}`)
    .attr("rowID", (d, i) => `${d["rowID"]}`)
    .attr("class", "label")
    .each(function(d, i) {
      const { dx, dy, rotate } = attributesByIndex[i];
      this.__drawn__ = { dx, dy, rotate };
    })
    .attr("x", (d, i) => attributesByIndex[i].xPos)
    .attr("y", (d, i) => attributesByIndex[i].yPos)
    .attr("dx", (d, i) => attributesByIndex[i].dx)
    .attr("dy", (d, i) => attributesByIndex[i].dy)
    .attr("text-anchor", textAnchor)
    .attr("dominant-baseline", (d, i) => attributesByIndex[i].below ? "hanging" : null)
    .attr("transform", (d, i) => {
      const { xPos, yPos, rotate } = attributesByIndex[i];
      return `rotate(${rotate}, ${xPos}, ${yPos})`;
    })
    .style("font-size", fontSize)
    .style("font-style", fontStyle)
    .style("font-family", fontFamily)
    .style("cursor", cursor)
    .text((d, i) => styleByIndex.get(i)?.text ?? d[label])
    // One label per gene: a gene with a link label gets it as a second line.
    // Done for all labels before the overlap check, which measures them all at once
    .each(function (d) {
      const linkLabel = linkLabelsByRow.get(String(d.rowID));
      if (linkLabel) addLinkLabelLine(this, linkLabel);
    })
    .each(function (d, i) {
      const attributes = attributesByIndex[i];
      placeLabel(this, d, attributes);
      // Labels below their gene rotate downwards when they overlap
      if (attributes.below) {
        attributes.labelAdjustmentOptions.rotation = Math.abs(attributes.labelAdjustmentOptions.rotation);
      }
    });

  const styleLabel = (element, i) => {
    const currentElement = d3.select(element);
    // Set additional options as attributes
    setStyleFromOptions(currentElement, additionalOptions);
    // Override with itemStyle based on the index
    applyStyleToElement(currentElement, styleByIndex.has(i) ? [styleByIndex.get(i)] : [], i);
    // Measured again only when it may have changed size since adjust()
    if (element.childElementCount || changesSize(additionalOptions) || changesSize(styleByIndex.get(i))) {
      labelAdjuster.refresh(element);
    }
  };

  // Spread labels are styled and spread first, so the overlap check of the
  // other labels below sees them where they end up
  g.selectAll("text.label").each(function (d, i) {
    if (attributesByIndex[i].spread) styleLabel(this, i);
  });
  // A lines option without length or with a length that is not a number gets
  // the default length; a theme's leaderLine = FALSE does not drop the
  // default style of lines set again with GC_labels()
  const { length: lineLength, ...lineStyle } =
    { ...defaultOptions.leaderLine, ...(isPlainObject(leaderLine) ? leaderLine : {}) };
  this.spreadLabels(g, attributesByIndex, {
    length: Number.isFinite(Number(lineLength)) ? Number(lineLength) : defaultOptions.leaderLine.length,
    lineStyle: leaderLine === false ? null : lineStyle,
    onTop: spreadPosition === "top"
  });

  g.selectAll("text.label").each(function (d, i) {
    const attributes = attributesByIndex[i];
    if (attributes.spread) return;
    // adjustLabels: TRUE turns labels that overlap, "hide" hides them
    if (attributes.adjustLabels && labelAdjuster.adjust(this, {
      ...attributes.labelAdjustmentOptions, hide: attributes.adjustLabels === "hide"
    })) {
      linkLabelLineToInline(this);
    }
    styleLabel(this, i);
  });

  g.selectAll("text.label").each(function(d, i) {
    applyMove(d3.select(this), styleByIndex.get(i) ?? {});
  });

  //Make markers available to tooltip
  this.labels = g.selectAll(".label");

  return this;
};

// adjustLabels "spread": the labels go on one line below the lowest gene (or
// above the highest gene with options.onTop), options.length away from it,
// moved apart where they would overlap, each with a line in
// options.lineStyle (none when null) to its gene. A chart drawn while hidden
// (e.g. in a tab that is not open) cannot be measured: its labels are spread
// once it is shown.
container.prototype.spreadLabels = function (g, attributesByIndex, options) {
  const svg = this.svg.node();
  if (!svg.getClientRects().length) {
    const observer = new ResizeObserver(() => {
      if (!svg.isConnected) return observer.disconnect();
      if (!svg.getClientRects().length) return;
      observer.disconnect();
      this.spreadLabels(g, attributesByIndex, options);
    });
    observer.observe(svg);
    return this;
  }

  const plotWidth = this.width - this.margin.left - this.margin.right;
  // The part of a gene in view, in pixels; null when it is out of view
  const inView = d => {
    const [left, right] = [this.xScale(d.start), this.xScale(d.end)].sort((a, b) => a - b);
    const from = Math.max(0, left);
    const to = Math.min(plotWidth, right);
    return from <= to ? [from, to] : null;
  };
  // Labels of genes out of view when zoomed in are hidden; genes without
  // label text get no place on the line and no line
  const labels = [];
  g.selectAll("text.label").each(function (d, i) {
    if (!attributesByIndex[i].spread || this.textContent.trim() === "") return;
    const view = inView(d);
    if (!view) {
      this.style.display = "none";
      return;
    }
    const { xPos } = attributesByIndex[i];
    labels.push({ node: this, d, geneX: (view[0] + view[1]) / 2, wanted: Math.min(view[1], Math.max(view[0], xPos)) });
  });
  if (!labels.length) return this;

  // The top and bottom of each labelled gene and of all genes, in the
  // coordinates of the labels
  const labelsCTM = g.node().getCTM();
  const labelled = new Set(labels.map(({ d }) => String(d.rowID)));
  const geneTops = new Map();
  const geneBottoms = new Map();
  let highest = Infinity;
  let lowest = -Infinity;
  this.svg.selectAll(".gene, .exon, .intron, .utr").each(function () {
    const ctm = this.getCTM();
    if (!ctm || !labelsCTM) return;
    const matrix = labelsCTM.inverse().multiply(ctm);
    const box = this.getBBox();
    let top = Infinity;
    let bottom = -Infinity;
    for (const [px, py] of [[box.x, box.y], [box.x + box.width, box.y],
      [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]]) {
      const y = new DOMPoint(px, py).matrixTransform(matrix).y;
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
    highest = Math.min(highest, top);
    lowest = Math.max(lowest, bottom);
    const rowID = this.getAttribute("rowID");
    if (!labelled.has(rowID)) return;
    geneTops.set(rowID, Math.min(geneTops.get(rowID) ?? Infinity, top));
    geneBottoms.set(rowID, Math.max(geneBottoms.get(rowID) ?? -Infinity, bottom));
  });
  const geneY = this.yScale(this.markerY ?? 50);
  const half = (this.markerHeight ?? 0) / 2;
  if (!Number.isFinite(highest)) highest = geneY - half;
  if (!Number.isFinite(lowest)) lowest = geneY + half;

  // Gap between labels, and between the ends of a line and its gene or label
  const gap = 6;
  const lineGap = 2;
  const boxes = labels.map(({ node }) => node.getBBox());
  const centres = spreadLabelCentres(
    labels.map(({ wanted }) => wanted),
    boxes.map(box => box.width), gap, 0, plotWidth);
  // Labels are brought closer to the genes when the cluster has no room for
  // them that far away, so they are not cut off
  const height = boxes.reduce((most, box) => Math.max(most, box.height), 0);
  const room = options.onTop
    ? highest - height + this.margin.top
    : this.height - this.margin.top - lowest - height;
  const length = Math.max(2 * lineGap, Math.min(options.length, room));
  labels.forEach(({ node }, k) => {
    const box = boxes[k];
    const left = centres[k] - box.width / 2;
    // A label pushed out of the plot, when the labels together are wider than
    // it, is hidden rather than cut off
    if (left < -0.5 || left + box.width > plotWidth + 0.5) {
      node.style.display = "none";
      return;
    }
    const dy = options.onTop ? highest - length - (box.y + box.height) : lowest + length - box.y;
    // Moves (moveX, moveY) already made stay when the labels are spread later
    const { moveX = 0, moveY = 0 } = node.__drawn__ ?? {};
    const move = moveX || moveY ? `translate(${moveX}, ${moveY}) ` : "";
    node.setAttribute("transform", `${move}translate(${centres[k] - (box.x + box.width / 2)}, ${dy})`);
  });

  if (!options.lineStyle) return this;
  const lines = g.insert("g", "text.label").attr("class", "leader-lines").style("pointer-events", "none");
  labels.forEach(({ node, d, geneX }) => {
    if (node.style.display === "none") return;
    const line = lines.append("line")
      .attr("x1", geneX)
      .attr("x2", geneX);
    setStyleFromOptions(line, options.lineStyle);
    node.__leader__ = {
      line: line.node(),
      gap: lineGap,
      geneTop: geneTops.get(String(d.rowID)) ?? highest,
      geneBottom: geneBottoms.get(String(d.rowID)) ?? lowest
    };
    updateLeaderLine(node);
    // Follows the label when it is dragged, or moved back with undo or reset
    new MutationObserver(() => updateLeaderLine(node))
      .observe(node, { attributes: true, attributeFilter: ["transform", "style"] });
  });
  return this;
};
