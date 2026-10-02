import { jsPDF } from 'jspdf';

/**
 * Generates the Close Account PDF document matching the exact 2-page template
 * for NASHVILLE (First Data) or TSYS workflows.
 * 
 * @param {Object} options
 * @param {'NASHVILLE'|'TSYS'} options.processor - Selected processor workflow
 * @param {string} options.reason - Reason for closing the account
 * @returns {jsPDF} The jsPDF document instance
 */
export function buildCloseAccountPdf({ processor = 'NASHVILLE', reason = '' }) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'letter', // 612 x 792 pt
  });

  const isNashville = (processor || 'NASHVILLE').toUpperCase() === 'NASHVILLE';
  const leftMargin = 72; // 1 inch standard margin
  const contentWidth = 612 - leftMargin * 2; // 468 pt
  let y = 68;

  // Draw clean vector checkbox (square with X if checked)
  function drawCheckbox(x, curY, checked) {
    const size = 9.5;
    doc.setDrawColor(45, 45, 45);
    doc.setLineWidth(0.8);
    doc.rect(x, curY - 8, size, size); // square box

    if (checked) {
      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(0.9);
      // Clean cross 'X' inside box
      doc.line(x + 1.6, curY - 6.4, x + size - 1.6, curY + size - 9.6);
      doc.line(x + size - 1.6, curY - 6.4, x + 1.6, curY + size - 9.6);
    }
  }

  // Draw section heading (e.g. "1.  Closure Request Verification")
  function drawSectionHeading(num, title) {
    y += 17;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(`${num}.  ${title}`, leftMargin, y);
    y += 15;
  }

  // Draw a workflow item with checkbox and text
  function drawItem(text, checked) {
    drawCheckbox(leftMargin, y, checked);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 30, 30);

    const splitText = doc.splitTextToSize(text, contentWidth - 18);
    doc.text(splitText, leftMargin + 16, y);
    y += splitText.length * 13.8 + 4.5;
  }

  // ==========================================
  // PAGE 1
  // ==========================================

  // Document Title: Close Processing Accounts Workflow (First Data & TSYS)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(44, 90, 160); // Blue #2c5aa0
  const title = 'Close Processing Accounts Workflow (First Data & TSYS)';
  const titleWidth = doc.getTextWidth(title);
  const titleX = (612 - titleWidth) / 2;
  doc.text(title, titleX, y);
  doc.setDrawColor(44, 90, 160);
  doc.setLineWidth(1);
  doc.line(titleX, y + 2.5, titleX + titleWidth, y + 2.5); // Underline

  y += 24;

  // 1. Closure Request Verification
  drawSectionHeading(1, 'Closure Request Verification');
  drawItem('Confirm closure request from client (email/case/ticket)', true);
  drawItem('Confirm closure reason', true);

  // Dynamic Reason for Closing line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 30, 30);
  const labelPrefix = 'Reason for Closing: ';
  doc.text(labelPrefix, leftMargin + 16, y);
  const labelWidth = doc.getTextWidth(labelPrefix);

  const cleanReason = (reason || '').trim();
  const availableWidth = contentWidth - 16 - labelWidth;
  const reasonLines = cleanReason
    ? doc.splitTextToSize(cleanReason, availableWidth)
    : [''];

  if (cleanReason) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(reasonLines, leftMargin + 16 + labelWidth, y);
  }
  y += Math.max(1, reasonLines.length) * 13.8 + 4.5;

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
  y = 70;

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
export function generateCloseAccountPdfBlob({ processor = 'NASHVILLE', reason = '' }) {
  const doc = buildCloseAccountPdf({ processor, reason });
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

  const blob = generateCloseAccountPdfBlob({ processor, reason });

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
