// Colour and pattern scales of groups.
import { warnOnce } from "./util.js";

export function getColorScale(colorScheme, customColors, uniqueGroups) {
  const schemeCategory30 = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
    "#393b79", "#637939", "#8c6d31", "#843c39", "#7b4173",
    "#bd9e39", "#ad494a", "#d6616b", "#31a354", "#cedb9c",
    "#9c9ede", "#5254a3", "#8ca252", "#b5cf6b", "#e7ba52",
    "#ce6dbd", "#e7cb94", "#e7969c", "#6b6ecf", "#a55194"
  ];

  // Colours are assigned to the non-null groups only, so genes() (which keeps
  // null groups) and legend() (which drops them) give each group the same colour.
  // Null groups are white.
  const groups = uniqueGroups.filter(group => group !== null);

  // Colours of the colour scheme: a d3 scheme name or an array of colours (e.g.
  // the palette of a theme), by default schemeCategory30. usesScheme tells
  // which groups take their colour from it: a warning that colours repeat is
  // only for those.
  const schemeRange = (usesScheme = () => true) => {
    if (colorScheme && (Array.isArray(colorScheme) || d3[colorScheme])) {
      const scheme = Array.isArray(colorScheme) ? colorScheme : d3[colorScheme];
      if (groups.some((group, index) => index >= scheme.length && usesScheme(group))) {
        warnOnce(`Warning: More unique groups than colors. Some colors will repeat.`);
      }
      return groups.map((group, index) => scheme[index % scheme.length]);
    }
    if (colorScheme) {
      warnOnce(`Warning: The color scheme "${colorScheme}" does not exist. Defaulting to schemeCategory30.`);
    }
    return groups.map((group, index) =>
      group === "No Hit" ? "#FFF" : schemeCategory30[index % schemeCategory30.length]
    );
  };

  let range;
  if (customColors && typeof customColors === "string") {
    // Handle customColors as a single color
    range = groups.map(() => customColors);
  } else if (customColors && Array.isArray(customColors)) {
    // Handle customColors as an array
    range = groups.map((group, index) => customColors[index % customColors.length] || "#FFF");
  } else if (customColors && typeof customColors === 'object') {
    // Handle customColors as an object: groups it leaves out keep the colour
    // of the colour scheme
    const scheme = schemeRange(group => !customColors[group]);
    range = groups.map((group, index) => customColors[group] || scheme[index]);
  } else {
    range = schemeRange();
  }

  return d3.scaleOrdinal()
    .domain([...groups, null])
    .range([...range, "#FFF"]);
}

// Pattern tiles: each draws the foreground of a square pattern tile of size s
// on the background colour bg.
const genePatterns = {
  none: () => {},
  solid: (p, s, color) => p.append("rect").attr("width", s).attr("height", s).attr("fill", color),
  horizontal: (p, s, color, w) => p.append("path").attr("d", `M0,${s / 2}H${s}`).attr("stroke", color).attr("stroke-width", w),
  vertical: (p, s, color, w) => p.append("path").attr("d", `M${s / 2},0V${s}`).attr("stroke", color).attr("stroke-width", w),
  // The corner segments keep the lines unbroken where tiles meet
  diagonal: (p, s, color, w) => p.append("path")
    .attr("d", `M0,${s}L${s},0M${-s / 4},${s / 4}L${s / 4},${-s / 4}M${s * 3 / 4},${s * 5 / 4}L${s * 5 / 4},${s * 3 / 4}`)
    .attr("stroke", color).attr("stroke-width", w),
  antidiagonal: (p, s, color, w) => p.append("path")
    .attr("d", `M0,0L${s},${s}M${-s / 4},${s * 3 / 4}L${s / 4},${s * 5 / 4}M${s * 3 / 4},${-s / 4}L${s * 5 / 4},${s / 4}`)
    .attr("stroke", color).attr("stroke-width", w),
  grid: (p, s, color, w) => p.append("path").attr("d", `M0,${s / 2}H${s}M${s / 2},0V${s}`).attr("stroke", color).attr("stroke-width", w),
  crosshatch: (p, s, color, w) => {
    genePatterns.diagonal(p, s, color, w);
    genePatterns.antidiagonal(p, s, color, w);
  },
  dots: (p, s, color) => p.append("circle").attr("cx", s / 2).attr("cy", s / 2).attr("r", s / 5).attr("fill", color),
  zigzag: (p, s, color, w) => p.append("path")
    .attr("d", `M0,${s * 0.7}L${s / 2},${s * 0.3}L${s},${s * 0.7}`)
    .attr("fill", "none").attr("stroke", color).attr("stroke-width", w),
  checkerboard: (p, s, color) => p.append("path")
    .attr("d", `M0,0H${s / 2}V${s / 2}H0ZM${s / 2},${s / 2}H${s}V${s}H${s / 2}Z`)
    .attr("fill", color),
  rings: (p, s, color, w) => p.append("circle").attr("cx", s / 2).attr("cy", s / 2).attr("r", s / 3.2)
    .attr("fill", "none").attr("stroke", color).attr("stroke-width", w * 0.8),
  // Rows of bricks, each row offset by half a brick
  bricks: (p, s, color, w) => p.append("path")
    .attr("d", `M0,0H${s}M0,${s / 2}H${s}M${s / 4},0V${s / 2}M${s * 3 / 4},${s / 2}V${s}`)
    .attr("stroke", color).attr("stroke-width", w),
  plus: (p, s, color, w) => p.append("path")
    .attr("d", `M${s / 2},${s * 0.2}V${s * 0.8}M${s * 0.2},${s / 2}H${s * 0.8}`)
    .attr("stroke", color).attr("stroke-width", w),
  // Filled band, so it reads as thick stripes at any strokeWidth
  wideStripes: (p, s, color) => p.append("path")
    .attr("d", `M0,${s}L${s},0H${s / 2}L0,${s / 2}ZM${s},${s / 2}V${s}H${s / 2}Z`)
    .attr("fill", color),
  // Background-coloured dots on a solid tile
  inverseDots: (p, s, color, w, bg) => {
    genePatterns.solid(p, s, color);
    p.append("circle").attr("cx", s / 2).attr("cy", s / 2).attr("r", s / 4).attr("fill", bg);
  }
};

