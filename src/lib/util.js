// Utilities: table rows, ids, sizes, option merging and warnings.
/**
 * Table data as an array of rows. Columns ({ a: [1, 2], b: ["x", "y"] }), as
 * R sends a data frame, become rows ([{ a: 1, b: "x" }, { a: 2, b: "y" }]);
 * rows are passed through. All columns have the length of the first. null or
 * undefined gives no rows.
 * @param {Object<string, Array>|Array<Object>|null|undefined} data
 * @returns {Array<Object>}
 */
export function toRows(data) {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  const names = Object.keys(data);
  const length = names.length ? data[names[0]].length : 0;
  const rows = [];
  for (let i = 0; i < length; i++) {
    const row = {};
    for (const name of names) row[name] = data[name][i];
    rows.push(row);
  }
  return rows;
}

export function getUniqueId(baseId) {
  var i = 1;
  while (document.getElementById(baseId + "-" + i)) {
    i++;
  }
  return baseId + "-" + i;
}

export function sanitizeId(str) {
  // Replace any character that is not a letter, number, underscore, or hyphen with an underscore
  return str.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function computeSize(inputSize, containerSize) {

  // If inputSize is undefined or null, return 0
  if (typeof inputSize === "undefined" || inputSize === null) {
    return 0;
  }

  // If inputSize is a number, return it directly
  if (typeof inputSize === "number") {
    return inputSize;
  }

  // Initialize resultSize
  var resultSize;

  // Check if the size is given as a percentage
  if (inputSize.includes("%")) {
    var percentageValue = parseFloat(inputSize);
    var fraction = percentageValue / 100;
    resultSize = Math.round(fraction * containerSize);
  }
  // Check if the size is given in pixels
  else if (inputSize.includes("px")) {
    resultSize = parseFloat(inputSize);
  }
  // Assume it's a plain number otherwise
  else {
    resultSize = parseFloat(inputSize);
  }

  return Math.floor(resultSize);
}

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Deep merge of options: nested objects are merged at every level, other values
// (arrays included) replace the base value. null means not set, and so does an
// empty array in place of an object (an empty list() from R). Returns new objects,
// so the base and override (e.g. a theme shared by all clusters) are not changed.
export function deepMergeOptions(base, override) {
  const result = { ...base };
  if (!isPlainObject(override)) {
    return result;
  }
  for (const key in override) {
    const value = override[key];
    if (value === null || value === undefined) {
      continue;
    }
    if (isPlainObject(value)) {
      result[key] = deepMergeOptions(isPlainObject(result[key]) ? result[key] : {}, value);
    } else if (Array.isArray(value) && value.length === 0 && isPlainObject(result[key])) {
      continue;
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Multiplies a size ("12px", "1.2em", 12) by factor, keeping its unit
function scaleSize(value, factor) {
  if (typeof value === "number") {
    return value * factor;
  }
  const match = typeof value === "string" && value.trim().match(/^(-?[\d.]+)([a-z%]*)$/i);
  return match ? `${parseFloat(match[1]) * factor}${match[2]}` : value;
}

// Scales every fontSize in options (at any level) by factor. Returns new objects.
function scaleFontSizes(options, factor) {
  if (!isPlainObject(options)) {
    return options;
  }
  const result = {};
  for (const key in options) {
    result[key] = key === "fontSize" ? scaleSize(options[key], factor) : scaleFontSizes(options[key], factor);
  }
  return result;
}

// Order of precedence: defaultOptions < theme (themeOptions[themeOptionsKey]) < userOptions.
// themeOptions: the chart theme, by default the theme of the container (this).
// The textScale of the theme scales the font sizes of the defaults and the theme,
// not those set by the user.
export function mergeOptions(defaultOptions, themeOptionsKey, userOptions = {}, themeOptions = this?.themeOptions) {
  const themeOpts = themeOptions?.[themeOptionsKey];
  let options = deepMergeOptions(defaultOptions, themeOpts);
  const textScale = themeTextScale(themeOptions);
  if (textScale !== 1) {
    options = scaleFontSizes(options, textScale);
  }
  return deepMergeOptions(options, userOptions);
}

// Text size of the theme, as a factor of the default font sizes
export function themeTextScale(themeOptions) {
  const textScale = themeOptions?.textScale;
  return typeof textScale === "number" && textScale > 0 ? textScale : 1;
}

// Warnings shown once per page: the colour and pattern scales are made for
// every cluster and legend on every draw, which includes each zoom frame and
// resize
const shownWarnings = new Set();
export function warnOnce(message) {
  if (shownWarnings.has(message)) return;
  shownWarnings.add(message);
  console.warn(message);
}
