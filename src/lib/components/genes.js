// Gene markers: container.prototype.genes.
import { getColorScale, getPatternScale } from "../color.js";
import { container } from "../container.js";
import { applyStyleToElement, extractAdditionalOptions, setStyleFromOptions, withGroupStyles } from "../style.js";
import { deepMergeOptions, mergeOptions, sanitizeId, warnOnce } from "../util.js";

// Closed SVG path through points, with the outer corners rounded by radius
// (0: sharp); inner corners, e.g. where the shaft of an arrow meets its head,
// stay sharp. Repeated points are dropped, and the radius is limited to half
// of the shortest side next to a corner, so short genes keep their shape.
function roundedPolygonPath(points, radius) {
    const pts = points.filter((p, i) => {
        const prev = points[(i - 1 + points.length) % points.length];
        return Math.abs(p[0] - prev[0]) > 1e-6 || Math.abs(p[1] - prev[1]) > 1e-6;
    });
    if (!(radius > 0) || pts.length < 3) {
        return `M${pts.map(p => `${p[0]} ${p[1]}`).join(" L")} Z`;
    }
    const n = pts.length;
    const sideLength = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
    // Point at distance d from a towards b
    const towards = (a, b, d) => {
        const l = sideLength(a, b);
        return [a[0] + (b[0] - a[0]) * d / l, a[1] + (b[1] - a[1]) * d / l];
    };
    // Sign of the turn at a corner: the same as the orientation of the
    // polygon for outer corners
    const turn = (a, p, b) => (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]);
    const orientation = Math.sign(pts.reduce((sum, p, i) => {
        const next = pts[(i + 1) % n];
        return sum + p[0] * next[1] - next[0] * p[1];
    }, 0));
    const corners = pts.map((p, i) => {
        const prev = pts[(i - 1 + n) % n];
        const next = pts[(i + 1) % n];
        const outer = Math.sign(turn(prev, p, next)) === orientation;
        const r = outer ? Math.min(radius, sideLength(prev, p) / 2, sideLength(p, next) / 2) : 0;
        return { p, start: towards(p, prev, r), end: towards(p, next, r) };
    });
    let path = `M${corners[0].end[0]} ${corners[0].end[1]}`;
    for (let i = 1; i <= n; i++) {
        const { p, start, end } = corners[i % n];
        path += ` L${start[0]} ${start[1]} Q${p[0]} ${p[1]} ${end[0]} ${end[1]}`;
    }
    return path + " Z";
}

