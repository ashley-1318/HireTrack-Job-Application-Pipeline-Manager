import axios from "axios";
import mammoth from "mammoth";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
// pdf-parse is CommonJS; use require to import
const pdfParseModule = require("pdf-parse");
const pdfParse = pdfParseModule.default || pdfParseModule;

async function fetchBuffer(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return res.data;
}

export async function extractResumeText(resumeUrl) {
  try {
    const buf = await fetchBuffer(resumeUrl);

    if (resumeUrl.endsWith(".pdf")) {
      const data = await pdfParse(buf);
      return data.text;
    }

    if (resumeUrl.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer: buf });
      return result.value;
    }

    const pdf = await pdfParse(buf);
    return pdf.text;
  } catch (err) {
    console.error("Resume extract error:", err);
    return "";
  }
}
