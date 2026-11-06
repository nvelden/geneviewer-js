// Links between clusters and their colour bar.
import { extractAdditionalOptions, setStyleFromOptions } from "./style.js";
import { getUniqueId, mergeOptions, toRows } from "./util.js";

function getLinkCoordinates(graphContainer, data) {

    const links = data.map(item => {
        // Construct the selectors from the data
        const selector1 = `.link-marker[cluster='${item.cluster1}'][linkID='${item.linkID}'][position='${item.start1}']`;
        const selector2 = `.link-marker[cluster='${item.cluster2}'][linkID='${item.linkID}'][position='${item.start2}']`;
        const selector3 = `.link-marker[cluster='${item.cluster1}'][linkID='${item.linkID}'][position='${item.end1}']`;
        const selector4 = `.link-marker[cluster='${item.cluster2}'][linkID='${item.linkID}'][position='${item.end2}']`;

        // Get the elements within graphContainer using D3
        const element1 = graphContainer.select(selector1).node();
        const element2 = graphContainer.select(selector2).node();
        const element3 = graphContainer.select(selector3).node();
        const element4 = graphContainer.select(selector4).node();

        // Check if elements exist
        if (!element1 || !element2 || !element3 || !element4) {
            return null;
        }

        // Get bounding rectangles
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();
        const rect3 = element3.getBoundingClientRect();
        const rect4 = element4.getBoundingClientRect();

        // Adjust the coordinates relative to the graphContainer's position
        const containerRect = graphContainer.node().getBoundingClientRect();
        const adjustRect = rect => ({
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top
        });

        // Determine the strand based on the x-coordinate positions
        const strand1 = item.start1 <= item.end1 ? "forward" : "reverse";
        const strand2 = item.start2 <= item.end2 ? "forward" : "reverse";
        const groupColor1 = element1.getAttribute("groupColor")
        const groupColor2 = element2.getAttribute("groupColor")

        return [
            { startPoint: adjustRect(rect1), endPoint: adjustRect(rect2), strand: strand1, groupColor: groupColor1 },
            { startPoint: adjustRect(rect3), endPoint: adjustRect(rect4), strand: strand2, groupColor: groupColor2 }
        ];
    });

    // Keep one entry per link (null if it cannot be drawn) so indexes match the link data
    return links;
};

// Link colours, shared by the links and the colour bar
const defaultLinkColors = {
  normalColor: "#969696",
  invertedColor: "#d62728",
  // Colour of a link with a measure of 0, e.g. the background on a dark chart
  lowColor: "#FFFFFF",
  // Measures of the lightest and the full link colour
  vmin: 0,
  vmax: 100
};

// Colour of a link by its measure: from nearly white (10%
// of the colour) at vmin to the colour at vmax; measures outside are clamped
function linkColorScale(lowColor, color, vmin, vmax) {
  const nearlyWhite = d3.interpolateRgb(lowColor, color)(0.1);
  return d3.scaleLinear()
    .domain([vmin, vmax])
    .range([nearlyWhite, color])
    .interpolate(d3.interpolateRgb)
    .clamp(true);
}

