// src/ReminderAcknowledgeComponents.jsx
// Interactive Like / Acknowledgment Button with Hover Popover & User Name Prompt Modal
import React, { useState, useEffect, useRef } from 'react';
import {
  getCurrentUserName,
  setCurrentUserName,
  hasSavedUserName,
  getReminderAcknowledgments,
  hasUserAcknowledged,
  toggleReminderAcknowledgment
} from './reminderLikesStorage';

/**
 * Get 1-2 letter initials from a user's full name
 * @param {string} name 
 * @returns {string}
 */
export function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format ISO timestamp into clean readable date/time (e.g. "Oct 14 7:45 PM")
 * @param {string} isoString 
 * @returns {string}
 */
export function formatAckTime(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}

/**
 * "Enter Your Name" Modal Prompt
 * Appears automatically on first visit or when user clicks to update their name
 */
export function UserNamePromptModal({
  isOpen,
  currentName = '',
  onSave,
  onClose,
  isMandatory = false
}) {
  const [inputVal, setInputVal] = useState(currentName);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setInputVal(currentName || '');
      setError('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = (inputVal || '').trim();
    if (!trimmed) {
      setError('Please enter your name.');
      if (inputRef.current) inputRef.current.focus();
      return;
    }
    const saved = setCurrentUserName(trimmed);
    if (onSave) onSave(saved);
  };

  return (
    <div
      className="user-name-modal-overlay"
      onClick={() => {
        if (!isMandatory && onClose) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-name-modal-title"
    >
      <div
        className="user-name-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="user-name-modal-icon" aria-hidden="true">
          <i className="bi bi-person-badge"></i>
        </div>

        <h3 id="user-name-modal-title" className="user-name-modal-title">
          {currentName ? 'Update Your Name' : 'Welcome to Team Reminders'}
        </h3>
        <p className="user-name-modal-desc">
          Enter your name so team members can see who has liked each reminder.
          Your name will be saved permanently in your browser.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="user-name-modal-input"
            placeholder="Enter your name (e.g. John Doe)"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              if (error) setError('');
            }}
            maxLength={60}
            required
            autoComplete="name"
          />

          {error && (
            <div style={{ color: '#ef4444', fontSize: '0.80rem', marginBottom: 12, textAlign: 'left', fontWeight: 600 }}>
              <i className="bi bi-exclamation-circle me-1"></i> {error}
            </div>
          )}

          <div className="user-name-modal-actions">
            {!isMandatory && onClose && (
              <button
                type="button"
                className="btn-user-name-cancel"
                onClick={onClose}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn-user-name-submit"
              disabled={!inputVal.trim()}
            >
              <i className="bi bi-check2-circle me-1"></i> {currentName ? 'Save Name' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Like / Acknowledgment Button for Reminders
 * - Shows like button with count and active state
 * - On hover: reveals the list of team members who acknowledged
 * - Prevents multiple likes from the same user
 */
export function ReminderAcknowledgeButton({
  reminderId,
  currentUserName,
  onRequireName,
  variant = 'card', // 'compact' | 'card' | 'detail'
  align = 'right',  // 'right' | 'left'
  dropDown = false  // if true, popover opens downward
}) {
  const [acks, setAcks] = useState(() => getReminderAcknowledgments(reminderId));
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);

  // Sync state whenever reminderId changes or an acknowledgment is made anywhere
  useEffect(() => {
    setAcks(getReminderAcknowledgments(reminderId));

    const handleAcksUpdated = (e) => {
      if (e.detail?.reminderId === reminderId) {
        setAcks(e.detail.acknowledgments || getReminderAcknowledgments(reminderId));
      }
    };

    window.addEventListener('reminder_acknowledgments_updated', handleAcksUpdated);
    return () => {
      window.removeEventListener('reminder_acknowledgments_updated', handleAcksUpdated);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [reminderId]);

  const effectiveUserName = (currentUserName || getCurrentUserName()).trim();
  const isLiked = hasUserAcknowledged(reminderId, effectiveUserName);
  const count = acks.length;

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // Small delay to allow moving onto popover
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (!effectiveUserName) {
      if (onRequireName) onRequireName();
      return;
    }
    const result = toggleReminderAcknowledgment(reminderId, effectiveUserName);
    setAcks(result.acknowledgments);
  };

  return (
    <div
      className="reminder-ack-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className={`btn-reminder-like ${variant} ${isLiked ? 'is-liked' : ''}`}
        onClick={handleClick}
        title={
          isLiked
            ? `Liked by you${count > 0 ? ` (${count} total)` : ''}. Click to remove like.`
            : `Like${count > 0 ? ` (${count})` : ''}`
        }
        aria-label={`Like reminder${count > 0 ? `, ${count} likes` : ''}`}
        aria-pressed={isLiked}
      >
        <i className={`bi ${isLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}`} aria-hidden="true"></i>
        {count > 0 && <span className="reminder-like-count">{count}</span>}
      </button>

      {/* Hover Popover: View who liked */}
      {isHovered && (
        <div
          className={`reminder-ack-popover ${align === 'left' ? 'align-left' : ''} ${dropDown ? 'drop-down' : ''}`}
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="reminder-ack-popover-header">
            <h5 className="reminder-ack-popover-title">
              <i className="bi bi-people-fill" style={{ color: '#8b5cf6' }}></i>
              Liked by
            </h5>
            <span className="reminder-ack-popover-badge">
              {count} {count === 1 ? 'person' : 'people'}
            </span>
          </div>

          {count === 0 ? (
            <div className="reminder-ack-empty">
              <i className="bi bi-info-circle me-1" style={{ color: '#8b5cf6' }}></i>
              No likes yet. Click the button to like this reminder!
            </div>
          ) : (
            <ul className="reminder-ack-list">
              {acks.map((item, idx) => {
                const isCurrent = effectiveUserName && item.name.toLowerCase() === effectiveUserName.toLowerCase();
                return (
                  <li key={`${item.name}-${idx}`} className="reminder-ack-item">
                    <div className="reminder-ack-user-info">
                      <span className="reminder-ack-avatar" aria-hidden="true">
                        {getInitials(item.name)}
                      </span>
                      <span className="reminder-ack-name" title={item.name}>
                        {item.name}
                        {isCurrent && <span className="reminder-ack-you-tag">You</span>}
                      </span>
                    </div>
                    {item.timestamp && (
                      <span className="reminder-ack-time">
                        {formatAckTime(item.timestamp)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
