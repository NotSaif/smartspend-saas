const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createWorker } = require('tesseract.js');
const { authenticate, authorize } = require('../middleware/auth');

// Receipt scanning is part of adding a transaction, so it follows the same rule (Owner or Admin).
router.use(authenticate, authorize('owner', 'admin'));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'image/bmp'].includes(file.mimetype)) cb(null, true);
    else cb(Object.assign(new Error('Only JPEG, PNG, WebP or BMP images are accepted.'), { status: 400 }));
  },
});

// One Tesseract worker is created on first use and reused, so later scans are fast.
let workerPromise = null;
const getWorker = () => {
  if (!workerPromise) workerPromise = createWorker('eng').catch(err => { workerPromise = null; throw err; });
  return workerPromise;
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// Build a YYYY-MM-DD string without going through time zones; returns null for impossible dates.
function toISODate(y, m, d) {
  y = Number(y); m = Number(m); d = Number(d);
  if (y < 100) y += 2000;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

const parseNumber = (s) => parseFloat(s.replace(/,/g, ''));

// Extract vendor, total amount and date from raw OCR text.
function parseReceiptText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Vendor: first line with at least 3 characters that is not purely numeric
  const vendor = lines.find(l => l.length >= 3 && !/^[\d\s.,:/-]+$/.test(l)) || 'Unknown Vendor';

  // Amount: the last "total" line (grand total / amount due / total) wins over a subtotal;
  // otherwise the largest number with 2-3 decimals.
  let amount = null;
  const totalRe = /(grand\s*total|amount\s*due|net\s*total|total)[^\d]*([\d,]+\.\d{2,3}|[\d,]+)/i;
  for (const line of lines) {
    if (/sub\s*-?\s*total/i.test(line)) continue;
    const m = line.match(totalRe);
    if (m) amount = parseNumber(m[2]);
  }
  if (!amount) {
    const sub = lines.map(l => l.match(/sub\s*-?\s*total[^\d]*([\d,]+\.\d{2,3})/i)).find(Boolean);
    const numbers = (text.match(/\b\d{1,6}\.\d{2,3}\b/g) || []).map(Number);
    if (numbers.length) amount = Math.max(...numbers);
    else if (sub) amount = parseNumber(sub[1]);
  }

  // Date: ISO (2026-10-12), Bahrain-style day first (12/10/2026) or with a month name (12 Oct 2026)
  let date = null;
  let m;
  if ((m = text.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/))) date = toISODate(m[1], m[2], m[3]);
  if (!date && (m = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/))) date = toISODate(m[3], m[2], m[1]);
  if (!date && (m = text.match(/\b(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[.,\s]+(\d{2,4})\b/i)))
    date = toISODate(m[3], MONTHS.indexOf(m[2].toLowerCase()) + 1, m[1]);

  return { vendor, amount: amount || null, date };
}

// POST /api/receipts/ocr
// Accepts a receipt image, runs Tesseract OCR, and returns extracted fields.
router.post('/ocr', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided.' });
    }

    const worker = await getWorker();
    const { data: { text } } = await worker.recognize(req.file.buffer);

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
    console.error(err);
    res.status(500).json({ success: false, error: 'Could not read the receipt. Please enter the details manually.' });
  }
});

module.exports = router;

module.exports.parseReceiptText = parseReceiptText;