export function makeLinks(graphContainer, links, themeOptions = {}) {

    if (!links || links.length === 0) {
        return;
    }
    // Default options for title and subtitle
    const defaultOptions = {
      curve: true,
      ...defaultLinkColors,
      useGroupColors: false,
      color: "lightgrey",
      measure: "identity",
      label: true,
      // Where the measure is written: "gene", with the label of the gene, or
      // "link", in the middle of the link where it fits
      labelPosition: "gene",
      linkStyle: {
        stroke: "none",
        fillOpacity: 0.8
      },
      labelStyle: {
        fontSize: "10px",
        fontStyle: "normal",
        fontFamily: "sans-serif",
        cursor: "default",
        textAnchor: "middle",
        alignmentBaseline: "middle"
      }
    };

  const graphRect = graphContainer.node().getBoundingClientRect();
  // Create a container div for the SVG
  const svgContainer = graphContainer.insert("div", ":first-child")
        .style("position", "relative")
        .style("width", "100%")
        .style("height", "100%");


  // Create an SVG element inside graphContainer
  var lineSvg = svgContainer.insert("svg", ":first-child")
      .attr("width", graphRect.width)
      .attr("height", graphRect.height)
      .classed("GeneLink", true)
      .style("position", "absolute")
      .style("z-index", 1);

    // Measures written on the links, drawn above all of them; boxes of those
    // placed, so two never overlap
    const linkLabels = [];

    links.forEach(function(link) {

        const combinedOptions = mergeOptions(defaultOptions, "linkOptions", link.options, themeOptions)
        const { curve, invertedColor, normalColor, lowColor, vmin, vmax, useGroupColors, color, linkStyle, measure } = combinedOptions;

        const additionalOptionsLinkStyle = extractAdditionalOptions(linkStyle, defaultOptions.linkStyle);

        const linkData = toRows(link.data)
        const coordinates = getLinkCoordinates(graphContainer, linkData);

      // Add svg paths
      coordinates.forEach(function(coordinate, index) {

                if (!coordinate) {
                    return;
                }

                const baseColor = coordinate[0].strand == coordinate[1].strand ? d3.rgb(normalColor) : d3.rgb(invertedColor)
                var colorScale = linkColorScale(lowColor, baseColor, vmin, vmax);
                const identity = combinedOptions.measure === "none" ? 100 : (link.data?.[measure]?.[index] ?? 100);
                const linkColor = useGroupColors ? coordinate[0].groupColor : colorScale(identity)

            lineSvg.append("path")
                .attr("data-component", "links")
                .datum(linkData[index])
                .attr("d", createLinkerPath(coordinate[0], coordinate[1], curve))
                .style("fill", linkColor)
                .style("stroke", linkStyle.stroke)
                .style("fill-opacity", linkStyle.fillOpacity)
                .classed("GeneLink", true)
                .each(function () {
                    const currentElement = d3.select(this);
                    setStyleFromOptions(currentElement, additionalOptionsLinkStyle);
                });

            const value = link.data?.[measure]?.[index];
            if (combinedOptions.label && combinedOptions.labelPosition === "link" &&
                measure !== "none" && value != null && Number.isFinite(+value)) {
              // Halfway down, the edges of the link are halfway between their
              // ends, for curves as for straight links
              const left = (coordinate[0].startPoint.x + coordinate[0].endPoint.x) / 2;
              const right = (coordinate[1].startPoint.x + coordinate[1].endPoint.x) / 2;
              linkLabels.push({
                x: (left + right) / 2,
                y: (coordinate[0].startPoint.y + coordinate[0].endPoint.y) / 2,
                width: Math.abs(right - left),
                text: `${parseFloat((+value).toFixed(1))}%`,
                // Dark text on a light link, white on a dark one
                fill: d3.hsl(d3.color(linkColor) ?? "#ffffff").l < 0.55 ? "#ffffff" : "#333333",
                datum: linkData[index],
                labelStyle: combinedOptions.labelStyle,
                defaults: defaultOptions.labelStyle
              });
            }

    });
  });

  // The measures, each where it fits within its link and clear of the others;
  // zoomed in, links widen and more of them fit
  const labelGroup = lineSvg.append("g").attr("class", "link-measure-labels");
  const placed = [];
  linkLabels
    .sort((a, b) => b.width - a.width)
    .forEach(item => {
      const { labelStyle } = item;
      const text = labelGroup.append("text")
        .attr("class", "link-measure")
        .attr("data-component", "links")
        .datum(item.datum)
        .attr("x", item.x)
        .attr("y", item.y)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .style("font-size", labelStyle.fontSize)
        .style("font-style", labelStyle.fontStyle)
        .style("font-family", labelStyle.fontFamily)
        .style("fill", item.fill)
        .style("pointer-events", "none")
        .text(item.text)
        .each(function () {
          const extra = extractAdditionalOptions(labelStyle, item.defaults);
          delete extra.labelPosition;
          setStyleFromOptions(d3.select(this), extra);
        });
      const box = text.node().getBBox();
      const clear = placed.every(other =>
        box.x + box.width < other.x || other.x + other.width < box.x ||
        box.y + box.height < other.y || other.y + other.height < box.y);
      if (box.width + 4 > item.width || !clear) {
        text.remove();
      } else {
        placed.push(box);
      }
    });

}

