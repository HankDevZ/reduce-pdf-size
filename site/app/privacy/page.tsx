import Link from "next/link";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { createPageMetadata } from "../seo";

export const metadata = createPageMetadata({
  title: "Privacy",
  description:
    "How Reduce PDF Size processes PDF files locally in your browser and handles temporary data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-main">
        <article className="legal-article">
          <p className="eyebrow">Plain-language privacy</p>
          <h1>Privacy</h1>
          <p className="updated">Last updated: August 1, 2026</p>

          <div className="legal-callout">
            <strong>Your PDF stays on your device.</strong>
            <p>
              The file is read by your browser and passed to a dedicated browser
              worker. Its contents are not uploaded to a compression server.
            </p>
          </div>

          <h2>What the app processes</h2>
          <p>
            When you choose a PDF, the app reads its file name, size, header,
            selected compression level, and file bytes in browser memory. These
            values are used only to validate and compress that file.
          </p>

          <h2>Network behavior</h2>
          <p>
            The app downloads its own page, scripts, browser worker, and
            Ghostscript WebAssembly resources from the same website. Firebase
            Analytics loads after the initial page load. The app does not send
            your PDF bytes through fetch, XHR, a form submission, analytics,
            advertising, logging, or an error-reporting service.
          </p>

          <h2>Temporary browser memory</h2>
          <p>
            The selected file and compressed result remain in memory while you
            use the tool. The app revokes the temporary download URL when you
            reset the tool, replace the result, or leave the page. Cancelling a
            task terminates its worker.
          </p>

          <h2>No accounts and limited analytics</h2>
          <p>
            This version does not require an account and does not include
            advertisements or file-upload services. It uses Firebase Analytics
            with measurement ID G-BGHK5Q8Z3R to record standard website usage
            and technical information, such as page views, interactions, and
            browser or device details. The integration does not send the selected
            file name, PDF bytes, compression setting, or compressed result to
            Analytics. Google processes analytics data under its{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
            >
              Privacy Policy
            </a>
            . Standard web-host access logs may also record ordinary request
            information such as an IP address and requested asset paths, but
            those requests do not contain your PDF file.
          </p>

          <h2>Your responsibility</h2>
          <p>
            Use a current browser on a device you trust. If a PDF is confidential,
            also consider the security of your device, browser extensions, and
            downloaded-files folder.
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
