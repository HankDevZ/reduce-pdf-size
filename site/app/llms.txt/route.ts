export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const markdown = `# Reduce PDF Size

> A free, English-language PDF compressor that processes one PDF locally in the browser without uploading the file to a compression server.

Reduce PDF Size supports PDF files up to 100MB and provides High Quality, Balanced, and Smallest Size compression levels. Balanced is the default. Results vary with document content, so the service does not promise an exact target size or lossless output. No account is required.

## Use the tool

- [Reduce PDF Size](${origin}/): Select one PDF, choose a compression level, compress it in the browser, review the before-and-after sizes, and download the result.
- [Privacy](${origin}/privacy): Browser-local processing, network behavior, temporary memory, and tracking information.
- [Terms of Use](${origin}/terms): Compatibility limits, output-review guidance, and warranty terms.

## Product reference

- [Full LLM reference](${origin}/llms-full.txt): Consolidated capabilities, workflow, limits, privacy facts, and FAQs.
- [About](${origin}/about): Maintainer identity, review process, stated limits, and correction channel.
- [Source Code](${origin}/source): Open-source and Ghostscript WebAssembly information.
- [GitHub repository](https://github.com/HankDevZ/reduce-pdf-size): Application source, build files, licenses, and third-party notices.

## Support

- [Contact and Feedback](${origin}/contact): Bug reports, privacy questions, accessibility feedback, corrections, and focused feature requests.
`;

  return new Response(markdown, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
