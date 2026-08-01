# Reduce PDF Size website

This directory is the only application, build, test, and deployment root for
the Reduce PDF Size website.

## Local development

Requirements: Node.js 22.13 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by the development server.

## Validation and production build

```sh
npm run lint
npm run test
```

The production build is written to `dist/`.

## Browser PDF engine

The browser worker loads the locally served files under `public/ghostscript/`
only when a user starts compression. The selected PDF is transferred directly
to that worker and is not sent to an application server.

The three UI levels map to Ghostscript `pdfwrite` presets:

- High Quality: `/printer`
- Balanced: `/ebook`
- Smallest Size: `/screen`

## Project structure

- `app/`: page routes, UI, content, and metadata
- `public/`: same-origin worker, WebAssembly runtime, and sharing image
- `tests/`: rendered-output and implementation checks
- `.openai/hosting.json`: Sites hosting configuration
- `worker/`: Cloudflare-compatible request entry point and security headers

This project is licensed under AGPL-3.0. See `LICENSE` and
`THIRD_PARTY_NOTICES.md`.
