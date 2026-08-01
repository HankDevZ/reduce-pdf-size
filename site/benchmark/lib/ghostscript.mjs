/**
 * Ghostscript runner for the benchmark harness.
 *
 * The argument list below is the single source of truth shared with
 * `public/pdf-worker.js`. `verify-args.mjs` asserts the two stay in sync, so a
 * change to the production pipeline cannot silently invalidate published
 * numbers.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const PKG_DIR = path.resolve(here, "../../node_modules/@jspawn/ghostscript-wasm/");

export const COMPRESSION_LEVELS = /** @type {const} */ ([
  { value: "printer", label: "High Quality" },
  { value: "ebook", label: "Balanced" },
  { value: "screen", label: "Smallest Size" },
]);

/** Exactly the flags `public/pdf-worker.js` passes to Ghostscript. */
export function productionArgs({ level, input, output }) {
  return [
    "-q",
    "-dSAFER",
    "-dBATCH",
    "-dNOPAUSE",
    "-dCompatibilityLevel=1.6",
    "-sDEVICE=pdfwrite",
    `-dPDFSETTINGS=/${level}`,
    "-dDetectDuplicateImages=true",
    "-dCompressFonts=true",
    "-dSubsetFonts=true",
    `-sOutputFile=${output}`,
    input,
  ];
}

let cachedFactory = null;
let cachedWasm = null;

async function loadFactory() {
  if (!cachedFactory) {
    cachedFactory = (await import(path.join(PKG_DIR, "gs.mjs"))).default;
    cachedWasm = await readFile(path.join(PKG_DIR, "gs.wasm"));
    // Each Emscripten instance registers its own process-level error handlers.
    // A full benchmark builds two dozen of them, which trips Node's default
    // listener cap and prints a spurious leak warning.
    process.setMaxListeners(0);
  }
  return cachedFactory;
}

/**
 * Run Ghostscript over `input` and return the produced bytes.
 *
 * A fresh module instance is created per call, mirroring production, where
 * every compression spawns a new worker.
 */
export async function runGhostscript(input, { level }) {
  const createGhostscript = await loadFactory();
  const logs = [];
  const gs = await createGhostscript({
    noInitialRun: true,
    instantiateWasm(imports, onSuccess) {
      WebAssembly.instantiate(cachedWasm, imports).then((result) =>
        onSuccess(result.instance, result.module),
      );
      return {};
    },
    print() {},
    printErr(line) {
      logs.push(String(line));
    },
  });

  const inputName = "/input.pdf";
  const outputName = "/output.pdf";
  gs.FS.writeFile(inputName, new Uint8Array(input));

  const started = performance.now();
  let exitCode = 0;
  try {
    exitCode = gs.callMain(
      productionArgs({ level, input: inputName, output: outputName }),
    );
  } catch (error) {
    if (!(error && typeof error === "object" && error.status === 0)) {
      throw new Error(
        `Ghostscript threw for level ${level}: ${error?.message ?? error}\n${logs.join("\n")}`,
      );
    }
  }
  const elapsedMs = performance.now() - started;

  if (exitCode !== 0) {
    throw new Error(
      `Ghostscript exited with status ${exitCode} for level ${level}\n${logs.join("\n")}`,
    );
  }

  const output = Buffer.from(gs.FS.readFile(outputName));
  if (!output.length || output[0] !== 0x25 || output[1] !== 0x50) {
    throw new Error(`Ghostscript produced an empty or invalid PDF for ${level}`);
  }

  return { output, elapsedMs, logs };
}

/**
 * Ghostscript's version, read from the `/Producer` string it stamps into its
 * own output.
 *
 * `gs -v` writes its banner straight to the process stdout rather than through
 * the module's `print` callback, so it cannot be captured here. Reading the
 * Producer string is both capturable and more relevant: it is the value that
 * actually ends up inside every compressed file.
 */
export async function ghostscriptVersion() {
  const probe = Buffer.from(
    "%PDF-1.4\n" +
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>\nendobj\n" +
      "trailer\n<< /Size 4 /Root 1 0 R >>\n%%EOF\n",
    "latin1",
  );
  const { output } = await runGhostscript(probe, { level: "ebook" });
  return (
    output.toString("latin1").match(/\/Producer\s*\(([^)]*)\)/)?.[1]?.trim() ??
    "unknown"
  );
}
