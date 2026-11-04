// Draws a fixture's payload into #chart, sized as in R (meta.json). Two modes:
//   binding  through the R binding (geneviewerwidget.js and the htmlwidgets
//            stand-in), as R draws it
//   direct   with geneviewer.newChart()
// The mode is the page's ?mode= (default binding). With record(name, detail),
// the events named in eventNames are recorded from the first draw on: as
// geneviewer:<name> DOM events in binding mode, through newChart's options.on
// in direct mode. Gives the binding's widget object or the chart.
function harnessMode() {
  return new URLSearchParams(location.search).get("mode") || "binding";
}

function mountChart(payload, meta, eventNames, record) {
  var el = document.getElementById("chart");
  el.classList.add("html-widget", "geneviewer");
  el.style.width = (meta.width || 1000) + "px";
  el.style.height = meta.height || "400px";
  eventNames = record ? eventNames : [];
  if (harnessMode() === "direct") {
    var on = {};
    eventNames.forEach(function (name) {
      on[name] = function (detail) { record(name, detail); };
    });
    return geneviewer.newChart(el, payload, { on: on });
  }
  eventNames.forEach(function (name) {
    el.addEventListener("geneviewer:" + name, function (event) { record(name, event.detail); });
  });
  var widget = HTMLWidgets.bindings.geneviewer.factory(el, el.clientWidth, el.clientHeight);
  widget.renderValue(payload);
  return widget;
}
