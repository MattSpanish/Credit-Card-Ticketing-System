// src/supabaseKnowledgeBase.js
// Dedicated cloud storage and real-time sync manager for Knowledge Base Guides

export const DEFAULT_KB_SUPABASE_URL = 'https://vvowtorapictgtgwnpqn.supabase.co';
export const DEFAULT_KB_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2b3d0b3JhcGljdGd0Z3ducHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NDEzMzYsImV4cCI6MjEwNzExNzMzNn0.wcuA6OPyRm44ICas82QmQnD_npTz6JdS2vraw1Qy3ME';

export const KB_STORAGE_KEY = 'knowledge_base_articles_data';
export const KB_CUSTOM_TAGS_KEY = 'knowledge_base_custom_tags';
export const KB_DELETED_TAGS_KEY = 'knowledge_base_deleted_tags';

// SQL definition for table creation in Supabase SQL editor
export const KB_TABLE_SQL = `-- Run this in Supabase SQL Editor for Knowledge Base Guides:
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for team members with anon key
CREATE POLICY "Allow public select on knowledge_base" ON public.knowledge_base FOR SELECT USING (true);
CREATE POLICY "Allow public insert on knowledge_base" ON public.knowledge_base FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on knowledge_base" ON public.knowledge_base FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on knowledge_base" ON public.knowledge_base FOR DELETE USING (true);
`;

export function getKbSupabaseConfig() {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_KB_SUPABASE_URL) || '';
  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_KB_SUPABASE_ANON_KEY) || '';
  const localUrl =
    (typeof localStorage !== 'undefined' && localStorage.getItem('cc_kb_supabase_url')) || '';
  const localKey =
    (typeof localStorage !== 'undefined' && localStorage.getItem('cc_kb_supabase_key')) || '';

  const url = (envUrl || DEFAULT_KB_SUPABASE_URL || localUrl).trim().replace(/\/+$/, '');
  const key = (envKey || DEFAULT_KB_SUPABASE_KEY || localKey).trim();

  return {
    url,
    key,
    isConfigured: Boolean(url && key),
  };
}

export function saveKbSupabaseConfig(url, key) {
  if (typeof localStorage === 'undefined') return;
  if (url) {
    localStorage.setItem('cc_kb_supabase_url', url.trim().replace(/\/+$/, ''));
  } else {
    localStorage.removeItem('cc_kb_supabase_url');
  }
  if (key) {
    localStorage.setItem('cc_kb_supabase_key', key.trim());
  } else {
    localStorage.removeItem('cc_kb_supabase_key');
  }
}

// Normalize row from Supabase (handles snake_case vs camelCase)
export function normalizeKbItemFromDb(row) {
  if (!row) return null;

  let tags = [];
  if (Array.isArray(row.tags)) {
    tags = row.tags;
  } else if (typeof row.tags === 'string') {
    try {
      const parsed = JSON.parse(row.tags);
      tags = Array.isArray(parsed) ? parsed : [row.tags];
    } catch {
      tags = row.tags ? [row.tags] : [];
    }
  }

  const category =
    row.category || (tags.length > 0 ? tags.join(', ') : 'General');

  return {
    id: String(row.id),
    title: row.title || '',
    description: row.description || '',
    tags,
    category,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

// Legacy mock ID filter
const LEGACY_MOCK_IDS = new Set([
  'kb-clover-offline-reset',
  'kb-dejavoo-error-99',
  'kb-fd150-comm-error',
  'kb-pax-batch-clear',
  'kb-nexgo-key-exchange',
  'kb-buypass-auth-timeout',
  'kb-tsys-batch-desync',
  'kb-nashville-settle-hold',
]);

// Local cache helpers
export function getLocalKbGuides() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KB_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Purge any legacy example items
    return parsed.filter((it) => it && it.id && !LEGACY_MOCK_IDS.has(it.id) && !it.isExample);
  } catch (e) {
    console.error('Failed to read local knowledge base cache', e);
    return [];
  }
}

export function saveLocalKbGuides(items) {
  if (typeof localStorage === 'undefined') return;
  try {
    const cleaned = (items || []).filter((it) => it && it.id && !LEGACY_MOCK_IDS.has(it.id) && !it.isExample);
    localStorage.setItem(KB_STORAGE_KEY, JSON.stringify(cleaned));
  } catch (e) {
    console.error('Failed to save local knowledge base cache', e);
  }
}

// Clear all example / mock guides
export function purgeExampleGuides() {
  const current = getLocalKbGuides();
  const cleaned = current.filter((it) => !LEGACY_MOCK_IDS.has(it.id) && !it.isExample);
  saveLocalKbGuides(cleaned);
  return cleaned;
}

