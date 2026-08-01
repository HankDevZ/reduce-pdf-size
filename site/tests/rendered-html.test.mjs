import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function decodeHtml(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function stripHtml(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
}

function attributeValue(tag, name) {
  return decodeHtml(tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? "");
}

function metaContent(html, attribute, value) {
  const tag = [...html.matchAll(/<meta\b[^>]*>/g)]
    .map((match) => match[0])
    .find((item) => attributeValue(item, attribute) === value);
  return tag ? attributeValue(tag, "content") : "";
}

function linkHref(html, rel) {
  const tag = [...html.matchAll(/<link\b[^>]*>/g)]
    .map((match) => match[0])
    .find((item) => attributeValue(item, "rel") === rel);
  return tag ? attributeValue(tag, "href") : "";
}

const publicPages = {
  "/": {
    title: "Reduce PDF Size Online Free — Private PDF Compressor",
    description:
      "Reduce PDF file size in your browser for free. Choose a compression level, keep your files private, and download a smaller PDF without uploading it.",
  },
  "/about": {
    title: "About | Reduce PDF Size",
    description:
      "Who maintains Reduce PDF Size, how its product information is checked, and where to report corrections or technical issues.",
  },
  "/privacy": {
    title: "Privacy | Reduce PDF Size",
    description:
      "How Reduce PDF Size processes PDF files locally in your browser and handles temporary data.",
  },
  "/terms": {
    title: "Terms of Use | Reduce PDF Size",
    description:
      "Terms and important compatibility limits for the Reduce PDF Size browser tool.",
  },
  "/source": {
    title: "Source Code | Reduce PDF Size",
    description:
      "View the Reduce PDF Size source code and open-source license information on GitHub.",
  },
  "/contact": {
    title: "Contact & Feedback | Reduce PDF Size",
    description:
      "Contact Reduce PDF Size by email for bug reports, privacy questions, accessibility feedback, and focused feature requests.",
  },
};

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the complete homepage and security headers", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(response.headers.get("content-security-policy") ?? "", /worker-src 'self'/);

  const html = await response.text();
  assert.match(
    html,
    /<title>Reduce PDF Size Online Free — Private PDF Compressor<\/title>/,
  );
  assert.equal((html.match(/<h1/g) ?? []).length, 1);
  assert.match(html, /Reduce PDF Size Online/);
  assert.match(html, /How to Reduce PDF File Size/);
  assert.match(html, /Make a PDF Smaller for Uploading/);
  assert.match(html, /How to Compress a Scanned PDF/);
  assert.equal((html.match(/class="step-card-link"/g) ?? []).length, 3);
  assert.equal((html.match(/class="step-card-link" href="#tool"/g) ?? []).length, 3);
  assert.match(html, /Built and maintained by/);
  assert.match(html, /rel="author"/);
  assert.match(html, /<time dateTime="2026-08-01">August 1, 2026<\/time>/);
  assert.match(html, /Comparison guide only/);
  assert.match(html, /class="quality-table"/);
  assert.doesNotMatch(html, /class="quality-grid"/);
  assert.match(html, /FAQPage/);
  assert.match(html, /WebApplication/);
  assert.match(html, /WebSite/);
  assert.match(html, /Your original stays unchanged/);
  assert.doesNotMatch(html, /ghostscript\/gs\.(?:mjs|wasm)/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("all public pages have unique on-page SEO metadata and one H1", async () => {
  const titles = new Set();
  const descriptions = new Set();

  for (const [path, expected] of Object.entries(publicPages)) {
    const response = await render(path);
    assert.equal(response.status, 200);
    const html = await response.text();
    const title = stripHtml(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
    const description = metaContent(html, "name", "description");

    assert.equal(title, expected.title, `${path} title`);
    assert.equal(description, expected.description, `${path} description`);
    assert.ok(title.length >= 20 && title.length <= 60, `${path} title length`);
    assert.ok(
      description.length >= 70 && description.length <= 160,
      `${path} description length`,
    );
    assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, `${path} H1 count`);
    assert.match(html, /<html lang="en">/);
    assert.equal(linkHref(html, "canonical"), `http://localhost${path}`);
    assert.notEqual(metaContent(html, "name", "robots"), "noindex");
    titles.add(title);
    descriptions.add(description);
  }

  assert.equal(titles.size, Object.keys(publicPages).length);
  assert.equal(descriptions.size, Object.keys(publicPages).length);
});

test("Open Graph and X cards are complete and page-specific", async () => {
  for (const [path, expected] of Object.entries(publicPages)) {
    const html = await (await render(path)).text();
    const canonical = `http://localhost${path}`;

    assert.equal(metaContent(html, "property", "og:title"), expected.title);
    assert.equal(metaContent(html, "property", "og:description"), expected.description);
    assert.equal(metaContent(html, "property", "og:type"), "website");
    assert.equal(metaContent(html, "property", "og:url"), canonical);
    assert.equal(metaContent(html, "property", "og:site_name"), "Reduce PDF Size");
    assert.equal(metaContent(html, "property", "og:locale"), "en_US");
    assert.equal(metaContent(html, "property", "og:image"), "http://localhost/og.png");
    assert.equal(metaContent(html, "property", "og:image:type"), "image/png");
    assert.equal(metaContent(html, "property", "og:image:width"), "1730");
    assert.equal(metaContent(html, "property", "og:image:height"), "909");
    assert.ok(metaContent(html, "property", "og:image:alt"));

    assert.equal(metaContent(html, "name", "twitter:card"), "summary_large_image");
    assert.equal(metaContent(html, "name", "twitter:title"), expected.title);
    assert.equal(metaContent(html, "name", "twitter:description"), expected.description);
    assert.equal(metaContent(html, "name", "twitter:image"), "http://localhost/og.png");
    assert.ok(metaContent(html, "name", "twitter:image:alt"));
  }
});

test("SEO metadata and JSON-LD are complete and internally consistent", async () => {
  const html = await (await render()).text();
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(decodeHtml(match[1])));
  const faq = schemas.find((schema) => schema["@type"] === "FAQPage");
  const application = schemas.find((schema) => schema["@type"] === "WebApplication");
  const website = schemas.find((schema) => schema["@type"] === "WebSite");
  const webPage = schemas.find((schema) => schema["@type"] === "WebPage");
  const maintainer = schemas.find((schema) => schema["@type"] === "Person");

  assert.ok(faq, "FAQPage schema is present and parseable");
  assert.ok(application, "WebApplication schema is present and parseable");
  assert.ok(website, "WebSite schema is present and parseable");
  assert.ok(webPage, "WebPage schema is present and parseable");
  assert.ok(maintainer, "Person maintainer schema is present and parseable");
  assert.equal(website.name, "Reduce PDF Size");
  assert.equal(website.url, "http://localhost/");
  assert.equal(website.inLanguage, "en");
  assert.equal(website.author["@id"], "http://localhost/#maintainer");
  assert.equal(webPage.datePublished, "2026-08-01");
  assert.equal(webPage.dateModified, "2026-08-01");
  assert.equal(webPage.author["@id"], "http://localhost/#maintainer");
  assert.equal(maintainer.name, "HankDevZ");
  assert.equal(maintainer.url, "http://localhost/about");
  assert.deepEqual(maintainer.sameAs, ["https://github.com/HankDevZ"]);
  assert.equal(faq.mainEntity.length, 6);
  assert.equal(faq.inLanguage, "en");
  assert.equal(application.offers.price, "0");
  assert.equal(application.applicationCategory, "UtilitiesApplication");
  assert.equal(application.inLanguage, "en");
  assert.equal(application.featureList.length, 4);
  assert.equal((html.match(/<title>/g) ?? []).length, 1);
  assert.match(html, /<meta name="description" content="[^"]+"/);
  assert.match(html, /<link rel="canonical" href="http:\/\/localhost\/"/);
  assert.match(html, /<meta property="og:image" content="http:\/\/localhost\/og\.png"/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);

  const visible = [...html.matchAll(/<details>([\s\S]*?)<\/details>/g)].map((match) => {
    const question = match[1].match(/<summary>([\s\S]*?)<span/);
    const answer = match[1].match(/<p class="faq-answer">([\s\S]*?)<\/p>/);
    return {
      question: stripHtml(question?.[1] ?? ""),
      answer: stripHtml(answer?.[1] ?? ""),
    };
  });

  assert.equal(visible.length, 6);
  assert.deepEqual(
    faq.mainEntity.map((item) => ({
      question: item.name,
      answer: item.acceptedAnswer.text,
    })),
    visible,
  );
});

test("robots and sitemap expose all canonical public pages", async () => {
  const robotsResponse = await render("/robots.txt");
  assert.equal(robotsResponse.status, 200);
  assert.match(robotsResponse.headers.get("content-type") ?? "", /^text\/plain\b/i);
  const robots = await robotsResponse.text();
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \/(?:\r?\n|$)/);
  assert.match(robots, /Sitemap: http:\/\/localhost\/sitemap\.xml/);

  const sitemapResponse = await render("/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemapResponse.headers.get("content-type") ?? "", /^application\/xml\b/i);
  const sitemap = await sitemapResponse.text();
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const lastModified = [...sitemap.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(locations, [
    "http://localhost/",
    "http://localhost/about",
    "http://localhost/privacy",
    "http://localhost/terms",
    "http://localhost/source",
    "http://localhost/contact",
  ]);
  assert.deepEqual(lastModified, Array(6).fill("2026-08-01"));
  assert.doesNotMatch(sitemap, /<priority>|<changefreq>/);
});

test("llms.txt exposes concise and full factual GEO references", async () => {
  const conciseResponse = await render("/llms.txt");
  assert.equal(conciseResponse.status, 200);
  assert.match(conciseResponse.headers.get("content-type") ?? "", /^text\/plain\b/i);
  const concise = await conciseResponse.text();
  assert.match(concise, /^# Reduce PDF Size\n\n>/);
  assert.match(concise, /http:\/\/localhost\/llms-full\.txt/);
  assert.match(concise, /https:\/\/github\.com\/HankDevZ\/reduce-pdf-size/);
  assert.match(concise, /http:\/\/localhost\/about/);
  assert.match(concise, /does not promise an exact target size or lossless output/);

  const fullResponse = await render("/llms-full.txt");
  assert.equal(fullResponse.status, 200);
  assert.match(fullResponse.headers.get("content-type") ?? "", /^text\/plain\b/i);
  const full = await fullResponse.text();
  assert.match(full, /^# Reduce PDF Size: Full Product Reference\n\n>/);
  assert.match(full, /## Privacy and network behavior/);
  assert.match(full, /built and maintained by HankDevZ/);
  assert.equal((full.match(/^### /gm) ?? []).length, 6);

  const typoResponse = await render("/llm.txt");
  assert.equal(typoResponse.status, 308);
  assert.equal(typoResponse.headers.get("location"), "http://localhost/llms.txt");
});

test("renders about, legal, source, contact, and a true not-found response", async () => {
  for (const path of ["/about", "/privacy", "/terms", "/source", "/contact"]) {
    const response = await render(path);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Return to the PDF compressor/);
  }
  const missing = await render("/this-page-does-not-exist");
  assert.equal(missing.status, 404);
  const missingHtml = await missing.text();
  assert.match(missingHtml, /This page isn/);
  assert.equal(metaContent(missingHtml, "name", "robots"), "noindex");
});

test("all internal navigation links resolve without errors", async () => {
  const hrefs = new Set();
  for (const path of Object.keys(publicPages)) {
    const html = await (await render(path)).text();
    for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
      const href = decodeHtml(match[1]);
      if (href.startsWith("/") && !href.startsWith("//")) {
        hrefs.add(href.split("#")[0] || "/");
      }
    }
  }

  for (const href of hrefs) {
    const response = await render(href);
    assert.ok(response.status < 400, `${href} returned ${response.status}`);
  }
});

test("source and feedback destinations use the approved external addresses", async () => {
  const source = await (await render("/source")).text();
  const contact = await (await render("/contact")).text();
  assert.match(source, /https:\/\/github\.com\/HankDevZ\/reduce-pdf-size/);
  assert.doesNotMatch(source, /reduce-pdf-size-source\.zip/);
  assert.match(contact, /mailto:pam41320@gmail\.com/);
});

test("legal-page primary links retain white text on the blue button", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.legal-article \.primary-button\s*{[^}]*color:\s*#ffffff;/,
  );
});

test("worker is local-only and uses the documented Ghostscript settings", async () => {
  const worker = await readFile(new URL("../public/pdf-worker.js", import.meta.url), "utf8");
  assert.match(worker, /new Uint8Array\(event\.data\.input\)/);
  assert.match(worker, /-sDEVICE=pdfwrite/);
  assert.match(worker, /-dPDFSETTINGS=/);
  assert.match(worker, /\/ghostscript\/gs\.mjs/);
  assert.doesNotMatch(worker, /https?:\/\//);
});

test("social preview image dimensions match the declared metadata", async () => {
  const image = await readFile(new URL("../public/og.png", import.meta.url));
  assert.equal(image.readUInt32BE(16), 1730);
  assert.equal(image.readUInt32BE(20), 909);
  assert.ok(image.length < 5 * 1024 * 1024);

  const favicon = await readFile(new URL("../public/favicon.png", import.meta.url));
  assert.equal(favicon.readUInt32BE(16), 192);
  assert.equal(favicon.readUInt32BE(20), 192);
});
