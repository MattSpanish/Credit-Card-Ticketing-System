// src/supabasePendingTasks.js
// Dedicated cloud storage & real-time sync manager for Shift Handover Pending Tasks

export const DEFAULT_PENDING_SUPABASE_URL = 'https://mzxunwpzewlsdkmsuenu.supabase.co';
export const DEFAULT_PENDING_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eHVud3B6ZXdsc2RrbXN1ZW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNTI3OTgsImV4cCI6MjEwNzYyODc5OH0.ZRDyobgR_kS3S4yGssbhbYXWU3VwcilEMkZ8FLtLIU4';

export const PENDING_TASKS_STORAGE_KEY = 'cc_pending_tasks_data_v1';
export const PENDING_COMMENTS_STORAGE_KEY = 'cc_pending_task_comments_v1';

// SQL definition for table creation in Supabase SQL editor
export const PENDING_TASKS_TABLE_SQL = `-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mzxunwpzewlsdkmsuenu/sql/new

-- 1. Table for Pending Shift Handover Tasks
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

-- 2. Table for Pending Task Comments
CREATE TABLE IF NOT EXISTS public.pending_task_comments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_comments_task_id ON public.pending_task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_pending_comments_created_at ON public.pending_task_comments(created_at);

ALTER TABLE public.pending_task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on pending_task_comments" ON public.pending_task_comments;
CREATE POLICY "Allow public select on pending_task_comments" ON public.pending_task_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on pending_task_comments" ON public.pending_task_comments;
CREATE POLICY "Allow public insert on pending_task_comments" ON public.pending_task_comments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on pending_task_comments" ON public.pending_task_comments;
CREATE POLICY "Allow public delete on pending_task_comments" ON public.pending_task_comments FOR DELETE USING (true);
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
 * Transparently extracts any embedded comments if present.
 */
export function normalizePendingTaskFromDb(row) {
  if (!row) return null;
  let rawDetails = row.details || '';
  let embeddedComments = [];

  const commentMatch = rawDetails.match(/<!--comments:([\s\S]*?)-->/);
  if (commentMatch) {
    try {
      const decoded = decodeURIComponent(commentMatch[1]);
      const json = JSON.parse(decoded);
      if (Array.isArray(json)) {
        embeddedComments = json;
      }
    } catch (e) {
      try {
        const json = JSON.parse(commentMatch[1]);
        if (Array.isArray(json)) embeddedComments = json;
      } catch (_) {}
    }
    rawDetails = rawDetails.replace(/\s*<!--comments:[\s\S]*?-->/, '').trimEnd();
  }

  return {
    id: String(row.id),
    title: row.title || '',
    details: rawDetails,
    createdBy: (row.created_by || row.createdBy || 'Support').trim(),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    status: row.status === 'resolved' ? 'resolved' : 'pending',
    resolvedBy: row.resolved_by || row.resolvedBy || null,
    resolutionNotes: row.resolution_notes || row.resolutionNotes || null,
    resolvedAt: row.resolved_at || row.resolvedAt || null,
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    embeddedComments,
  };
}

/**
 * Normalizes a database row from pending_task_comments.
 */
export function normalizePendingCommentFromDb(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    taskId: String(row.task_id || row.taskId || ''),
    userName: (row.user_name || row.userName || 'Support').trim(),
    comment: (row.comment || '').trim(),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
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
 * Local cache helpers for pending task comments.
 */
export function getLocalPendingComments() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PENDING_COMMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to read local comments cache', e);
    return [];
  }
}

export function saveLocalPendingComments(comments) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PENDING_COMMENTS_STORAGE_KEY, JSON.stringify(comments));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pending_comments_changed'));
    }
  } catch (e) {
    console.error('Failed to save local comments cache', e);
  }
}

export function mergeLocalPendingComments(newComments) {
  if (!Array.isArray(newComments) || newComments.length === 0) return;
  const current = getLocalPendingComments();
  const existingMap = new Map(current.map((c) => [c.id, c]));
  let hasChanges = false;

  for (const c of newComments) {
    if (c && c.id && !existingMap.has(c.id)) {
      existingMap.set(c.id, c);
      hasChanges = true;
    }
  }

  if (hasChanges) {
    const merged = Array.from(existingMap.values()).sort(
      (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );
    saveLocalPendingComments(merged);
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

      // Extract and merge any embedded comments across tasks
      const embeddedComments = items.flatMap((it) => it.embeddedComments || []);
      if (embeddedComments.length > 0) {
        mergeLocalPendingComments(embeddedComments);
      }

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

  // Clean up comments for this task locally
  const currentComments = getLocalPendingComments();
  const remainingComments = currentComments.filter((c) => c.taskId !== id);
  if (remainingComments.length !== currentComments.length) {
    saveLocalPendingComments(remainingComments);
  }

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

    // Also attempt to delete comments in cloud table if it exists
    fetch(`${config.url}/rest/v1/pending_task_comments?task_id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
    }).catch(() => {});

    return { success: res.ok, tasks: updatedLocal, source: 'cloud' };
  } catch (err) {
    console.error('Failed to delete pending task from Supabase:', err);
    return { success: true, tasks: updatedLocal, source: 'local_offline' };
  }
}

/**
 * Fallback helper that serializes task comments into the task details trailer
 * in the database so that comments persist across devices even if the dedicated
 * pending_task_comments table has not yet been executed in Supabase SQL editor.
 */
