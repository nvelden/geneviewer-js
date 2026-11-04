// Interaction scenarios: a fixture and a list of steps. After each step the
// runner records the geneviewer:* events since the last step and the chart's
// canonical listing. `h` has helpers: center(selector, nth), drag(from, to),
// press(key), click(point, modifiers).
module.exports = [
  {
    name: "zoom-relative",
    fixture: "interaction-zoom-events",
    steps: [
      { name: "drag start handle right", run: async (page, h) => {
        const from = await h.center('[aria-label="Zoom start"]');
        await h.drag(from, { x: from.x + 150, y: from.y });
      } },
      { name: "drag window left", run: async (page, h) => {
        const from = await h.center('[aria-label="Zoom window"]');
        await h.drag(from, { x: from.x - 60, y: from.y });
      } },
      { name: "arrow keys on end handle", run: async (page, h) => {
        await page.focus('[aria-label="Zoom end"]');
        await h.press("ArrowLeft");
        await h.press("Shift+ArrowLeft");
      } },
      { name: "End key", run: async (page, h) => {
        await page.focus('[aria-label="Zoom end"]');
        await h.press("End");
      } },
      { name: "double-click slider resets", run: async (page, h) => {
        const at = await h.center('[aria-label="Zoom window"]');
        await page.mouse.dblclick(at.x, at.y);
      } },
    ],
  },
  {
    name: "zoom-absolute",
    fixture: "rd-GC-zoom-2",
    steps: [
      { name: "drag end handle left (draws on release)", run: async (page, h) => {
        const from = await h.center('[aria-label="Zoom end"]');
        await h.drag(from, { x: from.x - 300, y: from.y });
      } },
      { name: "click the track right of the window", run: async (page, h) => {
        const box = await page.locator('.geneviewer-zoom-slider').boundingBox();
        await h.click({ x: box.x + box.width - 20, y: box.y + box.height / 2 });
      } },
    ],
  },
  {
    name: "selection",
    fixture: "vig-geneviewer-5",
    steps: [
      { name: "click a gene", run: async (page, h) => {
        await h.click(await h.center("#chart .gene", 1));
      } },
      { name: "shift-click a second gene", run: async (page, h) => {
        await h.click(await h.center("#chart .gene", 3), ["Shift"]);
      } },
      { name: "box select on empty space", run: async (page, h) => {
        const svg = await page.locator("#chart svg.geneviewer-svg-content").nth(1).boundingBox();
        await h.drag({ x: svg.x + 5, y: svg.y + 3 }, { x: svg.x + 400, y: svg.y + svg.height - 3 });
      } },
      { name: "Escape clears", run: async (page, h) => {
        await h.press("Escape");
      } },
    ],
  },
  {
    name: "drag-undo-redo",
    fixture: "vig-geneviewer-5",
    steps: [
      { name: "drag a gene label", run: async (page, h) => {
        const from = await h.center("#chart text.label", 2);
        await h.drag(from, { x: from.x + 30, y: from.y - 20 });
      } },
      { name: "drag the title", run: async (page, h) => {
        const from = await h.center('#chart [data-component="title"] [data-part="title"]');
        await h.drag(from, { x: from.x + 80, y: from.y + 5 });
      } },
      { name: "drag a legend label", run: async (page, h) => {
        const from = await h.center('#chart [data-component="legend"] [data-part="label"]', 1);
        await h.drag(from, { x: from.x, y: from.y + 15 });
      } },
      { name: "drag a scale bar", run: async (page, h) => {
        const from = await h.center('#chart [data-component="scaleBar"]');
        await h.drag(from, { x: from.x - 50, y: from.y });
      } },
      { name: "undo (Ctrl+Z)", run: async (page, h) => {
        await h.press("Control+z");
      } },
      { name: "redo (Ctrl+Shift+Z)", run: async (page, h) => {
        await h.press("Control+Shift+z");
      } },
      { name: "nudge the selected label (arrow keys)", run: async (page, h) => {
        await h.click(await h.center("#chart text.label", 4));
        // Off the chart: the label moves from under the pointer, and whether
        // Chrome has updated :hover (opacity 0.7) by the next event varies
        await page.mouse.move(10, 10);
        await h.press("ArrowUp");
        await h.press("Shift+ArrowRight");
      } },
      { name: "reset positions button", run: async (page, h) => {
        await h.click(await h.center("#chart .geneviewer-toolbar-button.geneviewer-reset"));
      } },
      { name: "undo the reset (toolbar)", run: async (page, h) => {
        await h.click(await h.center("#chart .geneviewer-toolbar-button.geneviewer-undo"));
      } },
    ],
  },
];
