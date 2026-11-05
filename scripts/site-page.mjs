// The frame of a generated page of the docs site: head, header with the
// navigation, and footer, as the pages in site/ have them.

const NAV = [
  ["./", "Overview"],
  ["getting-started.html", "Getting started"],
  ["examples.html", "Examples"],
  ["api.html", "API"],
];

/**
 * @param {{ title: string, description: string, current: string, body: string, head?: string }} options
 * @returns {string} The page's HTML.
 */
export function page({ title, description, current, body, head = "" }) {
  const nav = NAV.map(([href, label]) =>
    `        <a href="${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a>`).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}: geneviewer</title>
  <meta name="description" content="${description}">
  <link rel="icon" href="data:,">
  <link rel="stylesheet" href="assets/site.css">
${head}</head>
<body>
  <header class="site-header">
    <div class="inner">
      <a class="brand" href="./">geneviewer<span>-js</span></a>
      <nav>
${nav}
      </nav>
      <a class="github" href="https://github.com/nvelden/geneviewer-js">GitHub</a>
    </div>
  </header>

  <main class="inner">
${body}
  </main>

  <footer>
    <div class="inner">geneviewer is MIT licensed. Charts are drawn with <a href="https://d3js.org">D3</a>.</div>
  </footer>
</body>
</html>
`;
}
