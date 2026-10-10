import { jsPDF } from 'jspdf';

// Workflow structure and item definitions matching the official 2-page template
export const CLOSE_ACCOUNT_WORKFLOW_SECTIONS = [
  {
    secNum: 1,
    title: 'Closure Request Verification',
    page: 1,
    items: [
      { id: 'sec1_confirm_request', text: 'Confirm closure request from client (email/case/ticket)' },
      { id: 'sec1_confirm_reason', text: 'Confirm closure reason' },
      { id: 'sec1_check_terms', text: 'Check contract terms / early termination fees' }
    ]
  },
  {
    secNum: 2,
    title: 'Account Review',
    page: 1,
    items: [
      { id: 'sec2_no_pending_txns', text: 'Ensure no pending transactions' },
      { id: 'sec2_batches_settled', text: 'Confirm all batches are settled' },
      { id: 'sec2_check_disputes', text: 'Check for disputes/chargebacks' },
      { id: 'sec2_no_pending_deposits', text: 'Verify no pending deposits' }
    ]
  },
  {
    secNum: 3,
    title: 'First Data (FD) Workflow',
    page: 1,
    processorDefault: 'NASHVILLE',
    items: [
      { id: 'sec3_login_fd', text: 'Log in to First Data platform' },
      { id: 'sec3_search_acct', text: 'Search merchant account' },
      { id: 'sec3_verify_details', text: 'Verify account details and status' },
      { id: 'sec3_close_fd', text: 'Close merchant account in FD system' }
    ]
  },
  {
    secNum: 4,
    title: 'TSYS Workflow',
    page: 1,
    processorDefault: 'TSYS',
    items: [
      { id: 'sec4_access_tsys', text: 'Access TSYS system' },
      { id: 'sec4_locate_mid', text: 'Locate merchant account using MID' },
      { id: 'sec4_verify_status', text: 'Verify account status and activity' },
      { id: 'sec4_close_tsys', text: 'Close account in TSYS' },
      { id: 'sec4_remove_configs', text: 'Remove terminal configurations' }
    ]
  },
  {
    secNum: 5,
    title: 'Equipment Handling',
    items: [
      { id: 'sec5_identify_terminals', text: 'Identify all active terminals/devices', page: 1 },
      { id: 'sec5_confirm_returns', text: 'Confirm return requirements (with Krupali)', page: 1 },
      { id: 'sec5_send_instructions', text: 'Send return instructions to client with return label', page: 1 },
      {
        id: 'sec5_deactivate_devices',
        text: 'Deactivate devices in system / Disable any gateway/API integrations (Dejavoo, Valor, Clover, P98 Terminals, Auth.net, NMI, P98 Gateway, Clover Software)',
        page: 2
      },
      {
        id: 'sec5_deactivate_buypass',
        text: 'Deactivate ALL buypass IDs under the MID if it is a gas station. (This is done in buypass tools, disable the Buypass Merchant ID and Terminal ID)',
        page: 2
      }
    ]
  },
  {
    secNum: 6,
    title: 'Financial Closure (Verify with Billing Department)',
    page: 2,
    items: [
      { id: 'sec6_apply_fees', text: 'Apply final fees' },
      { id: 'sec6_check_balances', text: 'Check outstanding balances' },
      { id: 'sec6_final_adjustments', text: 'Process final billing adjustments' }
    ]
  },
  {
    secNum: 7,
    title: 'Communication',
    page: 2,
    items: [
      { id: 'sec7_send_email', text: 'Send closure confirmation email/message' },
      { id: 'sec7_effective_date', text: 'Include closure effective date' },
      { id: 'sec7_final_statement', text: 'Provide final statement if needed' }
    ]
  },
  {
    secNum: 8,
    title: 'Final Verification',
    page: 2,
    items: [
      { id: 'sec8_confirm_closed', text: 'Confirm account closed in all systems' },
      { id: 'sec8_no_active_services', text: 'Ensure no active services remain' }
    ]
  }
];

/**
 * Returns default checkbox state for the selected processor.
 * For NASHVILLE: Section 3 is checked, Section 4 is unchecked, all others checked.
 * For TSYS: Section 3 is unchecked, Section 4 is checked, all others checked.
 */
