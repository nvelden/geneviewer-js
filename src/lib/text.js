// Text: styled segments (<b>, <i>, <u>), wrapping and the label adjuster.
// Wraps a text element into lines of at most width pixels. <b>, <i> and <u>
// tags are read before the text is split into words, so each word keeps its
// style when a tagged part runs over two lines.
export function wrap(text, width, options = {}) {
  // Default options
  const defaultOptions = {
    dyAdjust: 0,
    lineHeightEms: 1.05,
    lineHeightSquishFactor: 1,
    splitOnHyphen: true,
    centreVertically: true,
  };

  // Merge default options and user-specified options
  const {
    dyAdjust,
    lineHeightEms,
    lineHeightSquishFactor,
    splitOnHyphen,
    centreVertically
  } = { ...defaultOptions, ...options };

  text.each(function () {
    var text = d3.select(this),
      x = text.attr("x"),
      y = text.attr("y");

    // Words as lists of styled pieces: "pQEB1<i>-like</i>" is one word. A word
    // split at a hyphen is not followed by a space
    var words = [];
    var word = [];
    var endWord = function (space) {
      if (word.length) words.push({ pieces: word, space: space });
      word = [];
    };
    styledSegments(text.text()).forEach(function (segment) {
      segment.content.split(/(\s+)/).forEach(function (part) {
        if (/^\s+$/.test(part)) {
          endWord(true);
          return;
        }
        var pieces = splitOnHyphen ? part.split(/(?<=-)/) : [part];
        pieces.forEach(function (piece, i) {
          if (piece) word.push({ ...segment, content: piece });
          if (i < pieces.length - 1) endWord(false);
        });
      });
    });
    endWord(true);

    // Writes words into a line
    var setLine = function (line, lineWords) {
      line.selectAll("*").remove();
      lineWords.forEach(function (lineWord, i) {
        lineWord.pieces.forEach(function (piece, j) {
          var last = j === lineWord.pieces.length - 1 && i < lineWords.length - 1;
          var space = last && lineWord.space ? " " : "";
          var tspan = line.append("tspan").text(piece.content + space);
          if (piece.bold) tspan.style("font-weight", "bold");
          if (piece.italic) tspan.style("font-style", "italic");
          if (piece.underline) tspan.style("text-decoration", "underline");
        });
      });
    };

    text.text(null); // Empty the text element

    var line = text.append("tspan").attr("class", "wrap-line");
    var lineWords = [];

    for (var i = 0; i < words.length; i++) {
      lineWords.push(words[i]);
      setLine(line, lineWords);

      if (line.node().getComputedTextLength() > width && lineWords.length > 1) {
        lineWords.pop();
        setLine(line, lineWords);
        lineWords = [words[i]];
        line = text.append("tspan").attr("class", "wrap-line");
        setLine(line, lineWords);
      }
    }

    var lines = text.selectAll("tspan.wrap-line");
    var h = lineHeightEms;

    if (lines.size() > 2)
      for (var i = 0; i < lines.size(); i++) h *= lineHeightSquishFactor;

    lines.each(function (d, i) {
      var dy = i * h + dyAdjust;
      if (centreVertically) dy -= ((lines.size() - 1) * h) / 2;
      d3.select(this)
        .attr("y", y)
        .attr("x", x)
        .attr("dy", dy + "em");
    });
  });
}

