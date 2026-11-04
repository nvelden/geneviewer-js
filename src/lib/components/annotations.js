// Annotations: container.prototype.addAnnotations and one method per type.
import { container } from "../container.js";
import { extractAdditionalOptions, setStyleFromOptions } from "../style.js";
import { parseAndStyleText } from "../text.js";
import { getUniqueId, mergeOptions, warnOnce } from "../util.js";

container.prototype.addAnnotations = function (annotations) {
  if (!annotations || annotations.length === 0) {
    return this;
  }

  var g = this.svg.append("g")
      .attr("data-component", "annotations")
    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
  annotations.forEach(annotation => {
    this.createAnnotation(g, annotation);
  });

  return this;
};

container.prototype.createAnnotation = function (group, options) {

  switch (options.type) {
    case 'text':
      this.createTextAnnotation(group, options);
      break;
    case 'line':
      this.createLineAnnotation(group, options);
      break;
    case 'textMarker':
      this.createTextMarkerAnnotation(group, options);
      break;
    case 'arrow':
      this.createArrowAnnotation(group, options);
      break;
    case 'promoter':
      this.createPromoterAnnotation(group, options);
      break;
    case 'terminator':
      this.createTerminatorAnnotation(group, options);
      break;
    case 'rectangle':
      this.createRectangleAnnotation(group, options);
      break;
    case 'symbol':
      this.createSymbolAnnotation(group, options);
      break;
    case 'arc':
      this.createCurveAnnotation(group, options);
      break;
    default:
      warnOnce('Unsupported annotation type: ' + options.type);
  }
};

container.prototype.createTextAnnotation = function (group, options) {
  // Define default styles for text annotations
  const defaultOptions = {
    x: 0,
    y: 60,
    text: '',
    style: {
      fontSize: "10px",
      fontStyle: "normal",
      fontWeight: "normal",
      textDecoration: "none",
      fontFamily: "sans-serif",
      cursor: "default"
    }
  };

  // Merge default options and user-specified options
  const combinedOptions = mergeOptions.call(this, defaultOptions, "textAnnotationOptions", options);
  let { x, y, text, style } = combinedOptions;

  // Convert x, y, and text to arrays if they are not already
  if (!Array.isArray(x)) x = [x];
  if (!Array.isArray(y)) y = [y];
  if (!Array.isArray(text)) text = [text];

  // Extract additional options that are not in defaultOptions
  const additionalOptionsStyle = extractAdditionalOptions(style, defaultOptions.style);

  var group = this.svg.append("g")
      .attr("data-component", "annotations")
    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

  // Iterate over each element in the arrays
  for (let i = 0; i < Math.max(x.length, y.length, text.length); i++) {
    const currentX = x[Math.min(i, x.length - 1)];
    const currentY = y[Math.min(i, y.length - 1)];
    const currentText = text[Math.min(i, text.length - 1)];

    // Create the text element with merged styles for each set of values
    group.append("text")
      .attr("x", this.xScale(currentX))
      .attr("y", this.yScale(currentY))
      .style("font-size", style.fontSize)
      .style("font-style", style.fontStyle)
      .style("font-weight", style.fontWeight)
      .style("text-decoration", style.textDecoration)
      .style("font-family", style.fontFamily)
      .style("cursor", style.cursor)
      .each(function () {
        const currentElement = d3.select(this);
        parseAndStyleText(currentText, currentElement, style);
        setStyleFromOptions(currentElement, additionalOptionsStyle);
      });
  }
};

