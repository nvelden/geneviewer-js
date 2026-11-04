// A stand-in for the two parts of the htmlwidgets runtime the R binding uses
// (HTMLWidgets.widget and HTMLWidgets.shinyMode), so the binding runs outside
// R. Used by the fixture tests in binding mode. Load it before
// geneviewerwidget.js; the binding it registers is then in
// HTMLWidgets.bindings.geneviewer.
(function () {
  "use strict";

  window.HTMLWidgets = {
    shinyMode: false,
    bindings: {},
    widget: function (definition) {
      window.HTMLWidgets.bindings[definition.name] = definition;
    },
  };
})();
