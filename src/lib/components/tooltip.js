// The gene tooltip: container.prototype.tooltip.
import { container } from "../container.js";
import { extractAdditionalOptions, setStyleFromOptions } from "../style.js";
import { mergeOptions } from "../util.js";

container.prototype.tooltip = function (show = true, options = {}) {
  if (!show) {
    return this;
  }

  const defaultOptions = {
    triggers: ["markers", "genes", "labels", "exons", "introns", "utrs"],
    formatter: "<b>Start:</b> {start}<br><b>End: {end}</b>",
    opacity: 0,
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid rgba(0,0,0,0.1)",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    pointerEvents: "none",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    zIndex: 1000,
    color: "#333",
    lineHeight: "1.5"
  };

  const combinedOptions = mergeOptions.call(this, defaultOptions, 'tooltipOptions', options);

  // Extract additional options that are not in defaultOptions
  const additionalOptions = extractAdditionalOptions(combinedOptions, defaultOptions);

  // Ensure triggers is an array
  if (typeof combinedOptions.triggers === 'string') {
    combinedOptions.triggers = [combinedOptions.triggers];
  }

  // One tooltip per cluster, inside the widget element, so each cluster keeps
  // its own options and the tooltip is removed when the widget redraws.
  // The arrow (::before in styles.css) takes its colour from --tooltip-bg.
  const host = this.svg.node().closest(".html-widget") || document.body;
  const tooltip = d3.select(host)
    .append("div")
    .attr("class", "cluster-tooltip")
    .style("opacity", combinedOptions.opacity)
    .style("position", combinedOptions.position)
    .style("background-color", combinedOptions.backgroundColor)
    .style("--tooltip-bg", combinedOptions.backgroundColor)
    .style("padding", combinedOptions.padding)
    .style("border-radius", combinedOptions.borderRadius)
    .style("border", combinedOptions.border)
    .style("box-shadow", combinedOptions.boxShadow)
    .style("pointer-events", combinedOptions.pointerEvents)
    .style("font-family", combinedOptions.fontFamily)
    .style("font-size", combinedOptions.fontSize)
    .style("z-index", combinedOptions.zIndex)
    .style("color", combinedOptions.color)
    .style("line-height", combinedOptions.lineHeight);
  setStyleFromOptions(tooltip, additionalOptions);

  // Place the tooltip centred above the mouse, relative to the widget element
  const moveTooltip = (event) => {
    const [x, y] = d3.pointer(event, host);
    tooltip.style("left", (x - tooltip.node().offsetWidth / 2) + "px")
      .style("top", (y - tooltip.node().offsetHeight - 15) + "px");
  };

  // Function to generate tooltip content
  const d3Format = d3.format(",");

  const isMissing = (value) => value === null || value === undefined || value === '' ||
    (typeof value === 'number' && isNaN(value));

  // A line whose fields all have no value is left out, e.g. the identity of a
  // gene without a BlastP hit
  const textAccessor = (d) => {
    return combinedOptions.formatter
      .split(/<br\s*\/?>/i)
      .filter(line => {
        const fields = [...line.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
        return fields.length === 0 || !fields.every(field => isMissing(d[field]));
      })
      .join('<br>')
      .replace(/\{(\w+)\}/g, (match, p1) => {
        if (typeof d[p1] === 'number') {
          return d3Format(d[p1]);
        }
        // The formatter is HTML; the values of the data are text, so markup
        // in them (e.g. a GenBank qualifier) is shown, not run
        return escapeHtml(d[p1] || '');
      });
  };

  combinedOptions.triggers.forEach(trigger => {

    if (!this.hasOwnProperty(trigger)) {
      return;
    }

    const selection = this[trigger];

    // Check if the selection exists and is not empty
    if (!selection || selection.empty()) {
      return; // Skip this iteration of the loop
    }

    // Mouseover event to show the tooltip
    selection.on("mouseover", (event, d) => {
      const dataPoint = this.data.find(item => item === d);

      const element = d3.select(event.currentTarget);
      element.classed("hovered", true);

      tooltip.transition()
        .duration(200)
        .style("opacity", 1);
      tooltip.html(textAccessor(dataPoint));
      moveTooltip(event);
    });

    // Mousemove event to reposition the tooltip as the mouse moves
    selection.on("mousemove", moveTooltip);

    // Mouseout event to hide the tooltip
    selection.on("mouseout", (event) => {

      const element = d3.select(event.currentTarget);
      element.classed("hovered", false);

      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });
  });

  return this; // Return the instance for method chaining
};

/**
 * A value as text in HTML: the characters that HTML reads as markup escaped.
 * @param {*} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
