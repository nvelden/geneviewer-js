// A table of columns, as R's data frames: compile() works on these and they
// become objects of columns ({ start: [...], end: [...] }) in the render
// model, as htmlwidgets writes data frames.

/** A table of equal-length columns, in column order. */
export class Frame {
  /**
   * @param {Object<string, Array<*>>} [columns] Columns by name, in order.
   */
  constructor(columns = {}) {
    /** @type {Map<string, Array<*>>} */
    this.columns = new Map(Object.entries(columns));
  }

  /**
   * A table from spec data: an array of rows or an object of columns.
   * @param {Array<Object>|Object<string, Array<*>>} data
   * @returns {Frame}
   */
  static from(data) {
    if (Array.isArray(data)) {
      const names = [];
      for (const row of data) {
        for (const name of Object.keys(row)) if (!names.includes(name)) names.push(name);
      }
      const frame = new Frame();
      for (const name of names) frame.columns.set(name, data.map((row) => (row[name] === undefined ? null : row[name])));
      return frame;
    }
    const frame = new Frame();
    for (const [name, values] of Object.entries(data || {})) {
      frame.columns.set(name, Array.isArray(values) ? values.slice() : [values]);
    }
    return frame;
  }

  /** @returns {Frame} */
  copy() {
    const frame = new Frame();
    for (const [name, values] of this.columns) frame.columns.set(name, values.slice());
    return frame;
  }

  /** @returns {number} */
  get nrow() {
    const first = this.columns.values().next();
    return first.done ? 0 : first.value.length;
  }

  /** @returns {string[]} */
  get names() {
    return [...this.columns.keys()];
  }

  /**
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return this.columns.has(name);
  }

  /**
   * @param {string} name
   * @returns {Array<*>|undefined}
   */
  get(name) {
    return this.columns.get(name);
  }

  /**
   * Sets a column: in its place when it exists, otherwise last (R's
   * `data$name <- values`). A single value is recycled over the rows.
   * @param {string} name
   * @param {Array<*>|*} values
   * @returns {Frame} this
   */
  set(name, values) {
    const n = this.nrow;
    this.columns.set(name, Array.isArray(values) ? values : Array.from({ length: n }, () => values));
    return this;
  }

  /**
   * The rows at the given 0-based indices, in that order.
   * @param {number[]} indices
   * @returns {Frame}
   */
  rows(indices) {
    const frame = new Frame();
    for (const [name, values] of this.columns) frame.columns.set(name, indices.map((i) => values[i]));
    return frame;
  }

  /**
   * The rows for which keep(i) is true.
   * @param {(i: number) => boolean} keep
   * @returns {Frame}
   */
  filter(keep) {
    const indices = [];
    for (let i = 0; i < this.nrow; i++) if (keep(i)) indices.push(i);
    return this.rows(indices);
  }

  /**
   * The columns with the given names, in that order.
   * @param {string[]} names
   * @returns {Frame}
   */
  select(names) {
    const frame = new Frame();
    for (const name of names) if (this.columns.has(name)) frame.columns.set(name, this.columns.get(name).slice());
    return frame;
  }

  /** @returns {Object<string, Array<*>>} The columns, as htmlwidgets writes a data frame. */
  toJSON() {
    return Object.fromEntries(this.columns);
  }
}
