import Link from "next/link";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { createPageMetadata } from "../seo";

export const metadata = createPageMetadata({
  title: "Terms of Use",
  description:
    "Terms and important compatibility limits for the Reduce PDF Size browser tool.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-main">
        <article className="legal-article">
          <p className="eyebrow">Important limits</p>
          <h1>Terms of Use</h1>
          <p className="updated">Last updated: August 1, 2026</p>

          <h2>Using the tool</h2>
          <p>
            You may use Reduce PDF Size to process files you own or are
            authorized to modify. You are responsible for complying with
            applicable laws and the rights of other people.
          </p>

          <h2>Compression changes files</h2>
          <p>
            PDF compression rewrites a document and may reduce image resolution,
            change internal structures, or affect advanced features. No
            compression level is guaranteed to be visually lossless or to reach a
            particular size.
          </p>

          <h2>Check every output</h2>
          <p>
            Open the downloaded PDF and inspect important pages, small text,
            images, stamps, signatures, forms, and links before deleting the
            original or submitting the output. Keep your original file until you
            are satisfied with the result.
          </p>

          <h2>Unsupported and limited files</h2>
          <p>
            This version rejects encrypted, password-protected, and detected
            digitally signed PDFs. Complex forms, attachments, scripts, layers,
            and some annotations may not be preserved exactly. Damaged or unusual
            PDFs may fail to process.
          </p>

          <h2>No warranty</h2>
          <p>
            The tool is provided as-is, without guarantees of availability,
            compatibility, compression ratio, fitness for a particular purpose,
            or preservation of every PDF feature. To the extent permitted by law,
            the project maintainers are not liable for lost files, rejected
            submissions, or other indirect damage.
          </p>

          <h2>Open-source software</h2>
          <p>
            The application is offered under AGPL-3.0 and uses third-party
            open-source software, including Ghostscript-related WebAssembly. See
            the <Link href="/source">Source page</Link> for notices and the
            corresponding source repository.
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
