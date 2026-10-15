// src/supabasePendingTasks.js
// Dedicated cloud storage & real-time sync manager for Shift Handover Pending Tasks

export const DEFAULT_PENDING_SUPABASE_URL = 'https://mzxunwpzewlsdkmsuenu.supabase.co';
export const DEFAULT_PENDING_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eHVud3B6ZXdsc2RrbXN1ZW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNTI3OTgsImV4cCI6MjEwNzYyODc5OH0.ZRDyobgR_kS3S4yGssbhbYXWU3VwcilEMkZ8FLtLIU4';

export const PENDING_TASKS_STORAGE_KEY = 'cc_pending_tasks_data_v1';

// SQL definition for table creation in Supabase SQL editor
export const PENDING_TASKS_TABLE_SQL = `-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mzxunwpzewlsdkmsuenu/sql/new

CREATE TABLE IF NOT EXISTS public.pending_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'resolved'
    resolved_by TEXT,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_pending_tasks_status ON public.pending_tasks(status);
CREATE INDEX IF NOT EXISTS idx_pending_tasks_created_at ON public.pending_tasks(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.pending_tasks ENABLE ROW LEVEL SECURITY;

-- Allow team members to read, create, update, and delete
DROP POLICY IF EXISTS "Allow public select on pending_tasks" ON public.pending_tasks;
CREATE POLICY "Allow public select on pending_tasks" ON public.pending_tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on pending_tasks" ON public.pending_tasks;
CREATE POLICY "Allow public insert on pending_tasks" ON public.pending_tasks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on pending_tasks" ON public.pending_tasks;
CREATE POLICY "Allow public update on pending_tasks" ON public.pending_tasks FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete on pending_tasks" ON public.pending_tasks;
CREATE POLICY "Allow public delete on pending_tasks" ON public.pending_tasks FOR DELETE USING (true);
`;

/**
 * Retrieves Supabase configuration (pre-configured with user credentials, with localStorage/env overrides).
 */
export function getPendingSupabaseConfig() {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PENDING_SUPABASE_URL) || '';
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PENDING_SUPABASE_ANON_KEY) || '';
  const localUrl = (typeof localStorage !== 'undefined' && localStorage.getItem('cc_pending_supabase_url')) || '';
  const localKey = (typeof localStorage !== 'undefined' && localStorage.getItem('cc_pending_supabase_key')) || '';

  const url = (envUrl || localUrl || DEFAULT_PENDING_SUPABASE_URL).trim().replace(/\/+$/, '');
  const key = (envKey || localKey || DEFAULT_PENDING_SUPABASE_KEY).trim();

  return {
    url,
    key,
    isConfigured: Boolean(url && key),
  };
}

export function savePendingSupabaseConfig(url, key) {
  if (typeof localStorage === 'undefined') return;
  if (url) {
    localStorage.setItem('cc_pending_supabase_url', url.trim().replace(/\/+$/, ''));
  } else {
    localStorage.removeItem('cc_pending_supabase_url');
  }
  if (key) {
    localStorage.setItem('cc_pending_supabase_key', key.trim());
  } else {
    localStorage.removeItem('cc_pending_supabase_key');
  }
}

/**
 * Normalizes database row to match UI camelCase structure.
 */
export function normalizePendingTaskFromDb(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    title: row.title || '',
    details: row.details || '',
    createdBy: (row.created_by || row.createdBy || 'Support').trim(),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    status: row.status === 'resolved' ? 'resolved' : 'pending',
    resolvedBy: row.resolved_by || row.resolvedBy || null,
    resolutionNotes: row.resolution_notes || row.resolutionNotes || null,
    resolvedAt: row.resolved_at || row.resolvedAt || null,
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

/**
 * Local cache helpers for offline fallback and fast initial paint.
 */
export function getLocalPendingTasks() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PENDING_TASKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to read local pending tasks cache', e);
    return [];
  }
}

export function saveLocalPendingTasks(tasks) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PENDING_TASKS_STORAGE_KEY, JSON.stringify(tasks));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pending_tasks_changed'));
    }
  } catch (e) {
    console.error('Failed to save local pending tasks cache', e);
  }
}

/**
 * Tests connection to Supabase and verifies if the pending_tasks table is created.
 */
