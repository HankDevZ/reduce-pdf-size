import Link from "next/link";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { createPageMetadata } from "../seo";

const email = "pam41320@gmail.com";
const emailHref =
  "mailto:pam41320@gmail.com?subject=Reduce%20PDF%20Size%20support%20request";

export const metadata = createPageMetadata({
  title: "Contact & Feedback",
  description:
    "Contact Reduce PDF Size by email for bug reports, privacy questions, accessibility feedback, and focused feature requests.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-main">
        <article className="legal-article">
          <p className="eyebrow">Support &amp; feedback</p>
          <h1>Contact</h1>
          <p className="updated">We read focused, practical feedback.</p>

          <div className="legal-callout contact-callout">
            <strong>Email Reduce PDF Size</strong>
            <p>
              Use email for bug reports, privacy questions, accessibility
              feedback, corrections, and focused feature requests.
            </p>
            <a className="contact-email" href={emailHref}>
              {email}
            </a>
            <a
              className="primary-button"
              href={emailHref}
              aria-label={`Email Reduce PDF Size support at ${email}`}
            >
              Send email
            </a>
          </div>

          <h2>What to include</h2>
          <ul>
            <li>What you expected to happen and what happened instead.</li>
            <li>Your browser name and version.</li>
            <li>The PDF size and selected compression level.</li>
            <li>Any error message shown by the tool.</li>
          </ul>

          <h2>Protect confidential files</h2>
          <p>
            Please do not email a confidential PDF. A description of the file
            type and the error is usually enough to begin investigating. Files
            chosen in the compressor remain on your device as described in our{" "}
            <Link href="/privacy">Privacy page</Link>.
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
