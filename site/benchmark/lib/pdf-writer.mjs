/**
 * Minimal deterministic PDF writer used to build the benchmark corpus.
 *
 * This is intentionally hand-rolled rather than pulled from a library: the
 * corpus has to be byte-reproducible from source so that anyone can rebuild
 * the exact inputs behind the published numbers.
 */
import { Buffer } from "node:buffer";
import { deflateSync } from "node:zlib";

const latin1 = (value) =>
  Buffer.isBuffer(value) ? value : Buffer.from(String(value), "latin1");

/**
 * Flate-compress a stream payload at a fixed level so output stays reproducible.
 *
 * Real PDFs from word processors and browsers arrive with their content streams
 * already compressed. A corpus entry that omits this measures Ghostscript
 * compressing something no real exporter would have left raw.
 */
export function deflate(data) {
  return deflateSync(latin1(data), { level: 9 });
}

export class PdfBuilder {
  #objects = [];

  /** Reserve an object number so objects can reference each other freely. */
  reserve() {
    this.#objects.push(null);
    return this.#objects.length;
  }

  set(ref, body) {
    this.#objects[ref - 1] = latin1(body);
    return ref;
  }

  add(body) {
    return this.set(this.reserve(), body);
  }

  /** Add a stream object. `dict` is the dictionary body without `<<`/`>>`. */
  addStream(dict, data, ref = this.reserve()) {
    const payload = latin1(data);
    return this.set(
      ref,
      Buffer.concat([
        latin1(`<< ${dict} /Length ${payload.length} >>\nstream\n`),
        payload,
        latin1("\nendstream"),
      ]),
    );
  }

  build(rootRef) {
    const chunks = [latin1("%PDF-1.7\n%\xe2\xe3\xcf\xd3\n")];
    let length = chunks[0].length;
    const offsets = [];

    this.#objects.forEach((body, index) => {
      if (body === null) {
        throw new Error(`PDF object ${index + 1} was reserved but never set`);
      }
      offsets.push(length);
      const chunk = Buffer.concat([
        latin1(`${index + 1} 0 obj\n`),
        body,
        latin1("\nendobj\n"),
      ]);
      chunks.push(chunk);
      length += chunk.length;
    });

    const startxref = length;
    let xref = `xref\n0 ${this.#objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets) {
      xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
    }
    xref += `trailer\n<< /Size ${this.#objects.length + 1} /Root ${rootRef} 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;
    chunks.push(latin1(xref));

    return Buffer.concat(chunks);
  }
}

/**
 * Assemble a document from page descriptors and return the finished bytes.
 *
 * Each page is `{ width, height, content, resources }` where `resources` is a
 * resource-dictionary body (already rendered as a string).
 */
export function buildDocument(builder, pages, { extraCatalog = "" } = {}) {
  const catalogRef = builder.reserve();
  const pagesRef = builder.reserve();
  const pageRefs = pages.map(() => builder.reserve());

  pages.forEach((page, index) => {
    const contentRef = page.compressContent
      ? builder.addStream("/Filter /FlateDecode", deflate(page.content))
      : builder.addStream("", page.content);
    builder.set(
      pageRefs[index],
      `<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${page.width} ${page.height}] ` +
        `/Resources << ${page.resources ?? ""} >> /Contents ${contentRef} 0 R${page.extra ?? ""} >>`,
    );
  });

  builder.set(
    pagesRef,
    `<< /Type /Pages /Kids [${pageRefs.map((r) => `${r} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  );
  builder.set(
    catalogRef,
    `<< /Type /Catalog /Pages ${pagesRef} 0 R${extraCatalog} >>`,
  );

  return builder.build(catalogRef);
}

/** Escape a string for use inside a PDF literal string. */
export function pdfString(text) {
  return text.replace(/([\\()])/g, "\\$1");
}

/** Lay out lines of text as a content-stream fragment. */
export function textBlock({
  lines,
  x,
  y,
  size = 11,
  leading = 15,
  font = "F1",
}) {
  const body = lines
    .map((line, index) =>
      index === 0
        ? `(${pdfString(line)}) Tj`
        : `T* (${pdfString(line)}) Tj`,
    )
    .join("\n");
  return `BT /${font} ${size} Tf ${leading} TL ${x} ${y} Td\n${body}\nET\n`;
}

/**
 * Replace Ghostscript's wall-clock metadata with fixed values.
 *
 * pdfwrite stamps `/CreationDate`, `/ModDate` and a time-derived `/ID` into
 * every file it writes, so a corpus entry derived from a Ghostscript run is
 * otherwise different on each rebuild. Each substitution preserves byte length,
 * which keeps the existing xref offsets valid; a length mismatch throws rather
 * than silently producing a corrupt file.
 *
 * Only the derived corpus entry is normalised. Benchmark outputs are never
 * touched — their measured sizes are unaffected because these fields are
 * fixed-width.
 */
export function normalizeGhostscriptMetadata(bytes) {
  let out = Buffer.from(bytes);

  const replaceSameLength = (pattern, make) => {
    out = Buffer.from(
      out.toString("latin1").replace(pattern, (match, inner) => {
        const replacement = make(inner.length);
        if (replacement.length !== inner.length) {
          throw new Error(
            `normalizeGhostscriptMetadata: replacement length ${replacement.length} != ${inner.length}`,
          );
        }
        return match.replace(inner, replacement);
      }),
      "latin1",
    );
  };

  // Info dictionary: D:YYYYMMDDHHMMSS+HH'MM' — same width as any real stamp.
  replaceSameLength(/\/CreationDate\s*\(([^)]*)\)/g, () =>
    "D:20260101000000+00'00'",
  );
  replaceSameLength(/\/ModDate\s*\(([^)]*)\)/g, () => "D:20260101000000+00'00'");
  replaceSameLength(/\/ID\s*\[\s*([^\]]*?)\s*\]/g, (length) => {
    const hex = "0".repeat(32);
    const canonical = `<${hex}><${hex}>`;
    return canonical.length === length ? canonical : "0".repeat(length);
  });

  // pdfwrite also emits an uncompressed XMP packet carrying its own ISO-8601
  // timestamps and a per-run document UUID. Missing these was why the first
  // version of this function still produced drifting bytes.
  for (const tag of ["ModifyDate", "CreateDate", "MetadataDate"]) {
    replaceSameLength(
      new RegExp(`<xmp:${tag}>([^<]*)</xmp:${tag}>`, "g"),
      () => "2026-01-01T00:00:00+00:00",
    );
  }
  for (const attr of ["DocumentID", "InstanceID"]) {
    replaceSameLength(
      new RegExp(`xapMM:${attr}='([^']*)'`, "g"),
      (length) => {
        const canonical = "uuid:00000000-0000-0000-0000-000000000000";
        return canonical.length === length ? canonical : "0".repeat(length);
      },
    );
  }

  return out;
}

/** Deterministic PRNG so every rebuild produces identical bytes. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
