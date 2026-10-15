// src/supabaseReminders.js
// Dedicated cloud storage & real-time sync manager for Team Reminders ONLY

export const DEFAULT_REMINDERS_URL = 'https://orfbmclzaprgiywkkiup.supabase.co';
export const DEFAULT_REMINDERS_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZmJtY2x6YXByZ2l5d2traXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NzQ1NDQsImV4cCI6MjEwNzU1MDU0NH0.qioq9jHRRsM2FiT2Mhim6vtQ-_Abafq18yc2WoMzqmM';

export const FALLBACK_REMINDERS_URL = 'https://dmszogifeeydgefbocqm.supabase.co';
export const FALLBACK_REMINDERS_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc3pvZ2lmZWV5ZGdlZmJvY3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NDA1NjIsImV4cCI6MjEwNjExNjU2Mn0.zhfSjDDHrbLOIjwgxVIilUy_r8U7xQwxj6MYLCe3e3E';

export const REMINDERS_STORAGE_KEY = 'team_reminders_creditcard';

// SQL definition for user setup in Supabase SQL editor
export const REMINDERS_TABLE_SQL = `-- Run this in your Supabase SQL Editor:
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

export function getRemindersSupabaseConfig() {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_REMINDERS_SUPABASE_URL) || '';
  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_REMINDERS_SUPABASE_ANON_KEY) || '';
  const localUrl =
    (typeof localStorage !== 'undefined' && localStorage.getItem('cc_reminders_supabase_url')) || '';
  const localKey =
    (typeof localStorage !== 'undefined' && localStorage.getItem('cc_reminders_supabase_key')) || '';

  // Filter out any stale/obsolete Supabase URL
  const cleanEnvUrl = envUrl && !envUrl.includes('dmszogifeeydgefbocqm') ? envUrl : '';
  const cleanEnvKey = cleanEnvUrl ? envKey : '';
  const cleanLocalUrl = localUrl && !localUrl.includes('dmszogifeeydgefbocqm') ? localUrl : '';
  const cleanLocalKey = cleanLocalUrl ? localKey : '';

  const url = (cleanEnvUrl || DEFAULT_REMINDERS_URL || cleanLocalUrl).trim().replace(/\/+$/, '');
  const key = (cleanEnvKey || DEFAULT_REMINDERS_KEY || cleanLocalKey).trim();

  return {
    url,
    key,
    isConfigured: Boolean(url && key),
  };
}

// Normalize row from Supabase (handles snake_case vs camelCase)
export function normalizeReminderFromDb(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    subject: row.subject || '',
    description: row.description || '',
    isImportant: Boolean(row.is_important ?? row.isImportant ?? false),
    removedFromSlideshow: Boolean(row.removed_from_slideshow ?? row.removedFromSlideshow ?? false),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

// Local cache helpers
export function getLocalReminders() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const data = localStorage.getItem(REMINDERS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to read local reminders cache', e);
    return [];
  }
}

export function saveLocalReminders(reminders) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  } catch (e) {
    console.error('Failed to save local reminders cache', e);
  }
}

// Test connection & check if table exists
export async function testRemindersConnection() {
  const config = getRemindersSupabaseConfig();
  if (!config.isConfigured) {
    return { success: false, message: 'Supabase credentials for Reminders are not configured.' };
  }

  try {
    const res = await fetch(`${config.url}/rest/v1/reminders?select=id&limit=1`, {
      method: 'GET',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      return { success: true, message: 'Connected to Supabase reminders table!' };
    }

    if (res.status === 404 || res.status === 400) {
      const err = await res.json().catch(() => ({}));
      if (
        (err.message && err.message.includes("Could not find the table 'public.reminders'")) ||
        err.code === 'PGRST205'
      ) {
        return {
          success: false,
          needsTable: true,
          message: 'Connected to Supabase, but "reminders" table is not created yet.',
          sql: REMINDERS_TABLE_SQL,
        };
      }
      return { success: false, message: `Supabase error (${res.status}): ${err.message || res.statusText}` };
    }

    return { success: false, message: `Connection failed (HTTP ${res.status})` };
  } catch (err) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

// Fetch all reminders (Supabase with localStorage fallback)
export async function fetchReminders() {
  const config = getRemindersSupabaseConfig();
  const localList = getLocalReminders();

  if (!config.isConfigured) {
    return { success: true, reminders: localList, source: 'local' };
  }

  try {
    const res = await fetch(`${config.url}/rest/v1/reminders?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const rows = await res.json();
      const normalized = rows.map(normalizeReminderFromDb).filter(Boolean);

      // Save to local cache so reminders remain instantly available offline
      saveLocalReminders(normalized);

      return {
        success: true,
        reminders: normalized,
        source: 'supabase',
      };
    } else if (FALLBACK_REMINDERS_URL && config.url !== FALLBACK_REMINDERS_URL) {
      try {
        const fbRes = await fetch(`${FALLBACK_REMINDERS_URL}/rest/v1/reminders?select=*&order=created_at.desc`, {
          method: 'GET',
          headers: {
            apikey: FALLBACK_REMINDERS_KEY,
            Authorization: `Bearer ${FALLBACK_REMINDERS_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        if (fbRes.ok) {
          const fbRows = await fbRes.json();
          const fbNorm = fbRows.map(normalizeReminderFromDb).filter(Boolean);
          saveLocalReminders(fbNorm);
          return { success: true, reminders: fbNorm, source: 'supabase-secondary' };
        }
      } catch (fbErr) {
        console.warn('Secondary fallback reminders error:', fbErr);
      }
      return {
        success: false,
        reminders: localList,
        source: 'local-fallback',
        status: res.status,
      };
    } else {
      console.warn(`Supabase fetch reminders failed (${res.status}), using local cache`);
      return {
        success: false,
        reminders: localList,
        source: 'local-fallback',
        status: res.status,
      };
    }
  } catch (err) {
    console.warn('Supabase reminders network error, using local cache', err);
    return {
      success: false,
      reminders: localList,
      source: 'local-fallback',
      error: err.message,
    };
  }
}

// Add a reminder (persists to Supabase & localStorage)
export async function addReminder({ subject, description, isImportant }) {
  const now = new Date().toISOString();
  const newReminder = {
    id: 'rem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    subject: (subject || '').trim(),
    description: (description || '').trim(),
    isImportant: Boolean(isImportant),
    removedFromSlideshow: false,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Optimistically save to local cache
  const current = getLocalReminders();
  const updated = [newReminder, ...current.filter((r) => r.id !== newReminder.id)];
  saveLocalReminders(updated);

  const config = getRemindersSupabaseConfig();
  if (config.isConfigured) {
    try {
      // Primary payload (standard snake_case)
      let res = await fetch(`${config.url}/rest/v1/reminders`, {
        method: 'POST',
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          id: newReminder.id,
          subject: newReminder.subject,
          description: newReminder.description,
          is_important: newReminder.isImportant,
          removed_from_slideshow: false,
          created_at: newReminder.createdAt,
          updated_at: newReminder.updatedAt,
        }),
      });

      // If Supabase table uses camelCase columns, retry with camelCase
      if (!res.ok && res.status === 400) {
        res = await fetch(`${config.url}/rest/v1/reminders`, {
          method: 'POST',
          headers: {
            apikey: config.key,
            Authorization: `Bearer ${config.key}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            id: newReminder.id,
            subject: newReminder.subject,
            description: newReminder.description,
            isImportant: newReminder.isImportant,
            removedFromSlideshow: false,
            createdAt: newReminder.createdAt,
            updatedAt: newReminder.updatedAt,
          }),
        });
      }

      if (res.ok) {
        const [savedRecord] = await res.json();
        const normalized = normalizeReminderFromDb(savedRecord) || newReminder;
        const freshList = [normalized, ...getLocalReminders().filter((r) => r.id !== normalized.id)];
        saveLocalReminders(freshList);
        return { success: true, reminder: normalized, synced: true };
      } else {
        console.warn('Supabase add reminder failed, kept locally', res.status);
      }
    } catch (err) {
      console.warn('Supabase add reminder error, kept locally', err);
    }
  }

  return { success: true, reminder: newReminder, synced: false };
}

