const fs = require('fs');
if (typeof DOMMatrix === 'undefined') {
    global.DOMMatrix = class DOMMatrix {};
}
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Optional Dependencies with Safe Loading
let Tesseract = null;
let pdfImgConvert = null;

// Try loading Tesseract
try {
    Tesseract = require('tesseract.js');
    console.log("✅ Tesseract.js loaded for OCR.");
} catch (e) {
    console.warn("⚠️ Tesseract.js not found. OCR disabled.");
}

// Try loading pdf-img-convert
try {
    pdfImgConvert = require('pdf-img-convert');
    console.log("✅ pdf-img-convert loaded for OCR.");
} catch (e) {
    console.warn("⚠️ pdf-img-convert not found. OCR disabled.");
}

/**
 * Extracts text from a resume file (PDF, DOCX, TXT)
 * @param {string} filePath - Path to the uploaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} Extracted text
 */
async function extractResumeText(filePath, mimeType) {
    try {
        console.log(`📄 Parsing file: ${filePath} (${mimeType})`);

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        let extractedText = "";
        const fileBuffer = fs.readFileSync(filePath);

        // --- PDF Processing ---
        if (mimeType === "application/pdf") {
            // 1. Try Standard Text Extraction (pdf-parse)
            try {
                const data = await pdfParse(fileBuffer);
                extractedText = data.text ? data.text.trim() : "";
            } catch (pdfError) {
                console.warn("⚠️ Standard PDF parsing failed (pdf-parse). Attempting OCR fallback:", pdfError.message);
                extractedText = ""; // Reset to empty to trigger OCR
            }

            // 2. Optical Character Recognition (OCR) Fallback
            if (extractedText.length < 50) {
                console.log("⚠️ PDF text too short or parsing failed. Checking for OCR availability...");

                if (Tesseract && pdfImgConvert) {
                    console.log("📷 Starting OCR extraction...");
                    try {
                        // helper function to get images
                        const outputImages = await pdfImgConvert.convert(filePath);
                        console.log(`📷 Converted PDF to ${outputImages.length} images.`);

                        for (let i = 0; i < outputImages.length; i++) {
                            console.log(`Processing page ${i + 1} of ${outputImages.length} with OCR...`);
                            const { data: { text } } = await Tesseract.recognize(outputImages[i], 'eng');
                            extractedText += text + "\n";
                        }
                    } catch (ocrError) {
                        console.error("❌ OCR Error:", ocrError.message);
                        // If OCR fails, we just continue with what we have (empty string)
                    }
                } else {
                    console.log("ℹ️ OCR skipped: Required modules (tesseract.js, pdf-img-convert) not installed.");
                }
            }
        }

        // --- DOCX Processing ---
        else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            mimeType === "application/msword") {
            try {
                const result = await mammoth.extractRawText({ buffer: fileBuffer });
                extractedText = result.value;
                if (result.messages.length) {
                    console.warn("DOCX Warnings:", result.messages);
                }
            } catch (docxError) {
                console.error("❌ DOCX Parse Error:", docxError.message);
                throw new Error("Failed to parse DOCX file.");
            }
        }

        // --- Plain Text Processing ---
        else if (mimeType === "text/plain") {
            extractedText = fileBuffer.toString("utf8");
        }

        else {
            throw new Error(`Unsupported file type: ${mimeType}`);
        }

        // Final Validation
        extractedText = extractedText ? extractedText.trim() : "";
        console.log(`✅ Text Extracted. Length: ${extractedText.length} chars.`);

        if (extractedText.length < 10) {
            throw new Error("Resume parsing failed. The file appears to be an image-only PDF or empty, which we cannot process. Please try uploading a Word Document (DOCX) or a text-based PDF.");
        }

        return extractedText;

    } catch (error) {
        console.error("❌ Resume Extraction Failed:", error.message);
        throw new Error(error.message || "Failed to extract text from resume.");
    }
}

module.exports = { extractResumeText };