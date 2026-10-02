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
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Update default file name when processor changes (if user hasn't typed custom name)
  useEffect(() => {
    if (!isCustomFileName) {
      setFileName(`Close_Account_${processor}.pdf`);
    }
  }, [processor, isCustomFileName]);

  // Quick reason suggestions
  const QUICK_REASONS = [
    'Merchant requested closure',
    'Business ceased operations / Store closed',
    'Switched to another merchant provider',
    'Seasonal account closure',
    'High fees / rates dispute',
    'Account inactive / zero processing volume'
  ];

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
      <div className="tools-nav-grid">
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
            <p>Generate exact TSYS & NASHVILLE close processing workflow PDFs with auto-checkboxes and custom reason.</p>
          </div>
        </div>

        <div className="tool-nav-card disabled" title="Coming soon">
          <div className="tool-card-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
            <i className="bi bi-cpu-fill"></i>
          </div>
          <div className="tool-card-info">
            <div className="tool-card-title-row">
              <h4>Terminal Parameter Decoder</h4>
              <span className="tool-badge-soon">COMING SOON</span>
            </div>
            <p>Quick lookup and decoder for PAX, FD150, Valor, and Dejavoo merchant configuration strings.</p>
          </div>
        </div>

        <div className="tool-nav-card disabled" title="Coming soon">
          <div className="tool-card-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <i className="bi bi-calculator-fill"></i>
          </div>
          <div className="tool-card-info">
            <div className="tool-card-title-row">
              <h4>Interchange & Fee Estimator</h4>
              <span className="tool-badge-soon">COMING SOON</span>
            </div>
            <p>Estimate interchange fee adjustments, terminal return fee calculations, and billing credits.</p>
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
            <div className="tool-detail-badge">
              <i className="bi bi-file-earmark-pdf-fill me-1"></i> Close Account PDF Generator
            </div>
            <h2>Close Account Workflow PDF</h2>
            <p className="tool-detail-desc">
              Select the processor variant (TSYS or NASHVILLE), enter the closure reason, and generate the official 2-page PDF ready for archiving and compliance.
            </p>
          </div>

          <div className="tool-generator-grid">
            {/* Left Column: Form Controls */}
            <div className="tool-form-card">
              {/* 1. Processor Variant Selection */}
              <div className="form-group mb-4">
                <label className="form-label-header">
                  <span className="step-num">1</span> Select Processor Variant:
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
                      <div className="processor-subtitle">First Data (FD) Workflow</div>
                      <div className="processor-pills">
                        <span className="pill-check">FD Workflow: 4 Checked</span>
                        <span className="pill-uncheck">TSYS: 5 Unchecked</span>
                      </div>
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
                      <div className="processor-subtitle">TSYS Processing Platform</div>
                      <div className="processor-pills">
                        <span className="pill-uncheck">FD: 4 Unchecked</span>
                        <span className="pill-check">TSYS Workflow: 5 Checked</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Reason for Closing */}
              <div className="form-group mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label htmlFor="close-account-reason" className="form-label-header m-0">
                    <span className="step-num">2</span> Reason for Closing:
                  </label>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {reason.length} characters
                  </span>
                </div>
                <textarea
                  id="close-account-reason"
                  className="form-control tool-textarea"
                  rows="3"
                  value={reason}
                  placeholder="e.g., Merchant requested closure due to store relocation..."
                  onChange={(e) => setReason(e.target.value)}
                ></textarea>

                {/* Quick Reason Suggestions */}
                <div className="quick-chips-wrap mt-2">
                  <span className="quick-chips-label">Quick suggestions:</span>
                  <div className="quick-chips-list">
                    {QUICK_REASONS.map((qReason) => (
                      <button
                        key={qReason}
                        type="button"
                        className="quick-chip-btn"
                        onClick={() => setReason(qReason)}
                      >
                        {qReason}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Output File Name */}
              <div className="form-group mb-4">
                <label htmlFor="close-account-filename" className="form-label-header">
                  <span className="step-num">3</span> PDF File Name:
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

              {/* 4. Download / Save Path */}
              <div className="form-group mb-4">
                <label className="form-label-header">
                  <span className="step-num">4</span> Save / Download Folder:
                </label>
                <div className="folder-config-card">
                  <div className="folder-icon-wrap">
                    <i className="bi bi-folder2-open"></i>
                  </div>
                  <div className="folder-details">
                    <div className="folder-name-label">
                      {savedFolderName ? (
                        <>
                          <strong style={{ color: 'var(--text-main, #ffffff)' }}>{savedFolderName}</strong>
                          {directoryHandle && <span className="folder-status-badge">Direct Write Active</span>}
                        </>
                      ) : (
                        <span className="text-muted">Standard Browser Downloads (Default)</span>
                      )}
                    </div>
                    <div className="folder-sub">
                      {savedFolderName
                        ? 'PDFs will be saved here automatically (remembered in browser).'
                        : 'Choose a dedicated folder or use your standard Downloads directory.'}
                    </div>
                  </div>
                  <div className="folder-actions">
                    <button
                      type="button"
                      className="btn-folder-action"
                      onClick={handleChooseFolder}
                      title="Choose or set custom save directory"
                    >
                      <i className="bi bi-folder-symlink me-1"></i> {savedFolderName ? 'Change Folder' : 'Set Save Folder'}
                    </button>
                    {savedFolderName && (
                      <button
                        type="button"
                        className="btn-folder-action-reset"
                        onClick={handleResetFolder}
                        title="Reset to browser default"
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                    )}
                  </div>
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

            {/* Right Column: Live Template Preview & Summary */}
            <div className="tool-preview-card">
              <div className="preview-header">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-eye-fill" style={{ color: 'var(--accent, #00d2b4)' }}></i>
                  <h5>Template Structure & Verification</h5>
                </div>
                <span className="preview-proc-badge">{processor} VARIANT</span>
              </div>

              <div className="preview-doc-mockup">
                <div className="preview-doc-title">
                  Close Processing Accounts Workflow (First Data & TSYS)
                </div>

                <div className="preview-section-group">
                  <div className="preview-section-title">1. Closure Request Verification</div>
                  <div className="preview-item checked">
                    <i className="bi bi-check-square-fill"></i> Confirm closure request from client (email/case/ticket)
                  </div>
                  <div className="preview-item checked">
                    <i className="bi bi-check-square-fill"></i> Confirm closure reason
                  </div>
                  <div className="preview-reason-box">
                    <strong>Reason for Closing: </strong>
                    <span className={reason.trim() ? 'reason-filled' : 'reason-empty'}>
                      {reason.trim() || '(Enter reason in the form on the left)'}
                    </span>
                  </div>
                  <div className="preview-item checked">
                    <i className="bi bi-check-square-fill"></i> Check contract terms / early termination fees
                  </div>
                </div>

                <div className="preview-section-group">
                  <div className="preview-section-title">2. Account Review</div>
                  <div className="preview-item checked">
                    <i className="bi bi-check-square-fill"></i> Ensure no pending transactions
                  </div>
                  <div className="preview-item checked">
                    <i className="bi bi-check-square-fill"></i> Confirm all batches are settled
                  </div>
                  <div className="preview-item checked">
                    <i className="bi bi-check-square-fill"></i> Check for disputes/chargebacks
                  </div>
                  <div className="preview-item checked">
                    <i className="bi bi-check-square-fill"></i> Verify no pending deposits
                  </div>
                </div>

                {/* 3. First Data Workflow */}
                <div className={`preview-section-group ${processor === 'NASHVILLE' ? 'highlight-section' : 'dimmed-section'}`}>
                  <div className="preview-section-title d-flex justify-content-between">
                    <span>3. First Data (FD) Workflow</span>
                    <span className="badge-status">
                      {processor === 'NASHVILLE' ? 'CHECKED (NASHVILLE)' : 'UNCHECKED'}
                    </span>
                  </div>
                  {['Log in to First Data platform', 'Search merchant account', 'Verify account details and status', 'Close merchant account in FD system'].map(
                    (text) => (
                      <div key={text} className={`preview-item ${processor === 'NASHVILLE' ? 'checked' : 'unchecked'}`}>
                        <i className={`bi ${processor === 'NASHVILLE' ? 'bi-check-square-fill' : 'bi-square'}`}></i>
                        <span>{text}</span>
                      </div>
                    )
                  )}
                </div>

                {/* 4. TSYS Workflow */}
                <div className={`preview-section-group ${processor === 'TSYS' ? 'highlight-section' : 'dimmed-section'}`}>
                  <div className="preview-section-title d-flex justify-content-between">
                    <span>4. TSYS Workflow</span>
                    <span className="badge-status">
                      {processor === 'TSYS' ? 'CHECKED (TSYS)' : 'UNCHECKED'}
                    </span>
                  </div>
                  {['Access TSYS system', 'Locate merchant account using MID', 'Verify account status and activity', 'Close account in TSYS', 'Remove terminal configurations'].map(
                    (text) => (
                      <div key={text} className={`preview-item ${processor === 'TSYS' ? 'checked' : 'unchecked'}`}>
                        <i className={`bi ${processor === 'TSYS' ? 'bi-check-square-fill' : 'bi-square'}`}></i>
                        <span>{text}</span>
                      </div>
                    )
                  )}
                </div>

                <div className="preview-section-group">
                  <div className="preview-section-title">5. Equipment Handling & Page 2</div>
                  <div className="preview-item checked">
                    <i className="bi bi-check-square-fill"></i> Terminals, return requirements & shipping instructions
                  </div>
                  <div className="preview-item checked">
                    <i className="bi bi-check-square-fill"></i> Page 2: Financial Closure, Communication & Final Verification
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