async function syncCommentsViaTaskMetadata(taskId, taskComments, config) {
  if (!config || !config.isConfigured || !taskId) return;
  try {
    // 1. Fetch current details for the task
    const res = await fetch(
      `${config.url}/rest/v1/pending_tasks?id=eq.${encodeURIComponent(taskId)}&select=details`,
      {
        method: 'GET',
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) return;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return;

    let baseDetails = rows[0].details || '';
    // Strip any existing comments trailer
    baseDetails = baseDetails.replace(/\s*<!--comments:[\s\S]*?-->/, '').trimEnd();

    // Re-encode with new comments
    let updatedDetails = baseDetails;
    if (taskComments && taskComments.length > 0) {
      updatedDetails = `${baseDetails}\n\n<!--comments:${encodeURIComponent(JSON.stringify(taskComments))}-->`;
    }

    // 2. PATCH task row
    await fetch(`${config.url}/rest/v1/pending_tasks?id=eq.${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        details: updatedDetails,
        updated_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.warn('Failed to sync comments via task metadata:', err);
  }
}

/**
 * Fetches all comments for pending tasks from Supabase.
 * Checks the dedicated pending_task_comments table and falls back to local cache.
 */
export async function fetchPendingCommentsFromDb() {
  const config = getPendingSupabaseConfig();
  const localList = getLocalPendingComments();

  if (!config.isConfigured) {
    return { success: true, comments: localList, source: 'local' };
  }

  try {
    const res = await fetch(`${config.url}/rest/v1/pending_task_comments?select=*&order=created_at.asc`, {
      method: 'GET',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const rows = await res.json();
      const comments = Array.isArray(rows) ? rows.map(normalizePendingCommentFromDb).filter(Boolean) : [];
      saveLocalPendingComments(comments);
      return { success: true, comments, source: 'cloud' };
    }

    // If 404/400 (table pending_task_comments not yet created), return localList (which includes embedded comments)
    return { success: true, comments: localList, source: 'local_fallback', needsTable: res.status === 404 };
  } catch (err) {
    console.error('Error fetching comments from Supabase:', err);
    return { success: false, comments: localList, source: 'local_fallback', error: err.message };
  }
}

/**
 * Posts a new comment to a pending task in Supabase and local cache.
 */
export async function createPendingCommentInDb({ taskId, comment, userName }) {
  const config = getPendingSupabaseConfig();
  const now = new Date().toISOString();
  const id = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const newComment = {
    id,
    taskId: String(taskId),
    userName: (userName || 'Support').trim(),
    comment: (comment || '').trim(),
    createdAt: now,
  };

  // Immediate optimistic local cache update
  const localList = getLocalPendingComments();
  const updatedLocal = [...localList.filter((c) => c.id !== id), newComment];
  saveLocalPendingComments(updatedLocal);

  if (!config.isConfigured) {
    return { success: true, comment: newComment, source: 'local' };
  }

  try {
    // 1. Try dedicated table first
    const dbPayload = {
      id: newComment.id,
      task_id: newComment.taskId,
      user_name: newComment.userName,
      comment: newComment.comment,
      created_at: newComment.createdAt,
    };

    const res = await fetch(`${config.url}/rest/v1/pending_task_comments`, {
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
      const saved = Array.isArray(inserted) && inserted[0]
        ? normalizePendingCommentFromDb(inserted[0])
        : newComment;
      return { success: true, comment: saved, source: 'cloud' };
    }

    // 2. If table doesn't exist yet (HTTP 404), seamlessly sync via task metadata!
    if (res.status === 404 || res.status === 400) {
      const taskComments = updatedLocal.filter((c) => c.taskId === taskId);
      await syncCommentsViaTaskMetadata(taskId, taskComments, config);
      return { success: true, comment: newComment, source: 'cloud_embedded' };
    }

    return { success: true, comment: newComment, source: 'local' };
  } catch (err) {
    console.error('Failed to sync comment to Supabase:', err);
    // Offline / network failure: fallback sync via task metadata if possible
    try {
      const taskComments = updatedLocal.filter((c) => c.taskId === taskId);
      await syncCommentsViaTaskMetadata(taskId, taskComments, config);
    } catch (_) {}
    return { success: true, comment: newComment, source: 'local_offline' };
  }
}

/**
 * Deletes a comment from Supabase and local cache.
 */
export async function deletePendingCommentInDb(commentId, taskId) {
  const config = getPendingSupabaseConfig();
  const localList = getLocalPendingComments();
  const updatedLocal = localList.filter((c) => c.id !== commentId);
  saveLocalPendingComments(updatedLocal);

  if (!config.isConfigured) {
    return { success: true, source: 'local' };
  }

  try {
    const res = await fetch(`${config.url}/rest/v1/pending_task_comments?id=eq.${encodeURIComponent(commentId)}`, {
      method: 'DELETE',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 404 || res.status === 400) {
      // Table doesn't exist yet, sync removal via task metadata
      const taskComments = updatedLocal.filter((c) => c.taskId === taskId);
      await syncCommentsViaTaskMetadata(taskId, taskComments, config);
    }

    return { success: true, source: 'cloud' };
  } catch (err) {
    console.error('Failed to delete comment in Supabase:', err);
    return { success: true, source: 'local_offline' };
  }
}

