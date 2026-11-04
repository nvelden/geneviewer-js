// Clipping of the zoomed parts: container.prototype.clipZoom.
import { container } from "../container.js";

// Zoomed (GC_zoom()), the parts placed along the scale are clipped to the
// plot area: they go into a nested SVG of its width, in the same coordinates
const zoomClipped = ["sequence", "genes", "transcript", "links", "coordinates", "labels", "annotations"];
container.prototype.clipZoom = function () {
  if (!this.zoom) return this;
  const svg = this.svg.node();
  const parts = Array.from(svg.children).filter(node => zoomClipped.includes(node.getAttribute("data-component")));
  if (!parts.length) return this;
  const plotWidth = this.width - this.margin.left - this.margin.right;
  const clip = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  clip.setAttribute("class", "geneviewer-zoom-clip");
  clip.setAttribute("x", this.margin.left);
  clip.setAttribute("y", 0);
  clip.setAttribute("width", plotWidth);
  clip.setAttribute("height", this.height);
  clip.setAttribute("viewBox", `${this.margin.left} 0 ${plotWidth} ${this.height}`);
  clip.setAttribute("preserveAspectRatio", "none");
  clip.setAttribute("overflow", "hidden");
  svg.insertBefore(clip, parts[0]);
  parts.forEach(node => clip.appendChild(node));
  return this;
};
