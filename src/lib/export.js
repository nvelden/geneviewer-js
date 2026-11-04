// Export: the chart as one SVG or PNG, downloads and the save menu.
// Styles copied from the page onto each element of an exported SVG, so it
// looks the same without the page's stylesheets (e.g. styles.css, fonts)
const svgExportInheritedStyles = [
  "fill", "fill-opacity", "fill-rule", "stroke", "stroke-width", "stroke-opacity",
  "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "font-family",
  "font-size", "font-weight", "font-style", "text-anchor", "dominant-baseline",
  "visibility"
];
const svgExportOwnStyles = { opacity: "1" };

// Combines all SVGs of a chart (title, clusters, links, legend) into one
// standalone SVG at their position in el and returns it as a string
export function chartToSVG(el, exclude = null) {
  const ns = "http://www.w3.org/2000/svg";
  const elRect = el.getBoundingClientRect();
  const width = Math.ceil(elRect.width);
  // The zoom slider (GC_zoom()) is a control, not part of the figure: its
  // band, with its margins, is left out, and what is below it moves up
  const zoomRow = el.querySelector(".geneviewer-zoom-row");
  let band = null;
  if (zoomRow) {
    const rowRect = zoomRow.getBoundingClientRect();
    const rowStyle = getComputedStyle(zoomRow);
    const top = rowRect.top - elRect.top - (parseFloat(rowStyle.marginTop) || 0);
    const bottom = rowRect.bottom - elRect.top + (parseFloat(rowStyle.marginBottom) || 0);
    if (bottom > top) band = { top, bottom, height: bottom - top };
  }
  const shiftOf = y => band && y >= band.bottom - 0.5 ? band.height : 0;
  const height = Math.ceil(elRect.height - (band ? band.height : 0));

  const root = document.createElementNS(ns, "svg");
  root.setAttribute("xmlns", ns);
  root.setAttribute("width", width);
  root.setAttribute("height", height);
  root.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const addBackground = (parent, x, y, w, h, color) => {
    if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") return;
    const rect = document.createElementNS(ns, "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", w);
    rect.setAttribute("height", h);
    rect.setAttribute("fill", color);
    // No anti-aliased seams between the backgrounds of adjacent SVGs
    rect.setAttribute("shape-rendering", "crispEdges");
    parent.appendChild(rect);
  };

  addBackground(root, 0, 0, width, height, getComputedStyle(el).backgroundColor);

  // Computed url() fills can be absolute (page url + #id); keep only the #id
  const localUrl = value => value.replace(/url\((["']?)[^#)]*#([^)"']+)\1\)/g, "url(#$2)");

  const copyStyles = (source, target, parentStyle) => {
    const computed = getComputedStyle(source);
    svgExportInheritedStyles.forEach(name => {
      const value = computed.getPropertyValue(name);
      if (value && (!parentStyle || parentStyle.getPropertyValue(name) !== value)) {
        target.style.setProperty(name, localUrl(value));
      }
    });
    Object.entries(svgExportOwnStyles).forEach(([name, initial]) => {
      const value = computed.getPropertyValue(name);
      if (value && value !== initial) target.style.setProperty(name, value);
    });
    return computed;
  };

  // Outermost SVGs only; nested ones are copied with their parent. Drawn in
  // z-index order (e.g. links below clusters), as on the page. The zoom
  // slider is a control, not part of the figure.
  const zIndex = svg => parseInt(getComputedStyle(svg).zIndex, 10) || 0;
  const svgs = Array.from(el.querySelectorAll("svg"))
    .filter(svg => !svg.parentElement.closest("svg") && !(exclude && exclude.contains(svg)) &&
                   !svg.closest(".geneviewer-zoom-slider"))
    .map((svg, order) => ({ svg, order, z: zIndex(svg) }))
    .sort((a, b) => a.z - b.z || a.order - b.order)
    .map(item => item.svg);

  svgs.forEach(svg => {
    const svgStyle = getComputedStyle(svg);
    if (svgStyle.display === "none" || svgStyle.visibility === "hidden") return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = rect.left - elRect.left;
    const top = rect.top - elRect.top;
    const y = top - shiftOf(top);

    addBackground(root, x, y, rect.width, rect.height, svgStyle.backgroundColor);

    const clone = svg.cloneNode(true);
    clone.removeAttribute("style");
    clone.removeAttribute("class");
    clone.setAttribute("x", x);
    clone.setAttribute("y", y);
    clone.setAttribute("width", rect.width);
    clone.setAttribute("height", rect.height);

    // cloneNode keeps the structure, so both lists are in the same order
    const sources = svg.querySelectorAll("*");
    const targets = clone.querySelectorAll("*");
    const computedStyles = new Map([[svg, copyStyles(svg, clone, null)]]);
    sources.forEach((source, i) => {
      const target = targets[i];
      const computed = getComputedStyle(source);
      if (computed.display === "none" && !source.closest("defs")) {
        target.setAttribute("display", "none");
        return;
      }
      if (source.closest("defs")) return;
      target.removeAttribute("class");
      computedStyles.set(source, copyStyles(source, target, computedStyles.get(source.parentNode)));
    });

    // An SVG over the slider band, such as the one of moved text, keeps
    // its parts above the band and moves those below it up
    if (band && top < band.bottom - 0.5) {
      Array.from(svg.children).forEach((part, i) => {
        if (part.tagName.toLowerCase() === "defs") return;
        const partTop = part.getBoundingClientRect().top - elRect.top;
        const shift = shiftOf(partTop);
        if (!shift) return;
        const target = clone.children[i];
        target.setAttribute("transform", `translate(0, ${-shift}) ${target.getAttribute("transform") || ""}`.trim());
      });
    }

    // Hidden elements are left out of the file
    clone.querySelectorAll("[display='none']").forEach(node => node.remove());
    root.appendChild(clone);
  });

  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(root);
}

// Rasterize the same SVG as vector export. The browser resolves modern CSS
// colors itself, without html2canvas parsing the surrounding app styles.
export function chartToPNG(el, exclude = null) {
  const svg = new Blob([chartToSVG(el, exclude)], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svg);
  return new Promise((resolve, reject) => {
    const image = new Image();
    const fail = error => { URL.revokeObjectURL(url); reject(error); };
    image.onerror = () => fail(new Error("Could not render the chart SVG as PNG."));
    image.onload = () => {
      try {
        const scale = window.devicePixelRatio || 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(image.naturalWidth * scale);
        canvas.height = Math.ceil(image.naturalHeight * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error("Could not encode the chart as PNG."));
        }, "image/png");
      } catch (error) { fail(error); }
    };
    image.src = url;
  });
}

/**
 * Save a file in the browser: a link to the blob, with download, is clicked.
 * The blob's URL is revoked after 40 seconds, when the download has long
 * started.
 * @param {Blob} blob
 * @param {string} filename
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 40000);
}

// The save icon and its formats, in the chart's toolbar (container), which
// shows and places it. Its colours are those of the stylesheet, set with
// GC_toolbar() and GC_theme(toolbar = ...). save(blob, filename) saves the
// file; by default the browser downloads it.
export function createSaveIcon(widgetId, el, container, iconClass = "fa-solid fa-download", save = downloadBlob) {
  var saveMenu = d3.select(container).append("div")
      .attr("id", `saveMenu-${widgetId}`)
      .style("position", "relative")
      .style("z-index", "1000")
      .style("display", "block");

  var icon = saveMenu.append("i")
      .attr("class", iconClass + " geneviewer-save-icon")
      .attr("id", `saveIcon-${widgetId}`)
      .attr("tabindex", "0")
      .attr("role", "button")
      .attr("aria-label", "Save chart")
      .attr("aria-haspopup", "menu")
      .style("text-align", "right")
      .style("cursor", "pointer");

  // Format options, shown when hovering or focusing the icon
  var options = saveMenu.append("div")
      .attr("id", `saveIconTooltip-${widgetId}`)
      .attr("class", "save-tooltip")
      .attr("role", "menu")
      .style("display", "none")
      .style("font-size", "12px")
      .style("overflow", "hidden")
      .style("white-space", "nowrap");

  // Hide the menu so it is not in the PNG, and until the mouse enters again
  var hideMenu = function () {
      options.style("display", "none");
  };

  var formats = [
    {
      label: "Save as SVG",
      save: function () {
        var svg = chartToSVG(el, container);
        save(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "graph.svg");
      }
    },
    {
      label: "Save as PNG",
      save: function () {
        return chartToPNG(el, container).then(blob => save(blob, "graph.png"));
      }
    }
  ];

  formats.forEach(function (format) {
    options.append("div")
      .attr("class", "save-option")
      .attr("tabindex", "0")
      .attr("role", "menuitem")
      .text(format.label)
      .style("padding", "5px 8px")
      .style("cursor", "pointer")
      .on("click", function () {
        hideMenu();
        format.save();
      })
      // The formats can also be chosen with the keyboard
      .on("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.click();
        }
      });
  });

  saveMenu.on("focusin", function () {
    options.style("display", "block");
  }).on("focusout", function (event) {
    if (saveMenu.node().contains(event.relatedTarget)) return;
    hideMenu();
  });
  d3.select(el).on("mouseleave", hideMenu);
  saveMenu.on("mouseenter", function () {
    options.style("display", "block");
  }).on("mouseleave", hideMenu);
}
