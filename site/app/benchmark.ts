/**
 * View model for the published compression benchmark.
 *
 * Everything the article states numerically is derived here from
 * `benchmark/results/results.json`, which `benchmark/run-benchmark.mjs` writes.
 * No measured figure is typed by hand, so re-running the benchmark updates the
 * page rather than leaving prose that quietly disagrees with the data.
 */
import benchmark from "../benchmark/results/results.json";

export type CompressionLevel = "printer" | "ebook" | "screen";

export const BENCHMARK_ENGINE = benchmark.engine;
export const BENCHMARK_CORPUS = benchmark.corpus;

export const LEVELS: {
  value: CompressionLevel;
  label: string;
  preset: string;
}[] = [
  { value: "printer", label: "High Quality", preset: "/printer" },
  { value: "ebook", label: "Balanced", preset: "/ebook" },
  { value: "screen", label: "Smallest Size", preset: "/screen" },
];

type Row = (typeof benchmark.results)[number];

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const value = bytes / 1024;
  if (value < 1024) {
    return `${value < 10 ? value.toFixed(2) : value.toFixed(1)} KB`;
  }
  const megabytes = value / 1024;
  return `${megabytes < 10 ? megabytes.toFixed(2) : megabytes.toFixed(1)} MB`;
}

export function rowFor(file: string, level: CompressionLevel): Row | undefined {
  return benchmark.results.find(
    (row) => row.file === file && row.level === level,
  );
}

export function rowsFor(file: string) {
  return LEVELS.map((level) => rowFor(file, level.value)).filter(
    (row): row is Row => Boolean(row),
  );
}

/** Input size for a corpus entry, taken from the measured rows. */
export function inputBytes(file: string) {
  return rowsFor(file)[0]?.inputBytes ?? 0;
}

/**
 * Documents where the hardest-downsampling level produced a larger file than
 * Balanced. Counted rather than asserted, because it is the article's headline.
 */
export const SMALLEST_NOT_SMALLEST = BENCHMARK_CORPUS.filter((entry) => {
  const balanced = rowFor(entry.file, "ebook");
  const smallest = rowFor(entry.file, "screen");
  return (
    balanced &&
    smallest &&
    !balanced.rejected &&
    smallest.outputBytes > balanced.outputBytes
  );
});

/** Documents where every level was refused by the "not smaller" rule. */
export const REJECTED_EVERYWHERE = BENCHMARK_CORPUS.filter((entry) =>
  rowsFor(entry.file).every((row) => row.rejected),
);

/** Documents that lost their interactive form definition. */
export const LOST_ACROFORM = BENCHMARK_CORPUS.filter((entry) => {
  const row = rowFor(entry.file, "ebook");
  return row?.source.hasAcroForm && !row.result.hasAcroForm;
});

/** Documents where duplicate image objects were merged. */
export const DEDUPLICATED = BENCHMARK_CORPUS.filter((entry) => {
  const row = rowFor(entry.file, "ebook");
  return (
    row && row.result.imageObjects > 0 &&
    row.result.imageObjects < row.source.imageObjects
  );
});

/** Corpus entries referenced by name from the articles. */
export const SCAN_FILE = "01-scan-300dpi.pdf";
export const REPORT_FILE = "02-report-mixed.pdf";
export const TEXT_RAW_FILE = "03-text-only.pdf";
export const SLIDES_FILE = "04-slides-export.pdf";
export const FORM_FILE = "05-form-fields.pdf";
export const OPTIMISED_FILE = "07-already-optimised.pdf";
export const TEXT_COMPRESSED_FILE = "09-text-precompressed.pdf";

/**
 * Levels that left a document's largest image at its original dimensions.
 *
 * This is the mechanism behind most refused results: when the images already
 * sit at or below the level's target resolution there is nothing to downsample,
 * so the rewrite only adds overhead.
 */
export function levelsKeepingImageSize(file: string) {
  return LEVELS.filter((level) => {
    const row = rowFor(file, level.value);
    const source = row?.source.largestImage;
    const result = row?.result.largestImage;
    return Boolean(
      source && result && source.width === result.width &&
        source.height === result.height,
    );
  });
}

export function corpusEntry(file: string) {
  return BENCHMARK_CORPUS.find((entry) => entry.file === file);
}

/** Best achievable reduction for a document, ignoring refused results. */
export function bestReduction(file: string) {
  const usable = rowsFor(file).filter((row) => !row.rejected);
  if (!usable.length) return null;
  return usable.reduce((best, row) =>
    row.outputBytes < best.outputBytes ? row : best,
  );
}