// Update a reminder (persists to Supabase & localStorage)
export async function updateReminder(id, updates) {
  const now = new Date().toISOString();
  const current = getLocalReminders();
  const existing = current.find((r) => r.id === id);

  const updatedReminder = {
    ...(existing || { id }),
    ...updates,
    updatedAt: now,
  };

  const updatedList = current.map((r) => (r.id === id ? updatedReminder : r));
  saveLocalReminders(updatedList);

  const config = getRemindersSupabaseConfig();
  if (config.isConfigured) {
    try {
      // Primary payload (snake_case)
      const payloadSnake = {
        updated_at: now,
      };
      if (updates.subject !== undefined) payloadSnake.subject = updates.subject;
      if (updates.description !== undefined) payloadSnake.description = updates.description;
      if (updates.isImportant !== undefined) payloadSnake.is_important = Boolean(updates.isImportant);
      if (updates.removedFromSlideshow !== undefined) {
        payloadSnake.removed_from_slideshow = Boolean(updates.removedFromSlideshow);
      }

      let res = await fetch(`${config.url}/rest/v1/reminders?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payloadSnake),
      });

      // Retry with camelCase if needed
      if (!res.ok && res.status === 400) {
        const payloadCamel = { updatedAt: now };
        if (updates.subject !== undefined) payloadCamel.subject = updates.subject;
        if (updates.description !== undefined) payloadCamel.description = updates.description;
        if (updates.isImportant !== undefined) payloadCamel.isImportant = Boolean(updates.isImportant);
        if (updates.removedFromSlideshow !== undefined) {
          payloadCamel.removedFromSlideshow = Boolean(updates.removedFromSlideshow);
        }

        res = await fetch(`${config.url}/rest/v1/reminders?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: {
            apikey: config.key,
            Authorization: `Bearer ${config.key}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(payloadCamel),
        });
      }

      if (res.ok) {
        return { success: true, reminder: updatedReminder, synced: true };
      }
    } catch (err) {
      console.warn('Supabase update reminder error', err);
    }
  }

  return { success: true, reminder: updatedReminder, synced: false };
}

// Delete a reminder (persists to Supabase & localStorage)
export async function deleteReminder(id) {
  const current = getLocalReminders();
  const updatedList = current.filter((r) => r.id !== id);
  saveLocalReminders(updatedList);

  const config = getRemindersSupabaseConfig();
  if (config.isConfigured) {
    try {
      const res = await fetch(`${config.url}/rest/v1/reminders?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        return { success: true, synced: true };
      }
    } catch (err) {
      console.warn('Supabase delete reminder error', err);
    }
  }

  return { success: true, synced: false };
}
