# PDF compression benchmark

A reproducible measurement of what the three compression levels on
[reducepdfsize.net](https://reducepdfsize.net) actually do.

Every published number on the site should be traceable to a command anyone can
re-run. This directory is that command.

## Running it

```bash
node benchmark/verify-args.mjs     # assert the harness matches production
node benchmark/build-corpus.mjs    # generate the eight input files
node benchmark/run-benchmark.mjs   # measure, write results/
```

Outputs land in `results/results.json` (full detail) and `results/results.md`
(publication-ready tables).

## Why the numbers are trustworthy

**Same engine.** The harness loads `@jspawn/ghostscript-wasm` from
`node_modules`, which is byte-identical to the copy the site serves from
`public/ghostscript/`:

```bash
shasum -a 256 public/ghostscript/gs.wasm node_modules/@jspawn/ghostscript-wasm/gs.wasm
```

**Same flags.** `lib/ghostscript.mjs` holds the single definition of the
Ghostscript argument list. `verify-args.mjs` parses `public/pdf-worker.js` and
fails if the two ever diverge, so a change to the shipped tool cannot silently
invalidate published data.

**Same success rule.** `PdfCompressor.tsx` treats an output that is not smaller
than the input as a failure and offers no download. The harness applies the same
rule and reports those rows as `not smaller` rather than as a negative
percentage.

**Reproducible inputs.** The corpus is generated from fixed seeds, so a rebuild
produces byte-identical files on any machine. `manifest.json` records the
SHA-256 of each input and is tracked in git; the PDFs themselves are not, since
they are derivable. To check reproducibility:

```bash
cp benchmark/corpus/manifest.json /tmp/expected.json
EXPECT_MANIFEST=/tmp/expected.json node benchmark/build-corpus.mjs
```

The derived entry (`07`) needs one extra step: Ghostscript stamps wall-clock
timestamps into both the Info dictionary and an XMP packet, plus a per-run
document UUID. `normalizeGhostscriptMetadata()` pins those to fixed values using
length-preserving substitutions, which keeps the xref offsets valid. Without it
that one file changes on every rebuild.

## The corpus

| File | What it isolates |
| --- | --- |
| `01-scan-300dpi.pdf` | Full-page 300 dpi grayscale scans — the highest-yield real case |
| `02-report-mixed.pdf` | Body text with photographs placed well below their native resolution |
| `03-text-only.pdf` | No raster content, content streams left raw |
| `04-slides-export.pdf` | Full-bleed presentation backgrounds |
| `05-form-fields.pdf` | An interactive AcroForm, watched for feature loss rather than size |
| `06-transparency.pdf` | Alpha blending and transparency groups |
| `07-already-optimised.pdf` | Case 02 pre-processed at `/screen` |
| `08-duplicate-images.pdf` | One image stored as ten objects, targeting `-dDetectDuplicateImages` |
| `09-text-precompressed.pdf` | Case `03` with compressed streams — the realistic text document |

## Known limitations

State these wherever the data is published. They bound what the numbers mean.

- **The text document appears twice on purpose.** Case `03` leaves its content
  streams uncompressed; case `09` compresses them, which is what every real
  exporter does. Case `03` alone would badly overstate what text documents
  gain, because most of its reduction is Ghostscript compressing streams nobody
  had compressed yet. Always read the pair together.
- **Fonts are not embedded.** Every text case uses the base-14 Helvetica, so
  `-dSubsetFonts=true` has nothing to subset. Real documents embed fonts, and
  font subsetting contributes savings this corpus cannot show.
- **Images are synthetic.** Procedural gradients with grain, not photographs.
  JPEG responds differently to real photographic content, so absolute
  compression ratios for image cases are indicative rather than predictive.
- **The scan is simulated.** Generated text-like rows on textured paper, not a
  real scanner's output, which carries sensor noise and compression history.
- **Timings are machine-dependent.** `elapsedMs` in `results.json` runs under
  Node on one machine; the site runs in a browser worker on the visitor's
  device. Treat timings as relative, never as a performance claim.
- **One document per case.** These isolate mechanisms; they are not a
  statistical sample of real-world PDFs.

## Findings worth writing up

The dataset contains several results that are not obvious from the preset names.

**"Smallest Size" is not always smallest.** On `01-scan-300dpi.pdf`, `/screen`
downsamples to a quarter of the pixels `/ebook` produces, yet yields a *larger*
file:

| Level | Largest image | Filter | Stream |
| --- | ---: | --- | ---: |
| `/printer` | 2480×3508 | `DCTDecode` | 670.1 KB |
| `/ebook` | 1240×1754 | `DCTDecode` | 273.6 KB |
| `/screen` | 595×842 | `FlateDecode` | 361.0 KB |

Ghostscript switched the encoder from JPEG to lossless Flate, which stores
continuous-tone grayscale far less efficiently. Fewer pixels, bigger file.

**A real text document has nothing to give.** Cases `03` and `09` hold the same
twelve pages of text and produce the *same* 16.7 KB output. The only difference
is the input: 39.4 KB with raw streams, 8.13 KB with compressed ones. So the
raw copy appears to shrink by 57.5% while the realistic copy more than doubles
and is refused at every level. Reported reductions say as much about how
wasteful the input was as about the compressor.

**Compression can make a file larger.** `05-form-fields.pdf` grows at every
level — a 3.43 KB form becomes 6.87–9.54 KB, because the metadata and structure
Ghostscript writes exceed the entire original. All three levels are rejected by
the production "not smaller" rule.

**Interactive form fields do not survive.** `05-form-fields.pdf` goes in with an
`/AcroForm` and comes out without one. This is the concrete evidence behind the
warning already on `/terms`.

**Duplicate image detection is measurable.** `08-duplicate-images.pdf` goes from
ten image objects to one, an 89.6% reduction at `/ebook` with no downsampling
involved.

**Nothing to gain means nothing gained.** On `02` and `04`, `/printer` and
`/ebook` leave images at their original dimensions — the placed resolution is
already at or below the preset's threshold — so the output is marginally larger
and the tool declines it. Only `/screen` downsamples enough to help.
