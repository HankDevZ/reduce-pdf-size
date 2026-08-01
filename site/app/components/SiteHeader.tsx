import Link from "next/link";

export function SiteHeader() {
  return (
    <header>
      <nav className="global-nav" aria-label="Main navigation">
        <div className="nav-inner">
          <Link className="nav-wordmark" href="/">
            Reduce PDF Size
          </Link>
          <div className="global-links">
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#faq">FAQ</Link>
            <Link className="nav-trust-link" href="/about">
              About
            </Link>
            <Link href="/privacy">Privacy</Link>
            <Link className="nav-trust-link" href="/contact">
              Contact
            </Link>
          </div>
        </div>
      </nav>
      <div className="sub-nav">
        <div className="nav-inner">
          <Link className="sub-brand" href="/">
            PDF Compressor
          </Link>
          <Link className="nav-cta" href="/#tool">
            Reduce a PDF
          </Link>
        </div>
      </div>
    </header>
  );
}