container.prototype.createLineAnnotation = function (group, options) {
  const defaultOptions = {
    x1: 0,
    y1: 70,
    x2: 0,
    y2: 50,
    style: {
      stroke: "black",
      strokeWidth: 1
    }
  };

  // Merge default options and user-specified options
  const combinedOptions = mergeOptions.call(this, defaultOptions, "lineAnnotationOptions", options);
  let { x1, y1, x2, y2, style } = combinedOptions;

  // Convert x1, y1, x2, y2 to arrays if they are not already
  if (!Array.isArray(x1)) x1 = [x1];
  if (!Array.isArray(y1)) y1 = [y1];
  if (!Array.isArray(x2)) x2 = [x2];
  if (!Array.isArray(y2)) y2 = [y2];

  // Extract additional options that are not in defaultOptions
  const additionalOptionsStyle = extractAdditionalOptions(style, defaultOptions.style);

    var group = this.svg.append("g")
      .attr("data-component", "annotations")
    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

  // Iterate over each set of line coordinates
  for (let i = 0; i < Math.max(x1.length, y1.length, x2.length, y2.length); i++) {
    const currentX1 = x1[Math.min(i, x1.length - 1)];
    const currentY1 = y1[Math.min(i, y1.length - 1)];
    const currentX2 = x2[Math.min(i, x2.length - 1)];
    const currentY2 = y2[Math.min(i, y2.length - 1)];

    // Create the line element with merged styles for each set of values
    group.append("line")
      .attr("x1", this.xScale(currentX1))
      .attr("y1", this.yScale(currentY1))
      .attr("x2", this.xScale(currentX2))
      .attr("y2", this.yScale(currentY2))
      .style("stroke", style.stroke)
      .style("stroke-width", style.strokeWidth)
      .each(function () {
        const currentElement = d3.select(this);
        setStyleFromOptions(currentElement, additionalOptionsStyle);
      });
  }
};

container.prototype.createArrowAnnotation = function (group, options) {
  const defaultOptions = {
    x1: 1,
    y1: 70,
    x2: 1,
    y2: 50,
    arrowSize: 8,
    arrowStyle: {
      fill: "black",
    },
    lineStyle: {
      stroke: "black",
      strokeWidth: 1
    }
  };

  // Merge default options and user-specified options
  const combinedOptions = mergeOptions.call(this, defaultOptions, "arrowAnnotationOptions", options);
  let { x1, y1, x2, y2, arrowSize, arrowStyle, lineStyle } = combinedOptions;

  // Convert x1, y1, x2, y2, and arrowSize to arrays if they are not already
  if (!Array.isArray(x1)) x1 = [x1];
  if (!Array.isArray(y1)) y1 = [y1];
  if (!Array.isArray(x2)) x2 = [x2];
  if (!Array.isArray(y2)) y2 = [y2];
  if (!Array.isArray(arrowSize)) arrowSize = [arrowSize];

  // Extract additional options that are not in defaultOptions
  const additionalOptionsLine = extractAdditionalOptions(lineStyle, defaultOptions.lineStyle);
  const additionalOptionsArrow = extractAdditionalOptions(arrowStyle, defaultOptions.arrowStyle);

  var group = this.svg.append("g")
      .attr("data-component", "annotations")
    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

  // Iterate over each element in the arrays
  for (let i = 0; i < Math.max(x1.length, y1.length, x2.length, y2.length, arrowSize.length); i++) {
    const currentX1 = x1[Math.min(i, x1.length - 1)];
    const currentY1 = y1[Math.min(i, y1.length - 1)];
    const currentX2 = x2[Math.min(i, x2.length - 1)];
    const currentY2 = y2[Math.min(i, y2.length - 1)];
    const currentArrowSize = arrowSize[Math.min(i, arrowSize.length - 1)];

    // Create a marker for each line; the id must be unique on the page
    const markerId = getUniqueId("arrowhead");
    this.svg.append("defs").append("marker")
      .attr("id", markerId)
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 5)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", currentArrowSize)
      .attr("markerHeight", currentArrowSize)
      .attr("xoverflow", "visible")
      .append("path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", arrowStyle.fill)
      .each(function () {
        const currentElement = d3.select(this);
        setStyleFromOptions(currentElement, additionalOptionsArrow);
      });

    // Draw the line with the arrow marker for each set of values
    group.append("line")
      .attr("x1", this.xScale(currentX1))
      .attr("y1", this.yScale(currentY1))
      .attr("x2", this.xScale(currentX2))
      .attr("y2", this.yScale(currentY2 + currentArrowSize / 2))
      .attr("marker-end", `url(#${markerId})`)
      .style("stroke", lineStyle.stroke)
      .style("stroke-width", lineStyle.strokeWidth)
      .each(function () {
        const currentElement = d3.select(this);
        setStyleFromOptions(currentElement, additionalOptionsLine);
      });
  }
};

