import Link from "next/link";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { createPageMetadata } from "../seo";

export const metadata = createPageMetadata({
  title: "Source Code",
  description:
    "View the Reduce PDF Size source code and open-source license information on GitHub.",
  path: "/source",
});

export default function SourcePage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-main">
        <article className="legal-article">
          <p className="eyebrow">Open source</p>
          <h1>Source Code</h1>
          <p className="updated">Updated: August 1, 2026</p>

          <div className="legal-callout">
            <strong>View the complete source on GitHub</strong>
            <p>
              The repository contains the application, dependency lockfile,
              browser worker integration, build instructions, licenses, and
              locally served runtime assets.
            </p>
            <a
              className="primary-button"
              href="https://github.com/HankDevZ/reduce-pdf-size"
              target="_blank"
              rel="noreferrer"
            >
              Open GitHub repository
            </a>
          </div>

          <h2>Application license</h2>
          <p>
            Reduce PDF Size is released under the GNU Affero General Public
            License, version 3. You may inspect, run, modify, and redistribute it
            under that license&apos;s terms. The GitHub repository includes the
            full license text.
          </p>

          <h2>Compression engine</h2>
          <p>
            This build uses <code>@jspawn/ghostscript-wasm 0.0.2</code>, an
            AGPL-3.0 browser WebAssembly distribution based on Ghostscript. Its
            runtime files are served from this website rather than a third-party
            CDN. See <code>THIRD_PARTY_NOTICES.md</code> in the repository
            for attribution and upstream links.
          </p>

          <h2>Build the site</h2>
          <ol>
            <li>Use a supported Node.js version listed in the package.</li>
            <li>Run <code>npm install</code> in the source directory.</li>
            <li>Run <code>npm run build</code> for the production output.</li>
          </ol>

          <p>
            The repository is provided for transparency and license compliance,
            not as legal advice. Review the licenses before redistributing a
            modified build.
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
