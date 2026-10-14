// src/reminderLikesStorage.js
// Dedicated cloud & local storage manager for Team Reminder Acknowledgments & User Profile
// Integrates with Supabase (https://orfbmclzaprgiywkkiup.supabase.co) with instant offline-first caching

export const DEFAULT_LIKES_SUPABASE_URL = 'https://orfbmclzaprgiywkkiup.supabase.co';
export const DEFAULT_LIKES_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZmJtY2x6YXByZ2l5d2traXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NzQ1NDQsImV4cCI6MjEwNzU1MDU0NH0.qioq9jHRRsM2FiT2Mhim6vtQ-_Abafq18yc2WoMzqmM';

export const USER_NAME_STORAGE_KEY = 'team_reminder_user_name';
export const REMINDER_LIKES_STORAGE_KEY = 'team_reminder_acknowledgments';

export const REMINDER_LIKES_TABLE_SQL = `-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/orfbmclzaprgiywkkiup/sql/new

-- 1. Table for Reminders
CREATE TABLE IF NOT EXISTS public.reminders (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    is_important BOOLEAN DEFAULT false,
    removed_from_slideshow BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table for Reminder Acknowledgments (Likes)
CREATE TABLE IF NOT EXISTS public.reminder_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_reminder_user_ack UNIQUE (reminder_id, user_name)
);

-- 3. Alias table for reminder_likes (for maximum compatibility)
CREATE TABLE IF NOT EXISTS public.reminder_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_reminder_user_like UNIQUE (reminder_id, user_name)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_likes ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Anon Access
DROP POLICY IF EXISTS "Allow public select on reminders" ON public.reminders;
CREATE POLICY "Allow public select on reminders" ON public.reminders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on reminders" ON public.reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on reminders" ON public.reminders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on reminders" ON public.reminders FOR UPDATE USING (true);
CREATE POLICY "Allow public update on reminders" ON public.reminders FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on reminders" ON public.reminders FOR DELETE USING (true);
CREATE POLICY "Allow public delete on reminders" ON public.reminders FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public select on reminder_acknowledgments" ON public.reminder_acknowledgments;
CREATE POLICY "Allow public select on reminder_acknowledgments" ON public.reminder_acknowledgments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on reminder_acknowledgments" ON public.reminder_acknowledgments;
CREATE POLICY "Allow public insert on reminder_acknowledgments" ON public.reminder_acknowledgments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on reminder_acknowledgments" ON public.reminder_acknowledgments;
CREATE POLICY "Allow public delete on reminder_acknowledgments" ON public.reminder_acknowledgments FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public select on reminder_likes" ON public.reminder_likes;
CREATE POLICY "Allow public select on reminder_likes" ON public.reminder_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on reminder_likes" ON public.reminder_likes;
CREATE POLICY "Allow public insert on reminder_likes" ON public.reminder_likes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on reminder_likes" ON public.reminder_likes;
CREATE POLICY "Allow public delete on reminder_likes" ON public.reminder_likes FOR DELETE USING (true);

-- 6. Preload Nashville Support Reminders
INSERT INTO public.reminders (id, subject, description, is_important, removed_from_slideshow, created_at, updated_at)
VALUES 
('rem_1791551981437_491gb', 'UPDATE: EBT FOR NEXGO + RAPID CONNECT', 'Please be advised that EBT card transactions are not working with Nexgo + Rapid Connect when integrated with Retailz POS . However, EBT transactions are working with Nexgo Transit . Thank you for your attention!', true, false, '2026-10-09T13:19:41.437Z', '2026-10-09T13:19:54.641Z'),
('rem_1790690379957_nyzqc', 'Shift Workload, Task Assignments, and Update Requirements', 'Good morning, everyone! Please ensure you manage your assigned tasks effectively throughout your shift. Prioritize critical issues, update tickets promptly, and collaborate with your teammates as needed. Let''s keep communication clear and maintain our high standards of support. Have a productive shift!', true, false, '2026-09-29T14:00:00.000Z', '2026-09-29T14:00:00.000Z'),
('rem_1790960405193_939l1', 'Partial Approval for Nexgo-Fiserv Resolved (OCTOBER 02, 2026)', '<p><strong>The Partial Payment issue has been resolved in NEXGO Rapid Connect (RC).</strong><br>Please ensure that the following configurations and version updates are completed:</p><ol><li>NEXGO Rapid Connect (RC): <strong>Update to Version 552</strong></li><li>P98 Application: Update to <strong>Version 1.0.9</strong></li><li>Ensure the required Partial Payment settings are properly configured in <strong>TAP/TMS Portal.</strong></li></ol>', true, false, '2026-10-02T17:00:05.193Z', '2026-10-05T15:54:07.419Z'),
('rem_1791477658506_tkglz', 'NEW UPDATE: P98 VERSION - PAX TERMINAL (APPROVED OCTOBER 08,2026)', '<h3>Please push the latest <strong>P98 version 1.0.9</strong> in BROADPOS for PAX A35 terminals with P98 programming.</h3><br><h2>Kindly ensure the latest version is deployed accordingly.</h2><br><h2>Thank you.</h2>', true, false, '2026-10-08T16:40:58.506Z', '2026-10-08T16:41:27.736Z'),
('rem_1791476926683_e4epg', 'New: P98 Application Version – PAX Terminal', '<p>When programming a PAX terminal with P98, you can use Version 1.0.9.</p><p>If you encounter any issues with Version 1.0.9, please take note of the issue and try downgrading to Version of 1.0.8 or 1.0.6.</p>', true, true, '2026-10-08T16:28:46.683Z', '2026-10-12T05:36:15.619Z'),
('rem_1790718866173_reqok', 'Partial Approval for Nexgo-Fiserv', 'The Auto-Decline feature for Nexgo-Fiserv terminals was not previously available in the TMS Portal, even though it was available for Nexgo-TSYS terminals.\n\nThis feature was recently added to the Fiserv setup last month. However, we discovered that it is causing issues in production at live stores. We have already communicated this issue to the team, and they are still working to identify the root cause and provide a permanent solution. The resolution is taking longer than expected.\n\nFor now, the only solution for this issue on Nexgo-Fiserv terminals is to replace the terminal with a PAX + P98 terminal.', true, true, '2026-09-29T21:54:26.173Z', '2026-10-12T05:36:25.233Z')
ON CONFLICT (id) DO NOTHING;
`;

