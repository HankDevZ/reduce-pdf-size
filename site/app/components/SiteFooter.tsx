import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <Link className="footer-brand" href="/">
            Reduce PDF Size
          </Link>
          <p>Private PDF compression, directly in your browser.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/">Tool</Link>
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/source">Source</Link>
          <Link href="/contact">Contact &amp; Feedback</Link>
        </nav>
      </div>
      <div className="footer-legal">
        <p>Free to use. No account. No file uploads.</p>
        <p>© {new Date().getFullYear()} Reduce PDF Size. AGPL-3.0.</p>
      </div>
    </footer>
  );
}
