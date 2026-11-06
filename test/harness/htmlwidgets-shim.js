// A stand-in for the parts of the htmlwidgets runtime the R binding uses
// (HTMLWidgets.widget, HTMLWidgets.shinyMode and HTMLWidgets.getInstance), so
// the binding runs outside R. Used by the fixture tests in binding mode. Load it before
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
    // The runtime keeps the widget object on the element, as mount() does
    getInstance: function (el) {
      return el.__widget;
    },
  };
})();