/**
 * Get Supabase configuration for Reminder Acknowledgments
 */
export function getLikesSupabaseConfig() {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_REMINDERS_SUPABASE_URL) || '';
  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_REMINDERS_SUPABASE_ANON_KEY) || '';
  const localUrl =
    (typeof localStorage !== 'undefined' && localStorage.getItem('cc_reminders_supabase_url')) || '';
  const localKey =
    (typeof localStorage !== 'undefined' && localStorage.getItem('cc_reminders_supabase_key')) || '';

  const url = (envUrl || DEFAULT_LIKES_SUPABASE_URL || localUrl).trim().replace(/\/+$/, '');
  const key = (envKey || DEFAULT_LIKES_SUPABASE_KEY || localKey).trim();

  return {
    url,
    key,
    isConfigured: Boolean(url && key),
  };
}

/**
 * Test connection to Supabase for Reminder Acknowledgments
 */
export async function testLikesSupabaseConnection() {
  const config = getLikesSupabaseConfig();
  if (!config.isConfigured) {
    return { success: false, message: 'Supabase credentials for Reminder Likes are not configured.' };
  }

  for (const table of ['reminder_acknowledgments', 'reminder_likes']) {
    try {
      const res = await fetch(`${config.url}/rest/v1/${table}?select=reminder_id&limit=1`, {
        method: 'GET',
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        return { success: true, table, message: `Connected to Supabase "${table}" table!` };
      }
    } catch (e) {
      console.warn(`Connection test error on ${table}:`, e);
    }
  }

  return {
    success: false,
    needsTable: true,
    message: 'Connected to Supabase, but "reminder_acknowledgments" table is not created yet.',
    sql: REMINDER_LIKES_TABLE_SQL,
  };
}

/**
 * Real-time Supabase WebSocket Manager for Team Reminders
 * Ensures instant sub-second synchronization of likes/acknowledgments across all users
 */
let realtimeSocket = null;
let realtimeHeartbeatInterval = null;
let realtimeReconnectTimeout = null;
let realtimeReconnectAttempts = 0;
let isRealtimeStarted = false;
let socketRefCounter = 1;

export function getRealtimeWsUrl() {
  const config = getLikesSupabaseConfig();
  if (!config.isConfigured) return '';
  const wsBase = config.url.replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://');
  return `${wsBase}/realtime/v1/websocket?apikey=${encodeURIComponent(config.key)}&vsn=1.0.0`;
}

export function handleRemoteLikeBroadcast({ reminderId, userName, isLiked, timestamp }) {
  if (!reminderId || !userName) return;
  const map = getAllReminderAcknowledgments();
  const currentList = Array.isArray(map[reminderId]) ? [...map[reminderId]] : [];
  const normalizedTarget = userName.toLowerCase().trim();

  const existingIndex = currentList.findIndex(
    (item) => (item.name || '').trim().toLowerCase() === normalizedTarget
  );

  if (isLiked) {
    if (existingIndex === -1) {
      currentList.push({ name: userName.trim(), timestamp: timestamp || new Date().toISOString() });
    } else {
      currentList[existingIndex] = {
        name: userName.trim(),
        timestamp: timestamp || currentList[existingIndex].timestamp,
      };
    }
  } else {
    if (existingIndex >= 0) {
      currentList.splice(existingIndex, 1);
    }
  }

  map[reminderId] = currentList;
  saveAllReminderAcknowledgments(map);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('reminder_acknowledgments_updated', {
        detail: { reminderId, isAcknowledged: isLiked, acknowledgments: currentList, source: 'realtime' },
      })
    );
    window.dispatchEvent(
      new CustomEvent('reminder_acknowledgments_synced', { detail: { map, source: 'realtime' } })
    );
  }
}

