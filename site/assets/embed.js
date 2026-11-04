// Draws geneviewer charts on this site from payloads exported by the R package.
//
// Temporary. Until the public API (geneviewer.newChart) exists, the bundle
// runs as an htmlwidgets binding, through the stand-in in
// htmlwidgets-shim.js (loaded before geneviewerwidget.js).
(function () {
  "use strict";

  var count = 0;

  // Draw payload.x into el, sized to payload.height and the element's width.
  function render(el, payload) {
    var binding = window.HTMLWidgets && HTMLWidgets.bindings.geneviewer;
    if (!binding) throw new Error("geneviewerwidget.js has not been loaded.");
    if (!el.id) el.id = "geneviewer-chart-" + ++count;
    el.classList.add("html-widget", "geneviewer");
    el.style.width = "100%";
    el.style.height = payload.height || "400px";

    var chart = binding.factory(el, el.clientWidth, el.clientHeight);
    chart.renderValue(payload.x);

    var width = el.clientWidth;
    var pending = false;
    new ResizeObserver(function () {
      if (pending || el.clientWidth === width) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        width = el.clientWidth;
        chart.resize(el.clientWidth, el.clientHeight);
      });
    }).observe(el);
    return chart;
  }

  function load(id) {
    return fetch("examples/" + id + ".json").then(function (response) {
      if (!response.ok) throw new Error("Could not load example " + id);
      return response.json();
    });
  }

  window.geneviewerSite = { render: render, load: load };
})();