export function getDefaultCheckboxState(processor = 'NASHVILLE') {
  const isNashville = (processor || 'NASHVILLE').toUpperCase() === 'NASHVILLE';
  const state = {};

  CLOSE_ACCOUNT_WORKFLOW_SECTIONS.forEach((sec) => {
    sec.items.forEach((item) => {
      if (sec.secNum === 3) {
        state[item.id] = isNashville;
      } else if (sec.secNum === 4) {
        state[item.id] = !isNashville;
      } else {
        state[item.id] = true;
      }
    });
  });

  return state;
}

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
 * with interactive AcroForm editable checkboxes.
 * 
 * @param {Object} options
 * @param {'NASHVILLE'|'TSYS'} options.processor - Selected processor workflow
 * @param {string} options.reason - Reason for closing the account
 * @param {Object} [options.checkedItems] - Custom checkbox states mapped by item id
 * @param {Object} [options.fonts] - Preloaded font base64 objects { reg, bold }
 * @returns {jsPDF} The jsPDF document instance
 */
export function buildCloseAccountPdf({
  processor = 'NASHVILLE',
  reason = '',
  checkedItems = null,
  fonts = null
}) {
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

  const defaultChecked = getDefaultCheckboxState(processor);
  const isItemChecked = (itemId) => {
    if (checkedItems && typeof checkedItems === 'object' && itemId in checkedItems) {
      return Boolean(checkedItems[itemId]);
    }
    return Boolean(defaultChecked[itemId]);
  };

  const leftMargin = 72; // 1 inch standard margin
  const contentWidth = 612 - leftMargin * 2; // 468 pt

  // Draw clean vector checkbox AND add interactive AcroForm fillable checkbox
  function drawCheckbox(x, curY, checked, fieldId) {
    const size = 6.8;
    const boxY = curY - size;

    // Vector box with crisp X when checked for print and flat renderers
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.55);
    doc.rect(x, boxY, size, size);

    if (checked) {
      doc.line(x, boxY, x + size, boxY + size);
      doc.line(x + size, boxY, x, boxY + size);
    }

    // Add interactive AcroForm checkbox field for PDF viewers (Acrobat, Chrome, Edge)
    try {
      if (typeof doc.AcroFormCheckBox === 'function') {
        const cb = new doc.AcroFormCheckBox();
        cb.fieldName = fieldId || `cb_${Math.round(x)}_${Math.round(boxY)}`;
        cb.Rect = [x, boxY, size, size];
        cb.value = checked ? 'Yes' : 'Off';
        cb.appearanceState = checked ? 'Yes' : 'Off';
        cb.showWhenPrinted = true;
        doc.addField(cb);
      }
    } catch (_) {
      // Fallback if AcroForm is not available
    }
  }

  // Draw section heading (e.g. "1.  Closure Request Verification")
  function drawSectionHeading(num, title) {
    y += 9;
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`${num}.  ${title}`, leftMargin + 16, y);
    y += 18.5;
  }

  // Draw a workflow item with checkbox and text
  function drawItem(id, text) {
    const checked = isItemChecked(id);
    drawCheckbox(leftMargin, y, checked, id);
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const splitText = doc.splitTextToSize(text, contentWidth - 14);
    doc.text(splitText, leftMargin + 10.5, y);
    y += (splitText.length - 1) * 13 + 18.5;
  }

  let y = 60;

  // ==========================================
  // PAGE 1
  // ==========================================

  // Document Title: Close Processing Accounts Workflow (First Data & TSYS)
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(40, 85, 168); // #2855a8 blue
  const title = 'Close Processing Accounts Workflow (First Data & TSYS)';
  const titleWidth = doc.getTextWidth(title);
  const titleX = (612 - titleWidth) / 2;
  doc.text(title, titleX, y);
  doc.setDrawColor(40, 85, 168);
  doc.setLineWidth(0.8);
  doc.line(titleX, y + 2.5, titleX + titleWidth, y + 2.5); // Underline

  y += 24;

  // 1. Closure Request Verification
  drawSectionHeading(1, 'Closure Request Verification');
  drawItem('sec1_confirm_request', 'Confirm closure request from client (email/case/ticket)');
  drawItem('sec1_confirm_reason', 'Confirm closure reason');

  // Dynamic Reason for Closing line indented under Confirm closure reason
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const cleanReason = (reason || '').trim();
  const reasonText = cleanReason ? `Reason for Closing: ${cleanReason}` : 'Reason for Closing: ';
  const splitReason = doc.splitTextToSize(reasonText, contentWidth - 14);
  doc.text(splitReason, leftMargin + 10.5, y);
  y += (splitReason.length - 1) * 13 + 18.5;

  drawItem('sec1_check_terms', 'Check contract terms / early termination fees');

  // 2. Account Review
  drawSectionHeading(2, 'Account Review');
  drawItem('sec2_no_pending_txns', 'Ensure no pending transactions');
  drawItem('sec2_batches_settled', 'Confirm all batches are settled');
  drawItem('sec2_check_disputes', 'Check for disputes/chargebacks');
  drawItem('sec2_no_pending_deposits', 'Verify no pending deposits');

  // 3. First Data (FD) Workflow
  drawSectionHeading(3, 'First Data (FD) Workflow');
  drawItem('sec3_login_fd', 'Log in to First Data platform');
  drawItem('sec3_search_acct', 'Search merchant account');
  drawItem('sec3_verify_details', 'Verify account details and status');
  drawItem('sec3_close_fd', 'Close merchant account in FD system');

  // 4. TSYS Workflow
  drawSectionHeading(4, 'TSYS Workflow');
  drawItem('sec4_access_tsys', 'Access TSYS system');
  drawItem('sec4_locate_mid', 'Locate merchant account using MID');
  drawItem('sec4_verify_status', 'Verify account status and activity');
  drawItem('sec4_close_tsys', 'Close account in TSYS');
  drawItem('sec4_remove_configs', 'Remove terminal configurations');

  // 5. Equipment Handling (First 3 items on Page 1)
  drawSectionHeading(5, 'Equipment Handling');
  drawItem('sec5_identify_terminals', 'Identify all active terminals/devices');
  drawItem('sec5_confirm_returns', 'Confirm return requirements (with Krupali)');
  drawItem('sec5_send_instructions', 'Send return instructions to client with return label');

  // ==========================================
  // PAGE 2
  // ==========================================
  doc.addPage('letter', 'portrait');
  y = 52;

  // Equipment Handling continued items on Page 2
  drawItem(
    'sec5_deactivate_devices',
    'Deactivate devices in system / Disable any gateway/API integrations (Dejavoo, Valor, Clover, P98 Terminals, Auth.net, NMI, P98 Gateway, Clover Software)'
  );
  drawItem(
    'sec5_deactivate_buypass',
    'Deactivate ALL buypass IDs under the MID if it is a gas station. (This is done in buypass tools, disable the Buypass Merchant ID and Terminal ID)'
  );

  // 6. Financial Closure (Verify with Billing Department)
  drawSectionHeading(6, 'Financial Closure (Verify with Billing Department)');
  drawItem('sec6_apply_fees', 'Apply final fees');
  drawItem('sec6_check_balances', 'Check outstanding balances');
  drawItem('sec6_final_adjustments', 'Process final billing adjustments');

  // 7. Communication
  drawSectionHeading(7, 'Communication');
  drawItem('sec7_send_email', 'Send closure confirmation email/message');
  drawItem('sec7_effective_date', 'Include closure effective date');
  drawItem('sec7_final_statement', 'Provide final statement if needed');

  // 8. Final Verification
  drawSectionHeading(8, 'Final Verification');
  drawItem('sec8_confirm_closed', 'Confirm account closed in all systems');
  drawItem('sec8_no_active_services', 'Ensure no active services remain');

  return doc;
}

