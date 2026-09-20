// src/supabaseShiftReports.js
// Dedicated storage & sync manager for Shift Reports only

const STORAGE_KEYS = {
  REPORTS: 'cc_shift_reports_cache',
  SUPABASE_URL: 'cc_supabase_url',
  SUPABASE_KEY: 'cc_supabase_anon_key',
};

// Metric parser from report text content
export function parseReportMetrics(content) {
  if (!content) return { totalCalls: 0, resolve: 0, pending: 0, other: 0 };

  const callsMatch = content.match(/(?:^|\n)\s*TOTAL\s*CALLS\s*[-:]\s*(\d+)/i);
  const resolveMatch = content.match(/(?:^|\n)\s*RESOLVE[D]?\s*[-:]\s*(\d+)/i);
  const pendingMatch = content.match(/(?:^|\n)\s*PENDING\s*[-:]\s*(\d+)/i);
  const otherMatch = content.match(/(?:^|\n)\s*OTHER\s*[-:]\s*(\d+)/i);

  return {
    totalCalls: callsMatch ? parseInt(callsMatch[1], 10) : 0,
    resolve: resolveMatch ? parseInt(resolveMatch[1], 10) : 0,
    pending: pendingMatch ? parseInt(pendingMatch[1], 10) : 0,
    other: otherMatch ? parseInt(otherMatch[1], 10) : 0,
  };
}

// Helper to detect shift from report content
export function detectShiftFromContent(content) {
  if (!content) return '';
  const upper = content.toUpperCase();
  if (
    upper.includes('02:00PM TO 11:00PM') ||
    upper.includes('02:00 PM - 11:00 PM') ||
    upper.includes('02:00PM - 11:00PM') ||
    (upper.includes('2:00') && upper.includes('11:00'))
  ) {
    return '2PM-11PM';
  }
  if (
    upper.includes('09:00PM TO 06:00AM') ||
    upper.includes('09:00 PM - 06:00 AM') ||
    upper.includes('09:00PM - 06:00AM') ||
    (upper.includes('9:00') && upper.includes('6:00'))
  ) {
    return '9PM-6AM';
  }
  if (
    upper.includes('05:00AM TO 02:00PM') ||
    upper.includes('05:00 AM - 02:00 PM') ||
    upper.includes('05:00AM - 02:00PM') ||
    (upper.includes('5:00') && upper.includes('2:00'))
  ) {
    return '5AM-2PM';
  }
  return '';
}

// Calculate combined previous shift metrics (2PM-11PM and 9PM-6AM) strictly for the SAME DATE
export function calculateMorningShiftMetrics(reports, targetDateStr) {
  if (!Array.isArray(reports) || !targetDateStr) {
    return { totalCalls: 0, resolve: 0, pending: 0, other: 0, foundReports: [] };
  }

  // Format target date (e.g. "September 20, 2026")
  let targetDateFormatted = '';
  try {
    const parts = targetDateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      targetDateFormatted = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  } catch {}

  // Filter reports that match the EXACT same date
  const sameDateReports = reports.filter((r) => {
    if (r.report_date && r.report_date === targetDateStr) return true;
    if (r.created_at && r.created_at.slice(0, 10) === targetDateStr) return true;
    if (r.content) {
      if (r.content.includes(targetDateStr)) return true;
      if (targetDateFormatted && r.content.includes(targetDateFormatted)) return true;
    }
    return false;
  });

  // Extract latest report for 2PM-11PM and latest for 9PM-6AM
  let report2PM = null;
  let report9PM = null;

  for (const r of sameDateReports) {
    const shift = detectShiftFromContent(r.content);
    if (shift === '2PM-11PM' && !report2PM) {
      report2PM = r;
    } else if (shift === '9PM-6AM' && !report9PM) {
      report9PM = r;
    }
  }

  const metrics2PM = report2PM ? parseReportMetrics(report2PM.content) : { totalCalls: 0, resolve: 0, pending: 0, other: 0 };
  const metrics9PM = report9PM ? parseReportMetrics(report9PM.content) : { totalCalls: 0, resolve: 0, pending: 0, other: 0 };

  const totalCalls = metrics2PM.totalCalls + metrics9PM.totalCalls;
  const resolve = metrics2PM.resolve + metrics9PM.resolve;
  const pending = metrics2PM.pending + metrics9PM.pending;
  const other = metrics2PM.other + metrics9PM.other;

  const foundReports = [];
  if (report2PM) foundReports.push({ shift: '02:00PM TO 11:00PM', metrics: metrics2PM });
  if (report9PM) foundReports.push({ shift: '09:00PM TO 06:00AM', metrics: metrics9PM });

  return {
    totalCalls,
    resolve,
    pending,
    other,
    foundReports,
  };
}

// Default template for quick insert
export function getDefaultReportTemplate(shiftName = '09:00PM TO 06:00AM', customDate = null, calculatedMetrics = null) {
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

  const totalCalls = calculatedMetrics?.totalCalls ?? 0;
  const resolve = calculatedMetrics?.resolve ?? 0;
  const pending = calculatedMetrics?.pending ?? 0;
  const other = calculatedMetrics?.other ?? 0;

  const baseTemplate = `SHIFT REPORT ${shiftName}

${formattedDate}

TOTAL CALLS - ${totalCalls}

RESOLVE - ${resolve}
PENDING - ${pending}

OTHER - ${other}`;

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
