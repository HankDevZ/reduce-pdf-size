/**
 * Build the benchmark corpus.
 *
 * Every file is generated from a fixed seed, so `node benchmark/build-corpus.mjs`
 * reproduces byte-identical inputs on any machine. That is what makes the
 * published compression numbers auditable rather than merely asserted.
 *
 * Usage: node benchmark/build-corpus.mjs
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";
import {
  PdfBuilder,
  buildDocument,
  textBlock,
  mulberry32,
  normalizeGhostscriptMetadata,
} from "./lib/pdf-writer.mjs";
import { runGhostscript } from "./lib/ghostscript.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const CORPUS_DIR = path.join(here, "corpus");

const A4 = { width: 595, height: 842 };
const SLIDE = { width: 960, height: 540 };

const HELVETICA = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
const HELVETICA_BOLD =
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

const LOREM = [
  "Compression rewrites the document rather than editing it in place.",
  "Image downsampling is the dominant factor for scanned pages.",
  "Vector text and line art are already compact in most documents.",
  "Font subsetting removes glyphs the document never references.",
  "Duplicate image detection merges repeated objects into one stream.",
  "The output is always written at PDF compatibility level 1.6.",
  "Results depend on what the source document actually contains.",
  "A file that is already optimised has very little left to remove.",
];

/* ---------------------------------------------------------------- images -- */

/** Simulated grayscale office scan: paper texture plus text-like rows. */
async function scanPageJpeg(seed, { width, height, quality }) {
  const random = mulberry32(seed);
  const pixels = Buffer.alloc(width * height);

  for (let i = 0; i < pixels.length; i += 1) {
    pixels[i] = 232 + Math.floor(random() * 20); // off-white paper with grain
  }

  const marginX = Math.round(width * 0.12);
  const lineWidth = width - marginX * 2;
  let y = Math.round(height * 0.1);
  const lineHeight = Math.round(height * 0.011);
  const lineGap = Math.round(height * 0.02);

  while (y < height * 0.9) {
    // Ragged right edge so lines look like real text rather than solid bars.
    const runLength = Math.round(lineWidth * (0.55 + random() * 0.45));
    for (let dy = 0; dy < lineHeight; dy += 1) {
      const row = (y + dy) * width;
      for (let dx = 0; dx < runLength; dx += 1) {
        // Word gaps.
        if (random() < 0.16) continue;
        const ink = 40 + Math.floor(random() * 70);
        pixels[row + marginX + dx] = ink;
      }
    }
    y += lineHeight + lineGap;
  }

  return sharp(pixels, { raw: { width, height, channels: 1 } })
    .jpeg({ quality, chromaSubsampling: "4:4:4" })
    .toBuffer();
}

/** Colour photograph stand-in: smooth gradients plus film-like grain. */
async function photoJpeg(seed, { width, height, quality }) {
  const random = mulberry32(seed);
  const pixels = Buffer.alloc(width * height * 3);
  const cx = random() * width;
  const cy = random() * height;

  for (let y = 0, i = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = (x - cx) / width;
      const dy = (y - cy) / height;
      const falloff = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
      const grain = (random() - 0.5) * 22;
      pixels[i++] = clamp(60 + falloff * 170 + grain);
      pixels[i++] = clamp(90 + falloff * 120 + grain + (y / height) * 40);
      pixels[i++] = clamp(140 - falloff * 40 + grain + (x / width) * 60);
    }
  }

  return sharp(pixels, { raw: { width, height, channels: 3 } })
    .jpeg({ quality })
    .toBuffer();
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function imageObject(builder, jpeg, { width, height, gray = false }) {
  return builder.addStream(
    `/Type /XObject /Subtype /Image /Width ${width} /Height ${height} ` +
      `/ColorSpace ${gray ? "/DeviceGray" : "/DeviceRGB"} /BitsPerComponent 8 /Filter /DCTDecode`,
    jpeg,
  );
}

/* ----------------------------------------------------------------- cases -- */

/** 1. Multi-page 300 dpi grayscale scan — the classic high-yield case. */
async function scannedPages() {
  const builder = new PdfBuilder();
  const width = 2480;
  const height = 3508; // A4 at 300 dpi
  const pages = [];

  for (let index = 0; index < 3; index += 1) {
    const jpeg = await scanPageJpeg(1000 + index, { width, height, quality: 82 });
    const ref = imageObject(builder, jpeg, { width, height, gray: true });
    pages.push({
      ...A4,
      resources: `/XObject << /Im0 ${ref} 0 R >>`,
      content: `q ${A4.width} 0 0 ${A4.height} 0 0 cm /Im0 Do Q\n`,
    });
  }

  return buildDocument(builder, pages);
}

