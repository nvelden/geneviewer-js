// The container of one chart part (a cluster, the title, the legend) and its
// cluster data. The drawn parts in components/ add their methods to
// container.prototype.
import { extractAdditionalOptions, setStyleFromOptions } from "./style.js";
import { computeSize, getUniqueId, mergeOptions } from "./util.js";

export function container(svg, margin, width, height) {
  this.svg = svg;
  this.margin = margin;
  this.width = width;
  this.height = height;
}

// themeOptions: the chart theme ({ geneOptions: {...}, labelsOptions: {...}, ... }),
// kept on the container so all of its components use it
export function createContainer(targetElementId, id, themeOptionsKey, options = {}, themeOptions = {}) {

  const defaultOptions = {
    id: id || "svg-container",
    margin: { top: 5, right: 50, bottom: 5, left: 50 },
    style: {
      backgroundColor: "#0000"
    },
    width: null,
    height: null
  };

  // Merge default options and user-specified options
  const combinedOptions = mergeOptions(defaultOptions, themeOptionsKey, options, themeOptions);
  const { id: containerId, margin: originalMargin, style, width, height } = combinedOptions;

  // Extract additional options that are not in defaultOptions
  const additionalOptionsStyle = extractAdditionalOptions(style, defaultOptions.style);

  // Compute margins without modifying the original margin object
  const computedMargin = {
    top: computeSize(originalMargin?.top ?? 0, height),
    right: computeSize(originalMargin?.right ?? 0, width),
    bottom: computeSize(originalMargin?.bottom ?? 0, height),
    left: computeSize(originalMargin?.left ?? 0, width)
  };

  var svg = d3.select(targetElementId)
    .append("svg")
    .attr("id", getUniqueId(containerId))
    .attr("width", width || "100%")
    .attr("height", height || "100%")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .classed("geneviewer-svg-content", true)
    .style("box-sizing", "border-box")
    .style("background-color", style.backgroundColor)
    .each(function () {
      const currentElement = d3.select(this);
      setStyleFromOptions(currentElement, additionalOptionsStyle);
    });

  // Apply styles from the combined options
  Object.entries(style).forEach(([key, value]) => {
    svg.style(key, value);
  });

  const newContainer = new container(svg, computedMargin, width, height);
  newContainer.themeOptions = themeOptions;
  return newContainer;
}

container.prototype.cluster = function (options = {}) {

  // Default options for title and subtitle
  const defaultOptions = {
    separateStrands: false,
    strandSpacing: 0,
    preventGeneOverlap: false,
    overlapSpacing: 5
  };

  const combinedOptions = mergeOptions.call(this, defaultOptions, 'clusterOptions', options);
  const { separateStrands, strandSpacing,  preventGeneOverlap, overlapSpacing} = combinedOptions;

  this.separateStrands = separateStrands;
  this.strandSpacing = strandSpacing;
  this.preventGeneOverlap = preventGeneOverlap;
  this.overlapSpacing = overlapSpacing;

  return this;
};

container.prototype.geneData = function (data, clusterData) {

  // Needed to set color
  this.dataAll = data

  this.data = clusterData.map(item => {
    var newItem = { ...item };

    // Convert cluster to string
    newItem.cluster = String(newItem.cluster);

    newItem.direction = "forward";
    if (newItem.start > newItem.end) {
      newItem.direction = "reverse";
    }

    return newItem;
  });

  return this;
};
