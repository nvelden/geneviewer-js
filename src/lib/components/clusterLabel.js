// The cluster label: container.prototype.clusterLabel.
import { container } from "../container.js";
import { applyMove, extractAdditionalOptions, partStyle, setStyleFromOptions } from "../style.js";
import { parseAndStyleText, wrap } from "../text.js";
import { mergeOptions, themeTextScale } from "../util.js";

// The cluster label is drawn in the left or right margin of the cluster. Returns
// that margin as { left: width } or { right: width }, set before the container is
// created. Width: of the label (user) > margin (user, GC_grid) > of the label
// (theme) > margin (theme) > 100px (times the text size of the theme).
export function clusterLabelMargin(containerOptions, labelOptions, themeOptions = {}) {
  const themeLabelOptions = themeOptions?.clusterLabelOptions ?? {};
  const position = labelOptions?.position ?? themeLabelOptions.position ?? "left";
  const width = labelOptions?.width ??
    containerOptions?.margin?.[position] ??
    themeLabelOptions.width ??
    themeOptions?.containerOptions?.margin?.[position] ??
    `${100 * themeTextScale(themeOptions)}px`;
  return { [position]: width };
}

container.prototype.clusterLabel = function (title, show = true, options = {}) {
  if (!show) {
    return this;
  }

  // Default options
  const defaultOptions = {
    x: 0,
    y: 0,
    position: 'left',
    align: 'center',
    width: null, // the margin the label is drawn in, see clusterLabelMargin()
    wrapLabel: true,
    wrapOptions: {},
    fontSize: "12px",
    fontStyle: "normal",
    fontWeight: "bold",
    fontFamily: "sans-serif",
    cursor: "default",
    subtitle: null,
    spacing: null, // Between the last line of the title and the subtitle; null: from the font sizes
    subtitleFont: {
      fontSize: "11px",
      fontStyle: "normal",
      fontWeight: "normal",
      fontFamily: "sans-serif",
      cursor: "default"
    }
  };

  // Merge the options using the generic function; a title or subtitle with a
  // style of its own (itemStyle) takes it on top
  const { itemStyle, ...mergedOptions } = mergeOptions.call(this, defaultOptions, 'clusterLabelOptions', options);
  const ownTitle = partStyle(itemStyle, "title");
  const ownSubtitle = partStyle(itemStyle, "subtitle");
  const combinedOptions = {
    ...mergedOptions,
    ...ownTitle.style,
    subtitle: ownSubtitle.text ?? mergedOptions.subtitle,
    subtitleFont: { ...mergedOptions.subtitleFont, ...ownSubtitle.style }
  };
  title = ownTitle.text ?? title;

  const {
    x,
    y,
    position,
    align,
    wrapLabel,
    wrapOptions,
    fontSize,
    fontStyle,
    fontWeight,
    fontFamily,
    cursor,
    subtitle,
    spacing,
    subtitleFont
  } = combinedOptions;

  const additionalwrapOptions = extractAdditionalOptions(wrapOptions, defaultOptions.wrapOptions);
  // Extract additional options that are not in defaultOptions
  const additionalOptions = extractAdditionalOptions(combinedOptions, defaultOptions);

  const titleFont = {
    size: fontSize,
    style: fontStyle,
    weight: fontWeight,
    family: fontFamily,
    cursor: cursor
  };


  // calculate middle y position
  const adjustedHeight = this.height - this.margin.top - this.margin.bottom;
  const middleY = this.margin.top + adjustedHeight / 2 + y;
  const titleWidth = position === 'left' ? this.margin.left - x : this.margin.right - x;

  // Align the lines of the label to the left, centre or right of the margin
  const alignShare = { left: 0, right: 1 }[align] ?? 0.5;
  const textAnchor = { left: "start", right: "end" }[align] ?? "middle";

  let xposition;
  if (position === 'left') {
    xposition = this.margin.left * alignShare + x;  // title is in the left margin
  } else {  // 'right'
    xposition = this.width - this.margin.right * (1 - alignShare) - x;  // title is in the right margin
  }

  let clusterTitle = this.svg.append("text")
      .attr("data-component", "clusterLabel")
    .attr("data-part", "title")
    .property("__text__", title)
    .attr("x", xposition)
    .attr("y", middleY)
    .attr("text-anchor", textAnchor)
    .attr("dominant-baseline", "central")  // Vertically center text
    .style("font-size", fontSize)
    .style("font-style", fontStyle)
    .style("font-weight", fontWeight)
    .style("font-family", fontFamily)
    .style("cursor", cursor)
    .each(function () {
      const currentElement = d3.select(this);

      if (!wrapLabel) {
        // Set the text and apply styles only if wrapLabel is false
        parseAndStyleText(title, currentElement, titleFont);
      } else {
        currentElement.text(title);
        // If wrapLabel is true, wrap the text; wrap() reads the <b>, <i> and <u> tags
        wrap(currentElement, titleWidth, wrapOptions);
      }
      setStyleFromOptions(currentElement, additionalOptions);
    });

  if (subtitle) {
    const additionalOptionsSubtitleFont = extractAdditionalOptions(subtitleFont, defaultOptions.subtitleFont);
    const subtitleStyle = {
      size: subtitleFont.fontSize,
      style: subtitleFont.fontStyle,
      weight: subtitleFont.fontWeight,
      family: subtitleFont.fontFamily,
      cursor: subtitleFont.cursor
    };

    const clusterSubtitle = this.svg.append("text")
      .attr("data-component", "clusterLabel")
      .attr("data-part", "subtitle")
      .property("__text__", subtitle)
      .attr("x", xposition)
      .attr("y", middleY)
      .attr("text-anchor", textAnchor)
      .attr("dominant-baseline", "central")
      .style("font-size", subtitleFont.fontSize)
      .style("font-style", subtitleFont.fontStyle)
      .style("font-weight", subtitleFont.fontWeight)
      .style("font-family", subtitleFont.fontFamily)
      .style("cursor", subtitleFont.cursor)
      .each(function () {
        const currentElement = d3.select(this);

        if (!wrapLabel) {
          parseAndStyleText(subtitle, currentElement, subtitleStyle);
        } else {
          currentElement.text(subtitle);
          wrap(currentElement, titleWidth, wrapOptions);
        }
        setStyleFromOptions(currentElement, additionalOptionsSubtitleFont);
      });

    // The subtitle starts spacing below the last line of the title, and the two
    // are centred together on the middle of the cluster. By default the spacing
    // is 1.2 times the mean font size of the two
    const titleLines = labelLineOffsets(clusterTitle);
    const subtitleLines = labelLineOffsets(clusterSubtitle);
    const lineSpacing = spacing ?? 1.2 * (titleLines.fontSize + subtitleLines.fontSize) / 2;
    const titleY = middleY -
      (titleLines.first + titleLines.last + lineSpacing - subtitleLines.first + subtitleLines.last) / 2;
    setLabelY(clusterTitle, titleY);
    setLabelY(clusterSubtitle, titleY + titleLines.last + lineSpacing - subtitleLines.first);
  }
  applyMove(clusterTitle, ownTitle.style);
  this.svg.selectAll('text[data-component="clusterLabel"][data-part="subtitle"]')
    .call(applyMove, ownSubtitle.style);

  return this;
};

// The font size of a label and the offsets in pixels of its first and last
// line from its y position: the lines of a wrapped label are moved with dy (in em)
function labelLineOffsets(label) {
  const fontSize = parseFloat(getComputedStyle(label.node()).fontSize);
  const lines = label.selectAll("tspan.wrap-line").nodes();
  if (!lines.length) {
    return { fontSize, first: 0, last: 0 };
  }
  const offset = line => (parseFloat(line.getAttribute("dy")) || 0) * fontSize;
  return { fontSize, first: offset(lines[0]), last: offset(lines[lines.length - 1]) };
}

// Moves a label and its wrapped lines to a new y position
function setLabelY(label, y) {
  label.attr("y", y);
  label.selectAll("tspan.wrap-line").attr("y", y);
}