function createLinkerPath(link1, link2, curve = true) {
  var path = d3.path();

  if(curve){
  var midY1 = (link1.startPoint.y + link1.endPoint.y) / 2;
      path.moveTo(link1.startPoint.x, link1.startPoint.y);
      path.bezierCurveTo(link1.startPoint.x, midY1, link1.endPoint.x, midY1, link1.endPoint.x, link1.endPoint.y);

      // Line to second curve's end point
      path.lineTo(link2.endPoint.x, link2.endPoint.y);

      // Second Bezier curve in reverse
      var midY2 = (link2.startPoint.y + link2.endPoint.y) / 2;
      path.bezierCurveTo(link2.endPoint.x, midY2, link2.startPoint.x, midY2, link2.startPoint.x, link2.startPoint.y);


  } else {
        path.moveTo(link1.startPoint.x, link1.startPoint.y);
        path.lineTo(link1.endPoint.x, link1.endPoint.y);
        path.lineTo(link2.endPoint.x, link2.endPoint.y);
        path.lineTo(link2.startPoint.x, link2.startPoint.y);
  }
  // Close the path
  path.closePath();

      return path.toString();
};

export function getClusterLinks(data, cluster) {

    if (!data || data.length === 0) {
        return [];
    }

    const linksCluster1 = data.filter(item => item.cluster1 === cluster);
    const linksCluster2 = data.filter(item => item.cluster2 === cluster);
    const clusterLinks = linksCluster1.concat(linksCluster2);

    return clusterLinks;
}

// Which link colours a chart has, over all link sets: like makeLinks(), a link
// is inverted (invertedColor) when its two ends are on different strands
function linkColorTypes(links) {
    let normal = false;
    let inverted = false;

    links.forEach(link => {
        const { start1 = [], end1 = [], start2 = [], end2 = [] } = link.data;
        for (let i = 0; i < start1.length; i++) {
            if ((start1[i] <= end1[i]) === (start2[i] <= end2[i])) {
                normal = true;
            } else {
                inverted = true;
            }
        }
    });

    return { normal, inverted };
}

