"use client";

import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type CompressionLevel = "printer" | "ebook" | "screen";
type Phase =
  | "idle"
  | "ready"
  | "preparing"
  | "compressing"
  | "finalizing"
  | "success"
  | "error"
  | "cancelled";

type Result = {
  url: string;
  outputSize: number;
  savedSize: number;
  reduction: number;
  downloadName: string;
};

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const LEVELS: {
  value: CompressionLevel;
  name: string;
  description: string;
}[] = [
  {
    value: "printer",
    name: "High Quality",
    description: "Sharper images, lighter compression",
  },
  {
    value: "ebook",
    name: "Balanced",
    description: "A practical choice for most files",
  },
  {
    value: "screen",
    name: "Smallest Size",
    description: "Smaller output, softer images",
  },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${value < 10 ? value.toFixed(2) : value.toFixed(1)} ${unit}`;
}

async function validatePdf(file: File) {
  if (!file.size) {
    throw new Error("This file is empty. Choose a PDF that contains content.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("This PDF is over 100MB. Choose a smaller file.");
  }

  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const signature = new TextDecoder("latin1").decode(header);
  if (!signature.startsWith("%PDF-")) {
    throw new Error(
      "This does not appear to be a valid PDF. Choose a file that begins with a PDF header.",
    );
  }

  const sampleSize = Math.min(file.size, 2 * 1024 * 1024);
  const [start, end] = await Promise.all([
    file.slice(0, sampleSize).arrayBuffer(),
    file.slice(Math.max(0, file.size - sampleSize), file.size).arrayBuffer(),
  ]);
  const decoder = new TextDecoder("latin1");
  const sample = `${decoder.decode(start)}${decoder.decode(end)}`;

  if (/\/Encrypt\b/.test(sample)) {
    throw new Error(
      "Password-protected or encrypted PDFs are not supported. Remove the protection before compressing.",
    );
  }
  if (/\/Type\s*\/Sig\b|\/ByteRange\s*\[/.test(sample)) {
    throw new Error(
      "This PDF appears to contain a digital signature. Compression could invalidate it, so the file was not changed.",
    );
  }
}

function reducedName(name: string) {
  const base = name.replace(/\.pdf$/i, "") || "document";
  return `${base}-reduced.pdf`;
}

export function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>("ebook");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState(
    "Choose a PDF to see its details and compression options.",
  );
  const [result, setResult] = useState<Result | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const releaseResult = useCallback(() => {
    setResult((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  }, []);

  const stopWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  useEffect(
    () => () => {
      stopWorker();
      if (result) URL.revokeObjectURL(result.url);
    },
    [result, stopWorker],
  );

  const selectFile = useCallback(
    async (candidate?: File) => {
      stopWorker();
      releaseResult();
      setFile(null);
      setLevel("ebook");
      if (!candidate) return;

      try {
        await validatePdf(candidate);
        setFile(candidate);
        setPhase("ready");
        setMessage("PDF ready. Choose a compression level, then continue.");
      } catch (error) {
        setPhase("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "This PDF could not be validated. Choose another file.",
        );
      }
    },
    [releaseResult, stopWorker],
  );

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void selectFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void selectFile(event.dataTransfer.files?.[0]);
  };

  const compress = async () => {
    if (!file) return;
    stopWorker();
    releaseResult();
    setPhase("preparing");
    setMessage("Preparing the compression engine…");

    try {
      const input = await file.arrayBuffer();
      const worker = new Worker("/pdf-worker.js", { type: "module" });
      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent) => {
        const data = event.data as {
          type: string;
          phase?: Phase;
          message?: string;
          output?: ArrayBuffer;
        };

        if (data.type === "STATUS" && data.phase) {
          setPhase(data.phase);
          setMessage(data.message || "Working on your PDF…");
          return;
        }

        if (data.type === "ERROR") {
          stopWorker();
          setPhase("error");
          setMessage(
            data.message ||
              "The PDF could not be compressed. Try another file or compression level.",
          );
          return;
        }

        if (data.type === "SUCCESS" && data.output) {
          stopWorker();
          const outputSize = data.output.byteLength;
          if (outputSize >= file.size) {
            setPhase("error");
            setMessage(
              "This PDF could not be made smaller at the selected level. It may already be optimized; try a stronger level or keep the original.",
            );
            return;
          }

          const blob = new Blob([data.output], { type: "application/pdf" });
          const savedSize = file.size - outputSize;
          setResult({
            url: URL.createObjectURL(blob),
            outputSize,
            savedSize,
            reduction: (savedSize / file.size) * 100,
            downloadName: reducedName(file.name),
          });
          setPhase("success");
          setMessage("Compression complete. Review the result before downloading.");
        }
      };

      worker.onerror = () => {
        stopWorker();
        setPhase("error");
        setMessage(
          "The compression engine stopped unexpectedly. Reset the tool and try again.",
        );
      };

      worker.postMessage(
        {
          type: "COMPRESS",
          id: crypto.randomUUID(),
          name: file.name,
          level,
          input,
        },
        [input],
      );
    } catch {
      stopWorker();
      setPhase("error");
      setMessage(
        "Your browser could not prepare this file. Close other large tabs and try again.",
      );
    }
  };

  const cancel = () => {
    stopWorker();
    setPhase("cancelled");
    setMessage("Compression cancelled. Your PDF was not changed.");
  };

  const reset = () => {
    stopWorker();
    releaseResult();
    setFile(null);
    setLevel("ebook");
    setPhase("idle");
    setMessage("Choose a PDF to see its details and compression options.");
    inputRef.current?.focus();
  };

  const processing = ["preparing", "compressing", "finalizing"].includes(phase);

  return (
    <div className="compressor-shell" aria-labelledby="compressor-title">
      <div className="tool-heading">
        <div>
          <p className="tool-label">Your PDF</p>
          <h2 id="compressor-title">Compress locally</h2>
        </div>
        <span className="privacy-chip">
          <span aria-hidden="true">●</span> On-device
        </span>
      </div>

      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept=".pdf,application/pdf"
        onChange={onInputChange}
        aria-label="Choose a PDF file"
      />

      {!file && (
        <div
          className={`drop-zone ${dragging ? "is-dragging" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <span className="file-glyph" aria-hidden="true">
            PDF
          </span>
          <h3>Drop your PDF here</h3>
          <p>or choose one file from your device</p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            Choose PDF
          </button>
          <small>PDF only · Maximum 100MB</small>
        </div>
      )}

      {file && (
        <div className="selected-file">
          <div className="selected-file-icon" aria-hidden="true">
            PDF
          </div>
          <div className="file-info">
            <strong title={file.name}>{file.name}</strong>
            <span>{formatBytes(file.size)}</span>
          </div>
          {!processing && (
            <button
              className="text-button"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              Change
            </button>
          )}
        </div>
      )}

      {file && !result && (
        <fieldset className="level-fieldset" disabled={processing}>
          <legend>Compression level</legend>
          <div className="level-grid">
            {LEVELS.map((item) => (
              <label
                key={item.value}
                className={level === item.value ? "level-card selected" : "level-card"}
              >
                <input
                  type="radio"
                  name="compression-level"
                  value={item.value}
                  checked={level === item.value}
                  onChange={() => setLevel(item.value)}
                />
                <span className="radio-dot" aria-hidden="true" />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.description}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {processing && (
        <div className="process-panel" aria-hidden="true">
          {(["preparing", "compressing", "finalizing"] as const).map(
            (item, index) => {
              const current = ["preparing", "compressing", "finalizing"].indexOf(
                phase as "preparing",
              );
              return (
                <div
                  key={item}
                  className={index <= current ? "process-step active" : "process-step"}
                >
                  <span />
                  {item[0].toUpperCase() + item.slice(1)}
                </div>
              );
            },
          )}
        </div>
      )}

      {result && file && (
        <div className="result-panel">
          <div className="result-title">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>Your smaller PDF is ready</strong>
              <p>Open the download and check important pages before sharing.</p>
            </div>
          </div>
          <dl className="result-stats">
            <div>
              <dt>Original</dt>
              <dd>{formatBytes(file.size)}</dd>
            </div>
            <div>
              <dt>New size</dt>
              <dd>{formatBytes(result.outputSize)}</dd>
            </div>
            <div>
              <dt>Saved</dt>
              <dd>
                {formatBytes(result.savedSize)} ({result.reduction.toFixed(1)}%)
              </dd>
            </div>
          </dl>
        </div>
      )}

      <p className={`status-message ${phase === "error" ? "error" : ""}`} aria-live="polite">
        {message}
      </p>

      <div className="tool-actions">
        {file && !processing && !result && (
          <button className="primary-button" type="button" onClick={compress}>
            Reduce PDF Size
          </button>
        )}
        {processing && (
          <button className="secondary-button" type="button" onClick={cancel}>
            Cancel
          </button>
        )}
        {result && (
          <>
            <a
              className="primary-button"
              href={result.url}
              download={result.downloadName}
            >
              Download reduced PDF
            </a>
            <button className="secondary-button" type="button" onClick={reset}>
              New file
            </button>
          </>
        )}
        {file && phase === "error" && (
          <button className="secondary-button" type="button" onClick={reset}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
