let activeTask = null;

function status(phase, message) {
  self.postMessage({ type: "STATUS", phase, message });
}

function friendlyError(error, logs) {
  const detail = `${error instanceof Error ? error.message : error}\n${logs.join("\n")}`;
  if (/password|encrypted|invalidfileaccess/i.test(detail)) {
    return "This PDF is encrypted or password-protected and cannot be compressed here.";
  }
  if (/undefinedfilename|syntaxerror|xref|damaged/i.test(detail)) {
    return "This PDF appears damaged or uses an unsupported structure. Try opening and re-saving the original first.";
  }
  if (/memory|allocation|out of bounds/i.test(detail)) {
    return "Your browser ran out of memory while processing this PDF. Close other large tabs or try a smaller file.";
  }
  if (/fetch|wasm|instantiate|network/i.test(detail)) {
    return "The compression engine could not load. Check your connection, reload the page, and try again.";
  }
  return "The PDF could not be compressed. Try another compression level or a different file.";
}

self.onmessage = async (event) => {
  if (event.data?.type !== "COMPRESS" || activeTask) return;
  activeTask = event.data.id;
  const logs = [];

  try {
    status("preparing", "Preparing the local compression engine…");
    const { default: createGhostscript } = await import("/ghostscript/gs.mjs");
    const ghostscript = await createGhostscript({
      noInitialRun: true,
      locateFile(file) {
        return `/ghostscript/${file}`;
      },
      print() {},
      printErr(line) {
        logs.push(String(line));
      },
    });

    const inputName = `/input-${activeTask}.pdf`;
    const outputName = `/output-${activeTask}.pdf`;
    ghostscript.FS.writeFile(inputName, new Uint8Array(event.data.input));

    status("compressing", "Compressing your PDF on this device…");
    let exitCode = 0;
    try {
      exitCode = ghostscript.callMain([
        "-q",
        "-dSAFER",
        "-dBATCH",
        "-dNOPAUSE",
        "-dCompatibilityLevel=1.6",
        "-sDEVICE=pdfwrite",
        `-dPDFSETTINGS=/${event.data.level}`,
        "-dDetectDuplicateImages=true",
        "-dCompressFonts=true",
        "-dSubsetFonts=true",
        `-sOutputFile=${outputName}`,
        inputName,
      ]);
    } catch (error) {
      if (!(error && typeof error === "object" && "status" in error && error.status === 0)) {
        throw error;
      }
    }

    if (exitCode !== 0) {
      throw new Error(`Ghostscript exited with status ${exitCode}`);
    }

    status("finalizing", "Finalizing the new PDF…");
    const output = ghostscript.FS.readFile(outputName);
    if (!output?.byteLength || output[0] !== 0x25 || output[1] !== 0x50) {
      throw new Error("The output PDF was empty or invalid.");
    }

    const transferable = output.buffer.slice(
      output.byteOffset,
      output.byteOffset + output.byteLength,
    );
    try {
      ghostscript.FS.unlink(inputName);
      ghostscript.FS.unlink(outputName);
    } catch {}
    self.postMessage({ type: "SUCCESS", output: transferable }, [transferable]);
  } catch (error) {
    self.postMessage({
      type: "ERROR",
      message: friendlyError(error, logs),
    });
  } finally {
    activeTask = null;
  }
};
