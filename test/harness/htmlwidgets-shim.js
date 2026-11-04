// A stand-in for the three parts of the htmlwidgets runtime the bundle uses
// (HTMLWidgets.widget, HTMLWidgets.dataframeToD3 and HTMLWidgets.shinyMode),
// so the bundle runs outside R. Used by the fixture tests and the docs site.
// Load it before geneviewerwidget.js; the binding it registers is then in
// HTMLWidgets.bindings.geneviewer.
(function () {
  "use strict";

  window.HTMLWidgets = {
    shinyMode: false,
    bindings: {},
    widget: function (definition) {
      window.HTMLWidgets.bindings[definition.name] = definition;
    },
    // Columns ({ a: [...], b: [...] }) to rows ([{ a, b }, ...]), as in htmlwidgets
    dataframeToD3: function (df) {
      if (Array.isArray(df)) return df;
      var names = Object.keys(df);
      var length = names.length ? df[names[0]].length : 0;
      var rows = [];
      for (var i = 0; i < length; i++) {
        var row = {};
        for (var j = 0; j < names.length; j++) row[names[j]] = df[names[j]][i];
        rows.push(row);
      }
      return rows;
    },
  };
})();