export function broadcastRealtimeLike(reminderId, userName, isLiked) {
  if (
    typeof WebSocket === 'undefined' ||
    !realtimeSocket ||
    realtimeSocket.readyState !== WebSocket.OPEN
  ) {
    return false;
  }

  try {
    const payload = {
      topic: 'realtime:reminder_likes_channel',
      event: 'broadcast',
      payload: {
        type: 'broadcast',
        event: 'like_toggled',
        payload: {
          reminderId,
          userName: (userName || '').trim(),
          isLiked: Boolean(isLiked),
          timestamp: new Date().toISOString(),
        },
      },
      ref: String(socketRefCounter++),
    };
    realtimeSocket.send(JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('Failed to send realtime like broadcast:', err);
    return false;
  }
}

export function startRealtimeLikesSubscription() {
  if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return;
  isRealtimeStarted = true;

  if (
    realtimeSocket &&
    (realtimeSocket.readyState === WebSocket.OPEN || realtimeSocket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  const wsUrl = getRealtimeWsUrl();
  if (!wsUrl) return;

  try {
    realtimeSocket = new WebSocket(wsUrl);

    realtimeSocket.onopen = () => {
      realtimeReconnectAttempts = 0;
      // Join the shared broadcast channel
      realtimeSocket.send(
        JSON.stringify({
          topic: 'realtime:reminder_likes_channel',
          event: 'phx_join',
          payload: {
            config: {
              broadcast: { ack: false, self: false },
              postgres_changes: [{ event: '*', schema: 'public', table: 'reminder_acknowledgments' }],
            },
          },
          ref: String(socketRefCounter++),
        })
      );

      // Start keep-alive heartbeat ping every 25 seconds
      if (realtimeHeartbeatInterval) clearInterval(realtimeHeartbeatInterval);
      realtimeHeartbeatInterval = setInterval(() => {
        if (realtimeSocket && realtimeSocket.readyState === WebSocket.OPEN) {
          realtimeSocket.send(
            JSON.stringify({
              topic: 'phoenix',
              event: 'heartbeat',
              payload: {},
              ref: 'hb_' + Date.now(),
            })
          );
        }
      }, 25000);

      // Fetch fresh data from DB on connect to catch any updates while offline
      fetchAcknowledgmentsFromDb().catch(() => {});
    };

    realtimeSocket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'broadcast' && msg.payload?.event === 'like_toggled') {
          handleRemoteLikeBroadcast(msg.payload.payload);
        } else if (msg.event === 'postgres_changes') {
          fetchAcknowledgmentsFromDb().catch(() => {});
        }
      } catch (err) {
        console.warn('Realtime message parse error:', err);
      }
    };

    realtimeSocket.onclose = () => {
      if (realtimeHeartbeatInterval) clearInterval(realtimeHeartbeatInterval);
      if (isRealtimeStarted) {
        const delay = Math.min(1000 * Math.pow(2, realtimeReconnectAttempts), 10000);
        realtimeReconnectAttempts++;
        if (realtimeReconnectTimeout) clearTimeout(realtimeReconnectTimeout);
        realtimeReconnectTimeout = setTimeout(() => {
          if (isRealtimeStarted) startRealtimeLikesSubscription();
        }, delay);
      }
    };

    realtimeSocket.onerror = (err) => {
      console.warn('Supabase Realtime socket notice:', err);
    };
  } catch (err) {
    console.warn('Failed to start Supabase Realtime subscription:', err);
  }
}

export function stopRealtimeLikesSubscription() {
  isRealtimeStarted = false;
  if (realtimeReconnectTimeout) clearTimeout(realtimeReconnectTimeout);
  if (realtimeHeartbeatInterval) clearInterval(realtimeHeartbeatInterval);
  if (realtimeSocket) {
    try {
      realtimeSocket.close();
    } catch {}
    realtimeSocket = null;
  }
}

// Auto-start in browser environment
if (typeof window !== 'undefined') {
  startRealtimeLikesSubscription();
}

/**
 * Fetch all reminder acknowledgments from Supabase and sync with local cache
 */
