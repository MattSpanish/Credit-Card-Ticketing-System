// src/supabaseShiftReports.js
// Dedicated storage & sync manager for Shift Reports only

const STORAGE_KEYS = {
  REPORTS: 'cc_shift_reports_cache',
  SUPABASE_URL: 'cc_supabase_url',
  SUPABASE_KEY: 'cc_supabase_anon_key',
};

// Default template for quick insert
export function getDefaultReportTemplate(shiftName = '09:00PM TO 06:00AM', customDate = null) {
  let dateObj = new Date();
  if (customDate) {
    const parts = customDate.split('-');
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      dateObj = new Date(customDate);
    }
  }
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = dateObj.toLocaleDateString('en-US', options);

  const baseTemplate = `SHIFT REPORT ${shiftName}

${formattedDate}

TOTAL CALLS - 0

RESOLVE - 0
PENDING - 0

OTHER - 0`;

  // DAILY WORK REPORT is ONLY included for the 05:00AM TO 02:00PM shift
  if (shiftName === '05:00AM TO 02:00PM' || shiftName.includes('05:00AM TO 02:00PM')) {
    return `${baseTemplate}

DAILY WORK REPORT 

HRMS TICKET REVIEW: 0
PENDING TICKET REVIEW: 0
PENDING SOLVED TICKET: 0`;
  }

  return baseTemplate;
}

// Configuration helper
export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || '';
  const localKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || '';

  const url = (localUrl || envUrl).trim().replace(/\/+$/, '');
  const key = (localKey || envKey).trim();

  return {
    url,
    key,
    isConfigured: Boolean(url && key),
    isFromEnv: Boolean(envUrl && envKey && !localUrl),
  };
}

export function saveSupabaseConfig(url, key) {
  if (url) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim().replace(/\/+$/, ''));
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
  }

  if (key) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_KEY);
  }
}

// Test connection
export async function testSupabaseConnection(urlInput, keyInput) {
  const url = (urlInput || '').trim().replace(/\/+$/, '');
  const key = (keyInput || '').trim();

  if (!url || !key) {
    return { success: false, message: 'URL and Anon Key are required.' };
  }

  try {
    const res = await fetch(`${url}/rest/v1/shift_reports?select=id&limit=1`, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      return { success: true, message: 'Connected successfully to Supabase shift_reports table!' };
    }

    if (res.status === 404 || res.status === 400) {
      const err = await res.json().catch(() => ({}));
      if (err.message && err.message.includes('relation "public.shift_reports" does not exist')) {
        return {
          success: false,
          needsTable: true,
          message: 'Connected to Supabase, but "shift_reports" table is not created yet. Run the SQL script below in Supabase SQL Editor.',
        };
      }
      return { success: false, message: `Supabase returned ${res.status}: ${err.message || res.statusText}` };
    }

    return { success: false, message: `Connection failed (HTTP ${res.status}): ${res.statusText}` };
  } catch (err) {
    return { success: false, message: `Network error: ${err.message}` };
  }
}

// Local cache helpers
function getLocalReports() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to read local shift reports', e);
    return [];
  }
}

function saveLocalReports(reports) {
  try {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to save local shift reports', e);
  }
}

// Fetch all shift reports
export async function fetchShiftReports() {
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    return {
      source: 'local',
      reports: getLocalReports(),
    };
  }

  try {
    const res = await fetch(`${config.url}/rest/v1/shift_reports?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const reports = await res.json();
      saveLocalReports(reports); // keep local cache updated
      return {
        source: 'supabase',
        reports,
      };
    } else {
      console.warn(`Supabase fetch failed (${res.status}), using local cache`);
      return {
        source: 'local-fallback',
        reports: getLocalReports(),
        error: `Supabase HTTP ${res.status}`,
      };
    }
  } catch (err) {
    console.warn('Supabase fetch network error, using local cache', err);
    return {
      source: 'local-fallback',
      reports: getLocalReports(),
      error: err.message,
    };
  }
}

// Add a new shift report
export async function addShiftReport({ content, author = '', reportDate = '', images = [] }) {
  if (!content || !content.trim()) {
    throw new Error('Report content cannot be empty');
  }

  const trimmedContent = content.trim();
  const trimmedAuthor = (author || '').trim();
  const timestamp = new Date().toISOString();
  const config = getSupabaseConfig();

  // Normalize images (ensure array of dataUrl strings)
  const normalizedImages = Array.isArray(images)
    ? images.map((img) => (typeof img === 'string' ? img : (img.dataUrl || ''))).filter(Boolean)
    : [];

  const newReport = {
    id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    content: trimmedContent,
    author: trimmedAuthor,
    report_date: reportDate,
    images: normalizedImages,
    created_at: timestamp,
  };

  if (config.isConfigured) {
    try {
      // First attempt: insert with images and report_date
      let res = await fetch(`${config.url}/rest/v1/shift_reports`, {
        method: 'POST',
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          content: trimmedContent,
          author: trimmedAuthor,
          report_date: reportDate,
          images: normalizedImages,
        }),
      });

      // If Supabase table doesn't have images/report_date columns yet, fallback to base fields
      if (!res.ok && res.status === 400) {
        res = await fetch(`${config.url}/rest/v1/shift_reports`, {
          method: 'POST',
          headers: {
            apikey: config.key,
            Authorization: `Bearer ${config.key}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            content: trimmedContent,
            author: trimmedAuthor,
          }),
        });
      }

      if (res.ok) {
        const [savedRecord] = await res.json();
        // Ensure local cache keeps images even if remote column was missing
        const recordWithImages = {
          ...savedRecord,
          images: savedRecord.images || normalizedImages,
          report_date: savedRecord.report_date || reportDate,
        };
        const current = getLocalReports();
        const updated = [recordWithImages, ...current.filter((r) => r.id !== recordWithImages.id)];
        saveLocalReports(updated);
        return { success: true, report: recordWithImages, synced: true };
      } else {
        console.warn('Supabase insert failed, saving locally', res.status);
      }
    } catch (err) {
      console.warn('Supabase insert error, saving locally', err);
    }
  }

  // Fallback / Local save
  const current = getLocalReports();
  const updated = [newReport, ...current];
  saveLocalReports(updated);
  return { success: true, report: newReport, synced: false };
}

// Delete a shift report
export async function deleteShiftReport(id) {
  const config = getSupabaseConfig();

  if (config.isConfigured && !id.startsWith('local_')) {
    try {
      await fetch(`${config.url}/rest/v1/shift_reports?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
        },
      });
    } catch (err) {
      console.warn('Supabase delete error', err);
    }
  }

  const current = getLocalReports();
  const updated = current.filter((r) => r.id !== id);
  saveLocalReports(updated);
  return { success: true };
}

// SQL schema generator
export const SUPABASE_SQL_SCRIPT = `-- Run this in your Supabase SQL Editor:
create table if not exists shift_reports (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  author text default '',
  report_date text default '',
  images jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- If your table already exists, run these two migrations:
alter table shift_reports add column if not exists report_date text default '';
alter table shift_reports add column if not exists images jsonb default '[]'::jsonb;

-- Enable Row Level Security (RLS)
alter table shift_reports enable row level security;

-- Allow read, insert, and delete for team access
create policy "Allow anon read shift_reports" on shift_reports for select using (true);
create policy "Allow anon insert shift_reports" on shift_reports for insert with check (true);
create policy "Allow anon delete shift_reports" on shift_reports for delete using (true);
create policy "Allow anon update shift_reports" on shift_reports for update using (true);
`;
