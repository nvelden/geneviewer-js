// Styles: options applied to elements as CSS, per-group styles and moves.
export function camelToKebab(string) {
  return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

export function extractAdditionalOptions(combinedOptions, defaultOptions) {
  // Extract additional options that are not in defaultOptions
  const additionalOptions = Object.keys(combinedOptions).reduce((acc, key) => {
    if (!(key in defaultOptions)) {
      acc[key] = combinedOptions[key];
    }
    return acc;
  }, {});

  return additionalOptions;
}

// Element options that position an element (applyMove()), not CSS
const moveKeys = ["moveX", "moveY"];

// Styles that colour an element but leave its size
const paintStyles = ["fill", "fillOpacity", "stroke", "strokeOpacity", "strokeWidth",
                     "strokeDasharray", "opacity", "color", "cursor", "pointerEvents"];
const notStyles = ["index", "rowID", "text", "labelAdjustmentOptions", ...moveKeys];

// True when styles (setStyleFromOptions(), applyStyleToElement()) can change
// the size of an element. Options that are no CSS property (label, show) do not.
export function changesSize(styles) {
  return Object.keys(styles ?? {}).some(key =>
    !paintStyles.includes(key) && !notStyles.includes(key) && key in document.documentElement.style);
}

export function setStyleFromOptions(currentElement, additionalOptions) {
  for (const [key, value] of Object.entries(additionalOptions)) {
    if (moveKeys.includes(key)) continue;
    currentElement.style(camelToKebab(key), value);
  }
}

// The style of each item: that of its group (groupStyle, by the value of the
// item in column), with the style of the item itself (itemStyle, by index) on
// top. Gives an itemStyle list.
export function withGroupStyles(items, column, groupStyle, itemStyle = []) {
  return items.flatMap((d, i) => {
    const ofGroup = column && groupStyle ? groupStyle[d[column]] : undefined;
    const ofIndex = itemStyle.find(s => s.rowID == null && s.index === i);
    const ofRow = itemStyle.find(s => s.rowID != null && s.rowID === d.rowID);
    return ofGroup || ofIndex || ofRow ? [{ ...ofGroup, ...ofIndex, ...ofRow, index: i }] : [];
  });
}

export function applyStyleToElement(currentElement, itemStyle, i) {
  const style = itemStyle.find(s => s.index === i);
  if (style) {
    for (const [key, value] of Object.entries(style)) {
      if (!['index', 'rowID', 'text', 'labelAdjustmentOptions', ...moveKeys].includes(key)) {
        currentElement.style(camelToKebab(key), value);
      }
    }
  }
}

// True for an opaque white colour ("#FFF", "white", "rgb(255, 255, 255)"),
// false for other colours and pattern fills ("url(#...)")
export function isWhite(color) {
  const rgb = typeof color === "string" ? d3.color(color)?.rgb() : null;
  return !!rgb && rgb.r === 255 && rgb.g === 255 && rgb.b === 255 && rgb.opacity === 1;
}

// Styles a title or subtitle text: the font options of defaultFont as styles,
// in their order, then the text with its <b>, <i> and <u> tags and the font
// options not in defaultFont
// The style a title or subtitle has of its own (GC_element_style(part = )):
// its text, and the options of its font
export function partStyle(itemStyle, part) {
  const { part: _part, text, ...style } = (itemStyle ?? []).find(s => s.part === part) ?? {};
  return { text, style };
}

// Move an element by its moveX and moveY (GC_element_style()): a translation
// in SVG pixels, independent of text rotation and automatic layout
export function applyMove(selection, options = {}) {
  selection.each(function () {
    const moveX = Number(options.moveX ?? 0);
    const moveY = Number(options.moveY ?? 0);
    const base = this.getAttribute("transform") || "";
    this.__drawn__ = { ...this.__drawn__, moveX, moveY };
    this.setAttribute("transform", `translate(${moveX}, ${moveY}) ${base}`.trim());
  });
}
