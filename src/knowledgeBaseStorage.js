// src/knowledgeBaseStorage.js
// Local storage and management for Knowledge Base troubleshooting guides

export const KB_STORAGE_KEY = 'knowledge_base_articles_data';

export const OFFICIAL_KB_CATEGORIES = [
  'Clover',
  'Dejavoo',
  'FD150',
  'PAX',
  'Nexgo',
  'Buypass',
  'TSYS',
  'Nashville',
  'P98',
  'Valor',
  'Account Maintenance',
  'General',
];

export const DEFAULT_KB_ITEMS = [];

export function getStoredKnowledgeBaseItems() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KB_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Filter out old legacy mock example guides
    const legacyMockIds = new Set([
      'kb-clover-offline-reset',
      'kb-dejavoo-error-99',
      'kb-fd150-comm-error',
      'kb-pax-batch-clear',
      'kb-nexgo-key-exchange',
      'kb-buypass-auth-timeout',
      'kb-tsys-batch-desync',
      'kb-nashville-settle-hold'
    ]);

    const cleaned = parsed.filter(item => !legacyMockIds.has(item.id));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(KB_STORAGE_KEY, JSON.stringify(cleaned));
    }

    return cleaned;
  } catch (err) {
    console.error('Error loading knowledge base items:', err);
    return [];
  }
}

// Helper: save list to storage
export function saveKnowledgeBaseItemsList(items) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KB_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving knowledge base items:', err);
  }
}

// Helper: sort items alphabetically (A–Z) by title
export function sortKnowledgeBaseItemsAZ(items) {
  return [...items].sort((a, b) => {
    const titleA = (a.title || '').trim().toLowerCase();
    const titleB = (b.title || '').trim().toLowerCase();
    return titleA.localeCompare(titleB, undefined, { sensitivity: 'base', numeric: true });
  });
}

export const KB_CUSTOM_TAGS_KEY = 'knowledge_base_custom_tags';

export function getStoredCustomTags() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KB_CUSTOM_TAGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading custom tags:', e);
    return [];
  }
}

export function saveStoredCustomTags(tags) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KB_CUSTOM_TAGS_KEY, JSON.stringify(tags));
  } catch (e) {
    console.error('Error saving custom tags:', e);
  }
}


export const KB_DELETED_TAGS_KEY = 'knowledge_base_deleted_tags';

export function getStoredDeletedTags() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KB_DELETED_TAGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading deleted tags:', e);
    return [];
  }
}

export function saveStoredDeletedTags(tags) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KB_DELETED_TAGS_KEY, JSON.stringify(tags));
  } catch (e) {
    console.error('Error saving deleted tags:', e);
  }
}
