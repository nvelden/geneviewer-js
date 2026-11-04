// R's rules that compile() follows to give what the R package gave: how
// numbers become text, how options are recycled over clusters, and the
// sizes of the chart (R/utils.R).

/**
 * R's as.character() of one value: numbers with up to 15 significant
 * digits, in fixed or scientific notation, whichever is shorter (R 4.4);
 * TRUE/FALSE; null for NA.
 * @param {*} x
 * @returns {string|null}
 */
export function asCharacter(x) {
  if (x === null || x === undefined) return null;
  if (typeof x === "boolean") return x ? "TRUE" : "FALSE";
  if (typeof x !== "number") return String(x);
  if (Number.isNaN(x)) return "NaN";
  if (!Number.isFinite(x)) return x > 0 ? "Inf" : "-Inf";
  if (x === 0) return "0";
  // Up to 15 significant digits; whole numbers beyond that as they are
  const rounded = Number(x.toPrecision(15));
  const value = rounded !== x && Number.isInteger(x) ? x : rounded;
  const [mantissa, exponent] = Math.abs(value).toExponential().split("e");
  const digits = mantissa.replace(".", "");
  const e = Number(exponent);
  const sign = value < 0 ? "-" : "";
  let fixed;
  if (e >= 0) {
    fixed = digits.length > e + 1
      ? `${digits.slice(0, e + 1)}.${digits.slice(e + 1)}`
      : digits + "0".repeat(e + 1 - digits.length);
  } else {
    fixed = `0.${"0".repeat(-e - 1)}${digits}`;
  }
  const scientific = `${mantissa}e${e < 0 ? "-" : "+"}${String(Math.abs(e)).padStart(2, "0")}`;
  return sign + (fixed.length <= scientific.length ? fixed : scientific);
}

/**
 * R's as.numeric() of one value: a number, or null for NA.
 * @param {*} x
 * @returns {number|null}
 */
export function asNumeric(x) {
  if (x === null || x === undefined) return null;
  if (typeof x === "number") return x;
  if (typeof x === "boolean") return x ? 1 : 0;
  const text = String(x).trim();
  if (text === "" || !/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$|^[-+]?(Inf|NaN)$/.test(text)) return null;
  return Number(text.replace("Inf", "Infinity"));
}

/**
 * The value for the i-th (0-based) selected cluster, as R's recycle_at():
 * `x[(i - 1) %% length(x) + 1]`. An array gives its element; an element that
 * is itself a list stays in a list of one, as R gives it. An object (a named
 * list) gives an object with its one element. Other values are themselves.
 * @param {*} x
 * @param {number} i
 * @returns {*} undefined for null and empty values
 */
export function recycleAt(x, i) {
  if (x === null || x === undefined) return undefined;
  if (Array.isArray(x)) {
    if (!x.length) return undefined;
    const value = x[i % x.length];
    return value !== null && typeof value === "object" ? [value] : value;
  }
  if (isNamedList(x)) {
    const keys = Object.keys(x);
    if (!keys.length) return undefined;
    const key = keys[i % keys.length];
    return { [key]: x[key] };
  }
  return x;
}

/**
 * Whether a value is an object, not an array (an R named list).
 * @param {*} x
 * @returns {boolean}
 */
export function isNamedList(x) {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

/**
 * R's c(x) as an array: an array as it is, a value in an array of one, no
 * value an empty array.
 * @param {*} x
 * @returns {Array<*>}
 */
export function asArray(x) {
  if (x === null || x === undefined) return [];
  return Array.isArray(x) ? x : [x];
}

/**
 * Whether a value is R's NULL or an empty list.
 * @param {*} x
 * @returns {boolean}
 */
export function isEmpty(x) {
  if (x === null || x === undefined) return true;
  if (Array.isArray(x)) return x.length === 0;
  if (isNamedList(x)) return Object.keys(x).length === 0;
  return false;
}

/**
 * R's compact(): the options without NULL and empty values.
 * @param {Object<string, *>} options
 * @returns {Object<string, *>}
 */
export function compact(options) {
  const out = {};
  for (const [key, value] of Object.entries(options)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (isNamedList(value) && Object.keys(value).length === 0) continue;
    out[key] = value;
  }
  return out;
}

/**
 * R's Filter(Negate(is.null), options): the options without NULL values.
 * @param {Object<string, *>} options
 * @returns {Object<string, *>}
 */
export function dropNull(options) {
  const out = {};
  for (const [key, value] of Object.entries(options)) {
    if (value !== null && value !== undefined) out[key] = value;
  }
  return out;
}

/**
 * R's utils::modifyList(old, new): named lists merged at every level; a
 * NULL in new removes the element.
 * @param {Object<string, *>} old
 * @param {Object<string, *>} update
 * @returns {Object<string, *>}
 */
export function modifyList(old, update) {
  const out = isNamedList(old) ? { ...old } : {};
  for (const [key, value] of Object.entries(update || {})) {
    if (value === null || value === undefined) {
      delete out[key];
    } else if (isNamedList(out[key]) && isNamedList(value)) {
      out[key] = modifyList(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * R's merge_options(): new when there are no old options, otherwise the old
 * options updated with new by modifyList().
 * @param {Object<string, *>|undefined} old
 * @param {Object<string, *>} update
 * @returns {Object<string, *>}
 */
export function mergeOptions(old, update) {
  return old === null || old === undefined ? update : modifyList(old, update);
}

/**
 * R's compute_size(): a size divided by a number; "400px" and "50%" keep
 * their unit.
 * @param {number|string} value
 * @param {number} length
 * @returns {number|string}
 */
export function computeSize(value, length = 2) {
  if (typeof value === "number") return value / length;
  if (/px$/.test(value)) return `${asCharacter(asNumeric(value.replace(/px$/, "")) / length)}px`;
  if (/%$/.test(value)) return `${asCharacter(asNumeric(value.replace(/%$/, "")) / length)}%`;
  throw new Error("Unsupported format");
}

/**
 * R's get_relative_height(): a size relative to a base size, in pixels, or
 * the percentage itself when both are percentages.
 * @param {number|string} baseHeight
 * @param {number|string} relativeHeight
 * @returns {number|string|null}
 */
export function getRelativeHeight(baseHeight, relativeHeight) {
  const isPercent = (x) => typeof x === "string" && /%$/.test(x);
  if (isPercent(baseHeight) && isPercent(relativeHeight)) return relativeHeight;
  let base = baseHeight;
  if (typeof base === "string" && /px$/.test(base)) base = asNumeric(base.replace("px", ""));
  if (isPercent(relativeHeight)) {
    const percentage = asNumeric(String(relativeHeight).replace("%", "")) / 100;
    return typeof base === "number" ? base * percentage : null;
  }
  let relative = relativeHeight;
  if (typeof relative === "string" && /px$/.test(relative)) relative = asNumeric(String(relative).replace("px", ""));
  return asNumeric(relative);
}

/**
 * A deep copy of plain data; tables are copied with their copy().
 * @param {*} x
 * @returns {*}
 */
export function clone(x) {
  if (x === null || typeof x !== "object") return x;
  if (typeof x.copy === "function") return x.copy();
  if (Array.isArray(x)) return x.map(clone);
  const out = {};
  for (const [key, value] of Object.entries(x)) out[key] = clone(value);
  return out;
}
