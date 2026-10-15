// src/PendingTasksPage.jsx
// Shift Handover & Pending Tasks Page
// Provides a centralized place to post, track, and resolve pending handover tasks between shifts.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './pendingTasks.css';
import { getPendingTasksSummary } from './pendingTasksStorage';
import {
  fetchPendingTasksFromDb,
  createPendingTaskInDb,
  resolvePendingTaskInDb,
  reopenPendingTaskInDb,
  deletePendingTaskFromDb,
  getLocalPendingTasks,
  PENDING_TASKS_TABLE_SQL,
  DEFAULT_PENDING_SUPABASE_URL,
} from './supabasePendingTasks';
import { getCurrentUserName } from './reminderLikesStorage';

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function PendingTasksPage({ onBackToDashboard, currentUserName }) {
  // Local state & database sync state
  const [tasks, setTasks] = useState(() => getLocalPendingTasks());
  const [cloudStatus, setCloudStatus] = useState('connecting'); // 'connected' | 'needs_table' | 'offline' | 'connecting'
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [isDismissedBanner, setIsDismissedBanner] = useState(false);

  const [activeFilter, setActiveFilter] = useState('pending'); // 'pending' | 'resolved' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resolvingTask, setResolvingTask] = useState(null);

  // Create Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDetails, setFormDetails] = useState('');
  const [formCreatedBy, setFormCreatedBy] = useState(() => currentUserName || getCurrentUserName() || '');
  const [createError, setCreateError] = useState('');

  // Resolve Form State
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveBy, setResolveBy] = useState(() => currentUserName || getCurrentUserName() || '');
  const [resolveError, setResolveError] = useState('');

  // Toast feedback
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  // Sync current user name if prop changes
  useEffect(() => {
    const user = currentUserName || getCurrentUserName() || '';
    if (user) {
      setFormCreatedBy((prev) => prev || user);
      setResolveBy((prev) => prev || user);
    }
  }, [currentUserName]);

  // Cloud Database Sync Function
  const syncWithDb = useCallback(async (showToastFeedback = false) => {
    setIsSyncing(true);
    try {
      const res = await fetchPendingTasksFromDb();
      if (res && res.items) {
        setTasks(res.items);
      }

      if (res && res.source === 'cloud') {
        setCloudStatus('connected');
        if (showToastFeedback) {
          showToast('Tasks synchronized with Supabase database!');
        }
      } else if (res && res.needsTable) {
        setCloudStatus('needs_table');
        if (showToastFeedback) {
          showToast('Connected to Supabase, but "pending_tasks" table is not yet created.', 'info');
        }
      } else {
        setCloudStatus('offline');
      }
    } catch (err) {
      console.error('Database sync error:', err);
      setCloudStatus('offline');
    } finally {
      setIsSyncing(false);
    }
  }, [showToast]);

  // Initial load & background real-time sync polling
  useEffect(() => {
    // Initial fetch from cloud database
    syncWithDb();

    // Listen for local changes across tabs or windows
    const handleStorageChange = () => {
      const cached = getLocalPendingTasks();
      if (cached && cached.length >= 0) {
        setTasks(cached);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pending_tasks_changed', handleStorageChange);

    // Auto sync with Supabase every 8 seconds so other shifts' tasks appear live
    const pollInterval = setInterval(() => {
      syncWithDb();
    }, 8000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pending_tasks_changed', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [syncWithDb]);

  // Summary counts
  const summary = useMemo(() => getPendingTasksSummary(tasks), [tasks]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Tab Filter
        if (activeFilter === 'pending' && task.status !== 'pending') return false;
        if (activeFilter === 'resolved' && task.status !== 'resolved') return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const titleMatch = (task.title || '').toLowerCase().includes(q);
          const detailsMatch = (task.details || '').toLowerCase().includes(q);
          const creatorMatch = (task.createdBy || '').toLowerCase().includes(q);
          const resolverMatch = (task.resolvedBy || '').toLowerCase().includes(q);
          const notesMatch = (task.resolutionNotes || '').toLowerCase().includes(q);
          return titleMatch || detailsMatch || creatorMatch || resolverMatch || notesMatch;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [tasks, activeFilter, searchQuery, sortOrder]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormTitle('');
    setFormDetails('');
    setFormCreatedBy(currentUserName || getCurrentUserName() || '');
    setCreateError('');
    setShowCreateModal(true);
  };

  // Submit Create Task
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setCreateError('Please enter a title/subject for the pending task.');
      return;
    }
    if (!formDetails.trim()) {
      setCreateError('Please provide details explaining what needs to be handled.');
      return;
    }
    if (!formCreatedBy.trim()) {
      setCreateError('Please specify who created this pending task.');
      return;
    }

    try {
      const res = await createPendingTaskInDb({
        title: formTitle,
        details: formDetails,
        createdBy: formCreatedBy,
      });

      // Update tasks state
      if (res && res.task) {
        setTasks((prev) => [res.task, ...prev.filter((t) => t.id !== res.task.id)]);
      }

      setShowCreateModal(false);
      showToast(`Pending task "${formTitle}" posted successfully!`);

      // Background re-sync
      syncWithDb();
    } catch (err) {
      console.error('Failed to create pending task:', err);
      showToast('Task saved locally!', 'info');
    }
  };

  // Open Resolve Modal
  const handleOpenResolve = (task) => {
    setResolvingTask(task);
    setResolveNotes('');
    setResolveBy(currentUserName || getCurrentUserName() || '');
    setResolveError('');
  };

  // Submit Resolve Task
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolvingTask) return;

    if (!resolveNotes.trim()) {
      setResolveError('Resolution details are required. Please describe how the issue was resolved.');
      return;
    }
    if (!resolveBy.trim()) {
      setResolveError('Please specify who resolved this task.');
      return;
    }

    try {
      const res = await resolvePendingTaskInDb(resolvingTask.id, {
        resolutionNotes: resolveNotes,
        resolvedBy: resolveBy,
      });

      if (res && res.task) {
        setTasks((prev) => prev.map((t) => (t.id === res.task.id ? res.task : t)));
      }

      setResolvingTask(null);
      showToast(`Task "${resolvingTask.title}" marked as Resolved!`);

      // Background re-sync
      syncWithDb();
    } catch (err) {
      console.error('Failed to resolve pending task:', err);
      showToast('Task marked as resolved locally.', 'info');
    }
  };

  // Re-open Task
  const handleReopen = async (task) => {
    if (window.confirm(`Re-open task "${task.title}" back to Pending status?`)) {
      try {
        const res = await reopenPendingTaskInDb(task.id);
        if (res && res.task) {
          setTasks((prev) => prev.map((t) => (t.id === res.task.id ? res.task : t)));
        }
        showToast(`Task "${task.title}" re-opened to Pending.`, 'info');
        syncWithDb();
      } catch (err) {
        console.error('Failed to reopen task:', err);
      }
    }
  };

  // Delete Task (only allowed for resolved tasks)
  const handleDelete = async (task) => {
    if (task.status === 'pending') {
      alert('Only resolved tasks can be deleted. This task is still pending.');
      return;
    }
    if (window.confirm(`Delete "${task.title}" permanently?`)) {
      try {
        const res = await deletePendingTaskFromDb(task.id);
        if (res.tasks) {
          setTasks(res.tasks);
        } else {
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
        }
        showToast(`Task deleted.`, 'info');
        syncWithDb();
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  // Copy SQL Helper
  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(PENDING_TASKS_TABLE_SQL);
      setSqlCopied(true);
      showToast('SQL script copied to clipboard!');
      setTimeout(() => setSqlCopied(false), 2500);
    } catch (e) {
      prompt('Copy the SQL below:', PENDING_TASKS_TABLE_SQL);
    }
  };

  return (
    <div className="pending-page-container">
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: 10,
            background: toast.type === 'info' ? '#3b82f6' : '#10b981',
            color: '#ffffff',
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'pendingFadeIn 0.2s ease',
          }}
        >
          <i className={`bi ${toast.type === 'info' ? 'bi-info-circle-fill' : 'bi-check-circle-fill'}`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="pending-header-banner">
        <div className="pending-header-left">
          <div className="pending-header-badge-row">
            <span className="pending-kicker-pill">
              <i className="bi bi-clock-history" aria-hidden="true"></i> Shift Handover
            </span>
          </div>
          <h1 className="pending-main-title">
            <i className="bi bi-hourglass-split" style={{ color: '#f59e0b' }} aria-hidden="true"></i>
            PENDING TASKS
          </h1>
          <p className="pending-subtitle">
            Post, track, and hand over unfinished tasks to the next shift so critical updates never get buried.
          </p>
        </div>

        <div className="pending-header-actions">
          {onBackToDashboard && (
            <button
              type="button"
              className="btn-pending-back"
              onClick={onBackToDashboard}
              title="Return to Dashboard"
            >
              <i className="bi bi-arrow-left" aria-hidden="true"></i> Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Supabase Database Setup Advisory Banner */}
      {cloudStatus === 'needs_table' && !isDismissedBanner && (
        <div className="pending-setup-banner">
          <div className="pending-setup-banner-content">
            <i className="bi bi-database-exclamation pending-setup-banner-icon" aria-hidden="true"></i>
            <div>
              <h4 className="pending-setup-banner-title">Supabase Database Connected (Pending Table Setup)</h4>
              <p className="pending-setup-banner-desc">
                Project <code>mzxunwpzewlsdkmsuenu.supabase.co</code> credentials are authenticated. Run the <code>pending_tasks</code> SQL script once in your Supabase SQL Editor to enable shared live sync across shifts.
              </p>
            </div>
          </div>
          <div className="pending-setup-banner-actions">
            <button type="button" className="btn-copy-sql" onClick={handleCopySql}>
              <i className={`bi ${sqlCopied ? 'bi-check2' : 'bi-clipboard'}`}></i>
              {sqlCopied ? 'Copied SQL!' : 'Copy SQL Script'}
            </button>
            <button type="button" className="btn-view-sql" onClick={() => setShowSqlModal(true)}>
              <i className="bi bi-code-slash"></i> View SQL
            </button>
            <button
              type="button"
              className="btn-banner-dismiss"
              onClick={() => setIsDismissedBanner(true)}
              title="Dismiss advisory"
              aria-label="Dismiss advisory banner"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      )}

      {/* Compact Metric Stats Cards */}
      <div className="pending-metrics-grid">
        <div
          className={`pending-metric-card ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveFilter('pending')}
          title="Click to view pending tasks"
        >
          <div className="pending-metric-icon pending">
            <i className="bi bi-hourglass-split" aria-hidden="true"></i>
          </div>
          <div className="pending-metric-info">
            <span className="pending-metric-value">{summary.pending}</span>
            <span className="pending-metric-label">Active Pending</span>
          </div>
        </div>

        <div
          className={`pending-metric-card ${activeFilter === 'resolved' ? 'active' : ''}`}
          onClick={() => setActiveFilter('resolved')}
          title="Click to view resolved tasks"
        >
          <div className="pending-metric-icon resolved">
            <i className="bi bi-check-circle-fill" aria-hidden="true"></i>
          </div>
          <div className="pending-metric-info">
            <span className="pending-metric-value">{summary.resolved}</span>
            <span className="pending-metric-label">Resolved</span>
          </div>
        </div>

        <div
          className={`pending-metric-card ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
          title="Click to view all tasks"
        >
          <div className="pending-metric-icon all">
            <i className="bi bi-collection-fill" aria-hidden="true"></i>
          </div>
          <div className="pending-metric-info">
            <span className="pending-metric-value">{summary.total}</span>
            <span className="pending-metric-label">All Handover Tasks</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="pending-controls-bar">
        <div className="pending-tab-group" role="tablist">
          <button
            type="button"
            className={`pending-tab-btn ${activeFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveFilter('pending')}
            role="tab"
            aria-selected={activeFilter === 'pending'}
          >
            <i className="bi bi-hourglass-split" aria-hidden="true"></i>
            <span>Pending</span>
            <span className="pending-tab-badge pending">{summary.pending}</span>
          </button>

          <button
            type="button"
            className={`pending-tab-btn ${activeFilter === 'resolved' ? 'active' : ''}`}
            onClick={() => setActiveFilter('resolved')}
            role="tab"
            aria-selected={activeFilter === 'resolved'}
          >
            <i className="bi bi-check2-circle" aria-hidden="true"></i>
            <span>Resolved</span>
            <span className="pending-tab-badge resolved">{summary.resolved}</span>
          </button>

          <button
            type="button"
            className={`pending-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
            role="tab"
            aria-selected={activeFilter === 'all'}
          >
            <i className="bi bi-list-check" aria-hidden="true"></i>
            <span>All Tasks</span>
            <span className="pending-tab-badge all">{summary.total}</span>
          </button>
        </div>

        <div className="pending-search-group">
          <div className="pending-search-input-wrapper">
            <i className="bi bi-search pending-search-icon" aria-hidden="true"></i>
            <input
              type="text"
              className="pending-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchQuery('');
              }}
              aria-label="Search pending tasks"
            />
            {searchQuery && (
              <button
                type="button"
                className="pending-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                aria-label="Clear search"
              >
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn-pending-back"
            style={{ padding: '7px 12px', fontSize: '0.8rem' }}
            onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
            title={sortOrder === 'newest' ? 'Showing newest first (Click to toggle)' : 'Showing oldest first (Click to toggle)'}
          >
            <i className={`bi ${sortOrder === 'newest' ? 'bi-sort-down' : 'bi-sort-up'}`}></i>
            <span>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
          </button>

          <button
            type="button"
            className="btn-create-pending btn-create-pending-plus"
            onClick={handleOpenCreate}
            title="Post a new pending task"
            aria-label="Post a new pending task"
          >
            <i className="bi bi-plus-lg" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="pending-empty-state">
          <div className="pending-empty-icon">
            <i className={`bi ${activeFilter === 'resolved' ? 'bi-check2-all' : 'bi-inbox'}`}></i>
          </div>
          <h3 className="pending-empty-title">
            {searchQuery
              ? 'No matching tasks found'
              : activeFilter === 'pending'
              ? 'No pending tasks right now'
              : activeFilter === 'resolved'
              ? 'No resolved tasks recorded'
              : 'No handover tasks found'}
          </h3>
          <p className="pending-empty-desc">
            {searchQuery
              ? `No results matched "${searchQuery}". Try a different keyword or clear the search filter.`
              : activeFilter === 'pending'
              ? 'All tasks have been resolved or handed over. Great job team!'
              : 'Create a pending task to hand over unfinished items to the incoming shift.'}
          </p>
          {!searchQuery && (
            <button type="button" className="btn-create-pending" onClick={handleOpenCreate}>
              <i className="bi bi-plus-lg" aria-hidden="true"></i> Post a Pending Task
            </button>
          )}
        </div>
      ) : (
        <div className="pending-tasks-list">
          {filteredTasks.map((task) => {
            const isPending = task.status === 'pending';

            return (
              <div
                key={task.id}
                className={`pending-task-card ${isPending ? 'is-pending' : 'is-resolved'}`}
              >
                {/* Card Top Row: Status pill & Title on upper left, delete icon on upper right */}
                <div className="pending-card-top-row">
                  <div className="pending-card-title-group">
                    <span className={`shift-task-status-pill ${task.status}`}>
                      <i className={`bi ${isPending ? 'bi-hourglass-split' : 'bi-check-circle-fill'}`}></i>
                      <span>{isPending ? 'Pending' : 'Resolved'}</span>
                    </span>
                    <h2 className="pending-card-title">{task.title}</h2>
                  </div>

                  {!isPending && (
                    <button
                      type="button"
                      className="btn-task-delete"
                      onClick={() => handleDelete(task)}
                      title="Delete resolved task"
                      aria-label={`Delete task ${task.title}`}
                    >
                      <i className="bi bi-trash3" aria-hidden="true"></i>
                    </button>
                  )}
                </div>

                {/* Details Section - Generous and clear */}
                <div className="pending-card-details">{task.details}</div>

                {/* Resolution Details Block (Shown when Resolved) */}
                {!isPending && (
                  <div className="pending-resolution-block">
                    <div className="pending-resolution-header">
                      <span className="pending-resolution-badge">
                        <i className="bi bi-check-circle-fill" aria-hidden="true"></i>
                        <span>Resolved by <strong>{task.resolvedBy || 'Support'}</strong></span>
                      </span>
                      {task.resolvedAt && (
                        <span className="pending-resolution-meta">
                          <i className="bi bi-clock me-1"></i>
                          {formatDate(task.resolvedAt)}
                        </span>
                      )}
                    </div>
                    <div className="pending-resolution-notes">
                      {task.resolutionNotes || 'Resolved without additional notes.'}
                    </div>
                  </div>
                )}

                {/* Card Meta Footer: Author and Date on bottom left (no date icon), Resolve action on bottom right */}
                <div className="pending-card-meta">
                  <div className="pending-meta-left">
                    <span className="pending-meta-item pending-meta-author">
                      <i className="bi bi-person-fill" style={{ color: '#8b5cf6' }}></i>
                      <span>Posted by <strong>{task.createdBy || 'Support'}</strong></span>
                    </span>

                    <span className="pending-meta-dot">•</span>

                    <span className="pending-meta-item pending-meta-date">
                      <span>{formatDate(task.createdAt)}</span>
                    </span>
                  </div>

                  <div className="pending-card-actions-bottom">
                    {isPending ? (
                      <button
                        type="button"
                        className="btn-task-resolve"
                        onClick={() => handleOpenResolve(task)}
                        title="Mark this task as resolved with resolution details"
                        aria-label={`Resolve task ${task.title}`}
                      >
                        <i className="bi bi-check2-circle" aria-hidden="true"></i>
                        <span>Resolve</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-task-reopen"
                        onClick={() => handleReopen(task)}
                        title="Reopen this task back to Pending status"
                        aria-label={`Reopen task ${task.title}`}
                      >
                        <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                        <span>Reopen</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE PENDING TASK MODAL - Spacious layout with large details field */}
      {showCreateModal && (
        <div className="pending-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="pending-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="pending-modal-header">
              <div>
                <h2 className="pending-modal-title">
                  <i className="bi bi-plus-circle" style={{ color: '#f59e0b' }}></i>
                  Create Pending Task
                </h2>
                <p className="pending-modal-subtitle">
                  Record an unfinished task or issue to hand over to the incoming shift
                </p>
              </div>
              <button
                type="button"
                className="pending-modal-close"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              {createError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#f87171',
                    fontSize: '0.86rem',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{createError}</span>
                </div>
              )}

              <div className="pending-form-group">
                <label className="pending-form-label" htmlFor="pending-title-input">
                  Title / Subject <span className="required-star">*</span>
                </label>
                <input
                  id="pending-title-input"
                  type="text"
                  className="pending-form-input"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (createError) setCreateError('');
                  }}
                  autoFocus
                />
              </div>

              <div className="pending-form-group">
                <label className="pending-form-label" htmlFor="pending-details-input">
                  Details & What Needs to Be Done <span className="required-star">*</span>
                </label>
                <textarea
                  id="pending-details-input"
                  className="pending-form-textarea"
                  value={formDetails}
                  onChange={(e) => {
                    setFormDetails(e.target.value);
                    if (createError) setCreateError('');
                  }}
                ></textarea>
                <span className="pending-form-hint">
                  Be as clear and specific as possible to help the next shift take over immediately.
                </span>
              </div>

              <div className="pending-form-group">
                <label className="pending-form-label" htmlFor="pending-creator-input">
                  Created By <span className="required-star">*</span>
                </label>
                <input
                  id="pending-creator-input"
                  type="text"
                  className="pending-form-input"
                  value={formCreatedBy}
                  onChange={(e) => {
                    setFormCreatedBy(e.target.value);
                    if (createError) setCreateError('');
                  }}
                />
              </div>

              <div className="pending-modal-footer">
                <button
                  type="button"
                  className="btn-pending-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-pending-submit">
                  <i className="bi bi-send-fill me-1"></i> Post Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE TASK MODAL */}
      {resolvingTask && (
        <div className="pending-modal-overlay" onClick={() => setResolvingTask(null)}>
          <div className="pending-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="pending-modal-header">
              <div>
                <h2 className="pending-modal-title">
                  <i className="bi bi-check2-circle" style={{ color: '#10b981' }}></i>
                  Resolve Pending Task
                </h2>
                <p className="pending-modal-subtitle">
                  Confirm how the issue was fixed before closing this item
                </p>
              </div>
              <button
                type="button"
                className="pending-modal-close"
                onClick={() => setResolvingTask(null)}
                aria-label="Close modal"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="pending-prompt-callout">
              <div>
                Task: <strong>{resolvingTask.title}</strong>
              </div>
              <div style={{ marginTop: 4, fontSize: '0.8rem', opacity: 0.85 }}>
                Posted by {resolvingTask.createdBy} on {formatDate(resolvingTask.createdAt)}
              </div>
            </div>

            <form onSubmit={handleResolveSubmit}>
              {resolveError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#f87171',
                    fontSize: '0.86rem',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{resolveError}</span>
                </div>
              )}

              <div className="pending-form-group">
                <label className="pending-form-label" htmlFor="resolve-notes-input">
                  How was this issue resolved? <span className="required-star">*</span>
                </label>
                <textarea
                  id="resolve-notes-input"
                  className="pending-form-textarea"
                  value={resolveNotes}
                  onChange={(e) => {
                    setResolveNotes(e.target.value);
                    if (resolveError) setResolveError('');
                  }}
                  autoFocus
                ></textarea>
              </div>

              <div className="pending-form-group">
                <label className="pending-form-label" htmlFor="resolve-by-input">
                  Resolved By <span className="required-star">*</span>
                </label>
                <input
                  id="resolve-by-input"
                  type="text"
                  className="pending-form-input"
                  value={resolveBy}
                  onChange={(e) => {
                    setResolveBy(e.target.value);
                    if (resolveError) setResolveError('');
                  }}
                />
              </div>

              <div className="pending-modal-footer">
                <button
                  type="button"
                  className="btn-pending-cancel"
                  onClick={() => setResolvingTask(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-pending-submit-resolve">
                  <i className="bi bi-check-lg me-1"></i> Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPABASE SQL SETUP MODAL */}
      {showSqlModal && (
        <div className="pending-modal-overlay" onClick={() => setShowSqlModal(false)}>
          <div
            className="pending-modal-box"
            style={{ maxWidth: 680 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pending-modal-header">
              <div>
                <h2 className="pending-modal-title">
                  <i className="bi bi-database-fill-gear" style={{ color: '#38bdf8' }}></i>
                  Supabase Setup: <code>pending_tasks</code> Table
                </h2>
                <p className="pending-modal-subtitle">
                  Run this SQL in your Supabase SQL editor to create the table and enable cross-device live sync
                </p>
              </div>
              <button
                type="button"
                className="pending-modal-close"
                onClick={() => setShowSqlModal(false)}
                aria-label="Close modal"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 10px 0' }}>
                <strong>Step 1:</strong> Go to your Supabase SQL Editor:{' '}
                <a
                  href="https://supabase.com/dashboard/project/mzxunwpzewlsdkmsuenu/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#38bdf8', textDecoration: 'underline' }}
                >
                  https://supabase.com/dashboard/project/mzxunwpzewlsdkmsuenu/sql/new
                </a>
              </p>
              <p style={{ margin: '0 0 10px 0' }}>
                <strong>Step 2:</strong> Paste the SQL below and click <strong>Run</strong>:
              </p>
            </div>

            <div className="pending-sql-codebox">{PENDING_TASKS_TABLE_SQL}</div>

            <div className="pending-modal-footer" style={{ justifyContent: 'space-between' }}>
              <a
                href="https://supabase.com/dashboard/project/mzxunwpzewlsdkmsuenu/sql/new"
                target="_blank"
                rel="noreferrer"
                className="btn-pending-back"
                style={{ textDecoration: 'none' }}
              >
                <i className="bi bi-box-arrow-up-right me-1"></i> Open Supabase SQL Editor
              </a>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn-pending-cancel"
                  onClick={() => setShowSqlModal(false)}
                >
                  Close
                </button>
                <button type="button" className="btn-copy-sql" onClick={handleCopySql}>
                  <i className={`bi ${sqlCopied ? 'bi-check2' : 'bi-clipboard'} me-1`}></i>
                  {sqlCopied ? 'Copied to Clipboard!' : 'Copy SQL'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