// Rotates labels that overlap another label of labelSelector in the
// container's SVG. Call adjust(label, options) for each label in turn (it
// returns true when it rotated the label) and refresh(label) after restyling a label. Label sizes are measured once and
// measured again only when a label changes, instead of on every comparison.
// With options.hide, a label that overlaps is hidden instead (adjust() returns
// false). bounds, { left, right, top, bottom } in the coordinates of the
// labels, is the area the labels are drawn in: a label that would turn out of
// it is hidden rather than cut off.
export function createLabelAdjuster(container, labelSelector, bounds = null) {
  // Default options
  const defaultOptions = {
    rotation: -65, // Rotation angle (in degrees)
    offsetX: 0,
    offsetY: 0,
    dx: "0em", // Horizontal adjustment
    dy: "0em", // Vertical adjustment
  };

  const overlapPercentage = (rect1, rect2) => {
    const x_overlap = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
    const y_overlap = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
    const overlapArea = x_overlap * y_overlap;
    const rect1Area = (rect1.right - rect1.left) * (rect1.bottom - rect1.top);
    return (overlapArea / rect1Area) * 100;
  };

  // The box of a label in the page, as getBoundingClientRect() gives it, from
  // its own box (getBBox()) and the transforms down to it
  const screenCTMs = new Map();
  const toScreen = (label, box) => {
    const parent = label.parentNode;
    if (!screenCTMs.has(parent)) {
      const ctm = parent.getScreenCTM?.();
      screenCTMs.set(parent, ctm ? DOMMatrix.fromMatrix(ctm) : null);
    }
    let matrix = screenCTMs.get(parent);
    if (!matrix) return label.getBoundingClientRect();
    const own = label.transform?.baseVal?.consolidate();
    if (own) matrix = matrix.multiply(DOMMatrix.fromMatrix(own.matrix));
    const corners = [
      [box.x, box.y], [box.x + box.width, box.y],
      [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]
    ].map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix));
    const xs = corners.map(p => p.x);
    const ys = corners.map(p => p.y);
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  };
  const boxes = new Map();
  const measure = (label) => {
    const box = label.getBBox();
    boxes.set(label, box);
    return toScreen(label, box);
  };

  // dx or dy in pixels; null for a unit other than px or em
  const pixels = (label, value) => {
    if (value == null || value === "") return 0;
    const match = String(value).trim().match(/^([-+]?[0-9.]+(?:e[-+]?[0-9]+)?)(px|em)?$/i);
    if (!match) return null;
    const number = parseFloat(match[1]);
    if (number === 0 || !match[2] || match[2].toLowerCase() === "px") return number;
    const fontSize = label.style.fontSize.endsWith("px") ? label.style.fontSize : getComputedStyle(label).fontSize;
    return number * parseFloat(fontSize);
  };

  // Labels by the columns of the page they reach into, so a label is only
  // checked against the labels near it
  const columnWidth = 50;
  const columns = new Map();
  const columnsOf = (rect) => {
    if (!Number.isFinite(rect.left) || !Number.isFinite(rect.right)) return [];
    const result = [];
    for (let c = Math.floor(rect.left / columnWidth); c <= Math.floor(rect.right / columnWidth); c++) result.push(c);
    return result;
  };
  const place = (label, rect) => {
    const previous = rects.get(label);
    if (previous) columnsOf(previous).forEach(c => columns.get(c).delete(label));
    rects.set(label, rect);
    columnsOf(rect).forEach(c => {
      if (!columns.has(c)) columns.set(c, new Set());
      columns.get(c).add(label);
    });
  };
  const neighbours = (label) => {
    const result = new Set();
    columnsOf(rects.get(label)).forEach(c => columns.get(c)?.forEach(other => result.add(other)));
    result.delete(label);
    return result;
  };

  // Measured on the first adjust(), when all labels are drawn
  let labels = null;
  const rects = new Map();

  const refresh = (label) => {
    if (labels) place(label, measure(label));
  };

  const adjust = (specificLabel, options = {}) => {
    if (!labels) {
      labels = container.svg.selectAll(labelSelector).nodes();
      labels.forEach(label => place(label, measure(label)));
    }

    const { rotation, offsetX, offsetY, dx, dy, hide = false } = { ...defaultOptions, ...options };

    // Calculate the label's original center position. Its box is as measured:
    // only other labels have changed since.
    const bbox = boxes.get(specificLabel) ?? specificLabel.getBBox();
    let centerX = bbox.x + bbox.width / 2;
    let centerY = bbox.y;

    centerX += offsetX;
    centerY += (rotation < 0) ? bbox.height : bbox.height / 2;
    centerY += offsetY;

    // Check for overlap with other labels
    if (!rects.has(specificLabel)) place(specificLabel, measure(specificLabel));
    const specificLabelRect = rects.get(specificLabel);
    for (const label of neighbours(specificLabel)) {
      // If the specific label overlaps with another label
      if (overlapPercentage(specificLabelRect, rects.get(label)) > 0) {
        if (hide) {
          // Hidden, it no longer stands in the way of the labels after it
          d3.select(specificLabel).style("display", "none");
          columnsOf(specificLabelRect).forEach(c => columns.get(c)?.delete(specificLabel));
          rects.delete(specificLabel);
          return false;
        }
        const oldY = parseFloat(specificLabel.getAttribute("y"));
        const oldDy = pixels(specificLabel, specificLabel.getAttribute("dy"));
        const newDx = pixels(specificLabel, dx);
        const newDy = pixels(specificLabel, dy);

        // Turned up (rotation < 0) the text rises width * sin + height * cos
        // above its anchor; turned down, it drops that far below it
        const radians = degrees => Math.abs(degrees) * Math.PI / 180;
        const reach = degrees => bbox.width * Math.sin(radians(degrees)) +
                                 bbox.height * Math.cos(radians(degrees));
        const anchorY = centerY + (newDy ?? 0);
        const fitsVertically = degrees => !bounds ||
          (degrees < 0 ? anchorY - reach(degrees) >= bounds.top
                       : anchorY + reach(degrees) <= bounds.bottom);
        // The turned text also runs width * cos(rotation) to the right of its
        // anchor. A label that would leave the area is hidden rather than cut
        // off: turned less steeply, or the other way, it would run into its
        // neighbours, which are turned too
        const run = bbox.width * Math.cos(radians(rotation));
        const anchorX = centerX + offsetX + (newDx ?? 0);
        if (!fitsVertically(rotation) || (bounds && anchorX + run > bounds.right)) {
          d3.select(specificLabel).style("display", "none");
          columnsOf(specificLabelRect).forEach(c => columns.get(c)?.delete(specificLabel));
          rects.delete(specificLabel);
          return false;
        }
        const angle = rotation;

        // Adjust the label rotation and position
        d3.select(specificLabel)
          .style("text-anchor", "start")
          .attr("dx", dx)
          .attr("dy", dy)
          .attr("x", centerX + offsetX)
          .attr("y", centerY)
          .attr("transform", `rotate(${angle}, ${centerX}, ${centerY})`);

        specificLabel.__drawn__ = { ...specificLabel.__drawn__, rotate: angle };
        // The text keeps its size and now starts at x + dx, with its baseline
        // moved from y + dy to the new y + dy. Measuring it instead would lay
        // out the page again for every label that turns.
        if (!specificLabel.childElementCount && Number.isFinite(oldY) &&
            [oldDy, newDx, newDy].every(Number.isFinite)) {
          const box = {
            x: centerX + offsetX + newDx,
            y: bbox.y + (centerY + newDy) - (oldY + oldDy),
            width: bbox.width,
            height: bbox.height
          };
          boxes.set(specificLabel, box);
          place(specificLabel, toScreen(specificLabel, box));
        } else {
          refresh(specificLabel);
        }
        return true;
      }
    }
    return false;
  };

  return { adjust, refresh };
}

// Splits a text into parts with their <b>, <i> or <u> style
function styledSegments(text) {
  const tagRegex = /<([biu])>(.*?)<\/\1>/g;
  const segments = [];
  const plain = content => ({ content, bold: false, italic: false, underline: false });
  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(text)) !== null) {
    // Text before the tag
    if (match.index > lastIndex) {
      segments.push(plain(text.substring(lastIndex, match.index)));
    }
    const [, tag, content] = match;
    segments.push({ content, bold: tag === "b", italic: tag === "i", underline: tag === "u" });
    lastIndex = match.index + match[0].length;
  }

  // Any remaining text after the last tag
  if (lastIndex < text.length) {
    segments.push(plain(text.substring(lastIndex)));
  }
  return segments;
}

export function parseAndStyleText(text, parentElement, fontOptions) {
  styledSegments(text).forEach(({ content, bold, italic, underline }) => {
    const tspan = parentElement.append("tspan")
      .style("font-weight", bold ? "bold" : fontOptions.weight)
      .style("font-style", italic ? "italic" : fontOptions.style)
      .text(content);

    if (underline) {
      tspan.style("text-decoration", "underline");
    }
  });
}
