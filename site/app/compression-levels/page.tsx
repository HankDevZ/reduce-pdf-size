import Link from "next/link";
import { headers } from "next/headers";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import {
  BENCHMARK_CORPUS,
  BENCHMARK_ENGINE,
  DEDUPLICATED,
  LEVELS,
  LOST_ACROFORM,
  REJECTED_EVERYWHERE,
  SCAN_FILE,
  SMALLEST_NOT_SMALLEST,
  formatBytes,
  inputBytes,
  rowFor,
} from "../benchmark";
import {
  createPageMetadata,
  MAINTAINER_NAME,
  PRIMARY_SOURCES,
  SITE_DATE_LABEL,
  SITE_MODIFIED_DATE,
  SITE_PUBLISHED_DATE,
  SITE_NAME,
} from "../seo";

const TITLE = "PDF Compression Levels Compared";
const DESCRIPTION =
  "Measured results for the High Quality, Balanced, and Smallest Size levels across eight test PDFs, with the reproducible benchmark behind every number.";

export const metadata = createPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/compression-levels",
});

export default async function CompressionLevelsPage() {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "localhost";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  const maintainerSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${origin}/#maintainer`,
    name: MAINTAINER_NAME,
    url: `${origin}/about`,
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${origin}/compression-levels#article`,
    url: `${origin}/compression-levels`,
    headline: TITLE,
    description: DESCRIPTION,
    inLanguage: "en",
    datePublished: SITE_PUBLISHED_DATE,
    dateModified: SITE_MODIFIED_DATE,
    lastReviewed: SITE_MODIFIED_DATE,
    author: { "@id": `${origin}/#maintainer` },
    reviewedBy: { "@id": `${origin}/#maintainer` },
    publisher: { "@id": `${origin}/#maintainer` },
    isPartOf: { "@id": `${origin}/#website` },
    about: { "@id": `${origin}/#web-application` },
    citation: PRIMARY_SOURCES.map((source) => source.url),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${origin}/compression-levels#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: SITE_NAME,
        item: `${origin}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: TITLE,
        item: `${origin}/compression-levels`,
      },
    ],
  };

  const scanRows = LEVELS.map((level) => ({
    level,
    row: rowFor(SCAN_FILE, level.value),
  })).filter((entry) => entry.row?.result.largestImage);

  const formEntry = REJECTED_EVERYWHERE[0];
  const formRows = formEntry ? LEVELS.map((level) => rowFor(formEntry.file, level.value)) : [];
  const dedupEntry = DEDUPLICATED[0];
  const dedupRow = dedupEntry ? rowFor(dedupEntry.file, "ebook") : undefined;
  const acroformEntry = LOST_ACROFORM[0];

  return (
    <>
      <SiteHeader />
      <main className="legal-main">
        <article className="legal-article">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">{SITE_NAME}</Link>
            <span aria-hidden="true"> / </span>
            <span aria-current="page">Compression levels</span>
          </nav>

          <p className="eyebrow">Measured, not estimated</p>
          <h1>{TITLE}</h1>
          <p className="updated">
            Published <time dateTime={SITE_PUBLISHED_DATE}>{SITE_DATE_LABEL}</time>
            <span aria-hidden="true"> · </span>
            Last reviewed <time dateTime={SITE_MODIFIED_DATE}>{SITE_DATE_LABEL}</time>
          </p>

          <p>
            The compressor offers three levels: High Quality, Balanced, and
            Smallest Size. Their names suggest a simple ordering from largest to
            smallest output. The measurements below show that the ordering does
            not always hold, and explain why.
          </p>
          <p>
            Every figure on this page comes from running{" "}
            {BENCHMARK_CORPUS.length} generated test documents through the same
            engine and the same settings this site uses, then reading the
            resulting file sizes. Nothing here is estimated.
          </p>

          <div className="legal-callout">
            <strong>Reproduce these numbers</strong>
            <p>
              The test documents are generated from fixed seeds, so a rebuild
              produces byte-identical inputs on any machine. From a checkout of
              the source repository:
            </p>
            <pre className="command-block">
              <code>
                node benchmark/build-corpus.mjs{"\n"}node
                benchmark/run-benchmark.mjs
              </code>
            </pre>
            <p>
              Engine: <code>{BENCHMARK_ENGINE}</code>, invoked with the same
              arguments as the browser worker that runs on this site.
            </p>
          </div>

          <h2>What each level does to an image</h2>
          <p>
            The levels map onto Ghostscript PDFSETTINGS presets. Rather than
            restate the documented target resolutions, the table below reports
            what actually came out of a three-page 300 dpi grayscale scan: the
            pixel dimensions of the largest image in each output, and the
            compression filter applied to it.
          </p>
          <div className="data-table-wrap">
            <table className="data-table">
              <caption className="visually-hidden">
                Measured image dimensions and filters for each compression level
              </caption>
              <thead>
                <tr>
                  <th scope="col">Level</th>
                  <th scope="col">Preset</th>
                  <th scope="col">Largest image</th>
                  <th scope="col">Filter</th>
                  <th scope="col">Image stream</th>
                </tr>
              </thead>
              <tbody>
                {scanRows.map(({ level, row }) => (
                  <tr key={level.value}>
                    <th scope="row">{level.label}</th>
                    <td data-label="Preset">
                      <code>{level.preset}</code>
                    </td>
                    <td data-label="Largest image">
                      {row!.result.largestImage!.width}
                      <span aria-hidden="true">×</span>
                      <span className="visually-hidden"> by </span>
                      {row!.result.largestImage!.height}
                    </td>
                    <td data-label="Filter">
                      <code>{row!.result.largestImage!.filter.replace("/", "")}</code>
                    </td>
                    <td data-label="Image stream">
                      {formatBytes(row!.result.largestImage!.streamBytes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Each step down halves the pixel dimensions. The filter column is
            where the surprise lives, and the next section returns to it.
          </p>

          <h2>Results across {BENCHMARK_CORPUS.length} documents</h2>
          <p>
            Each document isolates one mechanism rather than representing an
            average file. <strong>Not smaller</strong> means the engine produced
            an output at least as large as the input; the live tool reports those
            as a failure and offers no download, so no percentage is shown.
          </p>
          <div className="data-table-wrap">
            <table className="data-table">
              <caption className="visually-hidden">
                Output size for every test document at every compression level
              </caption>
              <thead>
                <tr>
                  <th scope="col">Document</th>
                  <th scope="col">Original</th>
                  {LEVELS.map((level) => (
                    <th scope="col" key={level.value}>
                      {level.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BENCHMARK_CORPUS.map((entry) => (
                  <tr key={entry.file}>
                    <th scope="row">{entry.title}</th>
                    <td data-label="Original">
                      {formatBytes(inputBytes(entry.file))}
                    </td>
                    {LEVELS.map((level) => {
                      const row = rowFor(entry.file, level.value);
                      return (
                        <td data-label={level.label} key={level.value}>
                          {!row || row.rejected ? (
                            <span className="result-none">not smaller</span>
                          ) : (
                            <>
                              {formatBytes(row.outputBytes)}
                              <span className="result-delta">
                                −{row.reductionPercent.toFixed(1)}%
                              </span>
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>Smallest Size is not always the smallest</h2>
          <p>
            On the 300 dpi scan, Smallest Size reduces the image to a quarter of
            the pixels that Balanced keeps, yet produces a{" "}
            <strong>larger file</strong>:{" "}
            {formatBytes(rowFor(SCAN_FILE, "ebook")!.outputBytes)} at Balanced
            against {formatBytes(rowFor(SCAN_FILE, "screen")!.outputBytes)} at
            Smallest Size.
          </p>
          <p>
            The filter column above explains it. Balanced keeps the image as
            JPEG (<code>DCTDecode</code>). Smallest Size stores it with{" "}
            <code>FlateDecode</code>, a lossless method that is efficient for
            flat graphics and line art but poorly suited to the continuous tones
            of a scanned page. Fewer pixels, stored far less efficiently, adds up
            to a bigger file.
          </p>
          <p>
            This affected {SMALLEST_NOT_SMALLEST.length} of{" "}
            {BENCHMARK_CORPUS.length} documents in this set. The practical
            consequence is simple: when a file needs to be as small as possible,
            try Balanced as well as Smallest Size and compare the two results.
            The stronger-sounding level is not guaranteed to win.
          </p>

          <h2>Compression can make a file larger</h2>
          {formEntry && formRows[0] && (
            <p>
              A small document has little to gain and a fixed amount to lose. The{" "}
              {formEntry.title.toLowerCase()} in this set starts at{" "}
              {formatBytes(inputBytes(formEntry.file))} and grows at every level,
              reaching {formatBytes(formRows[2]!.outputBytes)} at Smallest Size
              and {formatBytes(formRows[0]!.outputBytes)} at High Quality. The
              structural information the engine writes on its way out exceeds the
              entire original file.
            </p>
          )}
          <p>
            The same happens when a document has already been compressed. There
            is no reserve of removable data left, so a second pass mostly adds
            overhead. In both cases the tool refuses the result rather than
            presenting a larger file as a success.{" "}
            <Link href="/why-pdf-wont-compress">
              The measured reasons a PDF will not compress
            </Link>{" "}
            covers this in full, including why an ordinary text document more
            than doubles in size.
          </p>

          <h2>What changes besides the file size</h2>
          <p>
            Compression rewrites the document rather than editing it. Page count
            survived intact across every document tested, but two structural
            changes are worth knowing about before compressing something
            important.
          </p>
          {acroformEntry && (
            <p>
              <strong>Interactive form fields do not survive.</strong> The{" "}
              {acroformEntry.title.toLowerCase()} went in with a fillable form
              definition and came out without one. If a PDF has fields people are
              meant to type into, compressing it here will cost that
              functionality. Keep the original.
            </p>
          )}
          {dedupEntry && dedupRow && (
            <p>
              <strong>Repeated images are merged.</strong> A document storing one
              figure as {dedupRow.source.imageObjects} separate objects came out
              with {dedupRow.result.imageObjects}, a reduction of{" "}
              {dedupRow.reductionPercent.toFixed(1)}% at Balanced with no
              downsampling involved at all. Documents that reuse a logo or
              letterhead on every page benefit from this even when their images
              are already well compressed.
            </p>
          )}
          <p>
            Other elements — annotations, attachments, layers, and scripts — may
            also be altered. The <Link href="/terms">Terms of Use</Link> state
            these limits, and encrypted or digitally signed PDFs are rejected
            before compression rather than silently damaged.
          </p>

          <h2>Choosing a level</h2>
          <p>
            <strong>Start with Balanced.</strong> It produced the smallest usable
            output on more documents in this set than either alternative, and it
            keeps photographic content in a format suited to it.
          </p>
          <p>
            <strong>Use Smallest Size when a hard limit demands it</strong>, then
            compare it against the Balanced result rather than assuming it wins.
            On documents whose images sit well above their displayed size, it is
            dramatically more effective; on scans it can go the wrong way.
          </p>
          <p>
            <strong>Use High Quality when the document will be inspected
            closely.</strong> On several documents it produced no usable
            reduction at all, which is the honest outcome when the images are
            already at or below the level target.
          </p>
          <p>
            Whichever level you choose, open the downloaded file and check the
            pages that matter before discarding the original.{" "}
            <Link href="/#tool">Compress a PDF now.</Link>
          </p>

          <h2>How these numbers were produced</h2>
          <p>
            The documents are generated programmatically from fixed seeds rather
            than collected, so the exact inputs behind every figure can be
            rebuilt by anyone. The harness loads the same WebAssembly build of{" "}
            {BENCHMARK_ENGINE} that this site serves to browsers, and a test
            asserts that its argument list matches the worker in production, so
            the published numbers cannot silently drift away from the shipped
            tool.
          </p>
          <p>Several limits bound what these figures mean:</p>
          <ul>
            <li>
              <strong>The text document appears twice on purpose.</strong> One
              copy leaves its content streams uncompressed and one compresses
              them, because every real exporter compresses. The uncompressed
              copy reports a large reduction that no genuine document would see;
              the compressed copy cannot be reduced at all. Read the pair
              together rather than either number alone.
            </li>
            <li>
              <strong>Fonts are not embedded.</strong> The text documents use
              standard base-14 fonts, so font subsetting has nothing to remove.
              Real documents embed fonts and may gain there.
            </li>
            <li>
              <strong>Images are synthetic.</strong> They are generated gradients
              with grain, not photographs. Absolute ratios for image-heavy cases
              are indicative rather than predictive.
            </li>
            <li>
              <strong>One document per case.</strong> These isolate mechanisms;
              they are not a statistical sample of real-world PDFs.
            </li>
          </ul>
          <p>
            The preset behaviour described here is documented by Ghostscript, and
            the implementation is public. Both are listed on the{" "}
            <Link href="/source">Source Code page</Link>. If a figure looks wrong
            or the tool behaves differently for you, the{" "}
            <Link href="/contact">Contact page</Link> is the place to report it.
          </p>

          <p>
            <Link href="/#tool">Return to the PDF compressor.</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(maintainerSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
