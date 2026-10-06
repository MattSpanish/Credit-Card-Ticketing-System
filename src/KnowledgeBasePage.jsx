// src/KnowledgeBasePage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import './knowledgeBase.css';
import {
  getStoredKnowledgeBaseItems,
  saveKnowledgeBaseItemsList,
  sortKnowledgeBaseItemsAZ,
  DEFAULT_KB_ITEMS,
} from './knowledgeBaseStorage';

function formatKbDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const formatted = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
    return formatted.replace(/^([A-Za-z]+ \d+),\s*/, '$1 ');
  } catch {
    return '';
  }
}

export default function KnowledgeBasePage({ onBackToDashboard }) {
  const [items, setItems] = useState(() => {
    return sortKnowledgeBaseItemsAZ(getStoredKnowledgeBaseItems());
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewingItem, setViewingItem] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states for Add/Edit
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('General');
    const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Derive all unique categories
  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((it) => {
      if (it.category) set.add(it.category.trim());
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [items]);

  // Keyword search & category filter (Always sorted A–Z)
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by category
    if (selectedCategory !== 'ALL') {
      result = result.filter(
        (it) => (it.category || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query based on title and troubleshooting steps content
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      result = result.filter((it) => {
        const titleStr = (it.title || '').toLowerCase();
        const catStr = (it.category || '').toLowerCase();
        const contentStr = (it.description || '').toLowerCase();
        const combined = `${titleStr} ${catStr} ${contentStr}`;

        // Every search word must appear in the title, category, or troubleshooting content
        return tokens.every((token) => combined.includes(token));
      });
    }

    return sortKnowledgeBaseItemsAZ(result);
  }, [items, selectedCategory, searchQuery]);

  // Navigation within full guide view (Prev / Next)
  const currentNavIndex = viewingItem
    ? filteredItems.findIndex((it) => it.id === viewingItem.id)
    : -1;

  const handlePrevItem = () => {
    if (filteredItems.length <= 1 || currentNavIndex === -1) return;
    const prevIdx = (currentNavIndex - 1 + filteredItems.length) % filteredItems.length;
    setViewingItem(filteredItems[prevIdx]);
  };

  const handleNextItem = () => {
    if (filteredItems.length <= 1 || currentNavIndex === -1) return;
    const nextIdx = (currentNavIndex + 1) % filteredItems.length;
    setViewingItem(filteredItems[nextIdx]);
  };

  // Keyboard navigation for viewing guide
  useEffect(() => {
    if (!viewingItem || isEditorOpen) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      if (e.key === 'ArrowLeft') {
        handlePrevItem();
      } else if (e.key === 'ArrowRight') {
        handleNextItem();
      } else if (e.key === 'Escape') {
        setViewingItem(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingItem, isEditorOpen, currentNavIndex, filteredItems]);

  // Open editor for creating new guide
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormCategory('General');
        setFormDescription('');
    setFormError('');
    setIsEditorOpen(true);
  };

  // Open editor for modifying existing guide
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormTitle(item.title || '');
    setFormCategory(item.category || 'General');
        setFormDescription(item.description || '');
    setFormError('');
    setIsEditorOpen(true);
  };

  // Save handler (Add or Update)
  const handleSaveGuide = (e) => {
    e.preventDefault();
    const cleanTitle = formTitle.trim();
    const cleanDesc = formDescription.trim();

    if (!cleanTitle) {
      setFormError('Please enter a title for the troubleshooting guide.');
      return;
    }
    if (!cleanDesc) {
      setFormError('Please enter the troubleshooting steps or description.');
      return;
    }

    
    let updatedList;
    if (editingItem) {
      // Update existing item
      const updatedItem = {
        ...editingItem,
        title: cleanTitle,
        category: formCategory.trim() || 'General',
                description: cleanDesc,
        updatedAt: new Date().toISOString(),
      };
      updatedList = items.map((it) => (it.id === editingItem.id ? updatedItem : it));
      if (viewingItem && viewingItem.id === editingItem.id) {
        setViewingItem(updatedItem);
      }
      showToast(`Updated "${cleanTitle}" successfully!`, 'success');
    } else {
      // Create new item
      const newItem = {
        id: `kb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: cleanTitle,
        category: formCategory.trim() || 'General',
                description: cleanDesc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedList = [...items, newItem];
      showToast(`Created "${cleanTitle}" and added to Knowledge Base!`, 'success');
    }

    // Always sort alphabetically A–Z
    const sorted = sortKnowledgeBaseItemsAZ(updatedList);
    setItems(sorted);
    saveKnowledgeBaseItemsList(sorted);
    setIsEditorOpen(false);
    setEditingItem(null);
  };

  // Delete handler
  const handleDeleteGuide = (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}" from the Knowledge Base?`)) {
      const remaining = items.filter((it) => it.id !== id);
      const sorted = sortKnowledgeBaseItemsAZ(remaining);
      setItems(sorted);
      saveKnowledgeBaseItemsList(sorted);
      if (viewingItem && viewingItem.id === id) {
        setViewingItem(null);
      }
      showToast(`Deleted "${title}"`, 'info');
    }
  };

  // Copy troubleshooting steps to clipboard
  const handleCopySteps = (item) => {
    const textToCopy = `📌 [KNOWLEDGE BASE] ${item.title}\nCategory: ${item.category || 'General'}\n\nTroubleshooting Steps:\n${item.description}`;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopiedId(item.id);
        showToast('Troubleshooting steps copied to clipboard!', 'success');
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch((err) => {
        console.error('Clipboard copy failed:', err);
        showToast('Failed to copy to clipboard', 'error');
      });
  };

  // Reset to default guides
  const handleResetDefaults = () => {
    if (
      window.confirm(
        'Reset Knowledge Base to standard default troubleshooting guides? This will restore initial templates.'
      )
    ) {
      const sorted = sortKnowledgeBaseItemsAZ(DEFAULT_KB_ITEMS);
      setItems(sorted);
      saveKnowledgeBaseItemsList(sorted);
      showToast('Knowledge Base reset to default guides.', 'info');
    }
  };

  return (
    <div className="kb-page-container">
      {/* Toast Banner */}
      {toastMessage && (
        <div className={`kb-toast-alert kb-toast-${toastMessage.type}`}>
          <i
            className={`bi ${
              toastMessage.type === 'success'
                ? 'bi-check-circle-fill'
                : toastMessage.type === 'error'
                ? 'bi-exclamation-triangle-fill'
                : 'bi-info-circle-fill'
            } me-2`}
          ></i>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Section */}
      <div className="kb-header-banner">
        <div className="kb-header-left">
          <div className="header-badge-row">
            <span className="kicker-pill" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
              <i className="bi bi-journal-bookmark-fill me-1" aria-hidden="true"></i> Troubleshooting Steps
            </span>
            <span className="badge-local-pill">LOCAL ONLY</span>
          </div>
          <h1 className="kb-main-title">KNOWLEDGE BASE</h1>

          <div className="kb-header-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="announcement-back-btn kb-btn-compact"
              onClick={onBackToDashboard}
              title="Return to Ticketing Dashboard"
            >
              <i className="bi bi-arrow-left" aria-hidden="true"></i> Back to Dashboard
            </button>

            <button
              type="button"
              className="btn-add-kb-guide kb-btn-compact"
              onClick={handleOpenAdd}
              title="Create a new Knowledge Base entry"
            >
              <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
              <span>New Guide</span>
            </button>
          </div>
        </div>

        <div className="kb-header-right">
          <p className="kb-header-desc">
            Searchable library of terminal troubleshooting steps, host error resolutions, and standard operating procedures.
          </p>
        </div>
      </div>

      {/* Search & Filter Header Bar */}
      <div className="kb-search-panel">
        <div className="kb-search-row">
          <div className="kb-search-input-wrapper">
            <i className="bi bi-search kb-search-icon" aria-hidden="true"></i>
            <input
              type="text"
              className="kb-search-input"
              placeholder="Search troubleshooting steps by word (e.g. EBT, Settlement, Error 99, IP)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchQuery('');
              }}
              aria-label="Search knowledge base guides"
            />
            {searchQuery && (
              <button
                type="button"
                className="kb-search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                aria-label="Clear search"
              >
                <i className="bi bi-x-circle-fill" aria-hidden="true"></i>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="kb-category-chips-row">
          <span className="kb-chips-label">
            <i className="bi bi-funnel me-1"></i> Filter:
          </span>
          <div className="kb-chips-scroll">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`kb-category-chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
                {cat !== 'ALL' && (
                  <span className="kb-chip-count">
                    {items.filter((it) => (it.category || '').toLowerCase() === cat.toLowerCase()).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="kb-btn-reset-defaults"
            onClick={handleResetDefaults}
            title="Reset to default guide templates"
          >
            <i className="bi bi-arrow-counterclockwise me-1"></i> Reset Defaults
          </button>
        </div>
      </div>

      {/* Main Content: Alphabetical List of Guides */}
      <div className="kb-list-section">
        {filteredItems.length === 0 ? (
          <div className="kb-empty-state">
            <div className="kb-empty-icon">
              <i className="bi bi-search"></i>
            </div>
            <h3>No troubleshooting guides found</h3>
            <p>
              {searchQuery.trim()
                ? `No guides match your search "${searchQuery}". Try different keywords or click below to clear.`
                : 'No guides available in this category.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
              {searchQuery.trim() && (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="bi bi-x-circle me-1"></i> Clear Search
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleOpenAdd}
              >
                <i className="bi bi-plus-lg me-1"></i> Add "{searchQuery.trim() || 'New Guide'}"
              </button>
            </div>
          </div>
        ) : (
          <div className="kb-cards-list">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="reminder-card-item kb-card-item"
                onClick={() => setViewingItem(item)}
                tabIndex={0}
                role="button"
                aria-label={`View guide: ${item.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setViewingItem(item);
                  }
                }}
              >
                <div className="reminder-card-main-info kb-card-main-info">
                  <div className="reminder-card-title-group kb-card-title-group">
                    <h4 className="reminder-card-subject kb-card-subject">
                      {item.title}
                    </h4>
                  </div>
                  {(item.updatedAt || item.createdAt) && (
                    <span className="reminder-card-date kb-card-date">
                      {formatKbDate(item.updatedAt || item.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: VIEW FULL GUIDE DETAIL */}
      {viewingItem && (
        <div
          className="break-modal-overlay"
          onClick={() => setViewingItem(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="kb-detail-title"
        >
          <div
            className="break-modal-content kb-detail-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(95vw, 860px)', maxWidth: 860, padding: 28 }}
          >
            {/* Modal Header */}
            <div className="kb-modal-top-bar">
              <div className="kb-detail-breadcrumbs">
                <span className="kb-category-pill-lg">{viewingItem.category || 'General'}</span>
                <span className="kb-nav-counter">
                  Guide {currentNavIndex + 1} of {filteredItems.length} (A–Z)
                </span>
              </div>

              <div className="kb-modal-nav-controls">
                <button
                  type="button"
                  className="feed-refresh-btn"
                  onClick={handlePrevItem}
                  disabled={filteredItems.length <= 1}
                  title="Previous guide (Left Arrow)"
                  aria-label="Previous guide"
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button
                  type="button"
                  className="feed-refresh-btn"
                  onClick={handleNextItem}
                  disabled={filteredItems.length <= 1}
                  title="Next guide (Right Arrow)"
                  aria-label="Next guide"
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
                <button
                  type="button"
                  className="break-close-btn ms-2"
                  onClick={() => setViewingItem(null)}
                  title="Close (Esc)"
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>

            {/* Guide Title */}
            <h2 id="kb-detail-title" className="kb-detail-title">
              {viewingItem.title}
            </h2>

            {/* Action Bar */}
            <div className="kb-detail-actions-bar">
              <button
                type="button"
                className="btn-kb-action-primary"
                onClick={() => handleCopySteps(viewingItem)}
              >
                <i className={`bi ${copiedId === viewingItem.id ? 'bi-check2-all' : 'bi-clipboard-check'} me-1`}></i>
                {copiedId === viewingItem.id ? 'Copied Steps!' : 'Copy Steps to Clipboard'}
              </button>

              <button
                type="button"
                className="btn-kb-action-secondary"
                onClick={() => handleOpenEdit(viewingItem)}
              >
                <i className="bi bi-pencil-square me-1"></i> Edit Guide
              </button>

              <button
                type="button"
                className="btn-kb-action-danger"
                onClick={() => handleDeleteGuide(viewingItem.id, viewingItem.title)}
              >
                <i className="bi bi-trash3 me-1"></i> Delete
              </button>
            </div>

            {/* Full Steps Content */}
            <div className="kb-detail-body">
              <h4 className="kb-body-heading">
                <i className="bi bi-list-check me-2" style={{ color: '#38bdf8' }}></i>
                Troubleshooting Steps & Procedures
              </h4>
              <div className="kb-steps-formatted">
                {viewingItem.description.split('\n').map((line, idx) => {
                  const trimmed = line.trim();
                  if (!trimmed) {
                    return <div key={idx} style={{ height: 10 }} />;
                  }
                  // Check if header step like "1. Check ...", "2. ...", "3. ..."
                  const isStepHeader = /^[0-9]+[.)]\s+/.test(trimmed);
                  // Check if bullet point
                  const isBullet = /^[•\-*]\s+/.test(trimmed);

                  if (isStepHeader) {
                    return (
                      <div key={idx} className="kb-step-row kb-step-header-row">
                        <span className="kb-step-badge">
                          {trimmed.match(/^[0-9]+/)?.[0] || '•'}
                        </span>
                        <div className="kb-step-title-text">
                          {trimmed.replace(/^[0-9]+[.)]\s*/, '')}
                        </div>
                      </div>
                    );
                  }

                  if (isBullet) {
                    return (
                      <div key={idx} className="kb-step-row kb-step-bullet-row">
                        <span className="kb-bullet-dot">•</span>
                        <div className="kb-step-content-text">
                          {trimmed.replace(/^[•\-*]\s*/, '')}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <p key={idx} className="kb-step-normal-text">
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Modal Bottom Footer */}
            <div className="kb-modal-footer">
              <span className="kb-footer-note">
                <i className="bi bi-info-circle me-1"></i> Tip: Use Left / Right arrow keys to browse other guides in alphabetical order.
              </span>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setViewingItem(null)}
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT GUIDE FORM */}
      {isEditorOpen && (
        <div
          className="break-modal-overlay"
          onClick={() => setIsEditorOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="break-modal-content kb-editor-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(95vw, 760px)', maxWidth: 760, padding: 24 }}
          >
            <div className="break-modal-header" style={{ padding: '0 0 16px', marginBottom: 16 }}>
              <div>
                <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i
                    className={`bi ${editingItem ? 'bi-pencil-square' : 'bi-plus-circle-fill'}`}
                    style={{ color: '#8b5cf6' }}
                    aria-hidden="true"
                  ></i>
                  {editingItem ? 'Edit Knowledge Base Guide' : 'Add Knowledge Base Guide'}
                </h2>
                <p className="modal-subtitle">
                  {editingItem
                    ? 'Update the troubleshooting steps or title for this guide.'
                    : 'Create a new troubleshooting guide. It will be automatically sorted alphabetically (A–Z).'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="break-close-btn"
                title="Cancel & Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {formError && (
              <div className="alert alert-danger" style={{ marginBottom: 16, fontSize: 13 }}>
                <i className="bi bi-exclamation-triangle-fill me-2"></i> {formError}
              </div>
            )}

            <form onSubmit={handleSaveGuide} className="kb-editor-form">
              {/* Title input */}
              <div className="form-group mb-3">
                <label className="form-label fw-bold">
                  Guide Title / Subject <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., FD150 EBT Settlement Table Error"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (formError) setFormError('');
                  }}
                  autoFocus
                  required
                />
                <small className="text-muted" style={{ fontSize: 11 }}>
                  The guide will be automatically sorted alphabetically based on this title.
                </small>
              </div>

              {/* Category Row */}
              <div className="form-group mb-3">
                <label className="form-label fw-bold">Category</label>
                <input
                  type="text"
                  list="kb-categories-list"
                  className="form-control"
                  placeholder="e.g. FD150, Dejavoo, PAX, TSYS, Clover, General"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                />
                <datalist id="kb-categories-list">
                  <option value="FD150" />
                  <option value="Dejavoo" />
                  <option value="PAX" />
                  <option value="TSYS" />
                  <option value="Clover" />
                  <option value="Ingenico" />
                  <option value="Verifone" />
                  <option value="General" />
                </datalist>
              </div>

              {/* Troubleshooting Steps */}
              <div className="form-group mb-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label fw-bold m-0">
                    Troubleshooting Steps / Description <span className="text-danger">*</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    style={{ fontSize: 11, padding: '2px 8px' }}
                    onClick={() => {
                      if (!formDescription) {
                        setFormDescription(
                          `1. Identify the Issue:\n   • Check terminal display and verify error message.\n\n2. Power Cycle & Connectivity:\n   • Reboot terminal and inspect Ethernet/Wi-Fi connection.\n\n3. Resolution Steps:\n   • Enter Manager Menu (Password: 1234).\n   • Execute maintenance or re-download command.\n\n4. Test Transaction:\n   • Perform balance inquiry or test authorization.`
                        );
                      }
                    }}
                  >
                    <i className="bi bi-magic me-1"></i> Insert Numbered Template
                  </button>
                </div>
                <textarea
                  className="form-control kb-textarea-steps"
                  rows={10}
                  placeholder="Enter numbered steps, procedures, tips, or configuration commands..."
                  value={formDescription}
                  onChange={(e) => {
                    setFormDescription(e.target.value);
                    if (formError) setFormError('');
                  }}
                  required
                ></textarea>
              </div>

              {/* Form Action Buttons */}
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color, #334155)', paddingTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditorOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: 120 }}>
                  <i className="bi bi-check-lg me-1"></i> {editingItem ? 'Save Changes' : 'Create Guide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
