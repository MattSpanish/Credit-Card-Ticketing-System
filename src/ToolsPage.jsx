import React, { useState, useEffect } from 'react';
import {
  generateCloseAccountPdfBlob,
  saveOrDownloadCloseAccountPdf
} from './closeAccountPdfGenerator';

export default function ToolsPage({ onBackToDashboard }) {
  // Currently active tool inside the Tools Hub
  const [activeTool, setActiveTool] = useState('close-account-pdf');

  // Generator form state
  const [processor, setProcessor] = useState('NASHVILLE'); // 'NASHVILLE' or 'TSYS'
  const [reason, setReason] = useState('');
  const [fileName, setFileName] = useState('Close_Account_NASHVILLE.pdf');
  const [isCustomFileName, setIsCustomFileName] = useState(false);

  // Folder path / File System Access state
  const [savedFolderName, setSavedFolderName] = useState(() => {
    return localStorage.getItem('close_account_save_folder_name') || '';
  });
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [showFolderSettings, setShowFolderSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // PDF Preview State
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [previewMode, setPreviewMode] = useState('pdf'); // 'pdf' or 'sheet'
  const [sheetPage, setSheetPage] = useState(1); // 1 or 2

  // Update default file name when processor changes (if user hasn't typed custom name)
  useEffect(() => {
    if (!isCustomFileName) {
      setFileName(`Close_Account_${processor}.pdf`);
    }
  }, [processor, isCustomFileName]);

  // Live PDF preview blob generator with debounce to avoid reload flicker on typing
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      try {
        const blob = generateCloseAccountPdfBlob({
          processor,
          reason: reason.trim() || 'N/A'
        });
        const url = URL.createObjectURL(blob);
        if (active) {
          setPdfPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        }
      } catch (err) {
        console.error('Failed to create live PDF preview:', err);
      }
    }, 220);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [processor, reason]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  // Configure save folder via File System Access API
  const handleChooseFolder = async () => {
    if (typeof window.showDirectoryPicker === 'function') {
      try {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        setDirectoryHandle(handle);
        const name = handle.name || 'Selected Folder';
        setSavedFolderName(name);
        localStorage.setItem('close_account_save_folder_name', name);
        showToast(`Save folder set to "${name}"`, 'success');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          showToast('Could not access folder: ' + err.message, 'error');
        }
      }
    } else {
      // Fallback manual note for browsers without Directory Picker
      const promptName = window.prompt(
        'Enter preferred folder name/label for your records:',
        savedFolderName || 'Downloads'
      );
      if (promptName !== null) {
        const cleaned = promptName.trim() || 'Downloads';
        setSavedFolderName(cleaned);
        localStorage.setItem('close_account_save_folder_name', cleaned);
        showToast(`Save folder label set to "${cleaned}"`, 'info');
      }
    }
  };

  const handleResetFolder = () => {
    setDirectoryHandle(null);
    setSavedFolderName('');
    localStorage.removeItem('close_account_save_folder_name');
    showToast('Reset to default browser downloads', 'info');
  };

  const showToast = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  // Generate & Download/Save PDF
  const handleGeneratePdf = async () => {
    if (!reason.trim()) {
      showToast('Please enter a Reason for Closing before generating.', 'error');
      const reasonEl = document.getElementById('close-account-reason');
      if (reasonEl) reasonEl.focus();
      return;
    }

    setIsGenerating(true);
    try {
      const result = await saveOrDownloadCloseAccountPdf({
        processor,
        reason: reason.trim(),
        fileName: fileName || `Close_Account_${processor}.pdf`,
        dirHandle: directoryHandle
      });

      if (result.method === 'direct-folder') {
        showToast(`PDF saved directly to "${savedFolderName}" as "${result.fileName}"!`, 'success');
      } else {
        showToast(`PDF generated & downloaded as "${result.fileName}"!`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error generating PDF: ' + err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Preview generated PDF in a new tab
  const handlePreviewPdf = () => {
    try {
      const blob = generateCloseAccountPdfBlob({
        processor,
        reason: reason.trim() || 'N/A'
      });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error(err);
      showToast('Error generating preview: ' + err.message, 'error');
    }
  };

  const handleResetForm = () => {
    setReason('');
    setIsCustomFileName(false);
    setFileName(`Close_Account_${processor}.pdf`);
    showToast('Form reset', 'info');
  };

  return (
    <div className="tools-page-container">
      {/* Page Header */}
      <div className="tools-page-header">
        <div>
          <div className="tools-kicker">
            <span className="kicker-pill">
              <i className="bi bi-tools me-1" aria-hidden="true"></i> Support Utilities
            </span>
          </div>
          <h1>TOOLS & UTILITIES</h1>
          <p className="panel-subtitle">
            Specialized productivity utilities, document generators, and automated workflow tools.
          </p>
        </div>
        <button
          type="button"
          className="announcement-back-btn"
          onClick={onBackToDashboard}
          title="Return to Ticketing Dashboard"
        >
          <i className="bi bi-arrow-left" aria-hidden="true"></i> Back to Dashboard
        </button>
      </div>

      {/* Tools Hub Navigation Cards */}
      <div className="tools-nav-grid tools-nav-single">
        <div
          className={`tool-nav-card ${activeTool === 'close-account-pdf' ? 'active' : ''}`}
          onClick={() => setActiveTool('close-account-pdf')}
        >
          <div className="tool-card-icon-wrap" style={{ background: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6' }}>
            <i className="bi bi-file-earmark-pdf-fill"></i>
          </div>
          <div className="tool-card-info">
            <div className="tool-card-title-row">
              <h4>Close Account PDF Generator</h4>
              <span className="tool-badge-active">READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Toast */}
      {statusMessage && (
        <div className={`tools-toast ${statusMessage.type}`}>
          <i
            className={`bi ${
              statusMessage.type === 'success'
                ? 'bi-check-circle-fill'
                : statusMessage.type === 'error'
                ? 'bi-exclamation-triangle-fill'
                : 'bi-info-circle-fill'
            } me-2`}
          ></i>
          <span>{statusMessage.text}</span>
          <button type="button" className="tools-toast-close" onClick={() => setStatusMessage(null)}>
            <i className="bi bi-x"></i>
          </button>
        </div>
      )}

      {/* Active Tool View: Close Account PDF Generator */}
      {activeTool === 'close-account-pdf' && (
        <div className="tool-detail-section">
          <div className="tool-detail-header">
            <div className="tool-detail-header-top">
              <div className="tool-detail-badge">
                <i className="bi bi-file-earmark-pdf-fill me-1"></i> Close Account PDF Generator
              </div>
              <button
                type="button"
                className="btn-tools-settings"
                onClick={() => setShowFolderSettings(true)}
                title="Configure Save Folder"
              >
                <i className="bi bi-gear-fill me-1"></i>
                <span className="settings-btn-label">Folder Settings</span>
                {savedFolderName && (
                  <span className="settings-folder-chip" title={`Saving to ${savedFolderName}`}>
                    <i className="bi bi-folder-check me-1"></i>
                    {savedFolderName}
                  </span>
                )}
              </button>
            </div>
            <h2>Close Account Workflow PDF</h2>
          </div>

          <div className="tool-generator-grid">
            {/* Left Column: Form Controls */}
            <div className="tool-form-card">
              {/* 1. Processor Variant Selection */}
              <div className="form-group mb-4">
                <label className="form-label-header">
                  <span className="form-step-badge">1</span>
                  <span>Select Processor Variant</span>
                </label>
                <div className="processor-toggle-grid">
                  <div
                    className={`processor-card ${processor === 'NASHVILLE' ? 'selected' : ''}`}
                    onClick={() => {
                      setProcessor('NASHVILLE');
                      if (!isCustomFileName) setFileName('Close_Account_NASHVILLE.pdf');
                    }}
                  >
                    <div className="processor-card-radio">
                      <input
                        type="radio"
                        id="proc-nashville"
                        name="processor"
                        checked={processor === 'NASHVILLE'}
                        onChange={() => setProcessor('NASHVILLE')}
                      />
                    </div>
                    <div className="processor-card-content">
                      <div className="processor-title">NASHVILLE</div>
                    </div>
                  </div>

                  <div
                    className={`processor-card ${processor === 'TSYS' ? 'selected' : ''}`}
                    onClick={() => {
                      setProcessor('TSYS');
                      if (!isCustomFileName) setFileName('Close_Account_TSYS.pdf');
                    }}
                  >
                    <div className="processor-card-radio">
                      <input
                        type="radio"
                        id="proc-tsys"
                        name="processor"
                        checked={processor === 'TSYS'}
                        onChange={() => setProcessor('TSYS')}
                      />
                    </div>
                    <div className="processor-card-content">
                      <div className="processor-title">TSYS</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Reason for Closing */}
              <div className="form-group mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label htmlFor="close-account-reason" className="form-label-header m-0">
                    <span className="form-step-badge">2</span>
                    <span>Reason for Closing</span>
                  </label>
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                    {reason.length} characters
                  </span>
                </div>
                <textarea
                  id="close-account-reason"
                  className="form-control tool-textarea"
                  rows="4"
                  value={reason}
                  placeholder="Enter reason for closing the account..."
                  onChange={(e) => setReason(e.target.value)}
                ></textarea>
              </div>

              {/* 3. Output File Name */}
              <div className="form-group mb-4">
                <label htmlFor="close-account-filename" className="form-label-header">
                  <span className="form-step-badge">3</span>
                  <span>PDF File Name</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text tool-input-addon">
                    <i className="bi bi-file-earmark-pdf"></i>
                  </span>
                  <input
                    type="text"
                    id="close-account-filename"
                    className="form-control tool-input"
                    value={fileName}
                    onChange={(e) => {
                      setIsCustomFileName(true);
                      setFileName(e.target.value);
                    }}
                    placeholder={`Close_Account_${processor}.pdf`}
                  />
                  {isCustomFileName && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setIsCustomFileName(false);
                        setFileName(`Close_Account_${processor}.pdf`);
                      }}
                      title="Reset to default file name"
                    >
                      Reset Name
                    </button>
                  )}
                </div>
                <div className="form-text-hint">
                  The generated file will be saved with this name. (.pdf will be added automatically if omitted)
                </div>
              </div>

              {/* Generator Actions */}
              <div className="tool-actions-bar">
                <button
                  type="button"
                  className="btn-tool-primary"
                  onClick={handleGeneratePdf}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-file-earmark-pdf-fill me-2"></i>
                      Generate & Save PDF
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-tool-secondary"
                  onClick={handlePreviewPdf}
                  title="View PDF preview in browser tab"
                >
                  <i className="bi bi-box-arrow-up-right me-1"></i> Preview in Tab
                </button>

                <button
                  type="button"
                  className="btn-tool-ghost"
                  onClick={handleResetForm}
                  title="Reset reason and inputs"
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i> Reset
                </button>
              </div>
            </div>

            {/* Right Column: Live PDF Document Preview */}
            <div className="tool-preview-card pdf-preview-card-wrap">
              <div className="preview-header">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-file-earmark-pdf-fill" style={{ color: '#ef4444', fontSize: '1.15rem' }}></i>
                  <h5 className="m-0" style={{ fontSize: '0.92rem', fontWeight: '700' }}>PDF Document Preview</h5>
                  <span className="preview-proc-badge">{processor}</span>
                </div>

                <div className="preview-header-controls">
                  <div className="preview-mode-toggle">
                    <button
                      type="button"
                      className={`btn-preview-mode ${previewMode === 'pdf' ? 'active' : ''}`}
                      onClick={() => setPreviewMode('pdf')}
                      title="Embedded Vector PDF Viewer"
                    >
                      <i className="bi bi-file-earmark-pdf me-1"></i> PDF View
                    </button>
                    <button
                      type="button"
                      className={`btn-preview-mode ${previewMode === 'sheet' ? 'active' : ''}`}
                      onClick={() => setPreviewMode('sheet')}
                      title="Document Paper Sheet View"
                    >
                      <i className="bi bi-file-text me-1"></i> Paper Sheet
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn-preview-action"
                    onClick={handlePreviewPdf}
                    title="Open PDF in new tab"
                  >
                    <i className="bi bi-box-arrow-up-right"></i>
                  </button>
                </div>
              </div>

              {previewMode === 'pdf' ? (
                <div className="pdf-preview-canvas">
                  {pdfPreviewUrl ? (
                    <iframe
                      src={`${pdfPreviewUrl}#toolbar=1&navpanes=0&view=FitH`}
                      className="pdf-preview-iframe"
                      title="Close Account PDF Live Preview"
                    />
                  ) : (
                    <div className="pdf-loading-placeholder">
                      <div className="spinner-border text-primary mb-2" role="status"></div>
                      <span>Rendering PDF Preview...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pdf-sheet-canvas">
                  <div className="sheet-page-toolbar">
                    <div className="d-flex align-items-center gap-2">
                      <span className="sheet-page-label">Page:</span>
                      <button
                        type="button"
                        className={`btn-sheet-page ${sheetPage === 1 ? 'active' : ''}`}
                        onClick={() => setSheetPage(1)}
                      >
                        1
                      </button>
                      <button
                        type="button"
                        className={`btn-sheet-page ${sheetPage === 2 ? 'active' : ''}`}
                        onClick={() => setSheetPage(2)}
                      >
                        2
                      </button>
                    </div>
                    <span className="sheet-page-count">Showing Page {sheetPage} of 2</span>
                  </div>

                  {/* Realistic White Paper Sheet */}
                  <div className="pdf-sheet-paper">
                    {sheetPage === 1 ? (
                      <div className="sheet-content">
                        {/* Title */}
                        <div className="sheet-header">
                          <h3 className="sheet-title">CLOSE ACCOUNT CHECKLIST AND PROCESS</h3>
                        </div>

                        {/* Section 1 */}
                        <div className="sheet-section">
                          <div className="sheet-sec-heading">1.  Closure Request Verification</div>
                          <div className="sheet-item">
                            <span className="sheet-check checked">&#x2612;</span>
                            <span>Verify closure request directly with merchant owner / authorized signer</span>
                          </div>
                          <div className="sheet-item">
                            <span className="sheet-check checked">&#x2612;</span>
                            <span>
                              Reason for Closing:{' '}
                              <strong className="sheet-reason-text">
                                {reason.trim() || '______________________________________'}
                              </strong>
                            </span>
                          </div>
                          <div className="sheet-item">
                            <span className="sheet-check checked">&#x2612;</span>
                            <span>Check for outstanding support tickets, disputes, or chargebacks</span>
                          </div>
                        </div>

                        {/* Section 2 */}
                        <div className="sheet-section">
                          <div className="sheet-sec-heading">2.  Financial Obligations & Batch Settlement</div>
                          <div className="sheet-item">
                            <span className="sheet-check checked">&#x2612;</span>
                            <span>Ensure all open batches are settled and confirmed</span>
                          </div>
                          <div className="sheet-item">
                            <span className="sheet-check checked">&#x2612;</span>
                            <span>Check for negative balance or pending processing fees</span>
                          </div>
                          <div className="sheet-item">
                            <span className="sheet-check checked">&#x2612;</span>
                            <span>Notify merchant of any final billing cycle or fee deductions</span>
                          </div>
                        </div>

                        {/* Section 3 */}
                        <div className="sheet-section">
                          <div className="sheet-sec-heading">3.  First Data (FD) Workflow</div>
                          {[
                            'Log in to First Data processing platform / portal',
                            'Search merchant using Merchant ID (MID) and verify account details',
                            'Submit closure request / update account status to closed/inactive',
                            'Verify terminal de-allocation in FD system'
                          ].map((t) => (
                            <div key={t} className="sheet-item">
                              <span className={`sheet-check ${processor === 'NASHVILLE' ? 'checked' : 'unchecked'}`}>
                                {processor === 'NASHVILLE' ? '\u2612' : '\u2610'}
                              </span>
                              <span className={processor === 'NASHVILLE' ? 'text-active' : 'text-muted-opt'}>{t}</span>
                            </div>
                          ))}
                        </div>

                        {/* Section 4 */}
                        <div className="sheet-section">
                          <div className="sheet-sec-heading">4.  TSYS Workflow</div>
                          {[
                            'Access TSYS merchant management platform',
                            'Locate merchant account and review current processing parameters',
                            'Process account closure / termination code in TSYS',
                            'Confirm closure effective date and zero out recurring billing',
                            'Archive TSYS terminal and processing profile'
                          ].map((t) => (
                            <div key={t} className="sheet-item">
                              <span className={`sheet-check ${processor === 'TSYS' ? 'checked' : 'unchecked'}`}>
                                {processor === 'TSYS' ? '\u2612' : '\u2610'}
                              </span>
                              <span className={processor === 'TSYS' ? 'text-active' : 'text-muted-opt'}>{t}</span>
                            </div>
                          ))}
                        </div>

                        {/* Section 5 (Start on Page 1) */}
                        <div className="sheet-section">
                          <div className="sheet-sec-heading">5.  Equipment Handling & Returns</div>
                          <div className="sheet-item">
                            <span className="sheet-check checked">&#x2612;</span>
                            <span>Identify leased or owned physical POS terminal equipment</span>
                          </div>
                          <div className="sheet-item">
                            <span className="sheet-check checked">&#x2612;</span>
                            <span>If leased: issue return shipping labels and track delivery</span>
                          </div>
                        </div>

                        <div className="sheet-page-footer">Page 1 of 2</div>
                      </div>
                    ) : (
                      <div className="sheet-content">
                        {/* Continuation of Section 5 */}
                        <div className="sheet-section">
                          <div className="sheet-item">
                            <span className="sheet-check checked">&#x2612;</span>
                            <span>If merchant-owned: ensure encryption keys and remote access are wiped</span>
                          </div>
                        </div>

                        {/* Section 6 */}
                        <div className="sheet-section">
                          <div className="sheet-sec-heading">6.  Account Deactivation in Internal Systems</div>
                          {[
                            'Update CRM / ticketing system account status to "Closed"',
                            'Disable gateway access (Authorize.Net, NMI, etc.) if applicable',
                            'Remove or cancel active recurring subscription / software licenses',
                            'Record closure reason and final agent notes in CRM'
                          ].map((t) => (
                            <div key={t} className="sheet-item">
                              <span className="sheet-check checked">&#x2612;</span>
                              <span>{t}</span>
                            </div>
                          ))}
                        </div>

                        {/* Section 7 */}
                        <div className="sheet-section">
                          <div className="sheet-sec-heading">7.  Merchant Confirmation & Communication</div>
                          {[
                            'Send official Close Account confirmation email to merchant of record',
                            'Provide summary of final billing, equipment status, and effective date',
                            'Advise merchant on PCI DSS record retention requirements (minimum 18 months)'
                          ].map((t) => (
                            <div key={t} className="sheet-item">
                              <span className="sheet-check checked">&#x2612;</span>
                              <span>{t}</span>
                            </div>
                          ))}
                        </div>

                        {/* Section 8 */}
                        <div className="sheet-section">
                          <div className="sheet-sec-heading">8.  Final Documentation & Ticket Resolution</div>
                          {[
                            'Attach completed Close Account checklist to support ticket',
                            'Confirm no pending chargeback liabilities with risk department',
                            'Close ticket and mark resolved in support portal'
                          ].map((t) => (
                            <div key={t} className="sheet-item">
                              <span className="sheet-check checked">&#x2612;</span>
                              <span>{t}</span>
                            </div>
                          ))}
                        </div>

                        <div className="sheet-page-footer">Page 2 of 2</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Folder Settings Modal */}
      {showFolderSettings && (
        <div className="folder-settings-modal-overlay" onClick={() => setShowFolderSettings(false)}>
          <div className="folder-settings-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="folder-settings-modal-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-gear-fill" style={{ color: 'var(--accent, #00d2b4)', fontSize: '1.2rem' }}></i>
                <h4 className="m-0" style={{ fontSize: '1.1rem', fontWeight: '700' }}>Save Folder Settings</h4>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setShowFolderSettings(false)}
                title="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="folder-settings-modal-body">
              <p className="folder-settings-info">
                Configure where generated PDFs are saved. When a folder is selected via the directory picker (supported in Chrome/Edge), PDFs are saved directly without standard download prompts.
              </p>
              <div className="folder-config-card">
                <div className="folder-icon-wrap">
                  <i className="bi bi-folder2-open"></i>
                </div>
                <div className="folder-details">
                  <div className="folder-name-label">
                    {savedFolderName ? (
                      <>
                        <strong style={{ color: 'var(--text-primary, #ffffff)' }}>{savedFolderName}</strong>
                        {directoryHandle && <span className="folder-status-badge">Direct Write Active</span>}
                      </>
                    ) : (
                      <span className="text-muted">Standard Browser Downloads (Default)</span>
                    )}
                  </div>
                  <div className="folder-sub">
                    {savedFolderName
                      ? 'PDFs will be saved here automatically (remembered in browser).'
                      : 'Choose a dedicated folder or keep standard Downloads.'}
                  </div>
                </div>
              </div>
            </div>
            <div className="folder-settings-modal-footer">
              {savedFolderName && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger me-auto"
                  onClick={handleResetFolder}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i> Reset to Default
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleChooseFolder}
              >
                <i className="bi bi-folder-symlink me-1"></i> {savedFolderName ? 'Change Folder' : 'Select Folder'}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setShowFolderSettings(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