// The settings of the colour bar of a chart's links, or null when it has none
export function colorBarSettings(links, themeOptions = {}) {

    // Default options for the color bars (both normal and inverted)
    const defaultOptions = {
        colorBar: true,
        ...defaultLinkColors,
        measure: "identity",
        // Right of the plot area, which ends 50 pixels from the edge: the two
        // bars of normal and inverted links stay clear of the genes
        margin: { top: 5, right: 19, bottom: 0, left: 50 },
        colorBarOptions: {
            // Where the bar goes: a corner of the plot area or "legend", and
            // whether it stands up or lies down
            position: "bottomright",
            orientation: "vertical",
            // Labels of a lying bar: "inline", on one line with it, or "below",
            // under it with ticks; always inline in the legend
            labels: "inline",
            // In the legend: before the groups ("left") or after them ("right")
            legendSide: "left",
            // From the corner; null: 24 pixels up from the bottom for a
            // standing bar, otherwise 0
            x: 0,
            y: null,
            title: true,
            // null: 10 by 60 pixels standing, 80 by 8 lying inline, 120 by 8
            // lying with the labels below
            width: null,
            height: null,
            labelOptions: {
              fontSize: 8,
              fontFamily: "sans-serif",
              xOffset: 2,
              yOffset: 0
            },
            titleOptions: {
              fontSize: 10,
              fontFamily: "sans-serif",
              xOffset: 2,
              yOffset: 0
            },
            barOptions: {
              stroke: "#000",
              strokeWidth: 0.5,
              opacity: 1
            },
        }
    };

    // Theme link options under the user options, as in makeLinks()
    const linkOptions = mergeOptions(defaultOptions, "linkOptions", links[0].options, themeOptions);
    const { colorBarOptions } = linkOptions;

    if (linkOptions.colorBar === false || linkOptions.measure === 'none') {
      return null;
    }
    if (!links[0].data.hasOwnProperty('identity') && !links[0].data.hasOwnProperty('similarity')) {
      return null;
    }

    // Only draw a gradient for the link colours on the chart
    const { normal: hasNormal, inverted: hasInverted } = linkColorTypes(links);
    if (!hasNormal && !hasInverted) {
      return null;
    }

    const defaults = defaultOptions.colorBarOptions;
    return {
      linkOptions,
      colorBarOptions,
      // In the legend the bar always lies down
      horizontal: colorBarOptions.position === "legend" || colorBarOptions.orientation === "horizontal",
      hasNormal,
      hasInverted,
      additional: {
        label: extractAdditionalOptions(colorBarOptions.labelOptions, defaults.labelOptions),
        title: extractAdditionalOptions(colorBarOptions.titleOptions, defaults.titleOptions),
        bar: extractAdditionalOptions(colorBarOptions.barOptions, defaults.barOptions)
      }
    };
}

