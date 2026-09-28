// src/supabaseReminders.js
// Dedicated cloud storage & real-time sync manager for Team Reminders ONLY

export const DEFAULT_REMINDERS_URL = 'https://dmszogifeeydgefbocqm.supabase.co';
export const DEFAULT_REMINDERS_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc3pvZ2lmZWV5ZGdlZmJvY3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NDA1NjIsImV4cCI6MjEwNjExNjU2Mn0.zhfSjDDHrbLOIjwgxVIilUy_r8U7xQwxj6MYLCe3e3E';

export const REMINDERS_STORAGE_KEY = 'team_reminders_creditcard';

// SQL definition for user setup in Supabase SQL editor
export const REMINDERS_TABLE_SQL = `-- Run this in Supabase SQL Editor for Nashville CC Reminders:
CREATE TABLE IF NOT EXISTS public.reminders (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    is_important BOOLEAN DEFAULT false,
    removed_from_slideshow BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for team members with anon key
CREATE POLICY "Allow public select on reminders" ON public.reminders FOR SELECT USING (true);
CREATE POLICY "Allow public insert on reminders" ON public.reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on reminders" ON public.reminders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on reminders" ON public.reminders FOR DELETE USING (true);
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

  const url = (envUrl || DEFAULT_REMINDERS_URL || localUrl).trim().replace(/\/+$/, '');
  const key = (envKey || DEFAULT_REMINDERS_KEY || localKey).trim();

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
