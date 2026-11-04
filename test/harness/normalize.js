// Turns a drawn chart into a canonical text listing for comparison: one line
// per element or text node, indented by depth, with attributes sorted, style
// declarations sorted, and decimal numbers rounded to 2 places.
(function () {
  "use strict";

  function round(text) {
    return text.replace(/-?\d+\.\d+(e-?\d+)?/gi, function (n) {
      var value = Math.round(parseFloat(n) * 100) / 100;
      return String(Object.is(value, -0) ? 0 : value);
    });
  }

  function attributeValue(name, value) {
    if (name === "style") {
      value = value.split(";").map(function (d) { return d.trim(); })
        .filter(Boolean).sort().join("; ");
    }
    return round(value);
  }

  function walk(node, depth, lines) {
    var pad = "  ".repeat(depth);
    if (node.nodeType === Node.TEXT_NODE) {
      var text = node.textContent.trim();
      if (text) lines.push(pad + JSON.stringify(node.parentNode.nodeName === "style" ? text : round(text)));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    var attributes = Array.from(node.attributes)
      .map(function (a) { return [a.name, attributeValue(a.name, a.value)]; })
      .sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; })
      .map(function (a) { return " " + a[0] + "=" + JSON.stringify(a[1]); })
      .join("");
    lines.push(pad + "<" + node.nodeName.toLowerCase() + attributes + ">");
    node.childNodes.forEach(function (child) { walk(child, depth + 1, lines); });
  }

  window.normalizeChart = function (el) {
    var lines = [];
    el.childNodes.forEach(function (child) { walk(child, 0, lines); });
    return lines.join("\n") + "\n";
  };
})();
