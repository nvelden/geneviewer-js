// The scale bar: container.prototype.scaleBar.
import { container } from "../container.js";
import { applyMove, extractAdditionalOptions, setStyleFromOptions } from "../style.js";
import { mergeOptions } from "../util.js";

container.prototype.scaleBar = function (show = true, options = {}) {
  if (!show) {
    return this;
  }

  const defaultOptions = {
    title: "1 kb",
    scaleBarUnit: 1000,
    x: 0, // default x offset
    y: 10,
    labelStyle: { // default styling for the label
      fontSize: "10px",
      fontFamily: "sans-serif",
      cursor: "default",
      fill: "black", // default text color
      labelPosition: "left" // moved labelPosition into labelStyle
    },
    textPadding: 0, // padding between text and line in x-direction
    scaleBarLineStyle: { // default styling for the scale bar line
      stroke: "grey",
      strokeWidth: 1
    },
    scaleBarTickStyle: { // default styling for the scale bar ticks
      stroke: "grey",
      strokeWidth: 1
    }
  };

  // Merge the default options with any predefined scaleBarOptions and the provided options
  const combinedOptions = mergeOptions.call(this, defaultOptions, 'scaleBarOptions', options);
  const { title, scaleBarUnit, x, y, textPadding, labelStyle, scaleBarLineStyle, scaleBarTickStyle } = combinedOptions;

  // Extract additional options that are not in defaultOptions
  const additionalOptionsLine = extractAdditionalOptions(scaleBarLineStyle, defaultOptions.scaleBarLineStyle);
  const additionalOptionsTick = extractAdditionalOptions(scaleBarTickStyle, defaultOptions.scaleBarTickStyle);
  const additionalOptionsLabel = extractAdditionalOptions(labelStyle, defaultOptions.labelStyle);

  // Calculate the length of the scale bar in pixels
  const scaleBarLength = Math.abs(this.xScale(scaleBarUnit) - this.xScale(0));

  // Create the group with the x offset applied
  const g = this.svg.append("g")
    .attr("data-component", "scaleBar")
    .attr("transform", `translate(${this.width - this.margin.right - scaleBarLength - parseInt(labelStyle.fontSize) - 5 + x}, ${this.height - this.margin.bottom})`);

  // Create the scale bar line
  g.append("line")
    .attr("x1", parseInt(labelStyle.fontSize) + 5 + scaleBarLength)
    .attr("x2", parseInt(labelStyle.fontSize) + 5)
    .attr("y1", -y)
    .attr("y2", -y)
    .style("stroke", scaleBarLineStyle.stroke)
    .style("stroke-width", scaleBarLineStyle.strokeWidth)
    .each(function () {
      const currentElement = d3.select(this);
      setStyleFromOptions(currentElement, additionalOptionsLine);
    });

  // Add the ticks
  [parseInt(labelStyle.fontSize) + 5, parseInt(labelStyle.fontSize) + 5 + scaleBarLength].forEach(d => {
    g.append("line")
      .attr("x1", d)
      .attr("x2", d)
      .attr("y1", -y - 5)
      .attr("y2", -y + 5)
      .style("stroke", scaleBarTickStyle.stroke)
      .style("stroke-width", scaleBarTickStyle.strokeWidth)
      .each(function () {
        const currentElement = d3.select(this);
        setStyleFromOptions(currentElement, additionalOptionsTick);
      });
  });

  // Determine the x position of the title based on the labelPosition within labelStyle and adjust with textPadding
  const titleX = labelStyle.labelPosition === "left" ? (parseInt(labelStyle.fontSize) - textPadding) : (parseInt(labelStyle.fontSize) + 5 + scaleBarLength + textPadding);
  const textAnchor = labelStyle.labelPosition === "left" ? "end" : "start";

  // Add the title
  g.append("text")
    .attr("x", titleX)
    .attr("y", -y)
    .style("text-anchor", textAnchor)
    .style("dominant-baseline", "middle")
    .style("font-size", labelStyle.fontSize)
    .style("font-family", labelStyle.fontFamily)
    .style("cursor", labelStyle.cursor)
    .style("fill", labelStyle.fill) // Apply text color
    .each(function () {
      const currentElement = d3.select(this);
      setStyleFromOptions(currentElement, additionalOptionsLabel);
    })
    .text(title);

  // Move the complete bar, including its label, line and ticks.
  applyMove(g, combinedOptions.itemStyle?.[0]);

  return this;
};
