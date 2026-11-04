// Transcripts (exons, introns, UTRs): container.prototype.transcript.
import { getColorScale, getPatternScale } from "../color.js";
import { getMarkerAttributes, markerTransform, setRowAttributes } from "./genes.js";
import { container } from "../container.js";
import { applyStyleToElement, extractAdditionalOptions, setStyleFromOptions, withGroupStyles } from "../style.js";
import { mergeOptions, sanitizeId } from "../util.js";

container.prototype.transcript = function (group, show = true, options = {}) {

  if (!show) {
    return this;
  }

  if (!this.data) {
    console.error('No data has been added to this cluster container. Please use the geneData() function before attempting to draw arrows.');
    return this;
  }

  const defaultOptions = {
    x: 1,
    y: 50,
    colorScheme: null,
    customColors: null,
    pattern: null,
    styleExons: {
      show: true,
      strokeWidth: 0,
      cursor: "default",
      marker: "box",
      markerSize: "medium",
      arrowheadWidth: null,
      arrowheadHeight: null,
      markerHeight: null,
      cornerRadius: null
    },
    styleIntrons: {
      show: true,
      strokeWidth: 1,
      fill: "none",
      cursor: "default",
      marker: "intron",
      markerSize: "medium",
      arrowheadWidth: null,
      arrowheadHeight: null,
      markerHeight: null,
      cornerRadius: null
    },
    styleUTRs: {
      show: true,
      fontSize: "10px",
      fontStyle: "normal",
      fontFamily: "sans-serif",
      cursor: "default",
      color: "black",
      fill: "#FFF",
      strokeWidth: 1,
      marker: "box",
      markerSize: "medium",
      arrowheadWidth: null,
      arrowheadHeight: null,
      markerHeight: null,
      cornerRadius: null
    },
     labelOptions: {
      show: true,
      xOffset: 2,
      yOffset: 0,
      fontSize: "12px",
      fontStyle: "normal",
      fontWeight: "normal",
      fontFamily: "sans-serif",
      cursor: "default",
      color: "black"
    },
    itemStyleExons: [],
    itemStyleIntrons: [],
    itemStyleUTRs: [],
    groupStyleExons: {},
    groupStyleIntrons: {},
    groupStyleUTRs: {},
    styleBy: null
  };

  const combinedOptions = mergeOptions.call(this, defaultOptions, 'transcriptOptions', options);
  const { x, y, colorScheme, customColors, pattern, styleExons, styleIntrons, styleUTRs, labelOptions } = combinedOptions;
  const styleColumn = combinedOptions.styleBy ?? group;

  // Extract additional options that aren't in defaultOptions
  const additionalOptionsExons = extractAdditionalOptions(combinedOptions.styleExons, defaultOptions.styleExons);
  const additionalOptionsIntrons = extractAdditionalOptions(combinedOptions.styleIntrons, defaultOptions.styleIntrons);
  const additionalOptionsUTRs = extractAdditionalOptions(combinedOptions.styleUTRs, defaultOptions.styleUTRs);

  const uniqueGroups = [...new Set(this.dataAll.map(d => d[group]))];

  const colorScale = getColorScale(colorScheme, customColors, uniqueGroups);
  this.genesColorScale = colorScale;
  const patternScale = getPatternScale(this.svg, pattern, uniqueGroups, colorScale, "exon");

  const g = this.svg.append("g")
    .attr("data-component", "transcript")
    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

  // Sort the data first by the minimum value of start and end.
  this.data.sort((a, b) => Math.min(a.start, a.end) - Math.min(b.start, b.end));

  const getAttributesForIndex = (d, i, styles, itemStyles) => getMarkerAttributes(this, d, i, y, styles, itemStyles);

  // Draws the transcript rows of type ("exon", "intron" or "utr") with their
  // styles; fill and stroke are values or functions of the row
  const drawParts = (type, styles, groupStyle, itemStyle, additionalOptions, transform, fill, stroke) => {
    const parts = this.data.filter(transcript => new RegExp(type, "i").test(transcript.type));
    const itemStyles = withGroupStyles(parts, styleColumn, groupStyle, itemStyle);

    g.selectAll(`.${type}`)
      .data(parts)
      .enter()
      .append("path")
      .attr("d", (d, i) => {
        return getAttributesForIndex(d, i, styles, itemStyles).path;
      })
      .attr("transform", (d, i) => transform(d, getAttributesForIndex(d, i, styles, itemStyles)))
      .attr("fill", fill)
      .attr("class", type)
      .attr("id", (d, i) => `${sanitizeId(d.cluster)}-${type}-${i}`)
      .call(setRowAttributes)
      .style("stroke-width", styles.strokeWidth)
      .style("stroke", stroke)
      .style("cursor", styles.cursor)
      .each(function (d, i) {
        const currentElement = d3.select(this);
        // Set additional options as attributes
        setStyleFromOptions(currentElement, additionalOptions);
        // Override with itemStyle based on the index
        applyStyleToElement(currentElement, itemStyles, i);
      });

    return g.selectAll(`.${type}`);
  };

  const boxTransform = (d, attributes) => markerTransform(this.reverse, d, attributes);
  const geneStroke = (d) => patternScale.stroke(d[group]);

  if (styleExons.show) {
    // Add exons
    this.exons = drawParts("exon", styleExons, combinedOptions.groupStyleExons,
                           combinedOptions.itemStyleExons, additionalOptionsExons, boxTransform,
                           (d) => patternScale.fill(d[group]), styleExons.stroke);
  }

  if (styleIntrons.show) {
    // Add introns, as a line above or below the transcript
    const intronTransform = (d, { xPos, yPos, height }) => {
      const yOffset = d.direction === 'forward' ? -height : +height;
      const rotation = this.reverse
        ? (d.direction === 'reverse' ? 180 : 0)
        : (d.direction === 'forward' ? 0 : 180);
      return `rotate(${rotation}, ${xPos}, ${yPos + yOffset}) translate(${xPos}, ${yPos + yOffset})`;
    };
    this.introns = drawParts("intron", styleIntrons, combinedOptions.groupStyleIntrons,
                             combinedOptions.itemStyleIntrons, additionalOptionsIntrons, intronTransform,
                             styleIntrons.fill, geneStroke);
  }

  if (styleUTRs.show) {
    // Add UTRs
    this.utrs = drawParts("utr", styleUTRs, combinedOptions.groupStyleUTRs,
                          combinedOptions.itemStyleUTRs, additionalOptionsUTRs, boxTransform,
                          styleUTRs.fill, geneStroke);

    if (labelOptions.show) {

    const xPosition3Prime = this.data[0].direction === 'forward'
      ? this.xScale(this.maxEnd) + labelOptions.xOffset
      : this.xScale(this.minStart) - labelOptions.xOffset;

    const xPosition5Prime = this.data[0].direction === 'forward'
      ? this.xScale(this.minStart) - labelOptions.xOffset
      : this.xScale(this.maxEnd) + labelOptions.xOffset;

    // add 3' label
    g.append("text")
        .attr("x", xPosition3Prime)
        .attr("y", (d) => this.yScale(y + labelOptions.yOffset))
        .attr("class", "three-prime-label")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .style("font-size", labelOptions.fontSize)
        .style("font-style", labelOptions.fontStyle)
        .style("font-weight", labelOptions.fontWeight)
        .style("font-family", labelOptions.fontFamily)
        .style("cursor", labelOptions.cursor)
        .style("fill", labelOptions.color)
        .text("3'");

    // add 5' label
    g.append("text")
        .attr("x", xPosition5Prime)
        .attr("y", (d) => this.yScale(y + labelOptions.yOffset))
        .attr("class", "five-prime-label")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .style("font-size", labelOptions.fontSize)
        .style("font-style", labelOptions.fontStyle)
        .style("font-weight", labelOptions.fontWeight)
        .style("font-family", labelOptions.fontFamily)
        .style("cursor", labelOptions.cursor)
        .style("fill", labelOptions.color)
        .text("5'");

    }


  }

  return this;
};