// SVG path and size of a marker ("arrow", "box", "rbox", ...) of the given length
function getGenePath(marker, length, markerSize, options = {}) {
    const sizeDefaults = {
        small: { scale: 0.75 },
        medium: { scale: 1 },
        large: { scale: 1.25 }
    };

    const markerDefaults = {
        arrow: { arrowheadWidth: 10, arrowheadHeight: 30, markerHeight: 15 },
        boxarrow: { arrowheadWidth: 10, arrowheadHeight: 30, markerHeight: 30 },
        box: { arrowheadWidth: 0, arrowheadHeight: 30, markerHeight: 30 },
        rbox: { arrowheadWidth: 0, arrowheadHeight: 30, markerHeight: 30, cornerRadius: 5 },
        cbox: { arrowheadWidth: 10, arrowheadHeight: 30, markerHeight: 30 },
        intron: { arrowheadWidth: 0, arrowheadHeight: 0, markerHeight: 20 },  // Add intron default
        // Add other marker types if needed
    };

    const sizeOptions = sizeDefaults[markerSize] || sizeDefaults.medium;
    const markerOptions = markerDefaults[marker] || {};

    const combinedOptions = deepMergeOptions(markerOptions, options);

    // Scale the dimensions based on size
    const { arrowheadWidth, arrowheadHeight, markerHeight, cornerRadius } = combinedOptions;
    const scaledArrowheadWidth = arrowheadWidth * sizeOptions.scale;
    const scaledArrowheadHeight = arrowheadHeight * sizeOptions.scale;
    const scaledMarkerHeight = markerHeight * sizeOptions.scale;

    let shaftLength = length - scaledArrowheadWidth;
    shaftLength = Math.max(0, shaftLength);
    const shaftTop = (scaledArrowheadHeight - scaledMarkerHeight) / 2;
    const shaftBottom = shaftTop + scaledMarkerHeight;

    let path;
    let height = Math.max(scaledMarkerHeight, scaledArrowheadHeight);
    let effectiveCornerRadius;

    switch (marker) {
        case "arrow":
        case "boxarrow":
        case "box":
            path = roundedPolygonPath([
                [0, shaftTop],
                [0, shaftBottom],
                [shaftLength, shaftBottom],
                [shaftLength, scaledArrowheadHeight],
                [length, scaledArrowheadHeight / 2],
                [shaftLength, 0],
                [shaftLength, shaftTop]
            ], cornerRadius || 0);
            break;
        case "rbox":
            effectiveCornerRadius = Math.min(cornerRadius, scaledMarkerHeight / 2, length / 2);
            height = scaledMarkerHeight;
            path = `M ${effectiveCornerRadius},0
                     H ${length - effectiveCornerRadius}
                     A ${effectiveCornerRadius},${effectiveCornerRadius} 0 0 1 ${length},${effectiveCornerRadius}
                     V ${scaledMarkerHeight - effectiveCornerRadius}
                     A ${effectiveCornerRadius},${effectiveCornerRadius} 0 0 1 ${length - effectiveCornerRadius},${scaledMarkerHeight}
                     H ${effectiveCornerRadius}
                     A ${effectiveCornerRadius},${effectiveCornerRadius} 0 0 1 0,${scaledMarkerHeight - effectiveCornerRadius}
                     V ${effectiveCornerRadius}
                     A ${effectiveCornerRadius},${effectiveCornerRadius} 0 0 1 ${effectiveCornerRadius},0
                     Z`;
            break;
        case "cbox":
            effectiveCornerRadius = Math.min(scaledMarkerHeight / 2, length / 2);
            height = scaledMarkerHeight;
            path = `M ${effectiveCornerRadius} 0
                 L ${length - effectiveCornerRadius} 0
                 Q ${length} ${scaledMarkerHeight / 2} ${length - effectiveCornerRadius} ${scaledMarkerHeight}
                 L ${effectiveCornerRadius} ${scaledMarkerHeight}
                 Q 0 ${scaledMarkerHeight / 2} ${effectiveCornerRadius} 0
                 Z`;
            break;
        case "intron":
            // Create a V-shaped path for the intron
            const midPoint = length / 2;
            height = scaledMarkerHeight / 2
            path = `M0 ${height}
                    L${midPoint} 0
                    L${length} ${height}`;
            break;
        default:
            warnOnce(`Marker type '${marker}' not recognized.`);
            path = "";
    }

    // The options the marker was drawn with, before scaling by its size
    const used = { arrowheadWidth, arrowheadHeight, markerHeight, cornerRadius: cornerRadius ?? 0 };
    return { path, length, scaledArrowheadWidth, scaledArrowheadHeight, height, used };
}

// Path and position of the gene (or exon, intron, UTR) marker of d, the i-th
// item. styles holds the marker options and itemStyles the per-item overrides.
// Also sets the marker height and spacing on the container, used by labels.
// Sets the data of the gene row as attributes of the gene, exon, intron or UTR
export function setRowAttributes(selection) {
  selection
    .attr("rowID", (d, i) => `${d["rowID"]}`)
    .attr("start", (d, i) => `${d["start"]}`)
    .attr("end", (d, i) => `${d["end"]}`)
    .attr("strand", (d, i) => `${d["strand"]}`)
    .attr("cluster", (d, i) => `${d["cluster"]}`);
}

// Turns a gene, exon or UTR marker to the direction of the gene (reversed on a
// reversed scale) at its position
export function markerTransform(reverse, d, { xPos, yPos, height }) {
  const rotation = reverse
    ? (d.direction === 'forward' ? 180 : 0)
    : (d.direction === 'forward' ? 0 : 180);
  return `rotate(${rotation}, ${xPos}, ${yPos}) translate(${xPos}, ${yPos - (height / 2)})`;
}

