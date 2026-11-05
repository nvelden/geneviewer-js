// The library's stylesheet (src/styles.css, bundled as text), added to a
// page once, on the first chart drawn in it.
import css from "../styles.css";

/**
 * Adds the stylesheet to the document as <style data-geneviewer>, first in
 * its head so the page's own styles take precedence; once per document.
 * @param {Document} doc
 */
export function injectStyles(doc) {
  if (!doc || !doc.head || doc.querySelector("style[data-geneviewer]")) return;
  const style = doc.createElement("style");
  style.setAttribute("data-geneviewer", "");
  style.textContent = css;
  doc.head.insertBefore(style, doc.head.firstChild);
}