container.prototype.createTextMarkerAnnotation = function (group, options) {
  const defaultOptions = {
    x1: null,
    y1: 66,
    x2: null,
    y2: 50,
    position: 0,
    text: "",
    labelX: 0,
    labelY: 0,
    showArrow: false,
    arrowSize: 8,
    textStyle: {
      fontSize: "10px",
      fontFamily: "sans-serif",
      fill: "black",
      textAnchor: "middle"
    },
    arrowStyle: {
      fill: "black",
    },
    lineStyle: {
      stroke: "black",
      strokeWidth: 1
    }
  };

  // Merge default options and user-specified options
  const combinedOptions = mergeOptions.call(this, defaultOptions, "textMarkerAnnotationOptions", options);
  let { textStyle, arrowStyle, lineStyle } = combinedOptions;

  // Convert all options to arrays if not already
  const keys = ['x1', 'y1', 'x2', 'y2', 'position', 'text', 'labelX', 'labelY', 'showArrow', 'arrowSize'];
  keys.forEach(key => {
    if (!Array.isArray(combinedOptions[key])) {
      combinedOptions[key] = [combinedOptions[key]];
    }
  });

  const additionalOptionsLine = extractAdditionalOptions(lineStyle, defaultOptions.lineStyle);
  const additionalOptionsArrow = extractAdditionalOptions(arrowStyle, defaultOptions.arrowStyle);

  // Calculate the maximum length across all arrays
  const maxLength = Math.max(...keys.map(key => combinedOptions[key].length));

  for (let i = 0; i < maxLength; i++) {
    let currentValues = {};
    keys.forEach(key => {
      currentValues[key] = combinedOptions[key][i % combinedOptions[key].length];
    });

    let offsetY2 = currentValues.showArrow ? currentValues.arrowSize / 2 : 0;
    var group = this.svg.insert("g", ":first-child")
      .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

  const currentX1 = Math.round(this.xScale(currentValues.x1 !== null ? currentValues.x1 : currentValues.position));
  const currentX2 = Math.round(this.xScale(currentValues.x2 !== null ? currentValues.x2 : currentValues.position));

  // Create line element
  const line = group.append("line")
    .attr("x1", currentX1)
    .attr("y1", this.yScale(currentValues.y1))
    .attr("x2", currentX2)
    .attr("y2", this.yScale(currentValues.y2 + offsetY2))
    .style("stroke", lineStyle.stroke)
    .style("stroke-width", lineStyle.strokeWidth)
    .each(function () {
      const currentElement = d3.select(this);
      setStyleFromOptions(currentElement, additionalOptionsLine);
    });

  // Create a marker for each line; the id must be unique on the page
  const markerId = getUniqueId("arrowhead-marker");
  this.svg.append("defs").append("marker")
    .attr("id", markerId)
    .attr("viewBox", "-0 -5 10 10")
    .attr("refX", 5)
    .attr("refY", 0)
    .attr("orient", "auto")
    .attr("markerWidth", currentValues.arrowSize)
    .attr("markerHeight", currentValues.arrowSize)
    .attr("xoverflow", "visible")
    .append("path")
    .attr("d", "M 0,-5 L 10 ,0 L 0,5")
    .attr("fill", arrowStyle.fill)
    .each(function () {
      const currentElement = d3.select(this);
      setStyleFromOptions(currentElement, additionalOptionsArrow);
    });
    // Add arrow marker to line if showArrow is true
    if (currentValues.showArrow) {
      line.attr("marker-end", `url(#${markerId})`);
    }

    // Create text element if text is provided
    if (currentValues.text) {
      group.append("text")
        .attr("x", this.xScale(currentValues.x1 !== null ? currentValues.x1 : currentValues.position) + currentValues.labelX)
        .attr("y", this.yScale(currentValues.y1) - 5 - currentValues.labelY)
        .style("text-anchor", textStyle.textAnchor)
        .style("font-size", textStyle.fontSize)
        .style("font-family", textStyle.fontFamily)
        .style("fill", textStyle.fill)
        .each(function () {
          const currentElement = d3.select(this);
          parseAndStyleText(currentValues.text, currentElement, textStyle);
          setStyleFromOptions(currentElement, extractAdditionalOptions(textStyle, defaultOptions.textStyle));
        });
    }
  }

  return group;
};

