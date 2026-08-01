import Link from "next/link";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import {
  createPageMetadata,
  MAINTAINER_GITHUB,
  MAINTAINER_NAME,
  SITE_DATE_LABEL,
  SITE_MODIFIED_DATE,
  SITE_PUBLISHED_DATE,
} from "../seo";

export const metadata = createPageMetadata({
  title: "About",
  description:
    "Who maintains Reduce PDF Size, how its product information is checked, and where to report corrections or technical issues.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-main">
        <article className="legal-article">
          <p className="eyebrow">People, process, and accountability</p>
          <h1>About Reduce PDF Size</h1>
          <p className="updated">
            Published <time dateTime={SITE_PUBLISHED_DATE}>{SITE_DATE_LABEL}</time>
            <span aria-hidden="true"> · </span>
            Last reviewed <time dateTime={SITE_MODIFIED_DATE}>{SITE_DATE_LABEL}</time>
          </p>

          <div className="legal-callout maintainer-callout">
            <strong>Built and maintained by {MAINTAINER_NAME}</strong>
            <p>
              The public repository shows the application code, change history,
              build files, tests, licenses, and third-party notices used by this
              website.
            </p>
            <a href={MAINTAINER_GITHUB} target="_blank" rel="noreferrer author">
              View the maintainer on GitHub
            </a>
          </div>

          <h2>What this project does</h2>
          <p>
            Reduce PDF Size is a free browser tool for making one PDF at a time
            smaller. Its compression engine runs in a dedicated browser worker;
            the selected PDF is not uploaded to a compression server.
          </p>

          <h2>How information is checked</h2>
          <p>
            Product claims on this site are kept aligned with the implemented
            source and automated tests. Tests cover rendered page metadata,
            structured data, navigation, privacy statements, the local-only
            worker path, and the documented compression settings. The complete
            implementation is available on the <Link href="/source">Source Code page</Link>.
          </p>

          <h2>Limits we state clearly</h2>
          <p>
            Compression results depend on the document. The project does not
            promise an exact target size or lossless output. Users should keep
            the original PDF and inspect important text, images, forms, stamps,
            links, and signatures in every downloaded result.
          </p>

          <h2>Corrections and feedback</h2>
          <p>
            If a statement is unclear, outdated, or inconsistent with the tool,
            please use the <Link href="/contact">Contact page</Link>. Technical
            details and reproducible examples help the maintainer investigate.
          </p>

          <p>
            <Link href="/#tool">Return to the PDF compressor.</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
