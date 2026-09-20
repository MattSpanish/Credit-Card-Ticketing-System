// src/ShiftReportPage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  fetchShiftReports,
  addShiftReport,
  deleteShiftReport,
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  getDefaultReportTemplate,
  SUPABASE_SQL_SCRIPT,
} from './supabaseShiftReports';

const SUPPORT_NAMES = ['HANZ', 'CHARLES', 'KENNETH', 'ADI', 'TATI', 'RONIE', 'SEAN'];
const STANDARD_SHIFTS = [
  '09:00PM TO 06:00AM',
  '05:00AM TO 02:00PM',
  '02:00PM TO 11:00PM',
  '07:30AM TO 06:30PM',
  '06:00PM TO 05:00AM',
];

export default function ShiftReportPage({ onBackToDashboard }) {
  // Composer state
  const [reportText, setReportText] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedShift, setSelectedShift] = useState('09:00PM TO 06:00AM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feed state
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('local'); // 'supabase' | 'local' | 'local-fallback'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Supabase modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const textareaRef = useRef(null);

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
    setTimeout(() => setFeedbackMsg(''), 3000);
  }

  // Handle template insert
  function handleInsertTemplate() {
    const template = getDefaultReportTemplate(selectedShift);
    setReportText(template);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    showToast('Standard shift template inserted!');
  }

  // Handle post report
  async function handlePostReport(e) {
    if (e) e.preventDefault();
    if (!reportText.trim()) {
      showToast('⚠️ Please paste or type your shift report first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addShiftReport({
        content: reportText,
        author: author.trim(),
      });

      if (res.success) {
        showToast(res.synced ? '✅ Report posted & synced to Supabase!' : '✅ Report saved locally!');
        setReportText('');
        await loadReports();
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle copy text
  function handleCopy(text, id = null) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);
      }
      showToast('📋 Shift report copied to clipboard!');
    }).catch(() => {
      showToast('⚠️ Failed to copy to clipboard');
    });
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

  // Filtered reports
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.toLowerCase();
    return reports.filter((r) => {
      const contentMatch = (r.content || '').toLowerCase().includes(q);
      const authorMatch = (r.author || '').toLowerCase().includes(q);
      const dateMatch = (r.created_at || '').toLowerCase().includes(q);
      return contentMatch || authorMatch || dateMatch;
    });
  }, [reports, searchQuery]);

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
              <p className="composer-hint">Paste your formatted shift report here. No individual fields required.</p>
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
            {/* Quick Metadata: Shift & Author */}
            <div className="composer-meta-row">
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

              <div className="composer-meta-field">
                <label htmlFor="authorSelect">
                  <i className="bi bi-person me-1"></i> Posted By (Optional):
                </label>
                <div className="author-input-wrapper">
                  <input
                    id="authorSelect"
                    type="text"
                    className="composer-input"
                    placeholder="Enter your name"
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

            {/* Paste Textarea */}
            <div className="composer-textarea-wrap">
              <textarea
                ref={textareaRef}
                className="shift-paste-textarea"
                rows={14}
                placeholder={`Paste your completed shift report here...

Example:
SHIFT REPORT 09:00PM TO 06:00AM

September 20, 2026

TOTAL CALLS - 0

RESOLVE - 0
PENDING - 0

OTHER - 0

DAILY WORK REPORT 

HRMS TICKET REVIEW: 0
PENDING TICKET REVIEW: 0
PENDING SOLVED TICKET: 0`}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
              ></textarea>
            </div>

            {/* Composer Footer Actions */}
            <div className="composer-actions-bar">
              <div className="composer-actions-left">
                {reportText.trim() && (
                  <button
                    type="button"
                    className="btn-composer-secondary"
                    onClick={() => handleCopy(reportText)}
                    title="Copy current text"
                  >
                    <i className="bi bi-clipboard me-1" aria-hidden="true"></i> Copy Text
                  </button>
                )}
                {reportText.trim() && (
                  <button
                    type="button"
                    className="btn-composer-ghost"
                    onClick={() => setReportText('')}
                    title="Clear text"
                  >
                    <i className="bi bi-trash3 me-1" aria-hidden="true"></i> Clear
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="btn-post-report"
                disabled={isSubmitting || !reportText.trim()}
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
              <span className="feed-count-badge">{filteredReports.length} {filteredReports.length === 1 ? 'Report' : 'Reports'}</span>
            </div>

            <div className="feed-controls">
              <div className="feed-search-wrap">
                <i className="bi bi-search search-icon" aria-hidden="true"></i>
                <input
                  type="text"
                  className="feed-search-input"
                  placeholder="Search reports or authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>

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
                <i className="bi bi-inbox empty-icon" aria-hidden="true"></i>
                <h4>No Shift Reports Found</h4>
                <p>
                  {searchQuery
                    ? `No reports matched "${searchQuery}". Try a different search.`
                    : 'No shift reports have been posted yet. Paste a shift report on the left and click "Post Shift Report"!'}
                </p>
                {!searchQuery && (
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

                return (
                  <article key={report.id} className="report-feed-item">
                    {/* Item Top Bar */}
                    <div className="report-item-header">
                      <div className="report-item-meta">
                        <span className="report-title-badge">
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
                          className={`btn-copy-report ${isCopied ? 'copied' : ''}`}
                          onClick={() => handleCopy(report.content, report.id)}
                          title="Copy full report to clipboard"
                        >
                          <i className={`bi ${isCopied ? 'bi-check2' : 'bi-clipboard'} me-1`}></i>
                          {isCopied ? 'Copied!' : 'Copy Report'}
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
                    <div className="report-content-box">
                      <pre className="report-pre-text">{report.content}</pre>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

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
