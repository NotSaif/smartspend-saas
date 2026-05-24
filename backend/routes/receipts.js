const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createWorker } = require('tesseract.js');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are accepted.'));
  },
});

// Extract vendor, total amount, and date from raw OCR text.
function parseReceiptText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Vendor: first line with at least 3 chars that isn't purely numeric
  const vendor = lines.find(l => l.length >= 3 && !/^\d[\d\s.,]*$/.test(l)) || 'Unknown Vendor';

  // Amount: prefer labelled totals, fall back to largest decimal
  let amount = null;
  const labelMatch = text.match(
    /(?:total|grand\s+total|amount\s+due|net\s+total|subtotal)[:\s]*(?:bhd|bd|usd|\$|£|€)?\s*([\d,]+\.?\d*)/i
  );
  if (labelMatch) {
    amount = parseFloat(labelMatch[1].replace(/,/g, ''));
  }
  if (!amount || isNaN(amount)) {
    const numbers = (text.match(/\b\d{1,6}\.\d{2,3}\b/g) || []).map(Number);
    if (numbers.length) amount = Math.max(...numbers);
  }

  // Date: try ISO, numeric slash/dash, then written month formats
  let date = null;
  const datePatterns = [
    /\b(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})\b/,
    /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\b/,
    /\b(\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.,\s]+\d{2,4})\b/i,
  ];
  for (const pattern of datePatterns) {
    const m = text.match(pattern);
    if (m) {
      try {
        const parsed = new Date(m[1]);
        if (!isNaN(parsed.getTime())) {
          date = parsed.toISOString().split('T')[0];
          break;
        }
      } catch (_) { /* skip */ }
    }
  }

  return { vendor, amount: amount || null, date };
}

// POST /api/receipts/ocr
// Accepts a receipt image, runs Tesseract OCR, and returns extracted fields.
router.post('/ocr', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided.' });
    }

    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(req.file.buffer);
    await worker.terminate();

    const parsed = parseReceiptText(text);

    res.json({
      success: true,
      data: {
        vendor:  parsed.vendor,
        amount:  parsed.amount,
        date:    parsed.date,
        rawText: text.slice(0, 600).trim(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'OCR failed: ' + err.message });
  }
});

module.exports = router;
