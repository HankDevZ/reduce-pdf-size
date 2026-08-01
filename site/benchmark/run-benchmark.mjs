/**
 * Run every corpus file through every compression level and record the result.
 *
 * The Ghostscript flags come from `lib/ghostscript.mjs`, which `verify-args.mjs`
 * pins to `public/pdf-worker.js`. The "not smaller" rule below mirrors
 * `app/components/PdfCompressor.tsx`, so a row marked `rejected` is a case where
 * the live tool refuses to offer a download.
 *
 * Usage: node benchmark/run-benchmark.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  runGhostscript,
  ghostscriptVersion,
  COMPRESSION_LEVELS,
} from "./lib/ghostscript.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const CORPUS_DIR = path.join(here, "corpus");
const RESULTS_DIR = path.join(here, "results");

/** Structural facts worth reporting beyond raw byte counts. */
function inspect(bytes) {
  const text = bytes.toString("latin1");
  const version = text.slice(0, 9).match(/%PDF-(\d\.\d)/)?.[1] ?? "unknown";

  // Image encoding is recorded because the level that downsamples hardest does
  // not always produce the smallest file: Ghostscript may switch a heavily
  // downsampled photographic image from DCTDecode to FlateDecode, which stores
  // continuous-tone data far less efficiently.
  const images = [...text.matchAll(/\/Subtype\s*\/Image[\s\S]{0,320}?(?=stream)/g)].map(
    (match) => {
      const dict = match[0];
      return {
        width: Number(dict.match(/\/Width\s+(\d+)/)?.[1] ?? 0),
        height: Number(dict.match(/\/Height\s+(\d+)/)?.[1] ?? 0),
        filter: dict.match(/\/Filter\s*(\/\w+|\[[^\]]*\])/)?.[1] ?? "none",
        streamBytes: Number(dict.match(/\/Length\s+(\d+)/)?.[1] ?? 0),
      };
    },
  );

  return {
    pdfVersion: version,
    pages: (text.match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length,
    hasAcroForm: /\/AcroForm/.test(text),
    hasTransparencyGroup: /\/S\s*\/Transparency/.test(text),
    imageObjects: images.length,
    imageFilters: [...new Set(images.map((image) => image.filter))].sort(),
    largestImage: images.length
      ? images.reduce((a, b) => (a.streamBytes >= b.streamBytes ? a : b))
      : null,
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB"];
  let value = bytes / 1024;
  let unit = units[0];
  if (value >= 1024) {
    value /= 1024;
    unit = units[1];
  }
  return `${value < 10 ? value.toFixed(2) : value.toFixed(1)} ${unit}`;
}

async function main() {
  const manifest = JSON.parse(
    await readFile(path.join(CORPUS_DIR, "manifest.json"), "utf8"),
  );
  const version = await ghostscriptVersion();
  console.log(`engine: ${version}\n`);

  const rows = [];
  for (const entry of manifest) {
    const input = await readFile(path.join(CORPUS_DIR, entry.file));
    const source = inspect(input);
    process.stdout.write(`${entry.file}  (${formatBytes(input.length)})\n`);

    for (const level of COMPRESSION_LEVELS) {
      const { output, elapsedMs } = await runGhostscript(input, {
        level: level.value,
      });
      // Mirrors PdfCompressor.tsx: an output that is not smaller is surfaced
      // to the user as a failure, never as a download.
      const rejected = output.length >= input.length;
      const result = inspect(output);
      rows.push({
        file: entry.file,
        title: entry.title,
        level: level.value,
        levelLabel: level.label,
        inputBytes: input.length,
        outputBytes: output.length,
        reductionPercent: Number(
          (((input.length - output.length) / input.length) * 100).toFixed(2),
        ),
        rejected,
        elapsedMs: Number(elapsedMs.toFixed(0)),
        source,
        result,
      });
      console.log(
        `  ${level.value.padEnd(8)} ${formatBytes(output.length).padStart(9)}  ` +
          `${(((input.length - output.length) / input.length) * 100).toFixed(1).padStart(6)}%` +
          `  ${result.pages}p${rejected ? "  REJECTED (not smaller)" : ""}`,
      );
    }
    console.log("");
  }

  await mkdir(RESULTS_DIR, { recursive: true });
  const payload = {
    engine: version,
    generatedFrom: "benchmark/corpus/manifest.json",
    note: "Sizes are reproducible; timings are machine-dependent and indicative only.",
    corpus: manifest,
    results: rows,
  };
  await writeFile(
    path.join(RESULTS_DIR, "results.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
  );
  await writeFile(path.join(RESULTS_DIR, "results.md"), renderMarkdown(payload));
  console.log(`wrote results/results.json and results/results.md`);
}

function renderMarkdown({ engine, corpus, results }) {
  const lines = [
    "# PDF compression benchmark",
    "",
    `Engine: \`${engine}\`, invoked with the same flags as \`public/pdf-worker.js\`.`,
    "",
    "Rebuild the inputs with `node benchmark/build-corpus.mjs` and re-run with",
    "`node benchmark/run-benchmark.mjs`. Byte counts are reproducible; timings are not.",
    "",
    "## Corpus",
    "",
    "| File | Description | Size | SHA-256 |",
    "| --- | --- | ---: | --- |",
  ];

  for (const entry of corpus) {
    lines.push(
      `| \`${entry.file}\` | ${entry.note} | ${formatBytes(entry.bytes)} | \`${entry.sha256.slice(0, 16)}…\` |`,
    );
  }

  lines.push("", "## Results", "");
  lines.push(
    "| File | Original | High Quality | Balanced | Smallest Size |",
    "| --- | ---: | ---: | ---: | ---: |",
  );

  for (const entry of corpus) {
    const forFile = results.filter((row) => row.file === entry.file);
    const cell = (level) => {
      const row = forFile.find((r) => r.level === level);
      if (!row) return "—";
      if (row.rejected) return `not smaller`;
      return `${formatBytes(row.outputBytes)} (−${row.reductionPercent.toFixed(1)}%)`;
    };
    lines.push(
      `| \`${entry.file}\` | ${formatBytes(forFile[0].inputBytes)} | ${cell("printer")} | ${cell("ebook")} | ${cell("screen")} |`,
    );
  }

  lines.push(
    "",
    "`not smaller` means Ghostscript produced an output at least as large as the",
    "input. The live tool reports these as a failure and offers no download.",
    "",
    "## Structure preserved",
    "",
    "| File | Pages in → out | AcroForm in → out | Transparency group in → out | Image objects in → out |",
    "| --- | --- | --- | --- | --- |",
  );

  for (const entry of corpus) {
    const row = results.find(
      (item) => item.file === entry.file && item.level === "ebook",
    );
    if (!row) continue;
    const flag = (value) => (value ? "yes" : "no");
    lines.push(
      `| \`${entry.file}\` | ${row.source.pages} → ${row.result.pages} | ` +
        `${flag(row.source.hasAcroForm)} → ${flag(row.result.hasAcroForm)} | ` +
        `${flag(row.source.hasTransparencyGroup)} → ${flag(row.result.hasTransparencyGroup)} | ` +
        `${row.source.imageObjects} → ${row.result.imageObjects} |`,
    );
  }

  lines.push("", "Measured at the Balanced (`/ebook`) level.", "");

  const withImages = corpus.filter((entry) =>
    results.some((row) => row.file === entry.file && row.result.imageObjects > 0),
  );
  if (withImages.length) {
    lines.push(
      "## Image encoding per level",
      "",
      "Dimensions and filter of the largest image object in each output. The",
      "level that downsamples hardest is not always the one that produces the",
      "smallest file.",
      "",
      "| File | Level | Largest image | Filter | Stream |",
      "| --- | --- | ---: | --- | ---: |",
    );
    for (const entry of withImages) {
      for (const level of COMPRESSION_LEVELS) {
        const row = results.find(
          (item) => item.file === entry.file && item.level === level.value,
        );
        const image = row?.result.largestImage;
        if (!image) continue;
        lines.push(
          `| \`${entry.file}\` | ${level.value} | ${image.width}×${image.height} | ` +
            `\`${image.filter}\` | ${formatBytes(image.streamBytes)} |`,
        );
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

await main();