container.prototype.createSymbolAnnotation = function(group, options) {
  const defaultOptions = {
    x: 0,
    y: 50,
    size: 64,
    symbol: "circle",
    style: {
      fill: "black",
      stroke: "black",
      strokeWidth: 2
    },
    rotation: 0
  };

  // Merge default options and user-specified options
  const combinedOptions = mergeOptions.call(this, defaultOptions, "symbolAnnotationOptions", options);
  let { x, y, size, symbol, style, rotation } = combinedOptions;

  // Convert x, y, symbol, and rotation to arrays if they are not already
  if (!Array.isArray(x)) x = [x];
  if (!Array.isArray(y)) y = [y];
  if (!Array.isArray(symbol)) symbol = [symbol];
  if (!Array.isArray(rotation)) rotation = [rotation];
  if (!Array.isArray(size)) size = [size];

  var group = this.svg.append("g")
      .attr("data-component", "annotations")
    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

  // Extract additional options that are not in defaultOptions
  const additionalOptionsStyle = extractAdditionalOptions(style, defaultOptions.style);

  // Symbol type mapping
  const symbolTypes = {
    'circle': d3.symbolCircle,
    'cross': d3.symbolCross,
    'diamond': d3.symbolDiamond,
    'square': d3.symbolSquare,
    'star': d3.symbolStar,
    'triangle': d3.symbolTriangle,
    'wye': d3.symbolWye
  };

  // Iterate over each element in the arrays
  for (let i = 0; i < Math.max(x.length, y.length, symbol.length, rotation.length); i++) {
    const currentX = x[Math.min(i, x.length - 1)];
    const currentY = y[Math.min(i, y.length - 1)];
    const currentSymbol = symbol[Math.min(i, symbol.length - 1)];
    const currentRotation = rotation[Math.min(i, rotation.length - 1)];
    const currentSize = size[Math.min(i, size.length - 1)];

    // Check if the symbol type is valid
    if (!symbolTypes[currentSymbol]) {
      console.error(`Unsupported symbol type: ${currentSymbol}`);
      continue;
    }

    // Create the symbol
    const d3Symbol = d3.symbol().type(symbolTypes[currentSymbol]).size(currentSize);

    // Create the symbol element with merged styles for each set of values
    group.append("path")
      .attr("d", d3Symbol)
      .attr("transform", `translate(${this.xScale(currentX)}, ${this.yScale(currentY)}) rotate(${currentRotation})`)
      .style("fill", style.fill)
      .style("stroke", style.stroke)
      .style("stroke-width", style.strokeWidth)
      .each(function () {
        const currentElement = d3.select(this);
        setStyleFromOptions(currentElement, additionalOptionsStyle);
      });
  }

  return group;
};

container.prototype.createRectangleAnnotation = function(group, options) {
  const defaultOptions = {
    position: [[[9300, 20], [9400, 50]]], // Default as a nested array for multiple rectangles
    rotation: [0], // Array to support multiple rotations
    style: {
      fill: "#0000",
      stroke: "black",
      strokeWidth: 2
    }
  };

  // Merge default options and user-specified options
  const combinedOptions = mergeOptions.call(this, defaultOptions, "rectangleAnnotationOptions", options);
  let { position, style, rotation } = combinedOptions;

  // Normalize position to be an array of arrays
  if (!Array.isArray(position[0][0])) {
    position = [position];
  }
  if (!Array.isArray(rotation)) rotation = [rotation];

  // Extract additional options that are not in defaultOptions
  const additionalOptionsStyle = extractAdditionalOptions(style, defaultOptions.style);

  var group = this.svg.append("g")
      .attr("data-component", "annotations")
    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

  // Iterate over each element in the position and rotation arrays
  const numRects = Math.max(position.length, rotation.length);
  for (let i = 0; i < numRects; i++) {
    const currentPos = position[Math.min(i, position.length - 1)];
    const currentRot = rotation[Math.min(i, rotation.length - 1)];

    // Calculate x, y, width, and height from the position array
    const x1 = Math.min(currentPos[0][0], currentPos[1][0]);
    const x2 = Math.max(currentPos[0][0], currentPos[1][0]);
    const y1 = Math.max(currentPos[0][1], currentPos[1][1]);
    const y2 = Math.min(currentPos[0][1], currentPos[1][1]);
    const width = Math.abs(x1 - x2);
    const height = Math.abs(y2 - y1);

    // Create the rectangle element with merged styles
    group.append("rect")
      .attr("x", this.xScale(x1))
      .attr("y", this.yScale(y1))
      .attr("width", this.xScale(x2) - this.xScale(x1))
      .attr("height", this.yScale(y2) - this.yScale(y1))
      .attr("transform", `rotate(${currentRot}, ${this.xScale(x1 + width / 2)}, ${this.yScale(y1 + height / 2)})`)
      .style("fill", style.fill)
      .style("stroke", style.stroke)
      .style("stroke-width", style.strokeWidth)
      .each(function () {
        const currentElement = d3.select(this);
        setStyleFromOptions(currentElement, additionalOptionsStyle);
      });
  }
};

