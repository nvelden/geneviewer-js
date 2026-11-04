// Draws a fixture's payload into #chart, sized as in R (meta.json), through
// the R binding (geneviewerwidget.js and the htmlwidgets stand-in).
function mountChart(payload, meta) {
  var el = document.getElementById("chart");
  el.classList.add("html-widget", "geneviewer");
  el.style.width = (meta.width || 1000) + "px";
  el.style.height = meta.height || "400px";
  var chart = HTMLWidgets.bindings.geneviewer.factory(el, el.clientWidth, el.clientHeight);
  chart.renderValue(payload);
  return chart;
}
