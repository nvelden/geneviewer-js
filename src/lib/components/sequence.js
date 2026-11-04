// The sequence line: container.prototype.sequence.
import { container } from "../container.js";
import { addScalePadding } from "../scale.js";
import { extractAdditionalOptions, setStyleFromOptions } from "../style.js";
import { mergeOptions } from "../util.js";

container.prototype.sequence = function (show = true, options = {}) {

  if (!show) {
    return this;
  }

  if (!this.data) {
    console.error('No data has been added to this cluster container. Please use the addGeneData() function before attempting to draw a gene line.');
    return this;
  }

  const defaultOptions = {
    y: 50,
    start: null,
    end: null,
    sequenceStyle: { // Adding sequenceStyle
      stroke: "grey",
      strokeWidth: 1
    },
    markerStyle: {
      markerHeight: 10,
      stroke: "grey",
      strokeWidth: 1,
      tiltAmount: -5,
      gap: 0
    }
  };

  // Merge the default options with any predefined sequenceOptions and the provided options
  const combinedOptions = mergeOptions.call(this, defaultOptions, 'sequenceOptions', options);

  const { y, start, end, markerStyle, sequenceStyle } = combinedOptions;

  // Extract additional options that are not in defaultOptions for sequenceStyle
  const additionalOptionsSequence = extractAdditionalOptions(sequenceStyle, defaultOptions.sequenceStyle);

  var g = this.svg.append("g")
    .attr("data-component", "sequence")
    .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

  var minStart = start ?? d3.min(this.data, d => Math.min(d.start, d.end));
  var maxEnd = end ?? d3.max(this.data, d => Math.max(d.start, d.end));

  if(start == null){
  minStart = addScalePadding(minStart, maxEnd, this.padding, "start", this.breaks)
  }

  if(end == null){
  maxEnd = addScalePadding(minStart, maxEnd, this.padding, "end", this.breaks)
  }

  // Pixel positions of the break markers, each markerStyle.gap px away from the break
  const breakMarkers = this.breaks.map(gap => ({
    xStart: this.xScale(gap.start - 0.001) - markerStyle.gap,
    xEnd: this.xScale(gap.end + 0.001) + markerStyle.gap
  }));

  // Draw baseline with sequenceStyle, left open between the two markers of a break
  const [lineLeft, lineRight] = [this.xScale(minStart), this.xScale(maxEnd)].sort((a, b) => a - b);
  const openings = breakMarkers
    .map(({ xStart, xEnd }) => [xStart + markerStyle.tiltAmount / 2, xEnd - markerStyle.tiltAmount / 2]
      .sort((a, b) => a - b))
    .sort((a, b) => a[0] - b[0]);
  const segments = [];
  let segmentStart = lineLeft;
  for (const [openLeft, openRight] of openings) {
    if (openLeft > segmentStart) segments.push([segmentStart, Math.min(openLeft, lineRight)]);
    segmentStart = Math.max(segmentStart, openRight);
  }
  if (segmentStart < lineRight) segments.push([segmentStart, lineRight]);

  g.selectAll("line.baseline")
    .data(segments)
    .enter()
    .append("line")
    .attr("class", "baseline")
    .attr("x1", d => d[0])
    .attr("y1", this.yScale(y))
    .attr("x2", d => d[1])
    .attr("y2", this.yScale(y))
    .style("stroke", sequenceStyle.stroke)
    .style("stroke-width", sequenceStyle.strokeWidth)
    .each(function () {
      const currentElement = d3.select(this);
      setStyleFromOptions(currentElement, additionalOptionsSequence);
    });

  // Draw break markers with tilted lines
  for (const { xStart, xEnd } of breakMarkers) {
    const yBase = this.yScale(y);
    const yTop = yBase - markerStyle.markerHeight / 2;
    const yBottom = yBase + markerStyle.markerHeight / 2;

    // Draw the tilted line before the gap
    g.append("line")
      .attr("x1", xStart)
      .attr("y1", yTop)
      .attr("x2", xStart + markerStyle.tiltAmount)
      .attr("y2", yBottom)
      .attr("stroke", markerStyle.stroke)
      .attr("stroke-width", markerStyle.strokeWidth);

    // Draw the tilted line after the gap
    g.append("line")
      .attr("x1", xEnd - markerStyle.tiltAmount)
      .attr("y1", yTop)
      .attr("x2", xEnd)
      .attr("y2", yBottom)
      .attr("stroke", markerStyle.stroke)
      .attr("stroke-width", markerStyle.strokeWidth);
  }

  return this;
};