// Draws the colour bar of colorBarSettings() into g. A standing bar has the
// normal bar's top left corner at (0, 0), with the inverted bar left of it and
// the labels and title right of it. A lying bar is one line: the title, the
// lowest measure, the bars (the inverted below the normal) and the highest.
// `size` overrides the width, height and font of the settings, as for the
// legend. Returns the width and height of the bar itself.
export function drawColorBar(g, settings, size = {}) {
    const { linkOptions, colorBarOptions, horizontal, hasNormal, hasInverted, additional } = settings;
    const { labelOptions, titleOptions, barOptions } = colorBarOptions;
    const labelsBelow = horizontal && (size.labels ?? colorBarOptions.labels) === "below";
    const width = parseFloat(size.width ?? colorBarOptions.width ?? (horizontal ? (labelsBelow ? 120 : 80) : 10));
    const height = parseFloat(size.height ?? colorBarOptions.height ?? (horizontal ? 8 : 60));
    const labelFont = size.fontSize ?? labelOptions.fontSize;
    const titleFont = size.fontSize ?? titleOptions.fontSize;
    const fontFamily = size.fontFamily;
    // An outline for a bar without one, as the legend gives white markers
    const stroke = size.outline && (!barOptions.stroke || barOptions.stroke === "none")
      ? size.outline : barOptions.stroke;
    const strokeWidth = stroke === barOptions.stroke ? barOptions.strokeWidth : 0.5;

    const defs = g.append("defs");
    const minValue = linkOptions.vmin;
    const maxValue = linkOptions.vmax;

    // A gradient bar from lowColor to color: maxValue at the top of a standing
    // bar, at the right of a lying one
    const drawBar = (baseId, color, x, y) => {
        const gradientId = getUniqueId(baseId);
        const gradient = defs.append("linearGradient")
            .attr("id", gradientId)
            .attr("gradientTransform", horizontal ? null : "rotate(90)");
        const colorScale = linkColorScale(linkOptions.lowColor, color, minValue, maxValue);
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colorScale(horizontal ? minValue : maxValue));
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colorScale(horizontal ? maxValue : minValue));

        g.append("rect")
            .attr("x", x)
            .attr("y", y)
            .attr("width", width)
            .attr("height", height)
            .style("fill", `url(#${gradientId})`)
            .style("stroke", stroke)
            .style("stroke-width", strokeWidth)
            .style("opacity", barOptions.opacity)
            .each(function () {
                setStyleFromOptions(d3.select(this), additional.bar);
            });
    };

    const addText = (text, options, fontSize, style) => g.append("text")
        .attr("font-size", fontSize)
        .style("font-family", fontFamily ?? options.fontFamily)
        .text(text)
        .each(function () {
            setStyleFromOptions(d3.select(this), style);
        });

    if (!horizontal) {
      // The title, turned, right of the labels
      if (colorBarOptions.title !== false) {
        addText(linkOptions.measure, titleOptions, titleFont, additional.title)
          .attr("x", width + titleOptions.xOffset)
          .attr("y", height / 2 + titleOptions.yOffset + 10)
          .attr("transform", `rotate(-90, ${width + titleOptions.xOffset}, ${height / 2 + titleOptions.yOffset})`)
          .attr("alignment-baseline", "bottom")
          .attr("text-anchor", "middle");
      }

      // The normal bar sits next to the labels, the inverted bar left of it;
      // with only inverted links, the inverted bar takes the normal bar's place
      if (hasNormal) {
        drawBar("linear-gradient", linkOptions.normalColor, 0, 0);
      }
      if (hasInverted) {
        drawBar("reverse-gradient", linkOptions.invertedColor, hasNormal ? -width : 0, 0);
      }

      addText(maxValue + '%', labelOptions, labelFont, additional.label)
        .attr("x", width + labelOptions.xOffset)
        .attr("y", -labelOptions.yOffset)
        .attr("alignment-baseline", "middle");
      addText(minValue + '%', labelOptions, labelFont, additional.label)
        .attr("x", width + labelOptions.xOffset)
        .attr("y", height + labelOptions.yOffset)
        .attr("alignment-baseline", "middle");
      return { width: (hasNormal && hasInverted ? 2 : 1) * width, height };
    }

    // Lying down, the title stands out from the labels
    const barsHeight = (hasNormal && hasInverted ? 2 : 1) * height;
    const addTitle = () => addText(linkOptions.measure, titleOptions, titleFont, {
      fontWeight: "bold", ...additional.title
    });
    const drawBars = (x, y) => {
      if (hasNormal) {
        drawBar("linear-gradient", linkOptions.normalColor, x, y);
      }
      if (hasInverted) {
        drawBar("reverse-gradient", linkOptions.invertedColor, x, y + (hasNormal ? height : 0));
      }
    };

    if (labelsBelow) {
      // The title above the bars, and ticks with their measures below them
      let top = 0;
      if (colorBarOptions.title !== false) {
        const title = addTitle()
          .attr("x", 0)
          .attr("y", titleOptions.yOffset)
          .attr("dominant-baseline", "hanging");
        top = title.node().getBBox().height + 3;
      }
      drawBars(0, top);
      const scale = d3.scaleLinear().domain([minValue, maxValue]).range([0, width]);
      const tickLength = 3;
      const tickColor = stroke && stroke !== "none" ? stroke : "#555555";
      // The most ticks whose measures fit side by side, at least the two ends
      const textWidth = text => {
        const node = addText(text, labelOptions, labelFont, additional.label);
        const textLength = node.node().getComputedTextLength();
        node.remove();
        return textLength;
      };
      const fits = values => values.length > 1 && values.every((value, i) => i === 0 ||
        scale(value) - scale(values[i - 1]) >
          (textWidth(values[i - 1] + '%') + textWidth(value + '%')) / 2 + 4);
      const ticks = [5, 4, 3, 2].map(count => scale.ticks(count)).find(fits) ?? [minValue, maxValue];
      ticks.forEach(value => {
        g.append("line")
          .attr("x1", scale(value)).attr("x2", scale(value))
          .attr("y1", top + barsHeight).attr("y2", top + barsHeight + tickLength)
          .style("stroke", tickColor)
          .style("stroke-width", 0.5);
        addText(value + '%', labelOptions, labelFont, additional.label)
          .attr("x", scale(value))
          .attr("y", top + barsHeight + tickLength + 1 + labelOptions.yOffset)
          .attr("dominant-baseline", "hanging")
          .attr("text-anchor", "middle");
      });
      return { width, height: barsHeight };
    }

    // Inline: everything on one line through the middle of the bars
    const middle = barsHeight / 2;
    const gap = 4;
    let x = 0;
    const placeOnLine = (node, yOffset) => {
      node.attr("x", x)
        .attr("y", middle + yOffset)
        .attr("dominant-baseline", "central");
      x += node.node().getComputedTextLength() + gap;
    };

    if (colorBarOptions.title !== false) {
      placeOnLine(addTitle(), titleOptions.yOffset);
      x += gap;
    }
    placeOnLine(addText(minValue + '%', labelOptions, labelFont, additional.label), labelOptions.yOffset);
    drawBars(x, 0);
    x += width + gap;
    placeOnLine(addText(maxValue + '%', labelOptions, labelFont, additional.label), labelOptions.yOffset);
    return { width, height: barsHeight };
}

