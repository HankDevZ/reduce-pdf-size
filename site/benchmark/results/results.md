# PDF compression benchmark

Engine: `GPL Ghostscript 9.56.0`, invoked with the same flags as `public/pdf-worker.js`.

Rebuild the inputs with `node benchmark/build-corpus.mjs` and re-run with
`node benchmark/run-benchmark.mjs`. Byte counts are reproducible; timings are not.

## Corpus

| File | Description | Size | SHA-256 |
| --- | --- | ---: | --- |
| `01-scan-300dpi.pdf` | Each page is one full-bleed scanned image. The highest-yield real-world case. | 5.98 MB | `0a10b5c37154688f…` |
| `02-report-mixed.pdf` | Body text plus two ~200 dpi colour photographs per page. | 1.25 MB | `8cf4bf63657057b5…` |
| `03-text-only.pdf` | 12 text pages whose content streams are left uncompressed, as a baseline against case 09. | 39.4 KB | `a8cb7b8b03555216…` |
| `04-slides-export.pdf` | Full-bleed 1920x1080 backgrounds behind large display text. | 3.60 MB | `e1e3991c36f1fd68…` |
| `05-form-fields.pdf` | Eight fillable text fields. Watched for feature loss, not size. | 3.43 KB | `e01df2de48b6b20c…` |
| `06-transparency.pdf` | 720 alpha-blended vector shapes across Multiply, Screen and Normal. | 47.6 KB | `5ca8a8889f84e07f…` |
| `07-already-optimised.pdf` | Case 02 pre-processed at /screen, so little headroom remains. | 78.3 KB | `080572ea092ede13…` |
| `08-duplicate-images.pdf` | One image stored as ten separate objects, targeting -dDetectDuplicateImages. | 2.62 MB | `2f7ed104face35a7…` |
| `09-text-precompressed.pdf` | Case 03 with Flate-compressed content streams, matching what real exporters produce. | 8.13 KB | `8074650d36323f84…` |

## Results

| File | Original | High Quality | Balanced | Smallest Size |
| --- | ---: | ---: | ---: | ---: |
| `01-scan-300dpi.pdf` | 5.98 MB | 1.92 MB (−67.9%) | 809.1 KB (−86.8%) | 1.05 MB (−82.5%) |
| `02-report-mixed.pdf` | 1.25 MB | not smaller | not smaller | 78.3 KB (−93.9%) |
| `03-text-only.pdf` | 39.4 KB | 20.1 KB (−48.8%) | 16.7 KB (−57.5%) | 16.8 KB (−57.2%) |
| `04-slides-export.pdf` | 3.60 MB | not smaller | not smaller | 173.4 KB (−95.3%) |
| `05-form-fields.pdf` | 3.43 KB | not smaller | not smaller | not smaller |
| `06-transparency.pdf` | 47.6 KB | 27.3 KB (−42.6%) | 24.3 KB (−48.9%) | 24.4 KB (−48.8%) |
| `07-already-optimised.pdf` | 78.3 KB | not smaller | 78.3 KB (−0.0%) | not smaller |
| `08-duplicate-images.pdf` | 2.62 MB | 283.6 KB (−89.4%) | 277.6 KB (−89.6%) | 15.9 KB (−99.4%) |
| `09-text-precompressed.pdf` | 8.13 KB | not smaller | not smaller | not smaller |

`not smaller` means Ghostscript produced an output at least as large as the
input. The live tool reports these as a failure and offers no download.

## Structure preserved

| File | Pages in → out | AcroForm in → out | Transparency group in → out | Image objects in → out |
| --- | --- | --- | --- | --- |
| `01-scan-300dpi.pdf` | 3 → 3 | no → no | no → no | 3 → 3 |
| `02-report-mixed.pdf` | 6 → 6 | no → no | no → no | 12 → 12 |
| `03-text-only.pdf` | 12 → 12 | no → no | no → no | 0 → 0 |
| `04-slides-export.pdf` | 8 → 8 | no → no | no → no | 8 → 8 |
| `05-form-fields.pdf` | 2 → 2 | yes → no | no → no | 0 → 0 |
| `06-transparency.pdf` | 4 → 4 | no → no | yes → yes | 0 → 0 |
| `07-already-optimised.pdf` | 6 → 6 | no → no | no → no | 12 → 12 |
| `08-duplicate-images.pdf` | 10 → 10 | no → no | no → no | 10 → 1 |
| `09-text-precompressed.pdf` | 12 → 12 | no → no | no → no | 0 → 0 |

Measured at the Balanced (`/ebook`) level.

## Image encoding per level

Dimensions and filter of the largest image object in each output. The
level that downsamples hardest is not always the one that produces the
smallest file.

| File | Level | Largest image | Filter | Stream |
| --- | --- | ---: | --- | ---: |
| `01-scan-300dpi.pdf` | printer | 2480×3508 | `/DCTDecode` | 670.1 KB |
| `01-scan-300dpi.pdf` | ebook | 1240×1754 | `/DCTDecode` | 273.6 KB |
| `01-scan-300dpi.pdf` | screen | 595×842 | `/FlateDecode` | 361.0 KB |
| `02-report-mixed.pdf` | printer | 1100×760 | `/DCTDecode` | 143.5 KB |
| `02-report-mixed.pdf` | ebook | 1100×760 | `/DCTDecode` | 143.5 KB |
| `02-report-mixed.pdf` | screen | 400×276 | `/DCTDecode` | 8.57 KB |
| `04-slides-export.pdf` | printer | 1920×1080 | `/DCTDecode` | 460.6 KB |
| `04-slides-export.pdf` | ebook | 1920×1080 | `/DCTDecode` | 460.6 KB |
| `04-slides-export.pdf` | screen | 960×540 | `/DCTDecode` | 21.0 KB |
| `07-already-optimised.pdf` | printer | 400×276 | `/DCTDecode` | 8.57 KB |
| `07-already-optimised.pdf` | ebook | 400×276 | `/DCTDecode` | 8.57 KB |
| `07-already-optimised.pdf` | screen | 400×276 | `/DCTDecode` | 8.57 KB |
| `08-duplicate-images.pdf` | printer | 1400×980 | `/DCTDecode` | 267.2 KB |
| `08-duplicate-images.pdf` | ebook | 1400×980 | `/DCTDecode` | 267.2 KB |
| `08-duplicate-images.pdf` | screen | 466×326 | `/DCTDecode` | 5.45 KB |
