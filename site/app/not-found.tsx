import Link from "next/link";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="not-found">
        <div>
          <p className="error-code">404</p>
          <h1>This page isn&apos;t here.</h1>
          <p>
            The address may be incorrect, or the page may have moved. Your PDF
            compressor is still ready.
          </p>
          <Link className="primary-button" href="/">
            Go to the PDF tool
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
