import {
  formatBytes,
  inputBytes,
  rowFor,
  SCAN_FILE,
  TEXT_COMPRESSED_FILE,
  TEXT_RAW_FILE,
} from "../benchmark";
import { faqAnswerText, faqItems } from "../content";
import { PRIMARY_SOURCES } from "../seo";

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const faq = faqItems
    .map(
      (item) =>
        `### ${item.question}\n\n${faqAnswerText(item)}`,
    )
    .join("\n\n");
  const sources = PRIMARY_SOURCES.map(
    (source) => `- ${source.title}: ${source.url}\n  ${source.note}`,
  ).join("\n");

  const markdown = `# Reduce PDF Size: Full Product Reference

> Authoritative product facts for the Reduce PDF Size browser application.

## What it is

Reduce PDF Size is a free, English-language web application for reducing PDF file size. It processes one PDF at a time, supports files up to 100MB, requires no account, and runs the compression engine locally in the user's browser.

The project is built and maintained by HankDevZ. It was published and last reviewed on August 1, 2026. The public source and commit history are available at https://github.com/HankDevZ/reduce-pdf-size. Corrections can be sent through the contact page.

## How it works

1. Select or drag one PDF into the compressor.
2. Choose High Quality, Balanced, or Smallest Size. Balanced is the default.
3. Start compression and wait for the browser worker to finish.
4. Review the original size, new size, and percentage saved.
5. Download and inspect the resulting PDF before sharing or submitting it.

## Compression levels

- High Quality prioritizes image clarity and usually produces a more modest size reduction.
- Balanced is intended for ordinary sharing, email, and online uploads.
- Smallest Size prioritizes a smaller output and may reduce fine image detail.

Smallest Size is not guaranteed to produce the smallest file. On a 300 dpi grayscale scan the engine stores the heavily downsampled image with a lossless filter rather than JPEG, so Smallest Size yields ${formatBytes(rowFor(SCAN_FILE, "screen")!.outputBytes)} against ${formatBytes(rowFor(SCAN_FILE, "ebook")!.outputBytes)} at Balanced. Compare both levels when a file must be as small as possible. Measured results for eight reproducible test documents are published at ${origin}/compression-levels.

## Important limits

- Exact output sizes such as 1MB or 300KB are not guaranteed.
- Compression is not guaranteed to be lossless.
- Encrypted, password-protected, and detected digitally signed PDFs are rejected.
- Complex forms, attachments, scripts, layers, annotations, or damaged PDFs may not be preserved exactly or may fail to process.
- Users should keep the original and inspect important pages, text, images, forms, links, stamps, and signatures in the output.

A refusal is a normal outcome, not an error. Compression removes redundant image data, so a document without any has nothing to give. Measured: the same twelve text pages produce an identical ${formatBytes(rowFor(TEXT_RAW_FILE, "ebook")!.outputBytes)} output whether their content streams arrive raw or compressed, so the realistic ${formatBytes(inputBytes(TEXT_COMPRESSED_FILE))} version more than doubles in size and is refused at every level. Small files, images already at or below a level's target resolution, and documents that have already been compressed are refused for the same reason. Details at ${origin}/why-pdf-wont-compress.

## Privacy and network behavior

PDF bytes are read in browser memory and passed to a browser Web Worker. They are not uploaded to a compression server. The application loads its own page, scripts, worker, and Ghostscript WebAssembly assets from the same website. This version has no account system, advertising, cloud compression fallback, or file-upload service. Firebase Analytics loads after the initial page load for standard website usage measurement. The application does not send selected PDF names, PDF bytes, compression settings, or compressed results to Analytics.

## Sources and verification

${sources}

## Frequently asked questions

${faq}

## Canonical pages

- Tool: ${origin}/
- Compression levels compared (measured): ${origin}/compression-levels
- Why a PDF will not compress (measured): ${origin}/why-pdf-wont-compress
- About and maintainer information: ${origin}/about
- Privacy: ${origin}/privacy
- Terms: ${origin}/terms
- Source: ${origin}/source
- Contact: ${origin}/contact
- Concise LLM index: ${origin}/llms.txt
- GitHub source: https://github.com/HankDevZ/reduce-pdf-size
`;

  return new Response(markdown, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
