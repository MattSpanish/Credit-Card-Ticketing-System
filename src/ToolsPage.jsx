import React, { useState, useEffect, useMemo } from 'react';
import {
  generateCloseAccountPdfBlob,
  saveOrDownloadCloseAccountPdf,
  CLOSE_ACCOUNT_WORKFLOW_SECTIONS,
  getDefaultCheckboxState
} from './closeAccountPdfGenerator';

export default function ToolsPage({ onBackToDashboard }) {
  // Currently active tool inside the Tools Hub
  const [activeTool, setActiveTool] = useState('close-account-pdf');

  // Generator form state
  const [processor, setProcessor] = useState('NASHVILLE'); // 'NASHVILLE' or 'TSYS'
  const [reason, setReason] = useState('');
  const [fileName, setFileName] = useState('Close_Account_NASHVILLE.pdf');
  const [isCustomFileName, setIsCustomFileName] = useState(false);

  // Editable Checkbox States mapped by item id
  const [checkedItems, setCheckedItems] = useState(() => getDefaultCheckboxState('NASHVILLE'));
  const [showChecklistDrawer, setShowChecklistDrawer] = useState(false);

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

  // Select processor variant: automatically re-applies default checkbox settings for that processor
  const handleSelectProcessor = (selectedProc) => {
    setProcessor(selectedProc);
    setCheckedItems(getDefaultCheckboxState(selectedProc));
    if (!isCustomFileName) {
      setFileName(`Close_Account_${selectedProc}.pdf`);
    }
  };

  // Toggle individual item checkbox
  const handleToggleCheckbox = (id) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Reset checkboxes to default for currently selected processor
  const handleResetCheckboxes = () => {
    setCheckedItems(getDefaultCheckboxState(processor));
    showToast(`Reset to default ${processor} checkboxes`, 'info');
  };

  // Check all items
  const handleCheckAll = () => {
    const allChecked = {};
    CLOSE_ACCOUNT_WORKFLOW_SECTIONS.forEach((sec) => {
      sec.items.forEach((item) => {
        allChecked[item.id] = true;
      });
    });
    setCheckedItems(allChecked);
    showToast('All items checked', 'info');
  };

  // Uncheck all items
  const handleUncheckAll = () => {
    const allUnchecked = {};
    CLOSE_ACCOUNT_WORKFLOW_SECTIONS.forEach((sec) => {
      sec.items.forEach((item) => {
        allUnchecked[item.id] = false;
      });
    });
    setCheckedItems(allUnchecked);
    showToast('All items unchecked', 'info');
  };

  // Counts for UI badge
  const totalCheckboxes = useMemo(() => {
    return CLOSE_ACCOUNT_WORKFLOW_SECTIONS.reduce((acc, sec) => acc + sec.items.length, 0);
  }, []);

  const activeCheckedCount = useMemo(() => {
    return Object.values(checkedItems).filter(Boolean).length;
  }, [checkedItems]);

  // Live PDF preview blob generator with debounce
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const blob = await generateCloseAccountPdfBlob({
          processor,
          reason: reason.trim() || 'N/A',
          checkedItems
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
  }, [processor, reason, checkedItems]);

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
        checkedItems,
        fileName: fileName || `Close_Account_${processor}.pdf`,
        dirHandle: directoryHandle
      });

      if (result.method === 'direct-folder') {
        showToast(`PDF saved directly to "${savedFolderName}" as "${result.fileName}"!`, 'success');
      } else {
        showToast(`PDF saved to your Downloads folder as "${result.fileName}"!`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error generating PDF: ' + err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Preview generated PDF in a new tab
  const handlePreviewPdf = async () => {
    try {
      const blob = await generateCloseAccountPdfBlob({
        processor,
        reason: reason.trim() || 'N/A',
        checkedItems
      });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error(err);
      showToast('Error generating preview: ' + err.message, 'error');
    }
  };

  return (
    <div className="tools-page-container">
      {/* Toast Banner */}
      {statusMessage && (
        <div className={`kb-toast-alert kb-toast-${statusMessage.type}`} style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
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
        </div>
      )}

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
            </div>
            <p className="tool-card-desc">
              Generate 2-page Close Processing Accounts Workflow PDFs with interactive checkboxes and custom reason notes.
            </p>
          </div>
        </div>
      </div>

      {/* Active Tool View: Close Account PDF Generator */}
      {activeTool === 'close-account-pdf' && (
        <div className="tool-detail-section">
          <div className="tool-detail-header">
            <div className="tool-detail-header-top">
              <h2 className="tool-detail-heading">Close Account PDF Generator</h2>
              <button
                type="button"
                className="btn-tools-settings"
                onClick={() => setShowFolderSettings(true)}
                title={savedFolderName ? `Saving to: ${savedFolderName}` : "Configure Save Folder"}
              >
                <i className="bi bi-gear-fill me-1"></i>
                <span className="settings-btn-label">Folder Settings</span>
              </button>
            </div>
          </div>

          <div className="tool-generator-grid">
            {/* Left Column: Form Controls */}
            <div className="tool-form-card">
              {/* 1. Processor Variant Selection */}
              <div className="form-group mb-3">
                <label className="form-label-header">
                  <span className="form-step-badge">1</span>
                  <span>Select Processor Variant</span>
                </label>
                <div className="processor-toggle-grid">
                  <div
                    className={`processor-card ${processor === 'NASHVILLE' ? 'selected' : ''}`}
                    onClick={() => handleSelectProcessor('NASHVILLE')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="processor-card-radio">
                      <input
                        type="radio"
                        id="proc-nashville"
                        name="processor"
                        checked={processor === 'NASHVILLE'}
                        onChange={() => handleSelectProcessor('NASHVILLE')}
                      />
                    </div>
                    <div className="processor-card-content">
                      <div className="processor-title">NASHVILLE</div>
                      <div className="processor-desc" style={{ fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)' }}>
                        First Data (FD) Workflow Checked
                      </div>
                    </div>
                  </div>

                  <div
                    className={`processor-card ${processor === 'TSYS' ? 'selected' : ''}`}
                    onClick={() => handleSelectProcessor('TSYS')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="processor-card-radio">
                      <input
                        type="radio"
                        id="proc-tsys"
                        name="processor"
                        checked={processor === 'TSYS'}
                        onChange={() => handleSelectProcessor('TSYS')}
                      />
                    </div>
                    <div className="processor-card-content">
                      <div className="processor-title">TSYS</div>
                      <div className="processor-desc" style={{ fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)' }}>
                        TSYS Workflow Checked
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Reason for Closing */}
              <div className="form-group mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label htmlFor="close-account-reason" className="form-label-header m-0">
                    <span className="form-step-badge">2</span>
                    <span>Reason for Closing</span>
                  </label>
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                    {reason.length} characters
                  </span>
                </div>
                <textarea
                  id="close-account-reason"
                  className="tool-textarea"
                  rows="2"
                  value={reason}
                  placeholder="Enter reason for closing the account..."
                  onChange={(e) => setReason(e.target.value)}
                ></textarea>
              </div>

              {/* 3. Editable Workflow Checkboxes Controls */}
              <div className="form-group mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label-header m-0">
                    <span className="form-step-badge">3</span>
                    <span>Workflow Checkboxes</span>
                  </label>
                  <span className="badge-checkbox-count">
                    {activeCheckedCount} / {totalCheckboxes} Checked
                  </span>
                </div>
                <p className="form-hint-text" style={{ fontSize: '0.76rem', color: 'var(--text-muted, #94a3b8)', margin: '4px 0 8px' }}>
                  Auto-applied defaults for <strong>{processor}</strong>. Click any checkbox directly in the preview or use actions below to customize:
                </p>

                <div className="checkbox-quick-actions">
                  <button
                    type="button"
                    className="btn-checkbox-action"
                    onClick={handleResetCheckboxes}
                    title={`Reset checkboxes to ${processor} defaults`}
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i> Defaults ({processor})
                  </button>
                  <button
                    type="button"
                    className="btn-checkbox-action"
                    onClick={handleCheckAll}
                    title="Check all items"
                  >
                    <i className="bi bi-check-all me-1"></i> Check All
                  </button>
                  <button
                    type="button"
                    className="btn-checkbox-action"
                    onClick={handleUncheckAll}
                    title="Uncheck all items"
                  >
                    <i className="bi bi-dash-circle me-1"></i> Uncheck All
                  </button>
                  <button
                    type="button"
                    className="btn-checkbox-action btn-checkbox-action-toggle"
                    onClick={() => setShowChecklistDrawer(!showChecklistDrawer)}
                    title="View item checklist drawer"
                  >
                    <i className={`bi ${showChecklistDrawer ? 'bi-chevron-up' : 'bi-list-check'} me-1`}></i>
                    {showChecklistDrawer ? 'Hide List' : 'Edit in List'}
                  </button>
                </div>

                {/* Collapsible Form Checklist Drawer */}
                {showChecklistDrawer && (
                  <div className="form-checklist-drawer">
                    {CLOSE_ACCOUNT_WORKFLOW_SECTIONS.map((sec) => (
                      <div key={sec.secNum} className="form-checklist-sec">
                        <div className="form-checklist-sec-title">
                          {sec.secNum}. {sec.title}
                        </div>
                        <div className="form-checklist-items">
                          {sec.items.map((item) => (
                            <label key={item.id} className="form-checklist-item-row">
                              <input
                                type="checkbox"
                                checked={Boolean(checkedItems[item.id])}
                                onChange={() => handleToggleCheckbox(item.id)}
                              />
                              <span className="form-checklist-item-text">{item.text}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Output File Name */}
              <div className="form-group mb-3">
                <label htmlFor="close-account-filename" className="form-label-header">
                  <span className="form-step-badge">4</span>
                  <span>PDF File Name</span>
                </label>
                <input
                  type="text"
                  id="close-account-filename"
                  className="tool-input"
                  value={fileName}
                  onChange={(e) => {
                    setIsCustomFileName(true);
                    setFileName(e.target.value);
                  }}
                  placeholder={`Close_Account_${processor}.pdf`}
                />
              </div>

              {/* Generator Actions */}
              <div className="tool-actions-bar">
                <button
                  type="button"
                  className="btn-tool-primary btn-sm"
                  onClick={handleGeneratePdf}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-file-earmark-pdf-fill me-1"></i>
                      Generate PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Live PDF Document Preview */}
            <div className="tool-preview-card pdf-preview-card-wrap">
              <div className="preview-header">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <i className="bi bi-file-earmark-pdf-fill" style={{ color: '#ef4444', fontSize: '1.15rem' }}></i>
                  <h5 className="m-0" style={{ fontSize: '0.92rem', fontWeight: '700' }}>PDF Document Preview</h5>
                  <span className="preview-proc-badge">{processor}</span>
                  <span className="preview-interactive-badge" title="Click any checkbox on the sheet to toggle">
                    <i className="bi bi-hand-index-thumb me-1"></i> Click to Toggle
                  </span>
                </div>

                <div className="preview-header-controls">
                  <div className="sheet-quick-nav">
                    <button
                      type="button"
                      className="btn-quick-nav"
                      onClick={() => {
                        const el = document.getElementById('doc-sheet-page-1');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      title="Scroll to Page 1"
                    >
                      Page 1
                    </button>
                    <button
                      type="button"
                      className="btn-quick-nav"
                      onClick={() => {
                        const el = document.getElementById('doc-sheet-page-2');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      title="Scroll to Page 2"
                    >
                      Page 2
                    </button>
                  </div>
                </div>
              </div>

              {/* Continuous 2-Page Document Canvas with Interactive Checkboxes */}
              <div className="pdf-sheet-canvas">
                {/* PAGE 1 */}
                <div id="doc-sheet-page-1" className="pdf-sheet-paper">
                  <div className="sheet-content">
                    {/* Document Title */}
                    <div className="sheet-header">
                      <div className="sheet-title">Close Processing Accounts Workflow (First Data & TSYS)</div>
                    </div>

                    {/* Section 1 */}
                    <div className="sheet-section">
                      <div className="sheet-sec-heading">1.  Closure Request Verification</div>
                      <div
                        className={`sheet-item sheet-item-interactive ${checkedItems['sec1_confirm_request'] ? 'is-checked' : 'is-unchecked'}`}
                        onClick={() => handleToggleCheckbox('sec1_confirm_request')}
                        title="Click to toggle checkbox"
                      >
                        <span className={`sheet-check ${checkedItems['sec1_confirm_request'] ? 'checked' : 'unchecked'}`}>
                          {checkedItems['sec1_confirm_request'] ? '\u2612' : '\u2610'}
                        </span>
                        <span>Confirm closure request from client (email/case/ticket)</span>
                      </div>
                      <div
                        className={`sheet-item sheet-item-interactive ${checkedItems['sec1_confirm_reason'] ? 'is-checked' : 'is-unchecked'}`}
                        onClick={() => handleToggleCheckbox('sec1_confirm_reason')}
                        title="Click to toggle checkbox"
                      >
                        <span className={`sheet-check ${checkedItems['sec1_confirm_reason'] ? 'checked' : 'unchecked'}`}>
                          {checkedItems['sec1_confirm_reason'] ? '\u2612' : '\u2610'}
                        </span>
                        <span>Confirm closure reason</span>
                      </div>
                      <div className="sheet-reason-line">
                        <span>
                          Reason for Closing: <span className="sheet-reason-text">{reason.trim() || ''}</span>
                        </span>
                      </div>
                      <div
                        className={`sheet-item sheet-item-interactive ${checkedItems['sec1_check_terms'] ? 'is-checked' : 'is-unchecked'}`}
                        onClick={() => handleToggleCheckbox('sec1_check_terms')}
                        title="Click to toggle checkbox"
                      >
                        <span className={`sheet-check ${checkedItems['sec1_check_terms'] ? 'checked' : 'unchecked'}`}>
                          {checkedItems['sec1_check_terms'] ? '\u2612' : '\u2610'}
                        </span>
                        <span>Check contract terms / early termination fees</span>
                      </div>
                    </div>

                    {/* Section 2 */}
                    <div className="sheet-section">
                      <div className="sheet-sec-heading">2.  Account Review</div>
                      {[
                        { id: 'sec2_no_pending_txns', text: 'Ensure no pending transactions' },
                        { id: 'sec2_batches_settled', text: 'Confirm all batches are settled' },
                        { id: 'sec2_check_disputes', text: 'Check for disputes/chargebacks' },
                        { id: 'sec2_no_pending_deposits', text: 'Verify no pending deposits' }
                      ].map((item) => (
                        <div
                          key={item.id}
                          className={`sheet-item sheet-item-interactive ${checkedItems[item.id] ? 'is-checked' : 'is-unchecked'}`}
                          onClick={() => handleToggleCheckbox(item.id)}
                          title="Click to toggle checkbox"
                        >
                          <span className={`sheet-check ${checkedItems[item.id] ? 'checked' : 'unchecked'}`}>
                            {checkedItems[item.id] ? '\u2612' : '\u2610'}
                          </span>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Section 3: First Data (FD) Workflow */}
                    <div className="sheet-section">
                      <div className="sheet-sec-heading">3.  First Data (FD) Workflow</div>
                      {[
                        { id: 'sec3_login_fd', text: 'Log in to First Data platform' },
                        { id: 'sec3_search_acct', text: 'Search merchant account' },
                        { id: 'sec3_verify_details', text: 'Verify account details and status' },
                        { id: 'sec3_close_fd', text: 'Close merchant account in FD system' }
                      ].map((item) => (
                        <div
                          key={item.id}
                          className={`sheet-item sheet-item-interactive ${checkedItems[item.id] ? 'is-checked' : 'is-unchecked'}`}
                          onClick={() => handleToggleCheckbox(item.id)}
                          title="Click to toggle checkbox"
                        >
                          <span className={`sheet-check ${checkedItems[item.id] ? 'checked' : 'unchecked'}`}>
                            {checkedItems[item.id] ? '\u2612' : '\u2610'}
                          </span>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Section 4: TSYS Workflow */}
                    <div className="sheet-section">
                      <div className="sheet-sec-heading">4.  TSYS Workflow</div>
                      {[
                        { id: 'sec4_access_tsys', text: 'Access TSYS system' },
                        { id: 'sec4_locate_mid', text: 'Locate merchant account using MID' },
                        { id: 'sec4_verify_status', text: 'Verify account status and activity' },
                        { id: 'sec4_close_tsys', text: 'Close account in TSYS' },
                        { id: 'sec4_remove_configs', text: 'Remove terminal configurations' }
                      ].map((item) => (
                        <div
                          key={item.id}
                          className={`sheet-item sheet-item-interactive ${checkedItems[item.id] ? 'is-checked' : 'is-unchecked'}`}
                          onClick={() => handleToggleCheckbox(item.id)}
                          title="Click to toggle checkbox"
                        >
                          <span className={`sheet-check ${checkedItems[item.id] ? 'checked' : 'unchecked'}`}>
                            {checkedItems[item.id] ? '\u2612' : '\u2610'}
                          </span>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Section 5 (Page 1 items) */}
                    <div className="sheet-section">
                      <div className="sheet-sec-heading">5.  Equipment Handling</div>
                      {[
                        { id: 'sec5_identify_terminals', text: 'Identify all active terminals/devices' },
                        { id: 'sec5_confirm_returns', text: 'Confirm return requirements (with Krupali)' },
                        { id: 'sec5_send_instructions', text: 'Send return instructions to client with return label' }
                      ].map((item) => (
                        <div
                          key={item.id}
                          className={`sheet-item sheet-item-interactive ${checkedItems[item.id] ? 'is-checked' : 'is-unchecked'}`}
                          onClick={() => handleToggleCheckbox(item.id)}
                          title="Click to toggle checkbox"
                        >
                          <span className={`sheet-check ${checkedItems[item.id] ? 'checked' : 'unchecked'}`}>
                            {checkedItems[item.id] ? '\u2612' : '\u2610'}
                          </span>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>

                    <div className="sheet-page-footer">Page 1 of 2</div>
                  </div>
                </div>

                {/* PAGE 2 */}
                <div id="doc-sheet-page-2" className="pdf-sheet-paper">
                  <div className="sheet-content">
                    {/* Continuation of Section 5 */}
                    <div className="sheet-section">
                      {[
                        {
                          id: 'sec5_deactivate_devices',
                          text: 'Deactivate devices in system / Disable any gateway/API integrations (Dejavoo, Valor, Clover, P98 Terminals, Auth.net, NMI, P98 Gateway, Clover Software)'
                        },
                        {
                          id: 'sec5_deactivate_buypass',
                          text: 'Deactivate ALL buypass IDs under the MID if it is a gas station. (This is done in buypass tools, disable the Buypass Merchant ID and Terminal ID)'
                        }
                      ].map((item) => (
                        <div
                          key={item.id}
                          className={`sheet-item sheet-item-interactive ${checkedItems[item.id] ? 'is-checked' : 'is-unchecked'}`}
                          onClick={() => handleToggleCheckbox(item.id)}
                          title="Click to toggle checkbox"
                        >
                          <span className={`sheet-check ${checkedItems[item.id] ? 'checked' : 'unchecked'}`}>
                            {checkedItems[item.id] ? '\u2612' : '\u2610'}
                          </span>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Section 6 */}
                    <div className="sheet-section">
                      <div className="sheet-sec-heading">6.  Financial Closure (Verify with Billing Department)</div>
                      {[
                        { id: 'sec6_apply_fees', text: 'Apply final fees' },
                        { id: 'sec6_check_balances', text: 'Check outstanding balances' },
                        { id: 'sec6_final_adjustments', text: 'Process final billing adjustments' }
                      ].map((item) => (
                        <div
                          key={item.id}
                          className={`sheet-item sheet-item-interactive ${checkedItems[item.id] ? 'is-checked' : 'is-unchecked'}`}
                          onClick={() => handleToggleCheckbox(item.id)}
                          title="Click to toggle checkbox"
                        >
                          <span className={`sheet-check ${checkedItems[item.id] ? 'checked' : 'unchecked'}`}>
                            {checkedItems[item.id] ? '\u2612' : '\u2610'}
                          </span>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Section 7 */}
                    <div className="sheet-section">
                      <div className="sheet-sec-heading">7.  Communication</div>
                      {[
                        { id: 'sec7_send_email', text: 'Send closure confirmation email/message' },
                        { id: 'sec7_effective_date', text: 'Include closure effective date' },
                        { id: 'sec7_final_statement', text: 'Provide final statement if needed' }
                      ].map((item) => (
                        <div
                          key={item.id}
                          className={`sheet-item sheet-item-interactive ${checkedItems[item.id] ? 'is-checked' : 'is-unchecked'}`}
                          onClick={() => handleToggleCheckbox(item.id)}
                          title="Click to toggle checkbox"
                        >
                          <span className={`sheet-check ${checkedItems[item.id] ? 'checked' : 'unchecked'}`}>
                            {checkedItems[item.id] ? '\u2612' : '\u2610'}
                          </span>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Section 8 */}
                    <div className="sheet-section">
                      <div className="sheet-sec-heading">8.  Final Verification</div>
                      {[
                        { id: 'sec8_confirm_closed', text: 'Confirm account closed in all systems' },
                        { id: 'sec8_no_active_services', text: 'Ensure no active services remain' }
                      ].map((item) => (
                        <div
                          key={item.id}
                          className={`sheet-item sheet-item-interactive ${checkedItems[item.id] ? 'is-checked' : 'is-unchecked'}`}
                          onClick={() => handleToggleCheckbox(item.id)}
                          title="Click to toggle checkbox"
                        >
                          <span className={`sheet-check ${checkedItems[item.id] ? 'checked' : 'unchecked'}`}>
                            {checkedItems[item.id] ? '\u2612' : '\u2610'}
                          </span>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>

                    <div className="sheet-page-footer">Page 2 of 2</div>
                  </div>
                </div>
              </div>
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
                By default, PDFs automatically save to your computer's <strong>Downloads</strong> folder. You can optionally select a custom folder below.
              </p>
              <div className="folder-config-card">
                <div className="folder-icon-wrap">
                  <i className="bi bi-folder2-open"></i>
                </div>
                <div className="folder-details">
                  <div className="folder-name-label">
                    {savedFolderName ? (
                      <>
                        <strong style={{ color: 'var(--text-primary, #ffffff)' }}>Custom Folder: {savedFolderName}</strong>
                        {directoryHandle && <span className="folder-status-badge">Direct Write Active</span>}
                      </>
                    ) : (
                      <strong style={{ color: 'var(--text-primary, #ffffff)' }}>Default Downloads Folder</strong>
                    )}
                  </div>
                  <div className="folder-sub">
                    {savedFolderName
                      ? `PDFs will be saved directly into "${savedFolderName}".`
                      : "Default: PDFs save automatically to your computer's Downloads folder."}
                  </div>
                </div>
              </div>
            </div>
            <div className="folder-settings-modal-footer">
              {savedFolderName && (
                <button
                  type="button"
                  className="btn-folder-modal-reset me-auto"
                  onClick={handleResetFolder}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i> Reset to Default
                </button>
              )}
              <button
                type="button"
                className="btn-folder-modal-choose"
                onClick={handleChooseFolder}
              >
                <i className="bi bi-folder2-open me-1"></i> {savedFolderName ? 'Change Folder' : 'Select Folder'}
              </button>
              <button
                type="button"
                className="btn-folder-modal-done"
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
