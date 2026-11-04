// The position line that follows the mouse: container.prototype.trackMouse.
import { container } from "../container.js";
import { setStyleFromOptions } from "../style.js";
import { mergeOptions } from "../util.js";

container.prototype.trackMouse = function(track = true, options = {}) {
  if (!track) {
    return this;
  }

  // Styles of the coordinate tooltip
  const defaultOptions = {
    cursor: "crosshair",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid rgba(0,0,0,0.1)",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    color: "#333",
    lineHeight: "1.5",
    zIndex: 1000
  };

  const { cursor, show, ...tooltipStyle } = mergeOptions.call(this, defaultOptions, 'trackMouseOptions', options);

  // Change cursor
  this.svg.style("cursor", cursor);
    this.svg.selectAll("*").each(function() {
    this.style.cssText += `cursor: ${cursor} !important;`;
  });

  // Tooltip for displaying coordinates, inside the widget element so it is
  // removed when the widget redraws
  const host = this.svg.node().closest(".html-widget") || document.body;
  const tooltip = d3.select(host).append("div")
    .attr("class", "coordinate-tooltip")
    .style("pointer-events", "none")
    .style("position", "absolute")
    .style("visibility", "hidden");
  setStyleFromOptions(tooltip, tooltipStyle);

  const xScale = d3.scaleLinear().domain([0 + this.margin.left, this.width - this.margin.right]).range([0, 100]);
  const yScale = d3.scaleLinear().domain([this.height - this.margin.bottom, 0 + this.margin.top]).range([0, 100]);
  const linearScale = d3.scaleLinear().domain([0 - this.margin.left, this.width]).range([0, 100]);

  this.svg.on("mousemove", (event) => {
    const [x, y] = d3.pointer(event);
    const adjustedX = x - this.margin.left
    const loci = Math.round(this.xScale.invert(adjustedX))
    const format = d3.format(",");

    tooltip.html(`x: ${format(loci)} <br>y: ${yScale(y).toFixed(1)}`)
      .style("visibility", "visible")
      .style("left", (d3.pointer(event, host)[0] + 10) + "px")
      .style("top", (d3.pointer(event, host)[1] - 10) + "px");
  });

  this.svg.on("mouseout", () => {
    tooltip.style("visibility", "hidden");
  });

  return this;
};