// Draws the colour bar of the links in a corner of the plot area, unless it
// goes in the legend and the legend has drawn it (inLegend)
export function makeColorBar(graphContainer, links, themeOptions = {}, inLegend = false) {

    const settings = colorBarSettings(links, themeOptions);
    if (!settings) {
      return null;
    }
    const { linkOptions, colorBarOptions } = settings;
    if (colorBarOptions.position === "legend" && inLegend) {
      return null;
    }
    // Without a legend, a bar meant for it goes in the default corner, standing
    // unless it is set to lie
    const position = colorBarOptions.position === "legend" ? "bottomright" : colorBarOptions.position;
    const horizontal = colorBarOptions.orientation === "horizontal";

    const graphRect = graphContainer.node().getBoundingClientRect();

    // Create a container div for the SVG
    const svgContainer = graphContainer.insert("div", ":first-child")
        .style("position", "relative")
        .style("width", "100%")
        .style("height", "100%");

    // Create an SVG element inside the newly created container
    const svg = svgContainer.append("svg")
        .attr("width", graphRect.width)
        .attr("height", graphRect.height)
        .classed("color-bar", true)
        .attr("data-component", "links")
        .style("position", "absolute");

    // Append a group element to the SVG and transform based on margins
    const g = svg.append("g")
        .attr("transform", `translate(${linkOptions.margin.left}, ${linkOptions.margin.top})`);

    const contentWidth = graphRect.width - linkOptions.margin.left - linkOptions.margin.right;
    const contentHeight = graphRect.height - linkOptions.margin.top - linkOptions.margin.bottom;

    const top = position === "topleft" || position === "topright";
    const left = position === "topleft" || position === "bottomleft";
    // A standing bar keeps clear of the bottom row's labels; a lying bar is
    // low enough to sit at the edge
    const x = colorBarOptions.x ?? 0;
    const y = colorBarOptions.y ?? (top || horizontal ? 0 : 24);

    const bar = g.append("g");
    const { width, height } = drawColorBar(bar, { ...settings, horizontal });

    if (position === "bottomright" && !horizontal) {
      // The bar itself x and y in from the corner, its labels and title right of it
      bar.attr("transform", `translate(${contentWidth - width - x}, ${contentHeight - height - y})`);
    } else {
      // The whole bar, with its labels and title, x and y in from the corner
      const box = bar.node().getBBox();
      const tx = left ? x - box.x : contentWidth - x - (box.x + box.width);
      const ty = top ? y - box.y : contentHeight - y - (box.y + box.height);
      bar.attr("transform", `translate(${tx}, ${ty})`);
    }
    return svg;
}
