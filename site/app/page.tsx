import Link from "next/link";
import { headers } from "next/headers";
import { PdfCompressor } from "./components/PdfCompressor";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { faqAnswerText, faqItems } from "./content";
import {
  createPageMetadata,
  HOME_DESCRIPTION,
  HOME_TITLE,
  MAINTAINER_GITHUB,
  MAINTAINER_NAME,
  SITE_DATE_LABEL,
  SITE_MODIFIED_DATE,
  SITE_PUBLISHED_DATE,
} from "./seo";

export const metadata = createPageMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

export default async function Home() {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "localhost";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    name: "Reduce PDF Size",
    description: HOME_DESCRIPTION,
    inLanguage: "en",
    url: `${origin}/`,
    author: { "@id": `${origin}/#maintainer` },
    publisher: { "@id": `${origin}/#maintainer` },
  };

  const maintainerSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${origin}/#maintainer`,
    name: MAINTAINER_NAME,
    url: `${origin}/about`,
    sameAs: [MAINTAINER_GITHUB],
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${origin}/#webpage`,
    url: `${origin}/`,
    name: HOME_TITLE,
    description: HOME_DESCRIPTION,
    inLanguage: "en",
    datePublished: SITE_PUBLISHED_DATE,
    dateModified: SITE_MODIFIED_DATE,
    author: { "@id": `${origin}/#maintainer` },
    publisher: { "@id": `${origin}/#maintainer` },
    isPartOf: { "@id": `${origin}/#website` },
    mainEntity: { "@id": `${origin}/#web-application` },
  };

  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${origin}/#web-application`,
    url: `${origin}/`,
    name: "Reduce PDF Size",
    description:
      "A free browser-based PDF compressor with three compression levels.",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any modern browser",
    browserRequirements: "A modern browser with WebAssembly and Web Worker support",
    featureList: [
      "Browser-local PDF compression",
      "Three compression levels",
      "PDF files up to 100MB",
      "No account required",
    ],
    inLanguage: "en",
    isAccessibleForFree: true,
    isPartOf: { "@id": `${origin}/#website` },
    author: { "@id": `${origin}/#maintainer` },
    dateModified: SITE_MODIFIED_DATE,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${origin}/#faq`,
    url: `${origin}/#faq`,
    inLanguage: "en",
    isPartOf: { "@id": `${origin}/#website` },
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faqAnswerText(item),
      },
    })),
  };

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero" id="tool">
          <div className="hero-copy">
            <p className="eyebrow">Free PDF compressor</p>
            <h1>Reduce PDF Size Online</h1>
            <p className="hero-lead">
              Make a PDF smaller for email, forms, and sharing—right in your
              browser.
            </p>
            <ul className="trust-list" aria-label="Tool benefits">
              <li>Files stay on your device</li>
              <li>Your original stays unchanged</li>
              <li>No signup required</li>
              <li>PDF files up to 100MB</li>
            </ul>
            <p className="page-byline">
              Built and maintained by{" "}
              <Link href="/about" rel="author">
                {MAINTAINER_NAME}
              </Link>
              <span aria-hidden="true"> · </span>
              Published <time dateTime={SITE_PUBLISHED_DATE}>{SITE_DATE_LABEL}</time>
              <span aria-hidden="true"> · </span>
              Updated <time dateTime={SITE_MODIFIED_DATE}>{SITE_DATE_LABEL}</time>
            </p>
          </div>
          <PdfCompressor />
        </section>

        <section className="content-tile light" id="how-it-works">
          <div className="content-wrap">
            <p className="section-kicker">Three simple steps</p>
            <h2>How to Reduce PDF File Size</h2>
            <p className="section-lead">
              You can reduce the size of an existing PDF without recreating the
              document.
            </p>
            <ol className="steps-grid">
              <li>
                <a
                  className="step-card-link"
                  href="#tool"
                  aria-label="Select your PDF — go to the PDF compressor"
                >
                  <span>1</span>
                  <h3>Select your PDF</h3>
                  <p>Choose a file or drag it into the compressor above.</p>
                  <strong className="step-card-action">
                    Go to compressor <b aria-hidden="true">↗</b>
                  </strong>
                </a>
              </li>
              <li>
                <a
                  className="step-card-link"
                  href="#tool"
                  aria-label="Choose a compression level — go to the PDF compressor"
                >
                  <span>2</span>
                  <h3>Choose a level</h3>
                  <p>Pick the balance of image quality and file size you need.</p>
                  <strong className="step-card-action">
                    Go to compressor <b aria-hidden="true">↗</b>
                  </strong>
                </a>
              </li>
              <li>
                <a
                  className="step-card-link"
                  href="#tool"
                  aria-label="Compress and download — go to the PDF compressor"
                >
                  <span>3</span>
                  <h3>Compress and download</h3>
                  <p>Review the result, then save the smaller PDF to your device.</p>
                  <strong className="step-card-action">
                    Go to compressor <b aria-hidden="true">↗</b>
                  </strong>
                </a>
              </li>
            </ol>
          </div>
        </section>

        <section className="content-tile dark">
          <div className="split-wrap">
            <div>
              <p className="section-kicker on-dark">Everyday uploads</p>
              <h2>Make a PDF Smaller for Uploading</h2>
            </div>
            <div className="editorial-copy">
              <p>
                Email services, job applications, government forms, and other
                websites often limit attachment size. Start with{" "}
                <strong>Balanced</strong> for a practical mix of clarity and
                compression.
              </p>
              <p>
                If your PDF is still over the destination&apos;s limit, try{" "}
                <strong>Smallest Size</strong> and check the downloaded file
                before submitting it. The exact result depends on what is inside
                your PDF.
              </p>
              <a className="text-link-dark" href="#tool">
                Reduce a PDF now <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>

        <section className="content-tile parchment">
          <div className="content-wrap">
            <p className="section-kicker">A clear tradeoff</p>
            <h2>Reduce PDF Size Without Losing Quality</h2>
            <p className="section-lead">
              Compression can change image quality. Choose the lightest level
              that gets your file where it needs to go.
            </p>
            <div className="quality-comparison">
              <p className="quality-guide-note">
                Comparison guide only — choose a level in the compressor above.
              </p>
              <div className="quality-table-wrap">
                <table className="quality-table">
                  <caption className="visually-hidden">
                    Static comparison of the three PDF compression levels
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Compression level</th>
                      <th scope="col">Best for</th>
                      <th scope="col">Tradeoff</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">
                        <span className="quality-index">01</span>
                        <span>High Quality</span>
                      </th>
                      <td data-label="Best for">
                        Detailed images, charts, and documents you plan to inspect closely.
                      </td>
                      <td data-label="Tradeoff">
                        Prioritizes image clarity, so size reduction is usually more modest.
                      </td>
                    </tr>
                    <tr className="recommended-row">
                      <th scope="row">
                        <span className="quality-index">02</span>
                        <span>Balanced</span>
                        <span className="recommended-badge">Recommended default</span>
                      </th>
                      <td data-label="Best for">
                        Ordinary sharing, email attachments, forms, and online uploads.
                      </td>
                      <td data-label="Tradeoff">
                        A practical balance between readable output and a smaller file.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">
                        <span className="quality-index">03</span>
                        <span>Smallest Size</span>
                      </th>
                      <td data-label="Best for">
                        Strict upload limits when the other levels still produce a large PDF.
                      </td>
                      <td data-label="Tradeoff">
                        Prioritizes a smaller file; fine image details may appear less sharp.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="content-tile dark dark-alt">
          <div className="split-wrap">
            <div className="paper-visual" aria-hidden="true">
              <span className="paper-sheet paper-one" />
              <span className="paper-sheet paper-two" />
              <span className="paper-sheet paper-three" />
              <span className="scan-line" />
            </div>
            <div className="editorial-copy">
              <p className="section-kicker on-dark">Image-heavy documents</p>
              <h2>How to Compress a Scanned PDF</h2>
              <p>
                A scanned PDF often stores each page as a high-resolution image,
                so image downsampling and re-encoding can reduce its size more
                than a text-only document.
              </p>
              <p>
                Start with Balanced and inspect small text, stamps, signatures,
                and thin lines in the output. Strong compression can make those
                details less clear.
              </p>
            </div>
          </div>
        </section>

        <section className="content-tile light" id="faq">
          <div className="faq-wrap">
            <p className="section-kicker">Useful answers</p>
            <h2>Frequently Asked Questions</h2>
            <div className="faq-list">
              {faqItems.map((item) => (
                <details key={item.question}>
                  <summary>
                    {item.question}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p className="faq-answer">
                    {item.answer}{" "}
                    {"href" in item && (
                      <Link href={item.href}>{item.linkLabel}</Link>
                    )}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(maintainerSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
