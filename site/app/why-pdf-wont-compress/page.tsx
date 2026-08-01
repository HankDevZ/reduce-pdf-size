import Link from "next/link";
import { headers } from "next/headers";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import {
  BENCHMARK_ENGINE,
  FORM_FILE,
  OPTIMISED_FILE,
  REPORT_FILE,
  SCAN_FILE,
  SLIDES_FILE,
  TEXT_COMPRESSED_FILE,
  TEXT_RAW_FILE,
  formatBytes,
  inputBytes,
  levelsKeepingImageSize,
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

const TITLE = "Why Your PDF Will Not Compress";
const DESCRIPTION =
  "Four measured reasons a PDF refuses to get smaller, including the common case where compressing an ordinary text document makes the file twice as large.";

export const metadata = createPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/why-pdf-wont-compress",
});

export default async function WhyPdfWontCompressPage() {
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
    "@id": `${origin}/why-pdf-wont-compress#article`,
    url: `${origin}/why-pdf-wont-compress`,
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
    "@id": `${origin}/why-pdf-wont-compress#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${origin}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: TITLE,
        item: `${origin}/why-pdf-wont-compress`,
      },
    ],
  };

  const textRaw = rowFor(TEXT_RAW_FILE, "ebook")!;
  const textCompressed = rowFor(TEXT_COMPRESSED_FILE, "ebook")!;
  const form = rowFor(FORM_FILE, "ebook")!;
  const optimised = rowFor(OPTIMISED_FILE, "printer")!;
  const scanBest = rowFor(SCAN_FILE, "ebook")!;
  const reportKept = levelsKeepingImageSize(REPORT_FILE);
  const reportScreen = rowFor(REPORT_FILE, "screen")!;
  const slidesScreen = rowFor(SLIDES_FILE, "screen")!;

  return (
    <>
      <SiteHeader />
      <main className="legal-main">
        <article className="legal-article">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">{SITE_NAME}</Link>
            <span aria-hidden="true"> / </span>
            <span aria-current="page">Why a PDF will not compress</span>
          </nav>

          <p className="eyebrow">Measured, not estimated</p>
          <h1>{TITLE}</h1>
          <p className="updated">
            Published <time dateTime={SITE_PUBLISHED_DATE}>{SITE_DATE_LABEL}</time>
            <span aria-hidden="true"> · </span>
            Last reviewed <time dateTime={SITE_MODIFIED_DATE}>{SITE_DATE_LABEL}</time>
          </p>

          <p>
            Sometimes the compressor reports that your PDF could not be made
            smaller and offers no download. That is not a failure of the tool.
            It means the engine produced a file at least as large as the one you
            supplied, and showing you a bigger file labelled as a success would
            be dishonest.
          </p>
          <p>
            There are four common reasons, and all four can be measured. The
            figures below come from the same reproducible benchmark that
            produced the{" "}
            <Link href="/compression-levels">compression level comparison</Link>,
            run on {BENCHMARK_ENGINE}.
          </p>

          <h2>1. It is already compressed</h2>
          <p>
            This is the most common reason and the least obvious one. PDF is not
            a plain container: text, vector art, and layout instructions inside a
            PDF are normally stored already compressed. Word, Google Docs,
            LaTeX, and browser print-to-PDF all do this. There is no loose
            slack left for a second pass to squeeze out.
          </p>
          <p>
            The benchmark carries the same twelve pages of text twice, once with
            its content streams left raw and once compressed the way a real
            exporter would write them. Both produce an{" "}
            <strong>identical output</strong>. Only the input differs:
          </p>
          <div className="data-table-wrap">
            <table className="data-table">
              <caption className="visually-hidden">
                The same text document with raw and compressed content streams
              </caption>
              <thead>
                <tr>
                  <th scope="col">Same 12 pages of text</th>
                  <th scope="col">Input</th>
                  <th scope="col">Output</th>
                  <th scope="col">Result</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Content streams left raw</th>
                  <td data-label="Input">
                    {formatBytes(inputBytes(TEXT_RAW_FILE))}
                  </td>
                  <td data-label="Output">
                    {formatBytes(textRaw.outputBytes)}
                  </td>
                  <td data-label="Result">
                    <span className="result-delta">
                      −{textRaw.reductionPercent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
                <tr>
                  <th scope="row">Content streams compressed</th>
                  <td data-label="Input">
                    {formatBytes(inputBytes(TEXT_COMPRESSED_FILE))}
                  </td>
                  <td data-label="Output">
                    {formatBytes(textCompressed.outputBytes)}
                  </td>
                  <td data-label="Result">
                    <span className="result-none">not smaller</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            The realistic version is{" "}
            {formatBytes(inputBytes(TEXT_COMPRESSED_FILE))} and compressing it
            produces {formatBytes(textCompressed.outputBytes)} — more than twice
            the size. Every level refuses it.
          </p>
          <p>
            The uncompressed version appears to shrink by{" "}
            {textRaw.reductionPercent.toFixed(1)}%, but that number describes how
            wasteful its input was, not how good the compressor is. Any tool
            advertising large savings on ordinary text documents is quietly
            relying on this effect. A text-only PDF that will not compress is
            behaving exactly as it should.
          </p>

          <h2>2. The images are already small enough</h2>
          <p>
            Image downsampling does most of the work in PDF compression, and each
            level only downsamples images above its target resolution. If a
            photograph is already at or below that threshold, nothing happens to
            it, and the rewrite adds a little overhead instead.
          </p>
          {reportKept.length > 0 && (
            <p>
              In the illustrated report, the largest image measures{" "}
              {rowFor(REPORT_FILE, "ebook")!.source.largestImage!.width}
              <span aria-hidden="true">×</span>
              <span className="visually-hidden"> by </span>
              {rowFor(REPORT_FILE, "ebook")!.source.largestImage!.height} pixels
              and comes out at exactly those dimensions under{" "}
              {reportKept.map((level) => level.label).join(" and ")}. Both levels
              are refused. Smallest Size does downsample it, and the same file
              then drops by {reportScreen.reductionPercent.toFixed(1)}% — the
              presentation export behaves the same way, falling by{" "}
              {slidesScreen.reductionPercent.toFixed(1)}% only once its
              backgrounds are actually reduced.
            </p>
          )}
          <p>
            So a refusal at High Quality or Balanced is worth reading as
            information: your images are already modest for their level. Trying
            Smallest Size is the sensible next step, and it is the one case where
            it reliably helps.
          </p>

          <h2>3. The file is too small to win</h2>
          <p>
            Compression is not free. The engine writes structural information,
            metadata, and font descriptors into the output regardless of how
            small the document is. Below a certain size that fixed cost exceeds
            anything it can save.
          </p>
          <p>
            The interactive form in the benchmark starts at{" "}
            {formatBytes(inputBytes(FORM_FILE))} and becomes{" "}
            {formatBytes(form.outputBytes)} at Balanced. Nothing went wrong; the
            document simply had less content than the wrapper the engine writes
            around it. Files of a few kilobytes are already about as small as a
            valid PDF can be.
          </p>

          <h2>4. It has already been through a compressor</h2>
          <p>
            Running a compressed PDF through a compressor again almost never
            helps. The images have already been downsampled and re-encoded, so
            the second pass finds no headroom and re-encodes lossy images a
            second time, which costs quality without buying size.
          </p>
          <p>
            The benchmark includes a document already processed once. Compressing
            it again at High Quality yields{" "}
            {formatBytes(optimised.outputBytes)} against an input of{" "}
            {formatBytes(inputBytes(OPTIMISED_FILE))}, and is refused. If you
            have already compressed a file, compress the{" "}
            <em>original</em> at a stronger level instead of stacking passes.
          </p>

          <h2>What does compress well</h2>
          <p>
            For contrast, the cases that work are consistent and predictable:
          </p>
          <ul>
            <li>
              <strong>Scanned documents.</strong> Pages stored as
              high-resolution images have a great deal to remove — the scan in
              this benchmark falls by {scanBest.reductionPercent.toFixed(1)}%.
            </li>
            <li>
              <strong>Photographs placed far below their native size.</strong> A
              4000-pixel-wide image displayed at postcard size is pure waste, and
              downsampling reclaims all of it.
            </li>
            <li>
              <strong>Documents that repeat an image.</strong> A logo or
              letterhead stored once per page is merged into a single object.
            </li>
          </ul>
          <p>
            The pattern is simple: compression removes redundant image data. A
            document without redundant image data has nothing to give, no matter
            which level you choose.
          </p>

          <h2>What to do when nothing works</h2>
          <p>
            If every level refuses your file, the document is already efficient
            and no PDF compressor will change that. The remaining options are
            about the document rather than the encoding:
          </p>
          <ul>
            <li>
              Split it into smaller files if the destination has a per-file
              limit.
            </li>
            <li>
              Remove pages, embedded attachments, or high-resolution images you
              do not need, then export again from the original application.
            </li>
            <li>
              Re-export from the source document at a lower image quality, which
              controls resolution before the PDF is ever written.
            </li>
            <li>
              Check whether the destination accepts a ZIP archive, which will
              compress an already-compressed PDF by very little but sometimes
              satisfies an upload rule.
            </li>
          </ul>
          <p>
            A file that refuses to shrink is not broken, and neither is the tool.{" "}
            <Link href="/compression-levels">
              The measured level comparison
            </Link>{" "}
            shows what each level does when there is something to remove, and the{" "}
            <Link href="/terms">Terms of Use</Link> list the document features
            that compression can affect.
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
