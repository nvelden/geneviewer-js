// The legend: container.prototype.legend.
import { getColorScale, getPatternScale } from "../color.js";
import { container } from "../container.js";
import { drawColorBar } from "../links.js";
import { applyMove, extractAdditionalOptions, isWhite, setStyleFromOptions } from "../style.js";
import { computeSize, mergeOptions } from "../util.js";

container.prototype.legendData = function (data) {

  this.data = [...new Set(data)];

  return this;

};

// colorBar: the colorBarSettings() of the links when their colour bar goes in
// the legend; it is drawn as the first item
container.prototype.legend = function (group, show = true, parentId = null, options = {}, colorBar = null) {
  if (!show) {
    return this;
  }

  const defaultOptions = {
    x: 0,
    y: 0,
    width: null, // Default width set to null
    orientation: "horizontal",
    align: "left",
    adjustHeight: true,
    order: [],
    cornerRadius: 0,
    groupStyle: {},
    legendOptions: {
      cursor: "pointer",
      colorScheme: null,
      customColors: null,
      pattern: null
    },
    legendTextOptions: {
      cursor: "pointer",
      textAnchor: "start",
      dy: ".35em",
      fontSize: "12px",
      fontFamily: "sans-serif"
    }
  };

  const combinedOptions = mergeOptions.call(this, defaultOptions, 'legendOptions', options);
  const { x, y, width, orientation, align, adjustHeight, order, cornerRadius, legendOptions, legendTextOptions, groupStyle, itemStyle = [], editable = false } = combinedOptions;

  const additionalLegendOptions = extractAdditionalOptions(legendOptions, defaultOptions.legendOptions);
  const additionalLegendTextOptions = extractAdditionalOptions(legendTextOptions, defaultOptions.legendTextOptions);

  const svgLegend = this.svg;
  const parentWidth = computeSize(width, svgLegend.node().getBoundingClientRect().width) ||
    svgLegend.node().getBoundingClientRect().width;

  let uniqueGroups = [...new Set(this.data.map(d => d[group]))];
  uniqueGroups = uniqueGroups.filter(color => color !== null);

  const colorScale = getColorScale(legendOptions.colorScheme, legendOptions.customColors, uniqueGroups);
  const patternScale = getPatternScale(this.svg, legendOptions.pattern, uniqueGroups, colorScale, "legend");

  // Separate special groups ("Other", "No Hit", "Unknown") from the rest
  const specialGroups = ["Other", "No Hit", "Unknown"];
  const regularGroups = uniqueGroups.filter(group => !specialGroups.includes(group));
  const specialGroupsInData = specialGroups.filter(group => uniqueGroups.includes(group));
  // Reassemble uniqueGroups with special groups placed last
  uniqueGroups = [...regularGroups, ...specialGroupsInData];

  if (order && order.length > 0) {
    uniqueGroups = order
      .filter(item => uniqueGroups.includes(item))
      .concat(uniqueGroups.filter(item => !order.includes(item)));
  }

  if (!uniqueGroups.length) {
    console.error(`Error: No labels provided and the group "${group}" does not exist in the data.`);
    return;
  }

  const legendSize = parseFloat(legendTextOptions.fontSize);
  const legendPadding = legendSize / 2;

  let currentX = x;
  let currentY = y;
  // Row and horizontal extent of each item, to align the rows afterwards
  const itemExtents = [];

  var g = this.svg.append("g")
    .attr("data-component", "legend")
    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

  // The colour bar of the links, lying down in the text of the legend, before
  // the groups (legendSide "left") or after them ("right"), set apart from
  // them by a wider gap; it hides no genes when clicked
  const barSide = colorBar?.colorBarOptions.legendSide === "right" ? "right" : "left";
  const addColorBar = () => {
    const barItem = g.append("g")
      .attr("class", "legend-color-bar")
      .attr("data-component", "links");
    const bar = barItem.append("g");
    const both = colorBar.hasNormal && colorBar.hasInverted;
    // As tall as the markers, outlined like a white marker, on one line
    drawColorBar(bar, colorBar, {
      height: colorBar.colorBarOptions.height ?? legendSize / (both ? 2 : 1),
      fontSize: legendTextOptions.fontSize,
      fontFamily: legendTextOptions.fontFamily,
      outline: "#bdbdbd",
      labels: "inline"
    });
    const box = bar.node().getBBox();
    // The same gap on either side: a group ends with one padding after it
    const gap = 2 * legendSize + legendPadding;
    if (orientation === "horizontal" && barSide === "right" && currentX > x) {
      // After the groups: on the same row when it fits, else on a new one
      const availableWidth = this.width - this.margin.left - this.margin.right;
      if (currentX + gap + box.width > availableWidth) {
        currentX = x;
        currentY += legendSize + legendPadding;
      } else {
        currentX += gap;
      }
    }
    bar.attr("transform", `translate(${currentX - box.x}, ${currentY + legendSize / 2 - (box.y + box.height / 2)})`);
    itemExtents.push({ node: barItem.node(), row: currentY, start: currentX, end: currentX + box.width });
    if (orientation === "horizontal") {
      currentX += box.width + gap + legendPadding;
    } else {
      currentY += Math.max(legendSize, box.height) + legendPadding;
    }
  };
  if (colorBar && barSide === "left") {
    addColorBar();
  }

  g.selectAll(".legend")
    .data(uniqueGroups)
    .enter()
    .append("g")
    .attr("class", "legend")
    .each((d, i, nodes) => {
      const legendGroup = d3.select(nodes[i]);
      // The style of this group: for its text, and in marker for its marker
      const { marker: markerStyle = {}, text: groupText, ...textStyle } = groupStyle[d] ?? {};
      const { group: _labelGroup, part: _labelPart, text, ...labelStyle } =
        itemStyle.find(s => s.group === d && s.part === "label") ?? {};
      const { group: _markerGroup, part: _markerPart, ...ownMarkerStyle } =
        itemStyle.find(s => s.group === d && s.part === "marker") ?? {};

      const textLabel = legendGroup
        .append("text")
        .attr("class", "legend-label")
        .attr("data-part", "label")
        .attr("id", `legend-label-${i}`)
        .attr("dy", legendTextOptions.dy)
        .style("text-anchor", legendTextOptions.textAnchor)
        .style("font-size", legendTextOptions.fontSize)
        .style("font-family", legendTextOptions.fontFamily)
        .style("cursor", legendTextOptions.cursor)
        .text(text ?? groupText ?? d)
        .each(function () {
          const currentElement = d3.select(this);
          setStyleFromOptions(currentElement, additionalLegendTextOptions);
          // Before the text is measured below, so the items do not overlap
          setStyleFromOptions(currentElement, textStyle);
          setStyleFromOptions(currentElement, labelStyle);
        });

      const textLength = textLabel.node().getComputedTextLength();
      const availableWidth = this.width - this.margin.left - this.margin.right;
      const totalItemWidth = textLength + legendSize + 2 * legendPadding;

      if (currentX + totalItemWidth > availableWidth) {
        currentX = x;
        currentY += legendSize + legendPadding;
      }

      textLabel
        .attr("x", currentX + legendSize + legendPadding)
        .attr("y", currentY + legendSize / 2);

      const rect = legendGroup
        .append("rect")
        .attr("class", "legend-marker")
        .attr("data-part", "marker")
        .attr("id", `legend-marker-${i}`)
        .style("cursor", legendOptions.cursor)
        .attr("x", currentX)
        .attr("y", currentY)
        .attr("width", legendSize)
        .attr("height", legendSize)
        .attr("rx", cornerRadius)
        .style("fill", patternScale.fill(d))
        .style("stroke", patternScale.outline ?? (isWhite(patternScale.fill(d)) ? "#bdbdbd" : null))
        .each(() => patternScale.align(d, currentX, currentY))
        .each(function () {
          const currentElement = d3.select(this);
          setStyleFromOptions(currentElement, additionalLegendOptions);
          setStyleFromOptions(currentElement, markerStyle);
          setStyleFromOptions(currentElement, ownMarkerStyle);
        })

      // Dragged labels and markers move on their own (GC_element_style)
      applyMove(textLabel, labelStyle);
      applyMove(rect, ownMarkerStyle);

      itemExtents.push({ node: nodes[i], row: currentY, start: currentX,
                         end: currentX + legendSize + legendPadding + textLength });

      if (orientation === "horizontal") {
        currentX += textLength + legendSize + 2 * legendPadding;
      } else {
        currentY += legendSize + legendPadding;
      }
    })
    .on("mouseover", (event, d) => {
      const element = d3.select(event.currentTarget);
      element.classed("hovered", true);
    })
    .on("mouseout", (event, d) => {
      const element = d3.select(event.currentTarget);
      element.classed("hovered", false);
    })
    .on("click", (event, d) => {
      // A double-click includes a second click. Toggle only on its first one.
      // Non-bubbling synthetic clicks restore hidden groups after a redraw.
      if (event.detail > 1 || (editable && event.bubbles)) return;
      const element = d3.select(event.currentTarget);
      // If it's currently highlighted, unhighlight it, else highlight it
      if (element.classed("unselected")) {
        element.classed("unselected", false);
      } else {
        element.classed("unselected", true);
      }

      // Only this legend's items: other charts on the page have their own
      const unselectedLegend = g.selectAll(".unselected").data();
      const unselectedRowIds = this.data
        .filter(item => unselectedLegend.includes(item[group]))
        .map(item => item.rowID);

      if (parentId && typeof parentId === 'string') {
           // If parentId is not null and is a string, select within the parent
          d3.select('#' + parentId).selectAll('[rowID]').each(function () {
          const currentRowID = +d3.select(this).attr("rowID"); // Convert string to number
      if (unselectedRowIds.includes(currentRowID)) {
          d3.select(this).style("display", "none"); // Hide it
      } else {
          d3.select(this).style("display", ""); // Show it
        }
      });
      } else {
      // If parentId is null or not a string, select globally
      d3.selectAll('[rowID]').each(function () {
        const currentRowID = +d3.select(this).attr("rowID"); // Convert string to number
        if (unselectedRowIds.includes(currentRowID)) {
          d3.select(this).style("display", "none"); // Hide it
      } else {
        d3.select(this).style("display", ""); // Show it
      }
      });
}
    });

  if (colorBar && barSide === "right") {
    addColorBar();
  }

  // Align each row (or the whole column of a vertical legend) to the left,
  // centre or right of the available width
  const alignShare = { center: 0.5, right: 1 }[align] ?? 0;
  if (alignShare > 0) {
    const availableWidth = this.width - this.margin.left - this.margin.right;
    const rowOf = item => orientation === "horizontal" ? item.row : 0;
    const rowWidths = d3.rollup(itemExtents,
      items => d3.max(items, item => item.end) - d3.min(items, item => item.start), rowOf);
    itemExtents.forEach(item => {
      const shift = Math.max(0, availableWidth - rowWidths.get(rowOf(item))) * alignShare;
      d3.select(item.node).attr("transform", `translate(${shift}, 0)`);
    });
  }

  if (adjustHeight && this.height === 0) {
    var padding = 20;
    var contentHeight = currentY + legendSize + legendPadding + padding;

    svgLegend.attr("height", contentHeight);
    var viewBoxWidth = parentWidth;
    svgLegend.attr("viewBox", `0 0 ${viewBoxWidth} ${contentHeight}`);
    g.attr("transform", `translate(${this.margin.left}, ${this.margin.top + padding / 2})`);

  }

  return this;
};