/** 2. Text with embedded photographs at roughly 200 dpi. */
async function mixedReport() {
  const builder = new PdfBuilder();
  const fontRef = builder.add(HELVETICA);
  const boldRef = builder.add(HELVETICA_BOLD);
  const pages = [];

  for (let index = 0; index < 6; index += 1) {
    const photoA = await photoJpeg(2000 + index * 2, {
      width: 1100,
      height: 760,
      quality: 84,
    });
    const photoB = await photoJpeg(2001 + index * 2, {
      width: 760,
      height: 520,
      quality: 84,
    });
    const refA = imageObject(builder, photoA, { width: 1100, height: 760 });
    const refB = imageObject(builder, photoB, { width: 760, height: 520 });

    const content =
      textBlock({
        lines: [`Section ${index + 1}`],
        x: 56,
        y: A4.height - 70,
        size: 20,
        font: "F2",
      }) +
      `q 400 0 0 276 56 ${A4.height - 380} cm /ImA Do Q\n` +
      textBlock({
        lines: LOREM.slice(0, 6),
        x: 56,
        y: A4.height - 420,
        size: 11,
        leading: 16,
      }) +
      `q 260 0 0 178 56 120 cm /ImB Do Q\n`;

    pages.push({
      ...A4,
      resources:
        `/Font << /F1 ${fontRef} 0 R /F2 ${boldRef} 0 R >> ` +
        `/XObject << /ImA ${refA} 0 R /ImB ${refB} 0 R >>`,
      content,
    });
  }

  return buildDocument(builder, pages);
}

/**
 * 3 and 9. Pure text, no raster content.
 *
 * Built twice: once with raw content streams, once Flate-compressed. Real
 * exporters always compress their streams, so the difference between the two
 * separates "Ghostscript compressed something nobody had compressed yet" from
 * what a genuine text document has left to give.
 */
async function textOnly({ compressContent = false } = {}) {
  const builder = new PdfBuilder();
  const fontRef = builder.add(HELVETICA);
  const boldRef = builder.add(HELVETICA_BOLD);
  const pages = [];

  for (let index = 0; index < 12; index += 1) {
    const lines = [];
    for (let row = 0; row < 42; row += 1) {
      lines.push(LOREM[(index * 42 + row) % LOREM.length]);
    }
    pages.push({
      ...A4,
      compressContent,
      resources: `/Font << /F1 ${fontRef} 0 R /F2 ${boldRef} 0 R >>`,
      content:
        textBlock({
          lines: [`Chapter ${index + 1}`],
          x: 56,
          y: A4.height - 70,
          size: 18,
          font: "F2",
        }) +
        textBlock({
          lines,
          x: 56,
          y: A4.height - 110,
          size: 10,
          leading: 16,
        }),
    });
  }

  return buildDocument(builder, pages);
}

/** 4. Presentation export: full-bleed gradient backgrounds behind large text. */
async function slidesExport() {
  const builder = new PdfBuilder();
  const boldRef = builder.add(HELVETICA_BOLD);
  const pages = [];

  for (let index = 0; index < 8; index += 1) {
    const background = await photoJpeg(3000 + index, {
      width: 1920,
      height: 1080,
      quality: 88,
    });
    const ref = imageObject(builder, background, { width: 1920, height: 1080 });
    pages.push({
      ...SLIDE,
      resources: `/XObject << /Bg ${ref} 0 R >> /Font << /F2 ${boldRef} 0 R >>`,
      content:
        `q ${SLIDE.width} 0 0 ${SLIDE.height} 0 0 cm /Bg Do Q\n` +
        `1 1 1 rg\n` +
        textBlock({
          lines: [`Slide ${index + 1}`, "Quarterly review"],
          x: 64,
          y: 300,
          size: 44,
          leading: 56,
          font: "F2",
        }),
    });
  }

  return buildDocument(builder, pages);
}

