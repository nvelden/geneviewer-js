// The R binding as a widget: render events, Shiny sizing and PNG export.

module.exports = [
  {
    name: "render events follow successful drawing and are independent of clicks and resize",
    fixture: "beh-render-events",
    async run(page, t) {
      const res = await page.evaluate(() => {
        const x = input();
        const dom = [], shiny = [];
        window.Shiny = { setInputValue: (name, value, options) => shiny.push({ name, value, options }) };
        document.addEventListener("geneviewer:rendered", (event) => {
          dom.push({ target: event.target.id, ...event.detail,
            links: el.querySelectorAll("path.GeneLink").length,
            legend: el.querySelectorAll(".legend").length,
            save: !!el.querySelector(".save-option"),
            highlighted: el.classList.contains("geneviewer-highlight") });
        });
        x.spec.events = { click: false, highlight: false };
        widget.renderValue(x);
        const defaultCount = dom.length;
        x.spec.events.rendered = true;
        x.spec.events.renderId = "standalone";
        widget.renderValue(x);
        const standaloneShiny = shiny.length;
        HTMLWidgets.shinyMode = true;
        x.spec.events = { click: true, highlight: true, rendered: true, renderId: "load-1" };
        widget.renderValue(x);
        widget.renderValue(x);
        x.spec.events.renderId = 2;
        widget.renderValue(x);
        const beforeResize = dom.length;
        widget.resize(800, 400);
        const afterResize = dom.length;
        el.querySelector(".gene").dispatchEvent(new MouseEvent("click", { bubbles: true }));
        x.spec.events.rendered = false;
        widget.renderValue(x);
        const disabledCount = dom.length;
        x.spec.events.rendered = true;
        x.spec.events.renderId = "broken";
        // Links are drawn with d3.path() (the page's D3), and only links
        const originalPath = d3.path;
        d3.path = () => { throw new Error("Simulated link drawing failure"); };
        let failed = false;
        try { widget.renderValue(x); } catch (e) { failed = true; }
        d3.path = originalPath;
        const failedCount = dom.length;
        x.spec.events.renderId = "recovered";
        widget.renderValue(x);
        return JSON.stringify({ id: el.id, dom, shiny, defaultCount, standaloneShiny,
          beforeResize, afterResize, disabledCount, failed, failedCount });
      }).then(JSON.parse);
      t.equal([res.defaultCount, res.standaloneShiny], [0, 0], "off by default, not sent outside Shiny");
      t.equal(res.dom.map((e) => String(e.id)), ["standalone", "load-1", "load-1", "2", "recovered"], "ids");
      t.ok(res.dom.every((e) => e.target === res.id && e.chartId === res.id), "target and chartId");
      t.ok(res.dom.every((e) => e.links > 0 && e.legend > 0 && e.save), "after drawing");
      t.ok(res.dom[1].highlighted, "highlight set before");
      t.equal(res.dom[1].width, 600, "width");
      t.ok(res.dom[1].height > 0, "height");
      t.equal(res.afterResize, res.beforeResize, "none on resize");
      t.equal(res.disabledCount, res.afterResize, "none when off");
      t.ok(res.failed, "drawing failed");
      t.equal(res.failedCount, res.disabledCount, "none on failure");
      const rendered = res.shiny.filter((e) => e.name.endsWith("_rendered"));
      t.equal(rendered.length, 4, "sent to Shiny");
      t.ok(rendered.every((e) => e.name === `${res.id}_rendered` && e.options.priority === "event"), "input name, priority");
      t.equal(rendered[2].value.id, 2, "numeric id");
      t.ok(res.shiny.some((e) => e.name === `${res.id}_click`), "clicks still reported");
    },
  },
  {
    name: "omitted render IDs are unique across charts and repeated updates",
    fixture: "beh-render-ids", mount: false,
    async run(page, t) {
      const res = await page.evaluate(() => {
        // Two outputs of the same chart
        const elements = ["one", "two"].map((id) => {
          const node = document.createElement("div");
          node.id = id;
          node.className = "html-widget geneviewer";
          node.style.width = "800px";
          node.style.height = "200px";
          document.body.appendChild(node);
          node.__widget = HTMLWidgets.bindings.geneviewer.factory(node, 800, 200);
          node.__widget.renderValue(input());
          return node;
        });
        const dom = [], shiny = [];
        document.addEventListener("geneviewer:rendered", (event) => dom.push({ ...event.detail, target: event.target.id }));
        window.Shiny = { setInputValue: (name, value) => shiny.push({ name, value }) };
        HTMLWidgets.shinyMode = true;
        const render = (node, id) => {
          const x = input();
          if (id !== undefined) x.spec.events.renderId = id;
          node.__widget.renderValue(x);
        };
        for (let i = 0; i < 3; i++) elements.forEach((node) => render(node));
        render(elements[0], 0);
        render(elements[1], "");
        render(elements[0], "explicit");
        render(elements[1], "explicit");
        // Returning to automatic IDs must not reuse an earlier identifier
        elements.forEach((node) => render(node, null));
        return JSON.stringify({ elements: elements.map((node) => node.id), dom, shiny });
      }).then(JSON.parse);
      t.equal(res.dom.length, 12, "events");
      const automatic = [...res.dom.slice(0, 6), ...res.dom.slice(10, 12)];
      const ids = automatic.map((e) => e.id);
      t.ok(ids.every((id) => typeof id === "string" && id.length > 0), "automatic ids");
      t.equal(new Set(ids).size, 8, "unique");
      t.ok(automatic.every((e) => e.id.startsWith(`${e.chartId}-render-`)), "prefixed by the chart");
      t.equal(res.dom.map((e) => e.chartId), Array(6).fill(res.elements).flat(), "chart ids");
      t.ok(res.dom.every((e) => e.target === e.chartId), "targets");
      t.equal(res.dom.slice(6, 10).map((e) => e.id), [0, "", "explicit", "explicit"], "explicit ids");
      t.equal(res.shiny.map((e) => e.value), res.dom.map(({ target, ...e }) => e), "sent to Shiny");
      t.equal(res.shiny.map((e) => e.name), Array(6).fill(res.elements.map((id) => `${id}_rendered`)).flat(), "input names");
    },
  },
  {
    name: "PNG export works with modern host colours and keeps pixel density and patterns",
    fixture: "beh-png",
    async run(page, t) {
      const res = await page.evaluate(async () => {
        document.body.style.backgroundColor = "oklch(0.95 0.02 240)";
        document.body.style.color = "oklch(0.2 0.01 240)";
        const originalRatio = window.devicePixelRatio;
        const results = [];
        for (const ratio of [1, 2]) {
          Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: ratio });
          const blob = await widget.getChart().toPNG();
          const bitmap = await createImageBitmap(blob);
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.width; canvas.height = bitmap.height;
          const context = canvas.getContext("2d");
          context.drawImage(bitmap, 0, 0);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          let ink = 0;
          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] > 0 && pixels[i] < 200 && pixels[i + 1] < 200 && pixels[i + 2] < 200) ink++;
          }
          results.push({ type: blob.type, width: bitmap.width, height: bitmap.height, ink });
          bitmap.close();
        }
        Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: originalRatio });
        return { results, width: Math.ceil(el.getBoundingClientRect().width),
          height: Math.ceil(el.getBoundingClientRect().height), patterns: el.querySelectorAll("pattern").length };
      });
      t.ok(res.patterns > 0, "patterns");
      t.equal(res.results.map((r) => r.type), ["image/png", "image/png"], "type");
      t.equal(res.results.map((r) => r.width), [res.width, res.width * 2], "widths");
      t.equal(res.results.map((r) => r.height), [res.height, res.height * 2], "heights");
      t.ok(res.results.every((r) => r.ink > 0), "drawn");
    },
  },
  {
    name: "Shiny pixel widths size the whole widget and restore the output width",
    fixture: "beh-sizing", mount: false, viewport: { width: 1200, height: 800 },
    async run(page, t) {
      const res = await page.evaluate(() => {
        // The output in a container, as on an htmlwidgets page
        const container = document.createElement("div");
        el.parentNode.insertBefore(container, el);
        container.appendChild(el);
        window.widget = mountChart(fixture, { ...fixtureMeta, width: 600 });
        const original = input();
        const clicks = [];
        window.Shiny = { setInputValue: (id, value) => clicks.push(value) };
        HTMLWidgets.shinyMode = true;
        container.style.overflowX = "auto";
        container.style.width = "800px";
        const measure = () => ({
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
          svgs: [...el.querySelectorAll("svg:not(.geneviewer-icon-svg)")].map((svg) => ({
            width: svg.getBoundingClientRect().width,
            scale: svg.getBoundingClientRect().width / svg.viewBox.baseVal.width,
          })),
          genes: el.querySelectorAll(".gene").length,
          scrolls: container.scrollWidth > container.clientWidth,
        });
        // R draws the chart again with another width (GC_chart(width = ))
        const render = (width) => {
          const x = JSON.parse(JSON.stringify(original));
          x.spec.width = width;
          widget.renderValue(x);
          return measure();
        };
        const wide = render("3000px");
        widget.resize(800, 400);
        const resized = measure();
        const numeric = render(500);
        const fractional = render("500.5px");
        const responsive = render("100%");
        const percent = render("75%");
        const styled = JSON.parse(JSON.stringify(original));
        styled.spec.style = { width: "550px" };
        widget.renderValue(styled);
        const styleOverride = measure();
        const removedStyle = render("100%");
        el.querySelector(".gene").dispatchEvent(new MouseEvent("click", { bubbles: true }));
        const css = document.createElement("style");
        css.textContent = ".sizing-fill-row > div { flex: 1 1 0%; min-width: 0; }";
        document.head.appendChild(css);
        container.classList.add("sizing-fill-row");
        container.style.display = "flex";
        container.appendChild(document.createElement("div"));
        const fillRowFixed = render("3000px");
        const fillRowResponsive = render("100%");
        container.style.display = "block";
        el.style.width = "650px";
        el.style.flex = "2 1 auto";
        const hostChanged = render("100%");
        return JSON.stringify({ wide, resized, numeric, fractional, responsive,
          percent, styleOverride, removedStyle, clicks,
          fillRowFixed, fillRowResponsive, hostChanged, hostFlex: el.style.flex });
      }).then(JSON.parse);
      const widths = (m) => m.svgs.map((s) => s.width);
      t.equal([res.wide.width, res.wide.scrolls], [3000, true], "wide");
      t.equal(widths(res.wide), [3000, 3000, 3000, 3000], "wide SVGs");
      t.equal(res.wide.svgs.map((s) => s.scale), [1, 1, 1, 1], "wide SVGs not scaled");
      t.equal(res.resized, res.wide, "resize keeps a pixel width");
      t.equal([res.numeric.width, res.fractional.width], [500, 500.5], "numeric and fractional");
      t.equal([res.responsive.width, res.responsive.scrolls], [600, false], "responsive");
      t.equal(widths(res.responsive), [600, 600, 600, 600], "responsive SVGs");
      // Percentage widths keep their meaning relative to the output
      t.equal(res.percent.width, 600, "percent");
      t.equal(widths(res.percent), [600, 600, 600, 600], "percent SVGs");
      t.equal(res.percent.svgs.map((s) => s.scale), [1, 600 / 450, 600 / 450, 1], "percent scales");
      t.equal([res.styleOverride.width, res.removedStyle.width], [550, 600], "style width");
      t.equal(res.wide.height, res.responsive.height, "height kept");
      t.equal([res.wide.genes, res.responsive.genes], [17, 17], "genes");
      t.equal(res.clicks.map((c) => c.component), ["genes"], "clicks");
      t.equal([res.fillRowFixed.width, res.fillRowFixed.scrolls], [3000, true], "fill row, fixed");
      t.equal(res.fillRowResponsive.width, 400, "fill row, responsive");
      t.equal([res.hostChanged.width, res.hostFlex], [650, "2 1 auto"], "host styles kept");
    },
  },
];