container.prototype.createPromoterAnnotation = function(group, options) {

  const defaultOptions = {
    x: 0,
    y: 50,
    direction: 'forward',
    rotation: 0,
    scale: 1,
    style: {
      fill: "none",
      stroke: "black",
      strokeWidth: 1
    },
  };

  // Merge default options and user-specified options
  const combinedOptions = mergeOptions.call(this, defaultOptions, "promoterAnnotationOptions", options);
  let { x, y, direction, rotation, scale, style } = combinedOptions;

    // Extract additional options that are not in defaultOptions
  const additionalOptionsStyle = extractAdditionalOptions(style, defaultOptions.style);

  if (!Array.isArray(x)) x = [x];
  if (!Array.isArray(y)) y = [y];
  if (!Array.isArray(direction)) direction = [direction];
  if (!Array.isArray(rotation)) rotation = [rotation];
  if (!Array.isArray(scale)) scale = [scale];

    // Define the custom path and mirrored path
  const mirroredPath = "M -8 -17.5 L -13 -14 l 5 3.5 M -13 -14 L 0 -14 v 14";
  const customPath = "M 8 -17.5 L 13 -14 l -5 3.5 M 13 -14 H 0 v 14";

  var group = this.svg.append("g")
      .attr("data-component", "annotations")
    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

  // Iterate over each element in the arrays
  for (let i = 0; i < Math.max(x.length, y.length, direction.length, rotation.length, scale.length); i++) {

    const currentX = x[Math.min(i, x.length - 1)];
    const currentY = y[Math.min(i, y.length - 1)];
    const currentDirection = direction[Math.min(i, direction.length - 1)];
    const currentRotation = rotation[Math.min(i, rotation.length - 1)];
    const currentScale = scale[Math.min(i, scale.length - 1)];

    // Choose the appropriate path based on direction
    const pathToUse = currentDirection === "forward" ? customPath : mirroredPath;

    // Calculate the x position
    const xPosition = this.xScale(currentX);

    // Create the symbol element for each set of values
    group.append("path")
      .attr("d", pathToUse)
      .attr("transform", `translate(${xPosition}, ${this.yScale(currentY)}) scale(${currentScale}) rotate(${currentRotation})`)
      .style("fill", style.fill)
      .style("stroke", style.stroke)
      .style("stroke-width", style.strokeWidth)
      .each(function () {
        const currentElement = d3.select(this);
        setStyleFromOptions(currentElement, additionalOptionsStyle);
      });
  }
};

container.prototype.createTerminatorAnnotation = function(group, options) {

  const defaultOptions = {
    x: 0,
    y: 50,
    direction: 'forward',
    rotation: 0,
    scale: 1,
    style: {
      fill: "none",
      stroke: "black",
      strokeWidth: 1
    },
  };

  // Merge default options and user-specified options
  const combinedOptions = mergeOptions.call(this, defaultOptions, "terminatorAnnotationOptions", options);
  let { x, y, direction, rotation, scale, style } = combinedOptions;

    // Extract additional options that are not in defaultOptions
  const additionalOptionsStyle = extractAdditionalOptions(style, defaultOptions.style);

  if (!Array.isArray(x)) x = [x];
  if (!Array.isArray(y)) y = [y];
  if (!Array.isArray(direction)) direction = [direction];
  if (!Array.isArray(rotation)) rotation = [rotation];
  if (!Array.isArray(scale)) scale = [scale];

  // Define the custom paths
  const customPath = "M -8 17.5 L -13 14 l 5 -3.5 M -13 14 H 0 v -14";
  const mirroredPath = "M 8 17.5 L 13 14 l -5 -3.5 M 13 14 L 0 14 v -14";

  var group = this.svg.append("g")
      .attr("data-component", "annotations")
    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

  // Iterate over each element in the arrays
  for (let i = 0; i < Math.max(x.length, y.length, direction.length, rotation.length, scale.length); i++) {

    const currentX = x[Math.min(i, x.length - 1)];
    const currentY = y[Math.min(i, y.length - 1)];
    const currentDirection = direction[Math.min(i, direction.length - 1)];
    const currentRotation = rotation[Math.min(i, rotation.length - 1)];
    const currentScale = scale[Math.min(i, scale.length - 1)];

    // Choose the appropriate path based on direction
    const pathToUse = currentDirection === "forward" ? customPath : mirroredPath;

    // Calculate the x position
    const xPosition = this.xScale(currentX);

    // Create the symbol element for each set of values
    group.append("path")
      .attr("d", pathToUse)
      .attr("transform", `translate(${xPosition}, ${this.yScale(currentY)}) scale(${currentScale}) rotate(${currentRotation})`)
      .style("fill", style.fill)
      .style("stroke", style.stroke)
      .style("stroke-width", style.strokeWidth)
      .each(function () {
        const currentElement = d3.select(this);
        setStyleFromOptions(currentElement, additionalOptionsStyle);
      });
  }
};