export async function fetchAcknowledgmentsFromDb() {
  const config = getLikesSupabaseConfig();
  const localMap = getAllReminderAcknowledgments();

  if (!config.isConfigured) {
    return { success: true, acknowledgments: localMap, source: 'local' };
  }

  // Probe reminder_acknowledgments then reminder_likes
  for (const table of ['reminder_acknowledgments', 'reminder_likes']) {
    try {
      const cacheBust = `&_t=${Date.now()}`;
      const res = await fetch(`${config.url}/rest/v1/${table}?select=*&order=created_at.asc${cacheBust}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (res.ok) {
        const rows = await res.json();
        const map = {};

        for (const row of rows) {
          const rId = String(row.reminder_id || row.reminderId || '');
          const name = String(row.user_name || row.userName || '').trim();
          const timestamp = row.created_at || row.timestamp || new Date().toISOString();
          if (!rId || !name) continue;

          if (!map[rId]) map[rId] = [];
          if (!map[rId].some((u) => u.name.toLowerCase() === name.toLowerCase())) {
            map[rId].push({ name, timestamp });
          }
        }

        // Cache synced data locally
        saveAllReminderAcknowledgments(map);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('reminder_acknowledgments_synced', { detail: { map, source: 'supabase' } })
          );
        }

        return { success: true, acknowledgments: map, source: 'supabase' };
      }
    } catch (err) {
      console.warn(`Supabase ${table} fetch error:`, err);
    }
  }

  // Graceful local fallback if table does not exist or network unavailable
  return { success: false, acknowledgments: localMap, source: 'local-fallback' };
}

/**
 * Sync like/unlike toggle to Supabase in the background
 */
async function syncToggleToDb(reminderId, userName, shouldLike) {
  const config = getLikesSupabaseConfig();
  if (!config.isConfigured) return;

  for (const table of ['reminder_acknowledgments', 'reminder_likes']) {
    try {
      if (shouldLike) {
        const res = await fetch(`${config.url}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: config.key,
            Authorization: `Bearer ${config.key}`,
            Prefer: 'resolution=ignore-duplicates',
          },
          body: JSON.stringify({
            reminder_id: reminderId,
            user_name: userName,
            created_at: new Date().toISOString(),
          }),
        });
        if (res.ok) return;
      } else {
        const res = await fetch(
          `${config.url}/rest/v1/${table}?reminder_id=eq.${encodeURIComponent(
            reminderId
          )}&user_name=ilike.${encodeURIComponent(userName)}`,
          {
            method: 'DELETE',
            headers: {
              apikey: config.key,
              Authorization: `Bearer ${config.key}`,
            },
          }
        );
        if (res.ok) return;
      }
    } catch (e) {
      console.warn(`Error updating ${table} in Supabase:`, e);
    }
  }
}

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
  return acks.some((item) => (item.name || '').trim().toLowerCase() === targetName);
}

/**
 * Toggle acknowledgment for a reminder by the user.
 * Optimistically updates local cache and syncs to Supabase.
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
    (item) => (item.name || '').trim().toLowerCase() === normalizedTarget
  );

  let isAcknowledged = false;

  if (existingIndex >= 0) {
    // User already liked it: toggle off (unlike)
    currentList.splice(existingIndex, 1);
    isAcknowledged = false;
  } else {
    // Add acknowledgment
    currentList.push({
      name: targetName,
      timestamp: new Date().toISOString(),
    });
    isAcknowledged = true;
  }

  map[reminderId] = currentList;
  saveAllReminderAcknowledgments(map);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('reminder_acknowledgments_updated', {
        detail: { reminderId, isAcknowledged, acknowledgments: currentList },
      })
    );
  }

  // 1. Instant sub-second broadcast to all active team members via WebSocket
  broadcastRealtimeLike(reminderId, targetName, isAcknowledged);

  // 2. Background persistent sync to Supabase
  syncToggleToDb(reminderId, targetName, isAcknowledged).catch((err) => {
    console.warn('Background Supabase acknowledgment sync error:', err);
  });

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
    (item) => (item.name || '').trim().toLowerCase() === normalizedTarget
  );

  if (!exists) {
    currentList.push({
      name: targetName,
      timestamp: new Date().toISOString(),
    });
    map[reminderId] = currentList;
    saveAllReminderAcknowledgments(map);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('reminder_acknowledgments_updated', {
          detail: { reminderId, isAcknowledged: true, acknowledgments: currentList },
        })
      );
    }

    // 1. Instant sub-second broadcast to all active team members via WebSocket
    broadcastRealtimeLike(reminderId, targetName, true);

    // 2. Background persistent sync to Supabase
    syncToggleToDb(reminderId, targetName, true).catch((err) => {
      console.warn('Background Supabase acknowledgment add error:', err);
    });
  }

  return currentList;
}

/**
 * Sync acknowledgments with Supabase DB (alias for fetchAcknowledgmentsFromDb)
 */
export async function syncAcknowledgmentsWithDb() {
  return fetchAcknowledgmentsFromDb();
}
