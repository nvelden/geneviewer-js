// Gene coordinates: container.prototype.coordinates.
import { container } from "../container.js";
import { extractAdditionalOptions, setStyleFromOptions } from "../style.js";
import { mergeOptions } from "../util.js";

container.prototype.coordinates = function (show = true, options = {}) {
  if (!show) {
    return this;
  }

  const defaultOptions = {
    rotate: -45,
    yPositionTop: 53,
    yPositionBottom: 48,
    tickValuesTop: null,
    tickValuesBottom: null,
    overlapThreshold: 20,
    ticksFormat: ",.0f",
    groupStyle: {},
    styleBy: null,
    itemStyle: [],
    tickStyle: {
      stroke: "black",
      strokeWidth: 1,
      lineLength: 6
    },
    textStyle: {
      fill: "black",
      fontSize: "10px",
      fontFamily: "Arial",
      cursor: "default",
      x: 0,
      y: 0
    }
  };

  const combinedOptions = mergeOptions.call(this, defaultOptions, 'coordinatesOptions', options);
  const { rotate, yPositionTop, yPositionBottom, tickValuesBottom, tickValuesTop, ticksFormat, tickStyle, textStyle, groupStyle, styleBy, itemStyle } = combinedOptions;

  // The style of the group of the gene of a coordinate, with the style of the
  // coordinate itself on top (itemStyle, by rowID and start or end): show =
  // false leaves it out, tick styles its tick, the rest its text
  const ownStyleOf = t => itemStyle
    .filter(s => t?.rowID != null && s.rowID === t.rowID && (s.end == null || s.end === t.end))
    .reduce((style, { rowID, end, ...own }) => ({ ...style, ...own }), {});
  const styleOf = t => {
    const group = (styleBy && t?.gene ? groupStyle[t.gene[styleBy]] : undefined) ?? {};
    const own = ownStyleOf(t);
    return { ...group, ...own, tick: { ...group.tick, ...own.tick } };
  };
  const textStyleOf = t => {
    const { show, tick, ...text } = styleOf(t);
    return text;
  };

  // Extract additional options that are not in defaultOptions
  const additionalOptionsTickStyle = extractAdditionalOptions(tickStyle, defaultOptions.tickStyle);
  const additionalOptionsTextStyle = extractAdditionalOptions(textStyle, defaultOptions.textStyle);


  const g = this.svg.append("g")
    .attr("data-component", "coordinates")
    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

  // Convert provided tickValues to the required format
  let tickValuesTopFinal = Array.isArray(tickValuesTop) ? tickValuesTop.map(value => ({ value, rowID: null }))
    : (tickValuesTop != null ? [{ value: tickValuesTop, rowID: null }] : []);
  let tickValuesBottomFinal = Array.isArray(tickValuesBottom) ? tickValuesBottom.map(value => ({ value, rowID: null }))
    : (tickValuesBottom != null ? [{ value: tickValuesBottom, rowID: null }] : []);

  // If neither tickValuesTop nor tickValuesBottom are provided, calculate them
  if (!tickValuesTop && !tickValuesBottom) {

    let allTickValues = this.data.reduce((acc, d) => {
      // Define tickValueStart and tickValueStop
      let tickValueStart = { value: d.start, rowID: d.rowID, end: "start", gene: d };
      let tickValueStop = { value: d.end, rowID: d.rowID, end: "end", gene: d };
      // Add strand property if it exists
      tickValueStart.strand = d.strand;
      tickValueStop.strand = d.strand;
      // Add geneTrack property if it exists
      if ('geneTrack' in d) {
        tickValueStart.geneTrack = d.geneTrack;
        tickValueStop.geneTrack = d.geneTrack;
      }


      acc.push(tickValueStart);
      acc.push(tickValueStop);

      return acc;
    }, []);

    // Leave out the coordinates of the groups hidden with show = false, before
    // the duplicates, so a position another gene shares is kept
    allTickValues = allTickValues.filter(t => styleOf(t).show !== false);

    // Remove duplicates based on the 'value' property
    allTickValues = allTickValues.filter((obj, index, self) =>
      index === self.findIndex((t) => t.value === obj.value)
    );

    allTickValues.sort((a, b) => a.value - b.value);

    if (this.separateStrands) {
      allTickValues.forEach(tickValue => {
        if (tickValue.strand === "forward") {
          tickValuesTopFinal.push(tickValue);
        } else {
          tickValuesBottomFinal.push(tickValue);
        }
      });
    } else {
         // Calculate overlap and distribute tick values between top and bottom
    const tickValueThreshold = combinedOptions.overlapThreshold;

    for (let i = 0; i < allTickValues.length; i++) {
      if (i === 0) {
      // First tick always goes to the bottom
      tickValuesBottomFinal.push(allTickValues[i]);
      continue;
    }

  const diff = this.xScale(allTickValues[i].value) - this.xScale(allTickValues[i - 1].value);

  if (diff < tickValueThreshold) {
    // If the difference exceeds the threshold, place this tick at the top
    tickValuesTopFinal.push(allTickValues[i]);

    // Place the next tick at the bottom, if it exists
    if (i + 1 < allTickValues.length) {
      tickValuesBottomFinal.push(allTickValues[i + 1]);
      i++; // Skip the next index, as it's already processed
    }
    } else {
    // Otherwise, place this tick at the bottom
    tickValuesBottomFinal.push(allTickValues[i]);
      }
    }
  }
    }

  const self = this;

  // Create and configure the top axis
  const xAxisTop = g.append("g")
    .attr("transform", "translate(0," + this.yScale(yPositionTop) + ")")
    .call(d3.axisTop(this.xScale).tickValues(tickValuesTopFinal.map(t => t.value))
    .tickFormat(d3.format(ticksFormat))
    );

  xAxisTop.selectAll(".tick")
    .data(tickValuesTopFinal)
    .attr("rowID", d => d.rowID)
    .attr("transform", function (d) {
      const xOffset = self.xScale(d.value);
      var currentOverlapSpacing = d.geneTrack ? (d.geneTrack - 1) * self.geneOverlapSpacing : 0;
      return "translate(" + xOffset + "," + -currentOverlapSpacing + ")";
    });

  xAxisTop.select(".domain").attr("stroke", "none");

  xAxisTop.selectAll("text")
            .data(tickValuesTopFinal)
            .attr("class", "coordinate")
            .style("text-anchor", "end")
            .attr("dx", `${-0.8 + textStyle.x}em`)
            .attr("dy", `${0.4 + textStyle.y}em`)
            .attr("transform", "rotate(" + (-rotate) + ")")
            .style("fill", textStyle.fill)
            .style("font-size", textStyle.fontSize)
            .style("font-family", textStyle.fontFamily)
            .style("cursor", textStyle.cursor)
            .each(function(d) {
                const currentElement = d3.select(this);
                setStyleFromOptions(currentElement, additionalOptionsTextStyle);
                setStyleFromOptions(currentElement, textStyleOf(d));
            });

  xAxisTop.selectAll(".tick line")
    .style("stroke", tickStyle.stroke)
    .style("stroke-width", tickStyle.strokeWidth)
    .attr("y2", -tickStyle.lineLength)
    .each(function () {
      const currentElement = d3.select(this);
      setStyleFromOptions(currentElement, additionalOptionsTickStyle);
      setStyleFromOptions(currentElement, styleOf(d3.select(this.parentNode).datum()).tick ?? {});
    });

  // Create and configure the bottom axis
  const xAxisBottom = g.append("g")
    .attr("transform", "translate(0," + this.yScale(yPositionBottom) + ")")
    .call(d3.axisBottom(this.xScale).tickValues(tickValuesBottomFinal.map(t => t.value))
    .tickFormat(d3.format(ticksFormat))
    );

  xAxisBottom.selectAll(".tick")
    .data(tickValuesBottomFinal)
    .attr("rowID", d => d.rowID)
    .attr("transform", function (d) {
       const xOffset = self.xScale(d.value);
      var currentOverlapSpacing = d.geneTrack ? -(d.geneTrack - 1) * self.geneOverlapSpacing : 0;
      return "translate(" + xOffset + "," + -currentOverlapSpacing + ")";
    });

  xAxisBottom.select(".domain").attr("stroke", "none");

  xAxisBottom.selectAll("text")
    .data(tickValuesBottomFinal)
    .attr("class", "coordinate")
    .style("text-anchor", "start")
    .attr("dx", `${0.8 + textStyle.x}em`)
    .attr("dy", `${-0.15 + textStyle.y}em`)
    .attr("transform", "rotate(" + (-rotate) + ")")
    .style("fill", textStyle.fill)
    .style("font-size", textStyle.fontSize)
    .style("font-family", textStyle.fontFamily)
    .style("cursor", textStyle.cursor)
    .each(function(d) {
      const currentElement = d3.select(this);
      setStyleFromOptions(currentElement, additionalOptionsTextStyle);
      setStyleFromOptions(currentElement, textStyleOf(d));
    });

  xAxisBottom.selectAll(".tick line")
    .style("stroke", tickStyle.stroke)
    .style("stroke-width", tickStyle.strokeWidth)
    .attr("y2", tickStyle.lineLength)
    .each(function () {
      const currentElement = d3.select(this);
      setStyleFromOptions(currentElement, additionalOptionsTickStyle);
      setStyleFromOptions(currentElement, styleOf(d3.select(this.parentNode).datum()).tick ?? {});
    });

  return this;
};