container.prototype.createCurveAnnotation = function (group, options) {
    const defaultOptions = {
        x1: [0],
        y1: [50],
        x2: [100],
        y2: [50],
        midY: [80],
        stroke: ["black"],
        strokeWidth: [1],
        lineStyle: {},
        text: [""],
        labelX: [0],
        labelY: [0],
        textStyle: {
            fontSize: "10px",
            fontFamily: "sans-serif",
            fill: "black",
            textAnchor: "middle"
        }
    };

    // Merge default options and user-specified options
    const combinedOptions = mergeOptions.call(this, defaultOptions, "curveAnnotationOptions", options);

    // Convert all coordinates and styles to arrays if not already
    const keys = ['x1', 'y1', 'x2', 'y2', 'midY', 'stroke', 'strokeWidth', 'text', 'labelX', 'labelY'];
    keys.forEach(key => {
        if (!Array.isArray(combinedOptions[key])) {
            combinedOptions[key] = [combinedOptions[key]];
        }
    });

    let { x1, y1, x2, y2, midY, stroke, strokeWidth, lineStyle, text, labelX, labelY, textStyle } = combinedOptions;

    var group = this.svg.append("g")
      .attr("data-component", "annotations")
        .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

    // Iterate over each set of points
    for (let i = 0; i < Math.max(x1.length, y1.length, x2.length, y2.length, text.length, labelX.length, labelY.length); i++) {
        const currentX1 = x1[i % x1.length];
        const currentY1 = y1[i % y1.length];
        const currentX2 = x2[i % x2.length];
        const currentY2 = y2[i % y2.length];
        const currentMidY = midY[i % midY.length];
        const currentStroke = stroke[i % stroke.length];
        const currentStrokeWidth = strokeWidth[i % strokeWidth.length];
        const currentText = text[i % text.length];
        const currentLabelX = labelX[i % labelX.length];
        const currentLabelY = labelY[i % labelY.length];
        const midX = (currentX1 + currentX2) / 2;

        // Define the line generator with a curve
        const lineGenerator = d3.line()
            .curve(d3.curveBasis)
            .x(d => this.xScale(d.x))
            .y(d => this.yScale(d.y));

        // Create the path using the start, middle (control point), and end coordinates
        const points = [
            { x: currentX1, y: currentY1 },
            { x: midX, y: currentMidY },
            { x: currentX2, y: currentY2 }
        ];

        // Create the path element with merged styles
        const path = group.append("path")
            .attr("d", lineGenerator(points))
            .style("stroke", currentStroke)
            .style("stroke-width", currentStrokeWidth)
            .style("fill", "none");

        // Apply additional line styles if any
        setStyleFromOptions(path, extractAdditionalOptions(lineStyle, defaultOptions.lineStyle));

        // Add text at the highest point of the curve with offsets
        const textElement = group.append("text")
            .attr("x", this.xScale(midX) + currentLabelX)
            .attr("y", this.yScale(currentMidY) - currentLabelY)
            .text(currentText);

        // Apply text styles
        setStyleFromOptions(textElement, textStyle);
    }
};