export function getMarkerAttributes(container, d, i, y, styles, itemStyles) {
  const style = itemStyles.find(s => s.index === i) || {};
  const geneLength = Math.abs(container.xScale(d.end) - container.xScale(d.start));
  const currentY = style.y ?? y;

  const marker = style.marker ?? styles.marker;
  const markerSize = style.markerSize ?? styles.markerSize;
  const { path, arrowheadWidth, arrowheadHeight, height, used } = getGenePath(
    marker,
    geneLength,
    markerSize,
    {
      arrowheadWidth: style.arrowheadWidth ?? styles.arrowheadWidth,
      arrowheadHeight: style.arrowheadHeight ?? styles.arrowheadHeight,
      markerHeight: style.markerHeight ?? styles.markerHeight,
      cornerRadius: style.cornerRadius ?? styles.cornerRadius
    }
  );

  // The labels and track spacing of the cluster follow its own marker, not
  // the size or y of a single item set with itemStyle
  const clusterHeight = getGenePath(styles.marker, geneLength, styles.markerSize, {
    arrowheadWidth: styles.arrowheadWidth,
    arrowheadHeight: styles.arrowheadHeight,
    markerHeight: styles.markerHeight,
    cornerRadius: styles.cornerRadius
  }).height;
  container.markerHeight = clusterHeight;
  container.markerY = y;
  container.geneStrandSpacing = container.separateStrands ? (clusterHeight / 2 + container.strandSpacing) : 0;
  container.geneOverlapSpacing = (clusterHeight + container.overlapSpacing);

  // Calculate Y position based on geneTrack
  const currentGeneStrandSpacing = (d.strand === "forward" && container.geneStrandSpacing !== 0)
    ? container.geneStrandSpacing
    : -container.geneStrandSpacing;
  const currentOverlapSpacing = d.geneTrack ? (d.geneTrack - 1) * container.geneOverlapSpacing : 0;

  const yPos = container.yScale(currentY) - currentGeneStrandSpacing + currentOverlapSpacing;
  const xPos = container.xScale(d.start);

  // The settings the gene was drawn with, e.g. for an editor to show them
  const drawn = { marker, markerSize, ...used, y: currentY };

  return { xPos, yPos, path, arrowheadWidth, arrowheadHeight, height, drawn };
}

container.prototype.genes = function (group, show = true, options = {}) {

  if (!show) {
    return this;
  }

  const defaultOptions = {
    x: 1,
    y: 50,
    stroke: "black",
    strokeWidth: 1,
    colorScheme: null,
    customColors: null,
    pattern: null,
    cursor: "default",
    marker: "arrow",
    markerSize: "medium",
    itemStyle: [],
    groupStyle: {},
    styleBy: null,
    arrowheadWidth: null,
    arrowheadHeight: null,
    markerHeight: null,
    cornerRadius: null
  };

  const combinedOptions = mergeOptions.call(this, defaultOptions, 'geneOptions', options);
  const { x, y, stroke, strokeWidth, colorScheme, customColors, pattern, cursor, groupStyle, styleBy } = combinedOptions;

  // Extract additional options that aren't in defaultOptions
  const additionalOptions = extractAdditionalOptions(combinedOptions, defaultOptions);

  const uniqueGroups = [...new Set(this.dataAll.map(d => d[group]))];

  const colorScale = getColorScale(colorScheme, customColors, uniqueGroups);
  this.genesColorScale = colorScale;
  const patternScale = getPatternScale(this.svg, pattern, uniqueGroups, colorScale, "gene");

  var g = this.svg.append("g")
    .attr("data-component", "genes")
    .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

  // Sort the data first by the minimum value of start and end.
  this.data.sort((a, b) => Math.min(a.start, a.end) - Math.min(b.start, b.end));

  // The style of each gene: that of its group (groupStyle, by the column in
  // styleBy or else group), with the style of the gene itself (itemStyle, by
  // index) on top
  const itemStyle = withGroupStyles(this.data, styleBy ?? group, groupStyle, combinedOptions.itemStyle);

  const getAttributesForIndex = (d, i) => getMarkerAttributes(this, d, i, y, combinedOptions, itemStyle);

  g.selectAll(".gene")
    .data(this.data)
    .enter()
    .append("path")
    .attr("d", (d, i) => {
      return getAttributesForIndex(d, i).path;
    })
    .attr("transform", (d, i) => markerTransform(this.reverse, d, getAttributesForIndex(d, i)))
    .attr("fill", (d) => patternScale.fill(d[group]))
    .attr("class", "gene")
    .attr("id", (d, i) => `${sanitizeId(d.cluster)}-gene-${i}`)
    .call(setRowAttributes)
    .style("stroke-width", strokeWidth)
    .style("stroke", stroke)
    .style("cursor", cursor)
    .each(function (d, i) {
      const currentElement = d3.select(this);
      // Set additional options as attributes
      setStyleFromOptions(currentElement, additionalOptions);
      // Override with itemStyle based on the index
      applyStyleToElement(currentElement, itemStyle, i);
      // The shape settings it was drawn with, reported by GC_events()
      this.__drawn__ = getAttributesForIndex(d, i).drawn;
    });

  // Update the reference
  this.genes = g.selectAll(".gene");

  return this;
};
