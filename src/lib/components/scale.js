// The scale axis of a cluster: container.prototype.scale.
import { container } from "../container.js";
import { addScalePadding, createDiscontinuousScale } from "../scale.js";
import { applyMove, extractAdditionalOptions, setStyleFromOptions } from "../style.js";
import { mergeOptions } from "../util.js";

container.prototype.scale = function (options = {}) {
  // Default options specific for scales and axis
  const defaultScaleOptions = {
    start: null,
    end: null,
    xMin: null,
    xMax: null,
    padding: 2,
    hidden: true,
    reverse: false,
    axisPosition: "bottom",
    breaks: [],
    tickValues: null,
    ticksCount: 10,
    ticksFormat: ",.0f",
    y: null,
    tickStyle: {
      stroke: "grey",
      strokeWidth: 1,
      lineLength: 6
    },
    textStyle: {
      fill: "black",
      fontSize: "10px",
      fontFamily: "Arial",
      cursor: "default"
    },
    lineStyle: {
      stroke: "grey",
      strokeWidth: 1
    }
  };

  // Merge provided options with the default ones
  const combinedOptions = mergeOptions.call(this, defaultScaleOptions, 'scaleOptions', options);

  // De-structure the combined options
  const { start, end, xMin, xMax, padding, hidden, breaks,
          tickValues, reverse, axisPosition, ticksCount,
          ticksFormat, y: initialY, tickStyle, textStyle,
          lineStyle } = combinedOptions;

  // Determine y based on axisPosition and initialY
  const y = initialY !== null ? initialY : (axisPosition === 'bottom' ? 20 : 80);

  // Extract additional options that are not in defaultScaleOptions
  const additionalOptionsTickStyle = extractAdditionalOptions(tickStyle, defaultScaleOptions.tickStyle);
  const additionalOptionsTextStyle = extractAdditionalOptions(textStyle, defaultScaleOptions.textStyle);
  const additionalOptionslineStyle = extractAdditionalOptions(lineStyle, defaultScaleOptions.lineStyle);

  // Filter data based on the provided start and end values
  if (start !== null ) {
    this.data = this.data.filter(d => d.start >= start);
  }
  if (end !== null) {
    this.data = this.data.filter(d => d.end <= end);
  }

  // Filter out data where start or end falls within any of the breaks
  this.data = this.data.filter(d => {
    return !breaks.some(gap =>
      (d.start >= gap.start && d.start <= gap.end) ||
      (d.end >= gap.start && d.end <= gap.end)
    );
  });

  this.reverse = reverse;

  this.padding = padding;

  // Use provided start and end values if they exist, otherwise compute them from data
  this.minStart = start !== null ? start :
                xMin !== null ? xMin :
                d3.min(this.data, d => Math.min(d.start, d.end));

  this.maxEnd = end !== null ? end :
              xMax !== null ? xMax :
              d3.max(this.data, d => Math.max(d.start, d.end));

  if(start == null){
  this.minStart = addScalePadding(this.minStart, this.maxEnd, padding, "start", breaks)
  }

  if(end == null){
  this.maxEnd = addScalePadding(this.minStart, this.maxEnd, padding, "end", breaks)
  }

  // Create scales
  this.xScale = createDiscontinuousScale(this.minStart, this.maxEnd, this.width, this.margin, breaks, reverse);
  // The whole range, also when zoomed: the overview of the zoom slider
  this.fullScale = createDiscontinuousScale(this.minStart, this.maxEnd, this.width, this.margin, breaks, reverse);
  this.zoom = null;
  // Zoom (GC_zoom()): the scale shows a window of its range, as shares of
  // the width ("relative") or in base pairs ("absolute"). Everything placed
  // with the scale moves with it; clipZoom() hides what falls outside.
  if (options.zoom) {
    const plotWidth = this.width - this.margin.left - this.margin.right;
    const share = value => {
      // A position in a scale break is drawn where the break is
      const gap = breaks.find(gap => value >= gap.start && value <= gap.end);
      return this.fullScale(gap ? gap.end + 1e-9 : value) / plotWidth;
    };
    const { from, to, mode } = options.zoom;
    let [a, b] = (mode === "absolute" ? [share(from), share(to)] : [from, to]).sort((x, y) => x - y);
    if (!(b - a > 1e-9)) b = a + 1e-9;
    if (a > 1e-9 || b < 1 - 1e-9) {
      this.zoom = [a, b];
      this.xScale.range([-a * plotWidth / (b - a), (1 - a) * plotWidth / (b - a)]);
    }
  }
  this.yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([this.height - this.margin.bottom - this.margin.top, 0]);

  // Filter breaks within the scale range
  this.breaks = breaks.filter(gap => gap.start >= this.minStart && gap.end <= this.maxEnd);

  const that = this;
  if (!hidden) {

    // Create and configure the X-axis
    const adjustedYOffset = this.yScale ? this.yScale(y) : y;
    const axisGroup = this.svg.append("g")
    .attr("data-component", "scale")
      .attr("transform", `translate(${this.margin.left},${this.margin.top + adjustedYOffset})`);

    // Zoomed, the ticks are those of the window shown
    const plotWidth = this.width - this.margin.left - this.margin.right;
    const shown = this.zoom
      ? [this.xScale.invert(0), this.xScale.invert(plotWidth)].sort((a, b) => a - b)
      : [this.minStart, this.maxEnd];
    const linearScale = d3.scaleLinear()
      .domain(shown)
      .range([0, plotWidth]);

    const xAxis = d3.axisBottom(linearScale)
      .tickFormat(d3.format(ticksFormat));

    if (Array.isArray(tickValues) && tickValues.length > 0) {
      xAxis.tickValues(tickValues);
    } else if (typeof tickValues === 'number') {
      xAxis.tickValues([tickValues]);
    } else {
      xAxis.ticks(ticksCount);
    }

    const axis = axisGroup.append("g").call(xAxis);
    applyMove(axisGroup, combinedOptions.itemStyle?.[0]);

    // Style axis lines and text
    axis.selectAll(".tick line")
      .style("stroke", tickStyle.stroke)
      .style("stroke-width", tickStyle.strokeWidth)
      .attr("y2", tickStyle.lineLength)
      .each(function () {
        const currentElement = d3.select(this)
        setStyleFromOptions(currentElement, additionalOptionsTickStyle);
      });

    axis.selectAll(".tick text")
      .style("fill", textStyle.fill)
      .style("font-size", textStyle.fontSize)
      .style("font-family", textStyle.fontFamily)
      .style("cursor", textStyle.cursor)
      .each(function () {
        const currentElement = d3.select(this)
        setStyleFromOptions(currentElement, additionalOptionsTextStyle);
      });

    axis.selectAll(".tick").each(function (d) {
      let tickValue = d3.select(this).data()[0];
      let newX = that.xScale(tickValue);

      if (newX === null || newX < -0.5 || newX > plotWidth + 0.5) {
        // Remove ticks in a scale break, or outside a zoomed window
        d3.select(this).remove();
      } else {
        // Otherwise, update the transform attribute
        d3.select(this).attr("transform", `translate(${newX},0)`);
      }
    });

    axis.select(".domain")
      .style("stroke", lineStyle.stroke)
      .style("stroke-width", lineStyle.strokeWidth)
      .each(function () {
        const currentElement = d3.select(this);
        setStyleFromOptions(currentElement, additionalOptionslineStyle);
      });

  }
  return this;
};
