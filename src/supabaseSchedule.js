// src/supabaseSchedule.js
// Dedicated cloud storage & real-time sync manager for Team Schedule Plotting

export const DEFAULT_SCHEDULE_SUPABASE_URL = 'https://orfbmclzaprgiywkkiup.supabase.co';
export const DEFAULT_SCHEDULE_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZmJtY2x6YXByZ2l5d2traXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NzQ1NDQsImV4cCI6MjEwNzU1MDU0NH0.qioq9jHRRsM2FiT2Mhim6vtQ-_Abafq18yc2WoMzqmM';

export const SCHEDULE_RECORD_ID = 'team_schedule_cloud_data';
export const SCHEDULE_SUBJECT_TAG = '[TEAM_SCHEDULE_CONFIG]';

export const STORAGE_ROSTER_KEY = 'team_schedule_roster_v2';
export const STORAGE_WEEKS_KEY = 'team_schedule_weeks_v2';
export const STORAGE_SCHEDULE_META_KEY = 'team_schedule_meta_v2';

export function getScheduleSupabaseConfig() {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SCHEDULE_SUPABASE_URL) || '';
  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SCHEDULE_SUPABASE_ANON_KEY) || '';
  const localUrl =
    (typeof localStorage !== 'undefined' && localStorage.getItem('cc_schedule_supabase_url')) || '';
  const localKey =
    (typeof localStorage !== 'undefined' && localStorage.getItem('cc_schedule_supabase_key')) || '';

  const url = (envUrl || DEFAULT_SCHEDULE_SUPABASE_URL || localUrl).trim().replace(/\/+$/, '');
  const key = (envKey || DEFAULT_SCHEDULE_SUPABASE_KEY || localKey).trim();

  return {
    url,
    key,
    isConfigured: Boolean(url && key),
  };
}

/**
 * Fetch schedule from Supabase with localStorage fallback
 */
export async function fetchScheduleFromCloud() {
  const config = getScheduleSupabaseConfig();

  // 1. Read local cache first for instant initial display
  let localRoster = null;
  let localWeeks = {};
  let localMeta = { updatedAt: null, updatedBy: null };

  try {
    const rawRoster = localStorage.getItem(STORAGE_ROSTER_KEY);
    if (rawRoster) localRoster = JSON.parse(rawRoster);
    const rawWeeks = localStorage.getItem(STORAGE_WEEKS_KEY);
    if (rawWeeks) localWeeks = JSON.parse(rawWeeks);
    const rawMeta = localStorage.getItem(STORAGE_SCHEDULE_META_KEY);
    if (rawMeta) localMeta = JSON.parse(rawMeta);
  } catch (e) {
    console.error('Failed to read local schedule cache:', e);
  }

  if (!config.isConfigured) {
    return {
      success: true,
      rosterGroups: localRoster,
      weeksStore: localWeeks,
      meta: localMeta,
      source: 'local',
    };
  }

  try {
    const res = await fetch(
      `${config.url}/rest/v1/reminders?id=eq.${SCHEDULE_RECORD_ID}&select=*`,
      {
        method: 'GET',
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (res.ok) {
      const rows = await res.json().catch(() => []);
      if (Array.isArray(rows) && rows.length > 0 && rows[0]?.description) {
        try {
          const parsed = JSON.parse(rows[0].description);
          if (parsed && typeof parsed === 'object') {
            const roster = Array.isArray(parsed.rosterGroups) ? parsed.rosterGroups : localRoster;
            const weeks = parsed.weeksStore && typeof parsed.weeksStore === 'object' ? parsed.weeksStore : localWeeks;
            const meta = {
              updatedAt: parsed.updatedAt || rows[0].updated_at || new Date().toISOString(),
              updatedBy: parsed.updatedBy || 'Team Member',
            };

            // Update local cache
            if (roster) localStorage.setItem(STORAGE_ROSTER_KEY, JSON.stringify(roster));
            if (weeks) localStorage.setItem(STORAGE_WEEKS_KEY, JSON.stringify(weeks));
            localStorage.setItem(STORAGE_SCHEDULE_META_KEY, JSON.stringify(meta));

            return {
              success: true,
              rosterGroups: roster,
              weeksStore: weeks,
              meta,
              source: 'cloud',
            };
          }
        } catch (e) {
          console.error('Failed to parse cloud schedule payload:', e);
        }
      }
    }

    return {
      success: true,
      rosterGroups: localRoster,
      weeksStore: localWeeks,
      meta: localMeta,
      source: 'local_fallback',
    };
  } catch (err) {
    console.error('Network error fetching schedule from cloud:', err);
    return {
      success: true,
      rosterGroups: localRoster,
      weeksStore: localWeeks,
      meta: localMeta,
      source: 'local_offline',
    };
  }
}

/**
 * Save schedule to Supabase and cache locally
 */
export async function saveScheduleToCloud(rosterGroups, weeksStore, authorName = 'Support') {
  const config = getScheduleSupabaseConfig();
  const now = new Date().toISOString();
  const meta = {
    updatedAt: now,
    updatedBy: (authorName || 'Team Member').trim(),
  };

  // 1. Immediately persist locally
  try {
    localStorage.setItem(STORAGE_ROSTER_KEY, JSON.stringify(rosterGroups));
    localStorage.setItem(STORAGE_WEEKS_KEY, JSON.stringify(weeksStore));
    localStorage.setItem(STORAGE_SCHEDULE_META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.error('Failed to write local schedule cache:', e);
  }

  if (!config.isConfigured) {
    return {
      success: true,
      meta,
      source: 'local_only',
      message: 'Saved locally (Cloud not configured)',
    };
  }

  // 2. Upload to Supabase cloud
  try {
    const payload = {
      id: SCHEDULE_RECORD_ID,
      subject: SCHEDULE_SUBJECT_TAG,
      description: JSON.stringify({
        rosterGroups,
        weeksStore,
        updatedAt: meta.updatedAt,
        updatedBy: meta.updatedBy,
      }),
      is_important: false,
      removed_from_slideshow: true,
      updated_at: now,
    };

    const res = await fetch(`${config.url}/rest/v1/reminders?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('team_schedule_synced', { detail: meta }));
      }
      return {
        success: true,
        meta,
        source: 'cloud',
        message: 'Saved to cloud! All team members will see this schedule.',
      };
    }

    const err = await res.json().catch(() => ({}));
    console.error('Supabase schedule save error:', res.status, err);
    return {
      success: true,
      meta,
      source: 'local_saved_cloud_error',
      message: `Saved locally, cloud error (${res.status})`,
    };
  } catch (err) {
    console.error('Network failure saving schedule to cloud:', err);
    return {
      success: true,
      meta,
      source: 'local_saved_offline',
      message: 'Saved locally (offline)',
    };
  }
}