/**
 * Returns a Blob of the generated Close Account PDF
 */
export async function generateCloseAccountPdfBlob({
  processor = 'NASHVILLE',
  reason = '',
  checkedItems = null
}) {
  const fonts = await loadCalibriFonts();
  const doc = buildCloseAccountPdf({ processor, reason, checkedItems, fonts });
  return doc.output('blob');
}

/**
 * Saves or downloads the PDF based on the directory handle or fallback download
 */
export async function saveOrDownloadCloseAccountPdf({
  processor = 'NASHVILLE',
  reason = '',
  checkedItems = null,
  fileName = 'Close_Account_NASHVILLE.pdf',
  dirHandle = null
}) {
  const safeFileName = fileName.trim().toLowerCase().endsWith('.pdf')
    ? fileName.trim()
    : `${fileName.trim()}.pdf`;

  const fonts = await loadCalibriFonts();
  const doc = buildCloseAccountPdf({ processor, reason, checkedItems, fonts });

  // If a directory handle is configured (File System Access API)
  if (dirHandle && typeof dirHandle.getFileHandle === 'function') {
    try {
      const blob = doc.output('blob');
      const fileHandle = await dirHandle.getFileHandle(safeFileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { success: true, method: 'direct-folder', fileName: safeFileName };
    } catch (err) {
      console.warn('Could not write directly to directory handle, falling back to download:', err);
    }
  }

  // Standard browser download using jsPDF native save
  try {
    doc.save(safeFileName);
  } catch (err) {
    const pdfData = doc.output('arraybuffer');
    const blob = new Blob([pdfData], { type: 'application/octet-stream' });
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = safeFileName;
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  }

  return { success: true, method: 'download', fileName: safeFileName };
}
