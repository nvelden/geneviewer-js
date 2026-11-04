// The chart and cluster titles: container.prototype.title.
import { container } from "../container.js";
import { applyMove, camelToKebab, extractAdditionalOptions, partStyle, setStyleFromOptions } from "../style.js";
import { parseAndStyleText } from "../text.js";
import { mergeOptions, themeTextScale } from "../util.js";

// The x position and text anchor of a title or footer aligned "left", "right"
// or "center" between the left and right margins, moved by x. inSvg: drawn in
// the SVG itself, so the position includes the left margin; otherwise drawn
// in a group translated by the left margin.
export function titleAlignment(container, align, x, inSvg = false) {
  const { width, margin } = container;
  switch (align) {
    case "left":
      return { xPos: inSvg ? margin.left + x : x, textAnchor: "start" };
    case "right":
      return {
        xPos: (inSvg ? width - margin.right : width - margin.left - margin.right) + x,
        textAnchor: "end"
      };
    default: {
      const effectiveWidth = width - margin.left - margin.right;
      return {
        xPos: (inSvg ? margin.left + (effectiveWidth / 2) : (effectiveWidth / 2)) + x,
        textAnchor: "middle"
      };
    }
  }
}

export function styleFontText(selection, text, font, defaultFont) {
  for (const key of Object.keys(defaultFont)) {
    selection.style(camelToKebab(key), font[key]);
  }
  const additionalOptions = extractAdditionalOptions(font, defaultFont);
  selection.each(function () {
    const currentElement = d3.select(this);
    parseAndStyleText(text, currentElement, font);
    setStyleFromOptions(currentElement, additionalOptions);
  });
  applyMove(selection, font);
}

// themeOptionsKey: "titleOptions" for the chart title, "clusterTitleOptions" for a cluster
container.prototype.title = function (title, subtitle, show = true, options = {}, themeOptionsKey = "titleOptions") {

  // Return early if neither title nor subtitle is provided
  if (!title && !subtitle) {
    return this;
  }

  if (!show) {
    return this;
  }

  // Default options for title and subtitle; the position and spacing grow with
  // the text size of the theme
  const size = themeTextScale(this.themeOptions);
  const defaultOptions = {
    x: 0,
    y: 20 * size,
    align: "center",
    spacing: 20 * size, // Default spacing between title and subtitle
    titleFont: {
      fontSize: "16px",
      fontStyle: "normal",
      fontWeight: "bold",
      textDecoration: "normal",
      fontFamily: "sans-serif",
      cursor: "default"
    },
    subtitleFont: {
      fontSize: "14px",
      fontStyle: "normal",
      fontWeight: "normal",
      textDecoration: "none",
      fontFamily: "sans-serif",
      cursor: "default"
    },
  };

  const combinedOptions = mergeOptions.call(this, defaultOptions, themeOptionsKey, options);
  const { x, y, align, spacing, itemStyle } = combinedOptions;
  const ownTitle = partStyle(itemStyle, "title");
  const ownSubtitle = partStyle(itemStyle, "subtitle");
  const titleFont = { ...combinedOptions.titleFont, ...ownTitle.style };
  const subtitleFont = { ...combinedOptions.subtitleFont, ...ownSubtitle.style };
  title = ownTitle.text ?? title;
  subtitle = ownSubtitle.text ?? subtitle;

  // Determine text align and anchor based on the provided align
  const { xPos, textAnchor } = titleAlignment(this, align, x);

  var g = this.svg.append("g")
    .attr("data-component", themeOptionsKey === "clusterTitleOptions" ? "clusterTitle" : "title")
    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

  if (title) {
    // Add title to the SVG
    g.append("text")
      .attr("data-part", "title")
      .property("__text__", title)
      .attr("x", xPos)
      .attr("y", y + (this.margin.top / 2))
      .attr("text-anchor", textAnchor)
      .call(styleFontText, title, titleFont, defaultOptions.titleFont);
  }

  if (subtitle) {
    // Add subtitle to the SVG
    g.append("text")
      .attr("data-part", "subtitle")
      .property("__text__", subtitle)
      .attr("x", xPos)
      .attr("y", y + (this.margin.top / 2) + spacing)
      .attr("text-anchor", textAnchor)
      .call(styleFontText, subtitle, subtitleFont, defaultOptions.subtitleFont);
  }

  return this;
};
