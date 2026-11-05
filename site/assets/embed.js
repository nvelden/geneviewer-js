// Draws geneviewer charts on this site from the examples' specs, recorded
// from the R package (scripts/export-examples.R), with geneviewer.newChart().
(function () {
  "use strict";

  // Draw example.spec into el, sized to example.height and the element's
  // width. options go to newChart (e.g. on: event handlers). Gives the chart.
  function render(el, example, options) {
    el.style.width = "100%";
    el.style.height = example.height || "400px";

    var chart = geneviewer.newChart(el, example.spec, options);

    var width = el.clientWidth;
    var pending = false;
    new ResizeObserver(function () {
      if (pending || el.clientWidth === width) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        width = el.clientWidth;
        chart.resize();
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
