import { jsPDF } from 'jspdf';

// In-memory base64 cache for Calibri fonts
let cachedCalibriReg = null;
let cachedCalibriBold = null;
let fontLoadPromise = null;

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

/**
 * Preloads and caches the Calibri TTF fonts for jsPDF
 */
export async function loadCalibriFonts() {
  if (cachedCalibriReg && cachedCalibriBold) {
    return { reg: cachedCalibriReg, bold: cachedCalibriBold };
  }

  if (fontLoadPromise) return fontLoadPromise;

  fontLoadPromise = (async () => {
    try {
      if (typeof window !== 'undefined' && window.fetch) {
        const [regRes, boldRes] = await Promise.all([
          fetch('/fonts/calibri.ttf'),
          fetch('/fonts/calibrib.ttf')
        ]);
        if (regRes.ok && boldRes.ok) {
          const [regBuf, boldBuf] = await Promise.all([
            regRes.arrayBuffer(),
            boldRes.arrayBuffer()
          ]);
          cachedCalibriReg = arrayBufferToBase64(regBuf);
          cachedCalibriBold = arrayBufferToBase64(boldBuf);
          return { reg: cachedCalibriReg, bold: cachedCalibriBold };
        }
      } else if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node) {
        // Node environment fallback (for unit tests / build scripts)
        try {
          const req = typeof require !== 'undefined' ? require : null;
          if (req) {
            const fs = req('fs');
            const path = req('path');
            const regPath = path.resolve(process.cwd(), 'public/fonts/calibri.ttf');
            const boldPath = path.resolve(process.cwd(), 'public/fonts/calibrib.ttf');
            if (fs.existsSync(regPath) && fs.existsSync(boldPath)) {
              cachedCalibriReg = fs.readFileSync(regPath).toString('base64');
              cachedCalibriBold = fs.readFileSync(boldPath).toString('base64');
              return { reg: cachedCalibriReg, bold: cachedCalibriBold };
            }
          }
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Could not load Calibri font, falling back to Helvetica:', err);
    }
    return null;
  })();

  return fontLoadPromise;
}

// Automatically start preloading in browser environment
if (typeof window !== 'undefined') {
  loadCalibriFonts().catch(() => {});
}

/**
 * Generates the Close Account PDF document matching the exact 2-page template
 * for NASHVILLE (First Data) or TSYS workflows.
 * 
 * @param {Object} options
 * @param {'NASHVILLE'|'TSYS'} options.processor - Selected processor workflow
 * @param {string} options.reason - Reason for closing the account
 * @param {Object} [options.fonts] - Preloaded font base64 objects { reg, bold }
 * @returns {jsPDF} The jsPDF document instance
 */
export function buildCloseAccountPdf({ processor = 'NASHVILLE', reason = '', fonts = null }) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'letter', // 612 x 792 pt
  });

  let fontFamily = 'helvetica';
  const activeFonts = fonts || (cachedCalibriReg && cachedCalibriBold ? { reg: cachedCalibriReg, bold: cachedCalibriBold } : null);

  if (activeFonts?.reg && activeFonts?.bold) {
    try {
      doc.addFileToVFS('Calibri-Regular.ttf', activeFonts.reg);
      doc.addFont('Calibri-Regular.ttf', 'Calibri', 'normal');
      doc.addFileToVFS('Calibri-Bold.ttf', activeFonts.bold);
      doc.addFont('Calibri-Bold.ttf', 'Calibri', 'bold');
      fontFamily = 'Calibri';
    } catch (e) {
      fontFamily = 'helvetica';
    }
  }

  const isNashville = (processor || 'NASHVILLE').toUpperCase() === 'NASHVILLE';
  const leftMargin = 72; // 1 inch standard margin
  const contentWidth = 612 - leftMargin * 2; // 468 pt
  let y = 52;

  // Draw clean vector checkbox (square box with corner-to-corner X if checked)
  // Perfectly aligned with font baseline and cap-height
  function drawCheckbox(x, curY, checked) {
    const size = 7.8;
    const boxY = curY - size;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.65);
    doc.rect(x, boxY, size, size); // square box

    if (checked) {
      // Clean corner-to-corner diagonal 'X' exactly matching original template
      doc.line(x, boxY, x + size, boxY + size);
      doc.line(x + size, boxY, x, boxY + size);
    }
  }

  // Draw section heading (e.g. "1.  Closure Request Verification")
  // Section numbers are indented by 18pt so checkboxes sit to the left
  function drawSectionHeading(num, title) {
    y += 10;
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`${num}.  ${title}`, leftMargin + 18, y);
    y += 20;
  }

  // Draw a workflow item with checkbox and text
  function drawItem(text, checked) {
    drawCheckbox(leftMargin, y, checked);
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    const splitText = doc.splitTextToSize(text, contentWidth - 14);
    doc.text(splitText, leftMargin + 12, y);
    y += (splitText.length - 1) * 14 + 20;
  }

  // ==========================================
  // PAGE 1
  // ==========================================

  // 1. Closure Request Verification
  drawSectionHeading(1, 'Closure Request Verification');
  drawItem('Confirm closure request from client (email/case/ticket)', true);
  drawItem('Confirm closure reason', true);

  // Dynamic Reason for Closing line indented under Confirm closure reason
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const cleanReason = (reason || '').trim();
  const reasonText = cleanReason ? `Reason for Closing: ${cleanReason}` : 'Reason for Closing: ';
  const splitReason = doc.splitTextToSize(reasonText, contentWidth - 14);
  doc.text(splitReason, leftMargin + 12, y);
  y += (splitReason.length - 1) * 14 + 20;

  drawItem('Check contract terms / early termination fees', true);

  // 2. Account Review
  drawSectionHeading(2, 'Account Review');
  drawItem('Ensure no pending transactions', true);
  drawItem('Confirm all batches are settled', true);
  drawItem('Check for disputes/chargebacks', true);
  drawItem('Verify no pending deposits', true);

  // 3. First Data (FD) Workflow (Checked for NASHVILLE, Unchecked for TSYS)
  drawSectionHeading(3, 'First Data (FD) Workflow');
  drawItem('Log in to First Data platform', isNashville);
  drawItem('Search merchant account', isNashville);
  drawItem('Verify account details and status', isNashville);
  drawItem('Close merchant account in FD system', isNashville);

  // 4. TSYS Workflow (Unchecked for NASHVILLE, Checked for TSYS)
  drawSectionHeading(4, 'TSYS Workflow');
  drawItem('Access TSYS system', !isNashville);
  drawItem('Locate merchant account using MID', !isNashville);
  drawItem('Verify account status and activity', !isNashville);
  drawItem('Close account in TSYS', !isNashville);
  drawItem('Remove terminal configurations', !isNashville);

  // 5. Equipment Handling (First 3 items on Page 1)
  drawSectionHeading(5, 'Equipment Handling');
  drawItem('Identify all active terminals/devices', true);
  drawItem('Confirm return requirements (with Krupali)', true);
  drawItem('Send return instructions to client with return label', true);

  // ==========================================
  // PAGE 2
  // ==========================================
  doc.addPage('letter', 'portrait');
  y = 52;

  // Equipment Handling continued item
  drawItem(
    'Deactivate devices in system / Disable any gateway/API integrations (Dejavoo, Valor, Clover, P98 Terminals, Auth.net, NMI, P98 Gateway, Clover Software)',
    true
  );

  // 6. Financial Closure (Verify with Billing Department)
  drawSectionHeading(6, 'Financial Closure (Verify with Billing Department)');
  drawItem('Apply final fees', true);
  drawItem('Check outstanding balances', true);
  drawItem('Process final billing adjustments', true);

  // 7. Communication
  drawSectionHeading(7, 'Communication');
  drawItem('Send closure confirmation email/message', true);
  drawItem('Include closure effective date', true);
  drawItem('Provide final statement if needed', true);

  // 8. Final Verification
  drawSectionHeading(8, 'Final Verification');
  drawItem('Confirm account closed in all systems', true);
  drawItem('Ensure no active services remain', true);

  return doc;
}

