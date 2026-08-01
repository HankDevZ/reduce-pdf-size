export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const pages = ["", "/about", "/privacy", "/terms", "/source", "/contact"];
  const lastModified = "2026-08-01";
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (path) =>
      `  <url><loc>${origin}${path || "/"}</loc><lastmod>${lastModified}</lastmod></url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