// Tile size of each pattern relative to size; shapes that need more room get a larger tile
const patternTileScale = { checkerboard: 4 / 3, rings: 7 / 6, bricks: 5 / 3, plus: 4 / 3, wideStripes: 4 / 3 };

// Patterns that look alike (diagonal and wideStripes, dots and rings, grid and plus,
// diagonal and antidiagonal) are far apart, so neighbouring groups do not look alike
const defaultPatternOrder = [
  "diagonal", "dots", "horizontal", "crosshatch", "vertical", "zigzag", "checkerboard", "solid",
  "rings", "bricks", "inverseDots", "grid", "wideStripes", "plus", "antidiagonal"
];

// Returns the value for each group from a single value, an array (recycled) or an object (by group name).
function valuesByGroup(values, groups, fallback) {
  if (values === null || values === undefined) {
    return groups.map(() => fallback);
  }
  if (typeof values === "string") {
    return groups.map(() => values);
  }
  if (Array.isArray(values)) {
    return groups.map((group, index) => values[index % values.length]);
  }
  return groups.map(group => values[group] ?? fallback);
}

// Adds a <pattern> for each group to the <defs> of svg and returns a fill and
// a stroke function per group. Patterns are defined in every SVG that uses
// them, because the save button renders each SVG on its own.
export function getPatternScale(svg, pattern, uniqueGroups, colorScale, idPrefix) {
  if (!pattern) {
    return { fill: colorScale, stroke: colorScale, outline: null, align: () => {} };
  }

  const { patterns = null, color = "black", background = null, size = 6, strokeWidth = 1 } = pattern;

  // Same groups and order as getColorScale, so genes and legend match
  const groups = uniqueGroups.filter(group => group !== null);
  const types = valuesByGroup(patterns, groups, "none");
  if (patterns === null || patterns === undefined) {
    groups.forEach((group, index) => {
      types[index] = defaultPatternOrder[index % defaultPatternOrder.length];
    });
    if (groups.length > defaultPatternOrder.length) {
      warnOnce(`Warning: More unique groups than patterns. Some patterns will repeat.`);
    }
  }
  const backgrounds = valuesByGroup(background, groups, null);
  const colors = valuesByGroup(color, groups, "black");

  const svgId = svg.attr("id") || "geneviewer";
  const defs = svg.append("defs");
  const fills = new Map();
  const tiles = new Map();

  groups.forEach((group, index) => {
    let type = types[index];
    if (!genePatterns[type]) {
      warnOnce(`Warning: The pattern "${type}" does not exist. Using "none".`);
      type = "none";
    }
    // "No Hit" stays a plain white gene, like in the default colours
    if (group === "No Hit" && (patterns === null || patterns === undefined)) {
      type = "none";
    }
    const id = `${svgId}-${idPrefix}-pattern-${index}`;
    const tileSize = size * (patternTileScale[type] ?? 1);
    const bg = backgrounds[index] ?? colorScale(group);
    const tile = defs.append("pattern")
      .attr("id", id)
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", tileSize)
      .attr("height", tileSize);
    tile.append("rect")
      .attr("width", tileSize)
      .attr("height", tileSize)
      .attr("fill", bg);
    genePatterns[type](tile, tileSize, colors[index], strokeWidth, bg);
    fills.set(group, `url(#${id})`);
    tiles.set(group, tile);
  });

  const colorByGroup = new Map(groups.map((group, index) => [group, colors[index]]));

  return {
    fill: group => fills.get(group) ?? colorScale(group),
    // Lines (introns, UTR outlines) take the pattern colour when the
    // background replaces the gene colours, and keep the gene colour otherwise
    stroke: group => (background === null || background === undefined)
      ? colorScale(group)
      : (colorByGroup.get(group) ?? colors[0]),
    // Outline for legend markers, so white and patterned markers stay visible;
    // black when the groups have different pattern colours
    outline: typeof color === "string" ? color : "black",
    // Starts the tiles of a group at (x, y), e.g. at the corner of its legend marker
    align: (group, x, y) => tiles.get(group)?.attr("x", x).attr("y", y)
  };
}
