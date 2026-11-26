const LEGACY_KEYS = ['unifiedEntries_creditcard', 'unifiedEntries_creditcard_backup'];
const STORE_NAME = 'history';
const HISTORY_KEY = 'tickets';
let databasePromise;

function openDatabase() {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('creditcard-ticket-history', 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => {
          database.close();
          databasePromise = undefined;
        };
        database.onclose = () => { databasePromise = undefined; };
        resolve(database);
      };
    }).catch(error => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

function readLegacyHistory() {
  return LEGACY_KEYS.flatMap(key => {
    try {
      const raw = localStorage.getItem(key);
      const entries = JSON.parse(raw);
      if (Array.isArray(entries) && entries.every(entry => entry && typeof entry === 'object' && !Array.isArray(entry))) {
        return [{ key, raw, entries }];
      }
    } catch {
      // An unreadable key is left in place for recovery.
    }
    return [];
  });
}

function legacyEntries(sources) {
  return sources.find(source => source.entries.length)?.entries ?? [];
}

export function readLegacyTickets() {
  return legacyEntries(readLegacyHistory());
}

// Keep the read and write in the same transaction so tabs cannot overwrite each other's changes.
export async function updateTicketHistory(change) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(HISTORY_KEY);
    let legacySources;
    let entries;
    let changed = false;
    let failure;

    request.onsuccess = () => {
      try {
        entries = request.result;
        if (entries === undefined) {
          legacySources = readLegacyHistory();
          entries = legacyEntries(legacySources);
        }

        const updated = change?.(entries);
        changed = updated != null;
        if (changed) entries = updated;
        if (legacySources || changed) store.put(entries, HISTORY_KEY);
      } catch (error) {
        failure = error;
        transaction.abort();
      }
    };

    transaction.onabort = () => reject(failure ?? transaction.error ?? request.error);
    transaction.oncomplete = () => {
      const migratedSource = legacySources?.find(source => source.entries.length);
      for (const source of legacySources ?? []) {
        if (source.entries.length && source.raw !== migratedSource.raw) continue;
        // Release the old quota only after the replacement is committed.
        try {
          if (localStorage.getItem(source.key) === source.raw) localStorage.removeItem(source.key);
        } catch {
          // The migrated history is already available in IndexedDB.
        }
      }
      resolve({ entries, changed });
    };
  });
}
