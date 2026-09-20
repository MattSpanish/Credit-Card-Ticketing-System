// src/ShiftReportPage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  fetchShiftReports,
  addShiftReport,
  updateShiftReport,
  deleteShiftReport,
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  getDefaultReportTemplate,
  calculateMorningDailyWorkMetrics,
  recalculateMorningReportText,
  detectShiftFromContent,
  SUPABASE_SQL_SCRIPT,
} from './supabaseShiftReports';

const SUPPORT_NAMES = ['HANZ', 'CHARLES', 'KENNETH', 'ADI', 'TATI', 'RONIE', 'SEAN'];
const STANDARD_SHIFTS = [
  '09:00PM TO 06:00AM',
  '05:00AM TO 02:00PM',
  '02:00PM TO 11:00PM',
];

function getTodayDateISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function ShiftReportPage({ onBackToDashboard }) {
  // Composer state
  const [reportText, setReportText] = useState('');
  const [reportDate, setReportDate] = useState(getTodayDateISO());
  const [author, setAuthor] = useState('');
  const [selectedShift, setSelectedShift] = useState('09:00PM TO 06:00AM');
  const [attachedImages, setAttachedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feed state
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('local'); // 'supabase' | 'local' | 'local-fallback'
  const [filterDate, setFilterDate] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [copiedImgKey, setCopiedImgKey] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Lightbox modal state
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  // Edit Shift Report modal state
  const [editingReport, setEditingReport] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editReportDate, setEditReportDate] = useState('');
  const [editImages, setEditImages] = useState([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Supabase modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load initial reports and config
  useEffect(() => {
    loadReports();
    const cfg = getSupabaseConfig();
    setSupabaseUrl(cfg.url);
    setSupabaseKey(cfg.key);
  }, []);

  async function loadReports() {
    setIsLoading(true);
    try {
      const res = await fetchShiftReports();
      setReports(res.reports || []);
      setSyncStatus(res.source);
    } catch (e) {
      console.error(e);
      setSyncStatus('local');
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(msg) {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3500);
  }

  // Handle template insert
  function handleInsertTemplate() {
    let dailyWorkMetrics = null;
    let toastMessage = 'Standard shift template inserted!';

    if (
      selectedShift === '05:00AM TO 02:00PM' ||
      selectedShift.includes('05:00AM TO 02:00PM') ||
      selectedShift.includes('5AM')
    ) {
      const calc = calculateMorningDailyWorkMetrics(reports, reportDate);
      dailyWorkMetrics = calc;

      if (calc.foundReports && calc.foundReports.length > 0) {
        const shiftsFound = calc.foundReports.map((f) => f.shift).join(' + ');
        toastMessage = `⚡ Auto-calculated from ${shiftsFound} on ${reportDate} (HRMS Review: ${calc.hrmsTicketReview}, Pending Review: ${calc.pendingTicketReview})`;
      } else {
        toastMessage = `Template inserted. (No previous shifts found for ${reportDate}; HRMS & Pending Ticket Review set to 0)`;
      }
    }

    const template = getDefaultReportTemplate(selectedShift, reportDate, dailyWorkMetrics);
    setReportText(template);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    showToast(toastMessage);
  }

  // Handle report text editing with dynamic live recalculation for 5AM-2PM Daily Work Report
  function handleReportTextChange(e) {
    const rawValue = e.target.value;
    const selStart = e.target.selectionStart;
    const selEnd = e.target.selectionEnd;

    const updatedValue = recalculateMorningReportText(rawValue, reports, reportDate);
    setReportText(updatedValue);

    if (textareaRef.current && selStart !== null && selStart !== undefined) {
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(selStart, selEnd);
        }
      });
    }
  }

  // Process image file for attachment
  function processImageFile(file) {
    if (!file || !file.type || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target.result;
      setAttachedImages((prev) => [
        ...prev,
        {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          dataUrl,
          name: file.name || `screenshot_${Date.now()}.png`,
          size: file.size,
        },
      ]);
      showToast('📷 Image attached to shift report!');
    };
    reader.readAsDataURL(file);
  }

  // WhatsApp-style Ctrl+V paste listener on chat box
  function handlePaste(e) {
    const clipboardData = e.clipboardData;
    if (!clipboardData || !clipboardData.items) return;

    const items = clipboardData.items;
    let foundImage = false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && item.type.indexOf('image') !== -1) {
        foundImage = true;
        e.preventDefault(); // Prevent pasting binary or empty junk in textarea
        const file = item.getAsFile();
        if (file) {
          processImageFile(file);
        }
      }
    }
  }

  function handleFileInputChange(e) {
    const files = Array.from(e.target.files || []);
    files.forEach(processImageFile);
    e.target.value = '';
  }

  function handleRemoveAttachedImage(id) {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  }

  // Handle post report
  async function handlePostReport(e) {
    if (e) e.preventDefault();
    if (!reportText.trim() && attachedImages.length === 0) {
      showToast('⚠️ Please paste your shift report or attach an image.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addShiftReport({
        content: reportText,
        author: author.trim(),
        reportDate,
        images: attachedImages,
      });

      if (res.success) {
        showToast(res.synced ? '✅ Report posted & synced to Supabase!' : '✅ Report saved locally!');
        setReportText('');
        setAttachedImages([]);
        await loadReports();
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle copy text
  function handleCopyText(text, id = null) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);
      }
      showToast('📋 Shift report text copied to clipboard!');
    }).catch(() => {
      showToast('⚠️ Failed to copy to clipboard');
    });
  }

  // Copy Image directly to system clipboard as PNG blob
  async function handleCopyImage(imgSrc, key = null) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob }),
              ]);
              if (key) {
                setCopiedImgKey(key);
                setTimeout(() => setCopiedImgKey(null), 2500);
              }
              showToast('📋 Image copied to clipboard! (Ready to paste into chat)');
            } catch (clipErr) {
              console.error('Clipboard write error', clipErr);
              showToast('⚠️ Right click the image and choose "Copy image".');
            }
          }
        }, 'image/png');
      };
      img.onerror = () => showToast('⚠️ Could not load image to copy');
      img.src = imgSrc;
    } catch (err) {
      console.error(err);
      showToast('⚠️ Could not copy image');
    }
  }

  // Handle delete
  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this shift report?')) return;
    try {
      await deleteShiftReport(id);
      showToast('🗑️ Report deleted.');
      await loadReports();
    } catch (err) {
      showToast('❌ Failed to delete report.');
    }
  }

  // Edit modal handlers
  function handleOpenEditModal(report) {
    setEditingReport(report);
    setEditContent(report.content || '');
    setEditAuthor(report.author || '');
    setEditReportDate(report.report_date || report.created_at?.slice(0, 10) || getTodayDateISO());
    const normalizedImgs = Array.isArray(report.images)
      ? report.images.map((img, idx) => (typeof img === 'string' ? { id: `img_${idx}`, dataUrl: img } : img))
      : [];
    setEditImages(normalizedImgs);
  }

  function handleEditContentChange(e) {
    const raw = e.target.value;
    const updated = recalculateMorningReportText(raw, reports, editReportDate);
    setEditContent(updated);
  }

  async function handleSaveEdit(e) {
    if (e) e.preventDefault();
    if (!editingReport) return;
    if (!editContent.trim() && editImages.length === 0) {
      showToast('⚠️ Report content cannot be empty.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await updateShiftReport(editingReport.id, {
        content: editContent,
        author: editAuthor.trim(),
        reportDate: editReportDate,
        images: editImages,
      });

      if (res.success) {
        showToast('✅ Shift report updated successfully!');
        setEditingReport(null);
        await loadReports();
      }
    } catch (err) {
      showToast(`❌ Failed to update report: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  }

  // Supabase config handlers
  async function handleTestConnection() {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  }

  function handleSaveSupabaseConfig(e) {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setShowConfigModal(false);
    showToast('⚙️ Supabase settings saved!');
    loadReports();
  }

  function handleDisconnectSupabase() {
    saveSupabaseConfig('', '');
    setSupabaseUrl('');
    setSupabaseKey('');
    setTestResult(null);
    setShowConfigModal(false);
    showToast('Switched to local storage mode.');
    loadReports();
  }

  function handleCopySql() {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT).then(() => {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
      showToast('SQL script copied!');
    });
  }

  // Filtered reports by selected date
  const filteredReports = useMemo(() => {
    if (!filterDate) return reports;

    let targetFormatted = '';
    try {
      const parts = filterDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        targetFormatted = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }
    } catch {}

    return reports.filter((r) => {
      // 1. Explicit report_date property (YYYY-MM-DD)
      if (r.report_date === filterDate) return true;
      // 2. ISO timestamp created_at
      if (r.created_at && r.created_at.slice(0, 10) === filterDate) return true;
      // 3. Text content contains date (ISO or long format)
      if (r.content) {
        if (r.content.includes(filterDate)) return true;
        if (targetFormatted && r.content.includes(targetFormatted)) return true;
      }
      return false;
    });
  }, [reports, filterDate]);

  // Extract a readable title or first line from pasted report
  function extractReportTitle(content) {
    if (!content) return 'Shift Report';
    const lines = content.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      return lines[0].substring(0, 60);
    }
    return 'Shift Report';
  }

  function formatTimestamp(isoString) {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  }

  return (
    <div className="shift-report-page">
      {/* Toast Notification */}
      {feedbackMsg && (
        <div className="shift-toast" role="alert">
          {feedbackMsg}
        </div>
      )}

      {/* Page Header */}
      <div className="shift-page-header">
        <div>
          <div className="shift-kicker">
            <span className="kicker-pill">
              <i className="bi bi-clock-history me-1" aria-hidden="true"></i> Handover & Logs
            </span>
            <span className="kicker-release">Nashville CC Support</span>
          </div>
          <h1>SHIFT REPORT</h1>
          <p className="panel-subtitle">
            Dedicated place where each shift report can be pasted, viewed, and organized so reports never get buried in chat.
          </p>
        </div>

        <div className="shift-header-actions">
          {/* Connection Status Indicator */}
          <button
            type="button"
            className={`shift-conn-pill ${syncStatus === 'supabase' ? 'is-connected' : 'is-local'}`}
            onClick={() => setShowConfigModal(true)}
            title="Configure Supabase Shared Sync"
          >
            <span className="status-dot"></span>
            {syncStatus === 'supabase' ? (
              <span>Supabase Connected</span>
            ) : (
              <span>Local Mode (Connect Supabase)</span>
            )}
            <i className="bi bi-gear ms-1" aria-hidden="true"></i>
          </button>

          <button
            type="button"
            className="announcement-back-btn"
            onClick={onBackToDashboard}
            title="Return to Ticketing Dashboard"
          >
            <i className="bi bi-arrow-left" aria-hidden="true"></i> Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Grid: Composer on Left, Feed on Right */}
      <div className="shift-layout-grid">
        {/* Composer Panel */}
        <section className="shift-composer-card">
          <div className="composer-header">
            <div className="composer-title-group">
              <h3>
                <i className="bi bi-pencil-square me-2" aria-hidden="true"></i>
                Paste Shift Report
              </h3>
              <p className="composer-hint">Paste your formatted report here. Press <strong>Ctrl + V</strong> with an image copied to attach screenshots!</p>
            </div>
            <button
              type="button"
              className="btn-insert-template"
              onClick={handleInsertTemplate}
              title="Pre-fill standard report template"
            >
              <i className="bi bi-file-earmark-text me-1" aria-hidden="true"></i> Insert Template
            </button>
          </div>

          <form onSubmit={handlePostReport}>
            {/* Quick Metadata: Date, Shift & Author */}
            <div className="composer-meta-row composer-meta-row-3col">
              {/* 1. Date Field */}
              <div className="composer-meta-field">
                <label htmlFor="reportDateInput">
                  <i className="bi bi-calendar-event me-1"></i> Date:
                </label>
                <input
                  id="reportDateInput"
                  type="date"
                  className="composer-input"
                  value={reportDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setReportDate(newDate);
                    if (
                      reportText &&
                      (reportText.includes('HRMS TICKET REVIEW:') || reportText.includes('PENDING TICKET REVIEW:'))
                    ) {
                      const updated = recalculateMorningReportText(reportText, reports, newDate);
                      setReportText(updated);
                    }
                  }}
                  required
                />
              </div>

              {/* 2. Shift Timing */}
              <div className="composer-meta-field">
                <label htmlFor="shiftSelect">
                  <i className="bi bi-clock me-1"></i> Shift Timing:
                </label>
                <select
                  id="shiftSelect"
                  className="composer-select"
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                >
                  {STANDARD_SHIFTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Posted By */}
              <div className="composer-meta-field">
                <label htmlFor="authorSelect">
                  <i className="bi bi-person me-1"></i> Posted By:
                </label>
                <div className="author-input-wrapper">
                  <input
                    id="authorSelect"
                    type="text"
                    className="composer-input"
                    placeholder="Enter name"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    list="supportNamesList"
                  />
                  <datalist id="supportNamesList">
                    {SUPPORT_NAMES.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Paste Textarea with onPaste image support */}
            <div className="composer-textarea-wrap">
              <textarea
                ref={textareaRef}
                className="shift-paste-textarea"
                rows={13}
                onPaste={handlePaste}
                placeholder={`Paste your completed shift report here...

Tip: Copy any image or screenshot and press Ctrl + V here to attach it automatically!

Example:
SHIFT REPORT 09:00PM TO 06:00AM

September 20, 2026

TOTAL CALLS - 0

RESOLVE - 0
PENDING - 0

OTHER - 0`}
                value={reportText}
                onChange={handleReportTextChange}
              ></textarea>
            </div>

            {/* Attached Images Preview Strip */}
            {attachedImages.length > 0 && (
              <div className="attached-images-strip">
                <div className="attached-images-title">
                  <i className="bi bi-images me-1"></i>
                  <span>Attached Images ({attachedImages.length})</span>
                  <span className="attached-images-hint">Click image to preview full size</span>
                </div>
                <div className="attached-images-list">
                  {attachedImages.map((img) => (
                    <div key={img.id} className="attached-image-card">
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="attached-image-thumb"
                        onClick={() => setPreviewImageUrl(img.dataUrl)}
                        title="Click to preview full size"
                      />
                      <button
                        type="button"
                        className="btn-remove-attached-img"
                        onClick={() => handleRemoveAttachedImage(img.id)}
                        title="Remove image"
                        aria-label="Remove image"
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden file input for manual image upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />

            {/* Composer Footer Actions */}
            <div className="composer-actions-bar">
              <div className="composer-actions-left">
                <button
                  type="button"
                  className="btn-composer-secondary"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  title="Attach image or screenshot file"
                >
                  <i className="bi bi-paperclip me-1" aria-hidden="true"></i> Attach Image
                </button>

                {reportText.trim() && (
                  <button
                    type="button"
                    className="btn-composer-secondary"
                    onClick={() => handleCopyText(reportText)}
                    title="Copy current text"
                  >
                    <i className="bi bi-clipboard me-1" aria-hidden="true"></i> Copy Text
                  </button>
                )}

                {(reportText.trim() || attachedImages.length > 0) && (
                  <button
                    type="button"
                    className="btn-composer-ghost"
                    onClick={() => {
                      setReportText('');
                      setAttachedImages([]);
                    }}
                    title="Clear text and attachments"
                  >
                    <i className="bi bi-trash3 me-1" aria-hidden="true"></i> Clear
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="btn-post-report"
                disabled={isSubmitting || (!reportText.trim() && attachedImages.length === 0)}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Posting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send-fill me-2" aria-hidden="true"></i>
                    Post Shift Report
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Reports Feed & Organizer */}
        <section className="shift-feed-card">
          <div className="feed-header">
            <div className="feed-title-wrap">
              <h3>
                <i className="bi bi-journals me-2" aria-hidden="true"></i>
                Shift Reports History
              </h3>
              <span className="feed-count-badge">
                {filteredReports.length} {filteredReports.length === 1 ? 'Report' : 'Reports'}
                {filterDate ? ` on ${filterDate}` : ''}
              </span>
            </div>

            <div className="feed-controls">
              <div className="feed-date-filter-wrap">
                <i className="bi bi-calendar-event date-icon" aria-hidden="true"></i>
                <input
                  type="date"
                  className="feed-date-filter-input"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  title="Select date to filter shift reports"
                />
                {filterDate && (
                  <button
                    type="button"
                    className="date-clear-btn"
                    onClick={() => setFilterDate('')}
                    title="Clear date filter (show all dates)"
                    aria-label="Show all dates"
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>

              {filterDate && (
                <button
                  type="button"
                  className="btn-all-dates"
                  onClick={() => setFilterDate('')}
                  title="Show reports from all dates"
                >
                  All Dates
                </button>
              )}

              <button
                type="button"
                className="feed-refresh-btn"
                onClick={loadReports}
                title="Refresh reports"
              >
                <i className={`bi bi-arrow-clockwise ${isLoading ? 'spin-anim' : ''}`}></i>
              </button>
            </div>
          </div>

          {/* Feed List */}
          <div className="feed-list-container">
            {isLoading ? (
              <div className="feed-empty-state">
                <div className="spinner-border text-primary mb-3" role="status"></div>
                <p>Loading shift reports...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="feed-empty-state">
                <i className="bi bi-calendar-x empty-icon" aria-hidden="true"></i>
                <h4>{filterDate ? `No Reports on ${filterDate}` : 'No Shift Reports Found'}</h4>
                <p>
                  {filterDate
                    ? `No shift reports found for ${filterDate}. Select another date or click below to view all reports.`
                    : 'No shift reports have been posted yet. Paste a shift report on the left and click "Post Shift Report"!'}
                </p>
                {filterDate ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary mt-2"
                    onClick={() => setFilterDate('')}
                  >
                    <i className="bi bi-calendar2-range me-1"></i> View All Dates
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary mt-2"
                    onClick={handleInsertTemplate}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Try Template
                  </button>
                )}
              </div>
            ) : (
              filteredReports.map((report) => {
                const title = extractReportTitle(report.content);
                const isCopied = copiedId === report.id;
                const images = Array.isArray(report.images) ? report.images : [];
                const shiftType = detectShiftFromContent(report.content);

                let shiftThemeClass = 'shift-theme-default';
                let badgeClass = 'badge-default';
                if (shiftType === '9PM-6AM') {
                  shiftThemeClass = 'shift-theme-night';
                  badgeClass = 'badge-night';
                } else if (shiftType === '5AM-2PM') {
                  shiftThemeClass = 'shift-theme-morning';
                  badgeClass = 'badge-morning';
                } else if (shiftType === '2PM-11PM') {
                  shiftThemeClass = 'shift-theme-evening';
                  badgeClass = 'badge-evening';
                }

                return (
                  <article key={report.id} className={`report-feed-item ${shiftThemeClass}`}>
                    {/* Item Top Bar */}
                    <div className="report-item-header">
                      <div className="report-item-meta">
                        <span className={`report-title-badge ${badgeClass}`}>
                          <i className="bi bi-calendar2-event me-1"></i>
                          {title}
                        </span>
                        {report.author && (
                          <span className="report-author-badge">
                            <i className="bi bi-person-badge me-1"></i>
                            {report.author}
                          </span>
                        )}
                        <span className="report-time-stamp">
                          <i className="bi bi-clock me-1"></i>
                          {formatTimestamp(report.created_at)}
                        </span>
                      </div>

                      <div className="report-item-actions">
                        <button
                          type="button"
                          className="btn-edit-report"
                          onClick={() => handleOpenEditModal(report)}
                          title="Edit shift report"
                          aria-label="Edit shift report"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button
                          type="button"
                          className="btn-delete-report"
                          onClick={() => handleDelete(report.id)}
                          title="Delete report"
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </div>

                    {/* Pre-wrap formatted report content */}
                    {report.content && (
                      <div className="report-content-box">
                        <pre className="report-pre-text">{report.content}</pre>
                      </div>
                    )}

                    {/* Attached Images Gallery in History */}
                    {images.length > 0 && (
                      <div className="report-images-gallery">
                        <div className="report-gallery-header">
                          <i className="bi bi-images me-1"></i>
                          <span>Attached Screenshots ({images.length})</span>
                          <span className="report-gallery-sub">Click image to preview · Click "Copy Image" to paste into chat</span>
                        </div>
                        <div className="report-images-grid">
                          {images.map((imgItem, idx) => {
                            const imgSrc = typeof imgItem === 'string' ? imgItem : imgItem.dataUrl;
                            const imgKey = `${report.id}_img_${idx}`;
                            const isImgCopied = copiedImgKey === imgKey;

                            return (
                              <div key={imgKey} className="report-image-card">
                                <div
                                  className="report-image-preview-wrap"
                                  onClick={() => setPreviewImageUrl(imgSrc)}
                                  title="Click to view full size"
                                >
                                  <img
                                    src={imgSrc}
                                    alt={`Shift Attachment ${idx + 1}`}
                                    className="report-feed-img"
                                  />
                                  <div className="report-image-hover-overlay">
                                    <i className="bi bi-arrows-fullscreen me-1"></i> Preview
                                  </div>
                                </div>
                                <div className="report-image-card-actions">
                                  <button
                                    type="button"
                                    className={`btn-copy-img ${isImgCopied ? 'copied' : ''}`}
                                    onClick={() => handleCopyImage(imgSrc, imgKey)}
                                    title="Copy image to clipboard to paste in WhatsApp/Slack/Teams"
                                  >
                                    <i className={`bi ${isImgCopied ? 'bi-check2' : 'bi-clipboard-plus'} me-1`}></i>
                                    {isImgCopied ? 'Copied!' : 'Copy Image'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Lightbox / Full-Screen Image Preview Modal */}
      {previewImageUrl && (
        <div className="image-lightbox-overlay" onClick={() => setPreviewImageUrl(null)}>
          <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="image-lightbox-header">
              <div className="lightbox-header-title">
                <i className="bi bi-image me-2"></i> Screenshot Preview
              </div>
              <div className="lightbox-header-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => handleCopyImage(previewImageUrl, 'lightbox_active')}
                  title="Copy image to clipboard"
                >
                  <i className="bi bi-clipboard-plus me-1"></i> Copy Image
                </button>
                <button
                  type="button"
                  className="lightbox-close-btn"
                  onClick={() => setPreviewImageUrl(null)}
                  title="Close preview"
                  aria-label="Close preview"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
            <div className="image-lightbox-body">
              <img src={previewImageUrl} alt="Full resolution preview" className="image-lightbox-img" />
            </div>
          </div>
        </div>
      )}

      {/* Edit Shift Report Modal */}
      {editingReport && (
        <div className="break-modal-overlay" onClick={() => setEditingReport(null)}>
          <div className="shift-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="break-modal-header">
              <div>
                <h2 className="modal-title modal-title-row">
                  <i className="bi bi-pencil-square me-2"></i>
                  Edit Shift Report
                </h2>
                <p className="modal-subtitle">
                  Update report text, author, date, or screenshots.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingReport(null)}
                className="break-close-btn icon-close"
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="config-modal-body">
              {/* Metadata row */}
              <div className="composer-meta-row composer-meta-row-3col mb-3">
                <div className="composer-meta-field">
                  <label htmlFor="editReportDateInput">
                    <i className="bi bi-calendar-event me-1"></i> Date:
                  </label>
                  <input
                    id="editReportDateInput"
                    type="date"
                    className="composer-input"
                    value={editReportDate}
                    onChange={(e) => setEditReportDate(e.target.value)}
                    required
                  />
                </div>

                <div className="composer-meta-field">
                  <label htmlFor="editAuthorInput">
                    <i className="bi bi-person me-1"></i> Posted By:
                  </label>
                  <input
                    id="editAuthorInput"
                    type="text"
                    className="composer-input"
                    placeholder="Author name"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    list="supportNamesList"
                  />
                </div>

                <div className="composer-meta-field">
                  <label>
                    <i className="bi bi-clock me-1"></i> Detected Shift:
                  </label>
                  <span className="composer-input d-flex align-items-center" style={{ background: 'var(--bg-elevated, #f8fafc)', cursor: 'default' }}>
                    {detectShiftFromContent(editContent) || 'Standard Shift'}
                  </span>
                </div>
              </div>

              {/* Textarea */}
              <div className="composer-textarea-wrap mb-3">
                <label className="form-label fw-semibold" htmlFor="editReportContentTextarea">
                  Report Content:
                </label>
                <textarea
                  id="editReportContentTextarea"
                  className="shift-paste-textarea"
                  rows={11}
                  value={editContent}
                  onChange={handleEditContentChange}
                  placeholder="Edit report content..."
                  required
                ></textarea>
              </div>

              {/* Attached Images in Modal */}
              {editImages.length > 0 && (
                <div className="mb-3">
                  <div className="attached-images-title mb-2">
                    <i className="bi bi-images me-1"></i>
                    <span>Attached Screenshots ({editImages.length})</span>
                  </div>
                  <div className="attached-images-list">
                    {editImages.map((img, idx) => {
                      const src = typeof img === 'string' ? img : img.dataUrl;
                      const imgId = img.id || `img_${idx}`;
                      return (
                        <div key={imgId} className="attached-image-card">
                          <img
                            src={src}
                            alt={`Screenshot ${idx + 1}`}
                            className="attached-image-thumb"
                            onClick={() => setPreviewImageUrl(src)}
                            title="Click to preview"
                          />
                          <button
                            type="button"
                            className="btn-remove-attached-img"
                            onClick={() => setEditImages((prev) => prev.filter((_, i) => i !== idx))}
                            title="Remove image"
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="edit-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setEditingReport(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingEdit}
                >
                  <i className={`bi ${isSavingEdit ? 'bi-hourglass-split' : 'bi-check2'} me-1`}></i>
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supabase Configuration Modal */}
      {showConfigModal && (
        <div className="break-modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="shift-config-modal" onClick={(e) => e.stopPropagation()}>
            <div className="break-modal-header">
              <div>
                <h2 className="modal-title modal-title-row">
                  <i className="bi bi-database-check me-2"></i>
                  Supabase Team Sync Configuration
                </h2>
                <p className="modal-subtitle">
                  Connect your team's Supabase project so shift reports sync in real-time across all computers.
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="break-close-btn icon-close"
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveSupabaseConfig} className="config-modal-body">
              <div className="info-box mb-3">
                <i className="bi bi-info-circle info-box-icon" aria-hidden="true"></i>
                <span>
                  <strong>Shift Reports Only:</strong> This Supabase connection is strictly used to store and sync shift reports so they don't get buried. Tickets remain completely separate and local.
                </span>
              </div>

              <div className="form-group mb-3">
                <label className="form-label" htmlFor="supabaseUrlInput">
                  Supabase Project URL
                </label>
                <input
                  id="supabaseUrlInput"
                  type="url"
                  className="form-control"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  required
                />
                <div className="form-text">
                  Found in Supabase Dashboard → Project Settings → API → Project URL.
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label" htmlFor="supabaseKeyInput">
                  Supabase Anon Public API Key
                </label>
                <input
                  id="supabaseKeyInput"
                  type="password"
                  className="form-control"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  required
                />
                <div className="form-text">
                  Found in Supabase Dashboard → Project Settings → API → anon public key.
                </div>
              </div>

              {testResult && (
                <div
                  className={`alert ${testResult.success ? 'alert-success' : 'alert-warning'} mt-2 mb-3`}
                  role="alert"
                >
                  <i
                    className={`bi ${testResult.success ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}
                  ></i>
                  {testResult.message}
                </div>
              )}

              {/* SQL Schema helper */}
              <div className="sql-helper-box mb-3">
                <div className="sql-helper-header">
                  <span>
                    <i className="bi bi-terminal me-1"></i> SQL Table Setup (Run once in Supabase SQL Editor)
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={handleCopySql}
                  >
                    <i className={`bi ${copiedSql ? 'bi-check2' : 'bi-clipboard'} me-1`}></i>
                    {copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}
                  </button>
                </div>
                <pre className="sql-code-block">{SUPABASE_SQL_SCRIPT}</pre>
              </div>

              <div className="config-modal-footer">
                <div className="footer-left">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleTestConnection}
                    disabled={isTesting || !supabaseUrl || !supabaseKey}
                  >
                    {isTesting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1"></span> Testing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-lightning-charge me-1"></i> Test Connection
                      </>
                    )}
                  </button>

                  {(supabaseUrl || supabaseKey) && (
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={handleDisconnectSupabase}
                    >
                      Disconnect & Use Local
                    </button>
                  )}
                </div>

                <div className="footer-right">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowConfigModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check2 me-1"></i> Save & Connect
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