// Test connection & check if table exists
export async function testKbConnection() {
  const config = getKbSupabaseConfig();
  if (!config.isConfigured) {
    return { success: false, message: 'Supabase credentials for Knowledge Base are not configured.' };
  }

  try {
    const res = await fetch(`${config.url}/rest/v1/knowledge_base?select=id&limit=1`, {
      method: 'GET',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      return { success: true, message: 'Connected to Supabase knowledge_base table!' };
    }

    if (res.status === 404 || res.status === 400) {
      const err = await res.json().catch(() => ({}));
      if (
        (err.message && err.message.includes("Could not find the table 'public.knowledge_base'")) ||
        err.code === 'PGRST205'
      ) {
        return {
          success: false,
          needsTable: true,
          message: 'Connected to Supabase, but "knowledge_base" table is not created yet.',
          sql: KB_TABLE_SQL,
        };
      }
      return { success: false, message: `Supabase error (${res.status}): ${err.message || res.statusText}` };
    }

    return { success: false, message: `Connection failed (HTTP ${res.status})` };
  } catch (err) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

// Fetch all guides (Supabase with localStorage fallback)
export async function fetchKnowledgeBase() {
  const config = getKbSupabaseConfig();
  const localList = getLocalKbGuides();

  if (!config.isConfigured) {
    return { success: true, items: localList, source: 'local' };
  }

  try {
    const res = await fetch(`${config.url}/rest/v1/knowledge_base?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const rows = await res.json();
      const normalized = rows
        .map(normalizeKbItemFromDb)
        .filter((it) => it && it.id && !LEGACY_MOCK_IDS.has(it.id));

      // Cache to localStorage
      saveLocalKbGuides(normalized);

      return {
        success: true,
        items: normalized,
        source: 'supabase',
      };
    } else {
      const err = await res.json().catch(() => ({}));
      const isMissingTable =
        res.status === 404 ||
        err.code === 'PGRST205' ||
        (err.message && err.message.includes("Could not find the table 'public.knowledge_base'"));

      console.warn(`Supabase fetch KB guides failed (${res.status}), using local cache`);
      return {
        success: false,
        items: localList,
        source: 'local-fallback',
        status: res.status,
        needsTable: isMissingTable,
        sql: isMissingTable ? KB_TABLE_SQL : null,
      };
    }
  } catch (err) {
    console.warn('Supabase KB network error, using local cache', err);
    return {
      success: false,
      items: localList,
      source: 'local-fallback',
      error: err.message,
    };
  }
}

// Add a guide (persists to Supabase & localStorage)
export async function addKnowledgeBaseGuide(item) {
  const now = new Date().toISOString();
  const newGuide = {
    id: item.id || `kb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: (item.title || '').trim(),
    description: (item.description || '').trim(),
    tags: Array.isArray(item.tags) ? item.tags : [],
    category: item.category || (Array.isArray(item.tags) ? item.tags.join(', ') : 'General'),
    createdAt: item.createdAt || now,
    updatedAt: now,
  };

  // 1. Optimistically update local cache
  const current = getLocalKbGuides();
  const updated = [newGuide, ...current.filter((g) => g.id !== newGuide.id)];
  saveLocalKbGuides(updated);

  const config = getKbSupabaseConfig();
  if (config.isConfigured) {
    try {
      const payload = {
        id: newGuide.id,
        title: newGuide.title,
        description: newGuide.description,
        tags: newGuide.tags,
        category: newGuide.category,
        created_at: newGuide.createdAt,
        updated_at: newGuide.updatedAt,
      };

      const res = await fetch(`${config.url}/rest/v1/knowledge_base`, {
        method: 'POST',
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const rows = await res.json();
        const saved = normalizeKbItemFromDb(rows[0]) || newGuide;
        const freshList = [saved, ...getLocalKbGuides().filter((g) => g.id !== saved.id)];
        saveLocalKbGuides(freshList);
        return { success: true, item: saved, synced: true };
      } else {
        console.warn('Supabase add KB guide failed, kept locally', res.status);
      }
    } catch (err) {
      console.warn('Supabase add KB guide error, kept locally', err);
    }
  }

  return { success: true, item: newGuide, synced: false };
}

// Update a guide (persists to Supabase & localStorage)
export async function updateKnowledgeBaseGuide(id, updates) {
  const now = new Date().toISOString();
  const current = getLocalKbGuides();
  const existing = current.find((g) => g.id === id);

  const updatedGuide = {
    ...(existing || { id }),
    ...updates,
    updatedAt: now,
  };

  const updatedList = current.map((g) => (g.id === id ? updatedGuide : g));
  saveLocalKbGuides(updatedList);

  const config = getKbSupabaseConfig();
  if (config.isConfigured) {
    try {
      const payload = {
        updated_at: now,
      };
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.tags !== undefined) payload.tags = updates.tags;
      if (updates.category !== undefined) payload.category = updates.category;

      const res = await fetch(`${config.url}/rest/v1/knowledge_base?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        return { success: true, item: updatedGuide, synced: true };
      } else {
        console.warn('Supabase update KB guide failed, kept locally', res.status);
      }
    } catch (err) {
      console.warn('Supabase update KB guide error, kept locally', err);
    }
  }

  return { success: true, item: updatedGuide, synced: false };
}

// Delete a guide (persists to Supabase & localStorage)
export async function deleteKnowledgeBaseGuide(id) {
  const current = getLocalKbGuides();
  const remaining = current.filter((g) => g.id !== id);
  saveLocalKbGuides(remaining);

  const config = getKbSupabaseConfig();
  if (config.isConfigured) {
    try {
      const res = await fetch(`${config.url}/rest/v1/knowledge_base?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        return { success: true, synced: true };
      } else {
        console.warn('Supabase delete KB guide failed', res.status);
      }
    } catch (err) {
      console.warn('Supabase delete KB guide error', err);
    }
  }

  return { success: true, synced: false };
}
