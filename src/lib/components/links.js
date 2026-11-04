// Links drawn in a cluster's container: container.prototype.links.
import { container } from "../container.js";
import { changesSize, extractAdditionalOptions, setStyleFromOptions } from "../style.js";
import { createLabelAdjuster } from "../text.js";
import { mergeOptions, sanitizeId } from "../util.js";

container.prototype.links = function (links, clusterKey, options = {}) {

  const defaultOptions = {
    y: 50,
    showLinks: true,
    label: true,
    measure: "identity",
    linkWidth: 1,
    labelStyle: {
        cursor: "pointer",
        fontSize: "12px",
        fontStyle: "italic",
        fontFamily: "sans-serif",
        textAnchor: "middle",
    },
    labelAdjustmentOptions: {
      rotation: -65,
      offsetX: 0,
      offsetY: 0,
      dx: "0em",
      dy: "0em"
    },
  };

  if (!links || links.length === 0) {
      return this;
  }

  const combinedOptions = mergeOptions.call(this, defaultOptions, 'linkOptions', options);
  const { x, y, cursor, fontSize, fontStyle, fontFamily, textAnchor, showLinks, label, measure, labelStyle, labelAdjustmentOptions, linkWidth } = combinedOptions;

  const additionalOptions = extractAdditionalOptions(options, defaultOptions);
  const additionalOptionsLabelStyle = extractAdditionalOptions(labelStyle, defaultOptions.labelStyle);

  var group = this.svg.append("g")
    .attr("data-component", "links")
      .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

  const hasReverseStrand = this.data.some(item => item.strand === "reverse");
  const clusterStrandSpacing = hasReverseStrand ? this.geneStrandSpacing * 1 : 0;

  if(showLinks){
    links.forEach(link => {
        const widthFactor = (1 - linkWidth) / 2;
        const adjustedStart1 = link.start1 + (link.end1 - link.start1) * widthFactor;
        const adjustedEnd1 = link.end1 - (link.end1 - link.start1) * widthFactor;
        const adjustedStart2 = link.start2 + (link.end2 - link.start2) * widthFactor;
        const adjustedEnd2 = link.end2 - (link.end2 - link.start2) * widthFactor;

        // Check if the link is relevant to cluster1
        if (link.cluster1 === clusterKey) {
            const groupColor1 = link.groupColor ? this.genesColorScale(link.groupColor) : this.genesColorScale(link.group1);

            group.append("circle")
                .attr("cx", this.xScale(adjustedStart1))
                .attr("cy", this.yScale(y) + clusterStrandSpacing)
                .attr("position", link.start1)
                .attr("r", 1)
                .attr("cluster", clusterKey)
                .attr("visibility", "hidden")
                .attr("groupColor", groupColor1)
                .attr("linkID", link.linkID)
                .attr("class", "link-marker");

            group.append("circle")
                .attr("cx", this.xScale(adjustedEnd1))
                .attr("cy", this.yScale(y) + clusterStrandSpacing)
                .attr("position", link.end1)
                .attr("class", "link-marker")
                .attr("groupColor", groupColor1)
                .attr("visibility", "hidden")
                .attr("linkID", link.linkID)
                .attr("cluster", clusterKey)
                .attr("r", 1);
        }

        // Check if the link is relevant to cluster2
        if (link.cluster2 === clusterKey) {
            const groupColor2 = link.groupColor ? this.genesColorScale(link.groupColor) : this.genesColorScale(link.group2);

            group.append("circle")
                .attr("cx", this.xScale(adjustedStart2))
                .attr("cy", this.yScale(y) - clusterStrandSpacing)
                .attr("position", link.start2)
                .attr("class", "link-marker")
                .attr("cluster", clusterKey)
                .attr("visibility", "hidden")
                .attr("groupColor", groupColor2)
                .attr("linkID", link.linkID)
                .attr("r", 1);

            group.append("circle")
                .attr("cx", this.xScale(adjustedEnd2))
                .attr("cy", this.yScale(y) - clusterStrandSpacing)
                .attr("position", link.end2)
                .attr("class", "link-marker")
                .attr("linkID", link.linkID)
                .attr("cluster", clusterKey)
                .attr("visibility", "hidden")
                .attr("groupColor", groupColor2)
                .attr("r", 1);
        }
    });
  }

  // Measures written on the links themselves are drawn by makeLinks()
  if (label && combinedOptions.labelPosition !== "link") {
    const labelAdjuster = createLabelAdjuster(this, ".link-text");
    // Labels drawn by earlier link sets: a gene gets one label
    const labelled = this.svg.selectAll(".link-text").nodes();
    const labelledRows = new Set(labelled.map(node => node.getAttribute("rowID")));

    const labelData = this.data.filter(d =>
      !labelledRows.has(`${d["rowID"]}`) &&
      d[measure] != null &&
      d.BlastP != "No Hit" &&
      (d.BlastP === undefined || (d.BlastP != d.protein_id && d.BlastP)) &&
      ((options.value1 === undefined && options.value2 === undefined) ||
      (options.value1 && options.value1.includes(d[options.group])) ||
      (options.value2 && options.value2.includes(d[options.group])))
    );

    // Adding the Label
    group.selectAll(".link-text")
    .data(labelData)
    .enter()
    .append("text")
    .attr("id", (d, i) => `cluster-${sanitizeId(d.cluster)}-link-label-${labelled.length + i}`)
    .attr("rowID", (d, i) => `${d["rowID"]}`)
    .attr("class", "link-text")
    .attr("x", (d, i) => this.xScale((d.start + d.end) / 2))
    .attr("y", (d, i) => this.yScale(y) - (this.markerHeight / 1.5) - clusterStrandSpacing)
    .text(d => `${parseFloat(d[measure].toFixed(1))}%`)
    .style("font-size", labelStyle.fontSize)
    .style("font-style", labelStyle.fontStyle)
    .style("font-family", labelStyle.fontFamily)
    .style("cursor", labelStyle.cursor)
    .attr("text-anchor", labelStyle.textAnchor)
    .attr("cluster", clusterKey)
    .each(function (d, i) {
      const currentElement = d3.select(this);
      labelAdjuster.adjust(this, labelAdjustmentOptions);
      setStyleFromOptions(currentElement, additionalOptionsLabelStyle);
      if (changesSize(additionalOptionsLabelStyle)) labelAdjuster.refresh(this);
    });
  }

  return this;
};