/**
 * Returns a Blob of the generated Close Account PDF
 */
export async function generateCloseAccountPdfBlob({ processor = 'NASHVILLE', reason = '' }) {
  const fonts = await loadCalibriFonts();
  const doc = buildCloseAccountPdf({ processor, reason, fonts });
  return doc.output('blob');
}

/**
 * Saves or downloads the PDF based on the directory handle or fallback download
 */
export async function saveOrDownloadCloseAccountPdf({
  processor = 'NASHVILLE',
  reason = '',
  fileName = 'Close_Account_NASHVILLE.pdf',
  dirHandle = null
}) {
  const safeFileName = fileName.trim().toLowerCase().endsWith('.pdf')
    ? fileName.trim()
    : `${fileName.trim()}.pdf`;

  const blob = await generateCloseAccountPdfBlob({ processor, reason });

  // If a directory handle is configured (File System Access API)
  if (dirHandle && typeof dirHandle.getFileHandle === 'function') {
    try {
      const fileHandle = await dirHandle.getFileHandle(safeFileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { success: true, method: 'direct-folder', fileName: safeFileName };
    } catch (err) {
      console.warn('Could not write directly to directory handle, falling back to download:', err);
    }
  }

  // Standard browser download
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = safeFileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

  return { success: true, method: 'download', fileName: safeFileName };
}
