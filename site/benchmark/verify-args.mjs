/**
 * Guard: the benchmark must invoke Ghostscript exactly as production does.
 *
 * If `public/pdf-worker.js` changes its flags, published numbers stop
 * describing the shipped tool. This fails loudly instead.
 *
 * Usage: node benchmark/verify-args.mjs
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { productionArgs } from "./lib/ghostscript.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const WORKER = path.resolve(here, "../public/pdf-worker.js");

const source = await readFile(WORKER, "utf8");
const match = source.match(/callMain\(\s*\[([\s\S]*?)\]\s*\)/);
if (!match) {
  console.error(`could not find a callMain([...]) call in ${WORKER}`);
  process.exit(1);
}

const shipped = match[1]
  .split("\n")
  .map((line) => line.trim().replace(/,$/, ""))
  .filter(Boolean)
  .map((token) => {
    const literal = token.replace(/^["'`]|["'`]$/g, "");
    return literal
      .replace("${event.data.level}", "LEVEL")
      .replace("${outputName}", "OUTPUT")
      .replace(/^inputName$/, "INPUT");
  });

const expected = productionArgs({
  level: "LEVEL",
  input: "INPUT",
  output: "OUTPUT",
});

const same =
  shipped.length === expected.length &&
  shipped.every((value, index) => value === expected[index]);

if (!same) {
  console.error("Ghostscript arguments drifted from production.\n");
  console.error("public/pdf-worker.js:", shipped);
  console.error("benchmark/lib/ghostscript.mjs:", expected);
  process.exit(1);
}

console.log(
  `ok — benchmark matches public/pdf-worker.js (${expected.length} arguments)`,
);
