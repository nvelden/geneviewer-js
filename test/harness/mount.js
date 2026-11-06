// Draws a fixture's spec into #chart, sized as in R (meta.json). Two modes:
//   spec     with geneviewer.newChart()
//   rspec    through the R binding (geneviewerwidget.js and the htmlwidgets
//            stand-in) with { spec }, as the R package draws it
// The mode is the page's ?mode= (default rspec). With record(name, detail),
// the events named in eventNames are recorded from the first draw on: as
// geneviewer:<name> DOM events in rspec mode, through newChart's options.on in
// spec mode. Gives the binding's widget object or the chart.
function harnessMode() {
  return new URLSearchParams(location.search).get("mode") || "rspec";
}

function mountChart(spec, meta, eventNames, record) {
  var el = document.getElementById("chart");
  el.classList.add("html-widget", "geneviewer");
  el.style.width = (meta.width || 1000) + "px";
  el.style.height = meta.height || "400px";
  eventNames = record ? eventNames : [];
  if (harnessMode() === "spec") {
    var on = {};
    eventNames.forEach(function (name) {
      on[name] = function (event) { record(event.type, event.detail); };
    });
    return geneviewer.newChart(el, spec, { on: on });
  }
  eventNames.forEach(function (name) {
    el.addEventListener("geneviewer:" + name, function (event) { record(name, event.detail); });
  });
  var widget = HTMLWidgets.bindings.geneviewer.factory(el, el.clientWidth, el.clientHeight);
  widget.renderValue({ spec: spec });
  return widget;
}
