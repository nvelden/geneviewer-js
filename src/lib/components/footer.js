// The cluster footer: container.prototype.footer.
import { styleFontText, titleAlignment } from "./title.js";
import { container } from "../container.js";
import { partStyle } from "../style.js";
import { mergeOptions, themeTextScale } from "../util.js";

container.prototype.footer = function (title, subtitle, show = true, options = {}) {

  // Return early if neither title nor subtitle is provided
  if (!title && !subtitle) {
    return this;
  }

  if (!show) {
    return this;
  }

  // Default options for title and subtitle
  const defaultOptions = {
    x: 0,
    y: 0,
    align: "left",
    spacing: 12 * themeTextScale(this.themeOptions), // Default spacing between title and subtitle
    titleFont: {
      fontSize: "12px",
      fontWeight: "bold",
      fontStyle: "normal",
      fontFamily: "sans-serif",
      cursor: "default"
    },
    subtitleFont: {
      fontSize: "10px",
      fontWeight: "normal",
      fontStyle: "normal",
      fontFamily: "sans-serif",
      cursor: "default"
    },
  };

  const combinedOptions = mergeOptions.call(this, defaultOptions, 'footerOptions', options);
  const { x, y, align, spacing, itemStyle } = combinedOptions;
  const ownTitle = partStyle(itemStyle, "title");
  const ownSubtitle = partStyle(itemStyle, "subtitle");
  const titleFont = { ...combinedOptions.titleFont, ...ownTitle.style };
  const subtitleFont = { ...combinedOptions.subtitleFont, ...ownSubtitle.style };
  title = ownTitle.text ?? title;
  subtitle = ownSubtitle.text ?? subtitle;

  // Determine text align and anchor based on the provided align; the footer is
  // drawn in the SVG itself, so the positions include the left margin
  const { xPos, textAnchor } = titleAlignment(this, align, x, true);

  // Calculate y align for title and subtitle based on the SVG height and bottom margin
  const titleYPos = this.height - this.margin.bottom + y - 20;
  const subtitleYPos = titleYPos + spacing;

  if (title) {
    this.svg.append("text")
      .attr("data-component", "clusterFooter")
      .attr("data-part", "title")
      .property("__text__", title)
      .attr("x", xPos)
      .attr("y", titleYPos)
      .attr("text-anchor", textAnchor)
      .call(styleFontText, title, titleFont, defaultOptions.titleFont);
  }

  // Add subtitle to the SVG if provided
  if (subtitle) {
    this.svg.append("text")
      .attr("data-component", "clusterFooter")
      .attr("data-part", "subtitle")
      .property("__text__", subtitle)
      .attr("x", xPos)
      .attr("y", subtitleYPos)
      .attr("text-anchor", textAnchor)
      .call(styleFontText, subtitle, subtitleFont, defaultOptions.subtitleFont);
  }

  return this;
};