/** 5. An interactive AcroForm — the case where "compression" can cost features. */
async function formFields() {
  const builder = new PdfBuilder();
  const fontRef = builder.add(HELVETICA);
  const boldRef = builder.add(HELVETICA_BOLD);

  const catalogRef = builder.reserve();
  const pagesRef = builder.reserve();
  const pageRefs = [builder.reserve(), builder.reserve()];
  const fieldRefs = [];

  pageRefs.forEach((pageRef, pageIndex) => {
    const annots = [];
    for (let row = 0; row < 4; row += 1) {
      const fieldRef = builder.reserve();
      const y = A4.height - 200 - row * 70;
      builder.set(
        fieldRef,
        `<< /Type /Annot /Subtype /Widget /FT /Tx /Ff 0 ` +
          `/T (field_${pageIndex + 1}_${row + 1}) /TU (Applicant detail ${row + 1}) ` +
          `/Rect [200 ${y} 520 ${y + 26}] /P ${pageRef} 0 R ` +
          `/DA (/Helv 11 Tf 0 g) /MK << /BC [0 0 0] /BG [0.95 0.95 0.95] >> >>`,
      );
      fieldRefs.push(fieldRef);
      annots.push(`${fieldRef} 0 R`);
    }

    const labels = [];
    for (let row = 0; row < 4; row += 1) {
      labels.push(`Applicant detail ${row + 1}`);
    }

    const contentRef = builder.addStream(
      "",
      textBlock({
        lines: [`Application form — page ${pageIndex + 1}`],
        x: 56,
        y: A4.height - 90,
        size: 18,
        font: "F2",
      }) +
        labels
          .map((label, row) =>
            textBlock({
              lines: [label],
              x: 56,
              y: A4.height - 193 - row * 70,
              size: 11,
            }),
          )
          .join(""),
    );

    builder.set(
      pageRef,
      `<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${A4.width} ${A4.height}] ` +
        `/Resources << /Font << /F1 ${fontRef} 0 R /F2 ${boldRef} 0 R /Helv ${fontRef} 0 R >> >> ` +
        `/Contents ${contentRef} 0 R /Annots [${annots.join(" ")}] >>`,
    );
  });

  builder.set(
    pagesRef,
    `<< /Type /Pages /Kids [${pageRefs.map((r) => `${r} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`,
  );
  builder.set(
    catalogRef,
    `<< /Type /Catalog /Pages ${pagesRef} 0 R ` +
      `/AcroForm << /Fields [${fieldRefs.map((r) => `${r} 0 R`).join(" ")}] ` +
      `/DA (/Helv 11 Tf 0 g) /DR << /Font << /Helv ${fontRef} 0 R >> >> /NeedAppearances true >> >>`,
  );

  return builder.build(catalogRef);
}

/** 6. Vector art using transparency groups and blend modes. */
async function transparencyArt() {
  const builder = new PdfBuilder();
  const fontRef = builder.add(HELVETICA);
  const gsRefs = [
    builder.add("<< /Type /ExtGState /ca 0.45 /CA 0.45 /BM /Multiply >>"),
    builder.add("<< /Type /ExtGState /ca 0.65 /CA 0.65 /BM /Screen >>"),
    builder.add("<< /Type /ExtGState /ca 0.30 /CA 0.30 /BM /Normal >>"),
  ];
  const pages = [];

  for (let index = 0; index < 4; index += 1) {
    const random = mulberry32(4000 + index);
    let art = "";
    for (let shape = 0; shape < 180; shape += 1) {
      const gsName = `GS${shape % 3}`;
      const x = random() * A4.width;
      const y = random() * (A4.height - 120);
      const size = 30 + random() * 150;
      art +=
        `q /${gsName} gs ${random().toFixed(3)} ${random().toFixed(3)} ${random().toFixed(3)} rg\n` +
        `${x.toFixed(2)} ${y.toFixed(2)} ${size.toFixed(2)} ${size.toFixed(2)} re f Q\n`;
    }

    pages.push({
      ...A4,
      resources:
        `/Font << /F1 ${fontRef} 0 R >> ` +
        `/ExtGState << /GS0 ${gsRefs[0]} 0 R /GS1 ${gsRefs[1]} 0 R /GS2 ${gsRefs[2]} 0 R >>`,
      extra: " /Group << /S /Transparency /CS /DeviceRGB /I true >>",
      content:
        art +
        textBlock({
          lines: [`Transparency plate ${index + 1}`],
          x: 56,
          y: 40,
          size: 12,
        }),
    });
  }

  return buildDocument(builder, pages);
}

/** 8. The same image stored as many separate objects. */
async function duplicateImages() {
  const builder = new PdfBuilder();
  const fontRef = builder.add(HELVETICA);
  const jpeg = await photoJpeg(5000, { width: 1400, height: 980, quality: 86 });
  const pages = [];

  for (let index = 0; index < 10; index += 1) {
    // Deliberately re-added each time: ten identical streams, ten objects.
    const ref = imageObject(builder, jpeg, { width: 1400, height: 980 });
    pages.push({
      ...A4,
      resources: `/XObject << /Im0 ${ref} 0 R >> /Font << /F1 ${fontRef} 0 R >>`,
      content:
        `q 480 0 0 336 56 ${A4.height - 420} cm /Im0 Do Q\n` +
        textBlock({
          lines: [`Repeated figure, occurrence ${index + 1} of 10`],
          x: 56,
          y: A4.height - 460,
          size: 11,
        }),
    });
  }

  return buildDocument(builder, pages);
}

/* ------------------------------------------------------------------ main -- */

const CASES = [
  {
    file: "01-scan-300dpi.pdf",
    title: "300 dpi grayscale scan, 3 pages",
    note: "Each page is one full-bleed scanned image. The highest-yield real-world case.",
    build: scannedPages,
  },
  {
    file: "02-report-mixed.pdf",
    title: "Illustrated report, 6 pages",
    note: "Body text plus two ~200 dpi colour photographs per page.",
    build: mixedReport,
  },
  {
    file: "03-text-only.pdf",
    title: "Text-only document, raw streams",
    note: "12 text pages whose content streams are left uncompressed, as a baseline against case 09.",
    build: () => textOnly({ compressContent: false }),
  },
  {
    file: "04-slides-export.pdf",
    title: "Presentation export, 8 slides",
    note: "Full-bleed 1920x1080 backgrounds behind large display text.",
    build: slidesExport,
  },
  {
    file: "05-form-fields.pdf",
    title: "Interactive AcroForm, 2 pages",
    note: "Eight fillable text fields. Watched for feature loss, not size.",
    build: formFields,
  },
  {
    file: "06-transparency.pdf",
    title: "Transparency and blend modes, 4 pages",
    note: "720 alpha-blended vector shapes across Multiply, Screen and Normal.",
    build: transparencyArt,
  },
  {
    file: "07-already-optimised.pdf",
    title: "Already-optimised document, 6 pages",
    note: "Case 02 pre-processed at /screen, so little headroom remains.",
    build: async () => {
      const source = await mixedReport();
      const { output } = await runGhostscript(source, { level: "screen" });
      // pdfwrite stamps wall-clock dates and a time-derived /ID; pin them so
      // this derived entry rebuilds byte-identically like the others.
      return normalizeGhostscriptMetadata(output);
    },
  },
  {
    file: "08-duplicate-images.pdf",
    title: "Repeated figure, 10 pages",
    note: "One image stored as ten separate objects, targeting -dDetectDuplicateImages.",
    build: duplicateImages,
  },
  {
    file: "09-text-precompressed.pdf",
    title: "Text-only document, compressed streams",
    note: "Case 03 with Flate-compressed content streams, matching what real exporters produce.",
    build: () => textOnly({ compressContent: true }),
  },
];

async function main() {
  await mkdir(CORPUS_DIR, { recursive: true });
  const manifest = [];

  for (const item of CASES) {
    process.stdout.write(`building ${item.file} … `);
    const bytes = await item.build();
    const target = path.join(CORPUS_DIR, item.file);
    await writeFile(target, bytes);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    manifest.push({
      file: item.file,
      title: item.title,
      note: item.note,
      bytes: bytes.length,
      sha256,
    });
    console.log(`${(bytes.length / 1024).toFixed(1)} KB  ${sha256.slice(0, 12)}`);
  }

  const manifestPath = path.join(CORPUS_DIR, "manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nwrote ${manifest.length} files + manifest.json`);

  // Determinism guard: a rebuild that changes bytes invalidates published data.
  const previous = process.env.EXPECT_MANIFEST;
  if (previous) {
    const expected = JSON.parse(await readFile(previous, "utf8"));
    const drift = manifest.filter(
      (entry, index) => entry.sha256 !== expected[index]?.sha256,
    );
    if (drift.length) {
      console.error("corpus is not reproducible:", drift.map((d) => d.file));
      process.exitCode = 1;
    }
  }
}

await main();
