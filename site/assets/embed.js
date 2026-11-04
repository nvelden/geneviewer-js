// Draws geneviewer charts on this site from payloads exported by the R
// package (the render model, payload.x), with geneviewer.newChart().
(function () {
  "use strict";

  // Draw payload.x into el, sized to payload.height and the element's width.
  // options go to newChart (e.g. on: event handlers). Gives the chart.
  function render(el, payload, options) {
    el.style.width = "100%";
    el.style.height = payload.height || "400px";

    var chart = geneviewer.newChart(el, payload.x, options);

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