export async function testPendingConnection() {
  const config = getPendingSupabaseConfig();
  if (!config.isConfigured) {
    return { success: false, message: 'Supabase credentials are not configured.' };
  }

  try {
    const res = await fetch(`${config.url}/rest/v1/pending_tasks?select=id&limit=1`, {
      method: 'GET',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      return { success: true, message: 'Connected to Supabase pending_tasks table!' };
    }

    if (res.status === 404 || res.status === 400) {
      const err = await res.json().catch(() => ({}));
      if (
        (err.message && err.message.includes("Could not find the table 'public.pending_tasks'")) ||
        err.code === 'PGRST205'
      ) {
        return {
          success: false,
          needsTable: true,
          message: 'Connected to Supabase, but "pending_tasks" table is not created yet.',
          sql: PENDING_TASKS_TABLE_SQL,
        };
      }
      return { success: false, message: `Supabase error (${res.status}): ${err.message || res.statusText}` };
    }

    return { success: false, message: `Connection failed (HTTP ${res.status})` };
  } catch (err) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

/**
 * Fetches all pending tasks from Supabase with localStorage fallback.
 */
export async function fetchPendingTasksFromDb() {
  const config = getPendingSupabaseConfig();
  const localList = getLocalPendingTasks();

  if (!config.isConfigured) {
    return { success: true, items: localList, source: 'local' };
  }

  try {
    const res = await fetch(`${config.url}/rest/v1/pending_tasks?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const rows = await res.json();
      const items = Array.isArray(rows) ? rows.map(normalizePendingTaskFromDb).filter(Boolean) : [];
      saveLocalPendingTasks(items);
      return { success: true, items, source: 'cloud' };
    }

    if (res.status === 404 || res.status === 400) {
      const err = await res.json().catch(() => ({}));
      if (
        (err.message && err.message.includes("Could not find the table 'public.pending_tasks'")) ||
        err.code === 'PGRST205'
      ) {
        return {
          success: false,
          needsTable: true,
          items: localList,
          source: 'local_fallback',
          message: 'Pending tasks table is not created yet in Supabase.',
          sql: PENDING_TASKS_TABLE_SQL,
        };
      }
    }

    return { success: false, items: localList, source: 'local_fallback' };
  } catch (err) {
    console.error('Error fetching pending tasks from Supabase:', err);
    return { success: false, items: localList, source: 'local_fallback', error: err.message };
  }
}

/**
 * Creates a new pending task in Supabase and updates local cache.
 */
export async function createPendingTaskInDb({ title, details, createdBy }) {
  const config = getPendingSupabaseConfig();
  const now = new Date().toISOString();
  const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const newTask = {
    id,
    title: (title || '').trim(),
    details: (details || '').trim(),
    createdBy: (createdBy || 'Support').trim(),
    createdAt: now,
    status: 'pending',
    resolvedBy: null,
    resolutionNotes: null,
    resolvedAt: null,
  };

  // Immediate local cache update
  const localList = getLocalPendingTasks();
  const updatedLocal = [newTask, ...localList.filter((t) => t.id !== id)];
  saveLocalPendingTasks(updatedLocal);

  if (!config.isConfigured) {
    return { success: true, task: newTask, source: 'local' };
  }

  try {
    const dbPayload = {
      id: newTask.id,
      title: newTask.title,
      details: newTask.details,
      created_by: newTask.createdBy,
      created_at: newTask.createdAt,
      status: 'pending',
      resolved_by: null,
      resolution_notes: null,
      resolved_at: null,
      updated_at: now,
    };

    const res = await fetch(`${config.url}/rest/v1/pending_tasks`, {
      method: 'POST',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(dbPayload),
    });

    if (res.ok) {
      const inserted = await res.json().catch(() => []);
      const saved = Array.isArray(inserted) && inserted[0] ? normalizePendingTaskFromDb(inserted[0]) : newTask;
      return { success: true, task: saved, source: 'cloud' };
    }

    return { success: true, task: newTask, source: 'local_pending_cloud' };
  } catch (err) {
    console.error('Failed to sync new pending task to Supabase:', err);
    return { success: true, task: newTask, source: 'local_offline' };
  }
}

/**
 * Resolves a pending task in Supabase with explanation notes and resolver name.
 */
export async function resolvePendingTaskInDb(id, { resolutionNotes, resolvedBy }) {
  const config = getPendingSupabaseConfig();
  const now = new Date().toISOString();

  // Update local cache
  const localList = getLocalPendingTasks();
  let resolvedTask = null;
  const updatedLocal = localList.map((t) => {
    if (t.id === id) {
      resolvedTask = {
        ...t,
        status: 'resolved',
        resolutionNotes: (resolutionNotes || '').trim(),
        resolvedBy: (resolvedBy || 'Support').trim(),
        resolvedAt: now,
        updatedAt: now,
      };
      return resolvedTask;
    }
    return t;
  });
  saveLocalPendingTasks(updatedLocal);

  if (!config.isConfigured || !resolvedTask) {
    return { success: true, task: resolvedTask, source: 'local' };
  }

  try {
    const dbPayload = {
      status: 'resolved',
      resolution_notes: resolvedTask.resolutionNotes,
      resolved_by: resolvedTask.resolvedBy,
      resolved_at: resolvedTask.resolvedAt,
      updated_at: now,
    };

    const res = await fetch(`${config.url}/rest/v1/pending_tasks?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(dbPayload),
    });

    if (res.ok) {
      const rows = await res.json().catch(() => []);
      const saved = Array.isArray(rows) && rows[0] ? normalizePendingTaskFromDb(rows[0]) : resolvedTask;
      return { success: true, task: saved, source: 'cloud' };
    }

    return { success: true, task: resolvedTask, source: 'local' };
  } catch (err) {
    console.error('Failed to resolve pending task in Supabase:', err);
    return { success: true, task: resolvedTask, source: 'local_offline' };
  }
}

/**
 * Re-opens a task back to Pending in Supabase.
 */
export async function reopenPendingTaskInDb(id) {
  const config = getPendingSupabaseConfig();
  const now = new Date().toISOString();

  const localList = getLocalPendingTasks();
  let reopenedTask = null;
  const updatedLocal = localList.map((t) => {
    if (t.id === id) {
      reopenedTask = {
        ...t,
        status: 'pending',
        resolvedBy: null,
        resolutionNotes: null,
        resolvedAt: null,
        updatedAt: now,
      };
      return reopenedTask;
    }
    return t;
  });
  saveLocalPendingTasks(updatedLocal);

  if (!config.isConfigured || !reopenedTask) {
    return { success: true, task: reopenedTask, source: 'local' };
  }

  try {
    const dbPayload = {
      status: 'pending',
      resolved_by: null,
      resolution_notes: null,
      resolved_at: null,
      updated_at: now,
    };

    const res = await fetch(`${config.url}/rest/v1/pending_tasks?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(dbPayload),
    });

    if (res.ok) {
      const rows = await res.json().catch(() => []);
      const saved = Array.isArray(rows) && rows[0] ? normalizePendingTaskFromDb(rows[0]) : reopenedTask;
      return { success: true, task: saved, source: 'cloud' };
    }

    return { success: true, task: reopenedTask, source: 'local' };
  } catch (err) {
    console.error('Failed to reopen task in Supabase:', err);
    return { success: true, task: reopenedTask, source: 'local_offline' };
  }
}

/**
 * Deletes a resolved task from Supabase.
 * Strictly blocks deletion if the task is still pending.
 */
export async function deletePendingTaskFromDb(id) {
  const config = getPendingSupabaseConfig();
  const localList = getLocalPendingTasks();
  const target = localList.find((t) => t.id === id);

  if (target && target.status === 'pending') {
    return { success: false, error: 'Cannot delete pending task. Only resolved tasks can be deleted.', tasks: localList };
  }

  const updatedLocal = localList.filter((t) => t.id !== id);
  saveLocalPendingTasks(updatedLocal);

  if (!config.isConfigured) {
    return { success: true, tasks: updatedLocal, source: 'local' };
  }

  try {
    const res = await fetch(`${config.url}/rest/v1/pending_tasks?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
    });

    return { success: res.ok, tasks: updatedLocal, source: 'cloud' };
  } catch (err) {
    console.error('Failed to delete pending task from Supabase:', err);
    return { success: true, tasks: updatedLocal, source: 'local_offline' };
  }
}
