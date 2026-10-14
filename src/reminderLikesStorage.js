// src/reminderLikesStorage.js
// Dedicated local manager for Reminder Acknowledgments & User Profile
// Structured for seamless future integration with Supabase / shared database

export const USER_NAME_STORAGE_KEY = 'team_reminder_user_name';
export const REMINDER_LIKES_STORAGE_KEY = 'team_reminder_acknowledgments';

/**
 * Get the current user's saved name from localStorage
 * @returns {string} User name or empty string if not set
 */
export function getCurrentUserName() {
  if (typeof localStorage === 'undefined') return '';
  try {
    return (localStorage.getItem(USER_NAME_STORAGE_KEY) || '').trim();
  } catch (e) {
    console.error('Failed to read user name from localStorage', e);
    return '';
  }
}

/**
 * Save the current user's name permanently to localStorage
 * @param {string} name 
 * @returns {string} Cleaned trimmed name
 */
export function setCurrentUserName(name) {
  if (typeof localStorage === 'undefined') return '';
  try {
    const cleanName = (name || '').trim();
    if (cleanName) {
      localStorage.setItem(USER_NAME_STORAGE_KEY, cleanName);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reminder_user_name_changed', { detail: { name: cleanName } }));
      }
    }
    return cleanName;
  } catch (e) {
    console.error('Failed to save user name to localStorage', e);
    return '';
  }
}

/**
 * Check if the user has a saved name
 * @returns {boolean}
 */
export function hasSavedUserName() {
  return Boolean(getCurrentUserName());
}

/**
 * Get all reminder acknowledgments map from localStorage
 * Schema: { [reminderId: string]: Array<{ name: string, timestamp: string }> }
 * @returns {Record<string, Array<{ name: string, timestamp: string }>>}
 */
export function getAllReminderAcknowledgments() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(REMINDER_LIKES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (e) {
    console.error('Failed to parse reminder acknowledgments from localStorage', e);
    return {};
  }
}

/**
 * Save all reminder acknowledgments map to localStorage
 * @param {Record<string, Array<{ name: string, timestamp: string }>>} map 
 */
export function saveAllReminderAcknowledgments(map) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(REMINDER_LIKES_STORAGE_KEY, JSON.stringify(map || {}));
  } catch (e) {
    console.error('Failed to write reminder acknowledgments to localStorage', e);
  }
}

/**
 * Get list of users who acknowledged a specific reminder
 * @param {string} reminderId 
 * @returns {Array<{ name: string, timestamp: string }>}
 */
export function getReminderAcknowledgments(reminderId) {
  if (!reminderId) return [];
  const map = getAllReminderAcknowledgments();
  const list = map[reminderId];
  return Array.isArray(list) ? list : [];
}

/**
 * Check if a specific user has acknowledged a reminder
 * @param {string} reminderId 
 * @param {string} [userName] Defaults to current saved user name
 * @returns {boolean}
 */
export function hasUserAcknowledged(reminderId, userName) {
  if (!reminderId) return false;
  const targetName = (userName || getCurrentUserName()).trim().toLowerCase();
  if (!targetName) return false;

  const acks = getReminderAcknowledgments(reminderId);
  return acks.some(item => (item.name || '').trim().toLowerCase() === targetName);
}

/**
 * Toggle acknowledgment for a reminder by the user.
 * Prevents duplicate likes from the same user.
 * @param {string} reminderId 
 * @param {string} [userName] Defaults to current saved user name
 * @returns {{ isAcknowledged: boolean, acknowledgments: Array<{ name: string, timestamp: string }> }}
 */
export function toggleReminderAcknowledgment(reminderId, userName) {
  if (!reminderId) return { isAcknowledged: false, acknowledgments: [] };
  const targetName = (userName || getCurrentUserName()).trim();
  if (!targetName) return { isAcknowledged: false, acknowledgments: getReminderAcknowledgments(reminderId) };

  const map = getAllReminderAcknowledgments();
  const currentList = Array.isArray(map[reminderId]) ? [...map[reminderId]] : [];
  const normalizedTarget = targetName.toLowerCase();

  const existingIndex = currentList.findIndex(
    item => (item.name || '').trim().toLowerCase() === normalizedTarget
  );

  let isAcknowledged = false;

  if (existingIndex >= 0) {
    // User already liked it: toggle off (unlike)
    currentList.splice(existingIndex, 1);
    isAcknowledged = false;
  } else {
    // Add acknowledgment (ensuring name is capitalized nicely and timestamp recorded)
    currentList.push({
      name: targetName,
      timestamp: new Date().toISOString()
    });
    isAcknowledged = true;
  }

  map[reminderId] = currentList;
  saveAllReminderAcknowledgments(map);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('reminder_acknowledgments_updated', {
        detail: { reminderId, isAcknowledged, acknowledgments: currentList }
      })
    );
  }

  return { isAcknowledged, acknowledgments: currentList };
}

/**
 * Explicitly add an acknowledgment (prevent duplicates)
 * @param {string} reminderId 
 * @param {string} userName 
 * @returns {Array<{ name: string, timestamp: string }>}
 */
export function addReminderAcknowledgment(reminderId, userName) {
  if (!reminderId) return [];
  const targetName = (userName || getCurrentUserName()).trim();
  if (!targetName) return getReminderAcknowledgments(reminderId);

  const map = getAllReminderAcknowledgments();
  const currentList = Array.isArray(map[reminderId]) ? [...map[reminderId]] : [];
  const normalizedTarget = targetName.toLowerCase();

  const exists = currentList.some(
    item => (item.name || '').trim().toLowerCase() === normalizedTarget
  );

  if (!exists) {
    currentList.push({
      name: targetName,
      timestamp: new Date().toISOString()
    });
    map[reminderId] = currentList;
    saveAllReminderAcknowledgments(map);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('reminder_acknowledgments_updated', {
          detail: { reminderId, isAcknowledged: true, acknowledgments: currentList }
        })
      );
    }
  }

  return currentList;
}

/**
 * Future Database Hook / Stub
 * When Supabase table is created:
 * CREATE TABLE public.reminder_acknowledgments (
 *    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *    reminder_id TEXT NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
 *    user_name TEXT NOT NULL,
 *    created_at TIMESTAMPTZ DEFAULT now(),
 *    UNIQUE(reminder_id, user_name)
 * );
 * 
 * This stub can be implemented when the user provides the Supabase connection info.
 */
export async function syncAcknowledgmentsWithDb() {
  // Local-only mode currently. Ready for database integration when configured.
  return { success: true, mode: 'local' };
}
