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

export const DEFAULT_KB_ITEMS = [
  {
    id: 'kb-clover-offline-reset',
    title: 'Clover Mini / Flex Offline Mode & Network Reset',
    category: 'Clover',
    tags: ['Clover'],
    description: `1. Check network connection:
   • Swipe down from the top right corner of the screen and tap Settings > Wi-Fi.
   • Verify that the terminal is connected to a stable 2.4GHz or 5GHz business Wi-Fi network (avoid public captive portals).

2. Power cycle the terminal:
   • Press and hold the power button for 12 seconds until the Clover logo reappears.
   • Allow 60 seconds for the system to re-initialize and reconnect to Clover Cloud servers.

3. Flush offline transactions:
   • Open the "Transactions" app.
   • Check the "Pending / Offline" tab.
   • If offline payments are queued, tap "Process All Offline Transactions" while connected to the internet.

4. Reboot router or reconnect Ethernet:
   • If using Clover Mini with USB/Ethernet Hub, inspect the LAN cable and verify router DHCP lease is active.`,
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z'
  },
  {
    id: 'kb-dejavoo-error-99',
    title: 'Dejavoo Z8 / Z11 Batch Settlement Failed (Error 99)',
    category: 'Dejavoo',
    tags: ['Dejavoo'],
    description: `1. Check Host Communication:
   • Error 99 indicates host communication failure or open batch mismatch with the host processor.
   • Verify internet connectivity: Look for the blue IP icon or active Ethernet/Wi-Fi symbol on the top status bar.

2. Run Batch Inquiry:
   • Press the green OK button to enter Main Menu.
   • Select Settlement > Batch Inquiry.
   • Print or display inquiry to verify whether the host already settled the transactions.

3. Force Batch Close / Clear Batch:
   • If the host batch is closed but terminal shows open transactions, enter Supervisor Menu (Default PIN: 1234 or merchant password).
   • Select Settlement > Force Batch Close.
   • Confirm transaction count and total amount against POS or register journal.

4. Reboot Terminal:
   • Hold the yellow BACK key and punctuation (#) key together for 3 seconds to reboot Dejavoo terminal.
   • Try Settlement again.`,
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z'
  },
  {
    id: 'kb-fd150-ebt-table-error',
    title: 'FD150 EBT Settlement Table Error',
    category: 'FD150',
    tags: ['FD150', 'Nashville'],
    description: `1. Identify the Cause:
   • "EBT Settlement Table Error" occurs when the terminal's internal EBT batch table has desynchronized records or corrupted totals compared to the host processor gateway.

2. Verify Date and Time:
   • Press # (Admin / Options) > Enter Password (1234 or manager password).
   • Navigate to System Setup > Date/Time. Ensure local EST/PST date and time are perfectly synchronized.

3. Perform Partial / EBT Batch Inquiry:
   • Go to Settlement Menu > EBT Inquiry.
   • Print inquiry report. Note total EBT Food Stamp and EBT Cash amounts.

4. Clear Corrupt EBT Batch Table Cache:
   • Enter Supervisor Menu (# key).
   • Select Memory / Table Clear > Select "Clear EBT Batch Table" (Do NOT clear credit/debit batch table).
   • Enter authorization code or supervisor password.

5. Parameter Auto-Download:
   • Navigate to Maintenance > Parameter Download.
   • Select Host Download (Nashville / First Data).
   • Let download finish with code "DOWNLOAD SUCCESSFUL".

6. Re-settle Terminal:
   • Return to home screen and press Settlement key.
   • Verify settlement receipt prints "BATCH SETTLED - TRANSACTION ACCEPTED".`,
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z'
  },
  {
    id: 'kb-fd150-param-download',
    title: 'FD150 Parameter Download & Dial Pay Setup',
    category: 'FD150',
    tags: ['FD150', 'Nashville'],
    description: `1. Prepare Terminal:
   • Connect terminal to high-speed Ethernet (port with network icon) or verify Wi-Fi is connected.
   • Ensure printer paper roll is loaded.

2. Enter Download Menu:
   • Press the # key to enter Manager Menu.
   • Enter password (default: 1234 or merchant's manager code).
   • Select Maintenance > Download.

3. Verify Merchant ID (MID) and Terminal ID (TID):
   • Check that Merchant ID matches Nashville record (12-digit number).
   • Check that Terminal ID matches TID assigned in First Data boarding system (7 or 8 digits).

4. Initiate Parameter Download:
   • Choose "IP Download" (or Dial-up if on analog phone line).
   • Terminal will connect to First Data Datawire / Nashville server.
   • Wait 1–3 minutes while files download. Do not unplug power!

5. Completion:
   • Terminal will print "DOWNLOAD COMPLETED" receipt and reboot automatically.
   • Test with a $0.01 authorization transaction or balance inquiry to confirm operation.`,
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z'
  },
  {
    id: 'kb-pax-comm-error',
    title: 'PAX S80 / S300 Communication & Socket Error',
    category: 'PAX',
    tags: ['PAX'],
    description: `1. Check Physical Cable Connection:
   • Ensure Ethernet cable is connected to the LAN port (NOT the RS232 or PIN pad port).
   • Look for active green and flashing amber LEDs on the RJ45 port.

2. Check Terminal IP Address:
   • Press Menu > System Settings > Communication > LAN Type > IP Address.
   • Verify terminal has acquired a valid local IP (e.g., 192.168.x.x or 10.x.x.x) and not 0.0.0.0.
   • If DHCP is failing, set Static IP outside of router DHCP pool with DNS 8.8.8.8 and 1.1.1.1.

3. Socket Error / POS Disconnect (PAX S300 Semi-Integrated):
   • Check port configuration (Default TCP Port: 10009).
   • Restart POS software and power cycle PAX S300 by holding FUNC + 1 for 3 seconds.
   • Ping PAX S300 IP address from POS computer command prompt to test network path.

4. Clear DNS & Cache:
   • Enter Main Menu > Host Settings > Primary Host URL / Port.
   • Ensure host port matches processor gateway.`,
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z'
  },
  {
    id: 'kb-nexgo-partial-approval',
    title: 'Nexgo N5 / N8 Partial Approval & Host Communication Reset',
    category: 'Nexgo',
    tags: ['Nexgo'],
    description: `1. Identify Partial Approval / Comm Issue:
   • When transactions return partial balance approval or socket disconnect on Nexgo Android terminals.
   • Verify network connectivity in Android status bar (Wi-Fi or cellular 4G icon).

2. Network & Wi-Fi Check:
   • Swipe down from top and verify IP address is assigned via DHCP.
   • Disconnect and reconnect to business Wi-Fi (forget network and re-enter WPA2 password).

3. Restart Terminal App:
   • Exit to Launcher, tap Settings > Apps > Nexgo POS > Force Stop.
   • Relaunch application and perform Host Parameter Sync.

4. Test Transaction:
   • Run a $0.01 test sale or balance inquiry to verify full approval response.`,
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z'
  },
  {
    id: 'kb-buypass-comm-error',
    title: 'Buypass Host Comm Error & Parameter Download',
    category: 'Buypass',
    tags: ['Buypass'],
    description: `1. Verify Network Configuration:
   • Check communication mode (IP/Ethernet or Dial-up backup).
   • Confirm Port 10002 / 50000 outbound firewall access on router.

2. Check Terminal ID & Merchant ID:
   • Verify 7-digit Buypass Terminal ID matches processor boarding records.
   • Check routing ID and network carrier connection parameters.

3. Initiate Host Download:
   • Access Manager Menu > Download > Buypass IP Download.
   • Wait for "DOWNLOAD SUCCESSFUL" receipt and reboot terminal.`,
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z'
  },
  {
    id: 'kb-tsys-tid-mid-mismatch',
    title: 'TSYS Terminal ID (TID) / Merchant ID (MID) Mismatch',
    category: 'TSYS',
    tags: ['TSYS'],
    description: `1. Confirm Boarding Information:
   • Check VAR sheet or TSYS boarding portal for exact 16-digit Merchant Number and 8-digit V-Number / TID.

2. Verify Terminal Configuration:
   • In terminal settings, check:
     - Merchant ID / Bank ID
     - Terminal ID (TID / V-Number)
     - Industry Code (Retail / Restaurant / MOTO)
     - Agent / Chain Number

3. Re-download Terminal Profile:
   • Run full file download to sync parameters from TSYS host.
   • Confirm response "DOWNLOAD SUCCESSFUL".`,
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z'
  },
  {
    id: 'kb-nashville-batch-reconciliation',
    title: 'Nashville Batch Out of Balance & Reconciliation',
    category: 'Nashville',
    tags: ['Nashville'],
    description: `1. Identify Discrepancy:
   • "Out of Balance" occurs when the terminal batch count or dollar total differs from Nashville records (often caused by an offline void, duplicate auth, or dropped transaction).

2. Print Detailed Audit Report:
   • From Terminal: Go to Reports > Detail Report (prints every card transaction in the active batch).
   • From Host Portal (e.g. Nashville MMS): Generate current batch details.

3. Compare Transactions Line by Line:
   • Match sequence numbers and approval codes to identify the missing or duplicate item.
   • Note whether tip adjustments or voids were properly captured on the host.

4. Force Batch Close:
   • If all customer cards were charged and documented, perform "Force Settle / Force Close" on terminal.
   • Document batch number, date, and adjusted total in ticketing system notes.`,
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z'
  },
  {
    id: 'kb-p98-setup-troubleshooting',
    title: 'P98 Wireless Terminal Communication & Setup',
    category: 'P98',
    tags: ['P98'],
    description: `1. Check Network Connectivity:
   • Verify 4G SIM cellular signal or Wi-Fi connectivity indicator in the top status bar.
   • If signal is low, perform network reset from Wireless Settings.

2. Verify Host Gateway:
   • Press Menu > System Config > Communication Settings.
   • Verify APN and host IP / port settings.

3. Test Transaction:
   • Perform balance inquiry or test sale to confirm communication.`,
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z'
  },
  {
    id: 'kb-valor-batch-settle',
    title: 'Valor VL100 / VL110 Batch Settlement & Key Injection',
    category: 'Valor',
    tags: ['Valor'],
    description: `1. Check Batch Status:
   • Tap Menu > Settlement > Batch Summary.
   • Review open totals against POS / register reports.

2. Settle Batch:
   • Select "Close Batch" and enter Manager password.
   • Wait for "BATCH ACCEPTED" receipt confirmation.

3. Remote Key Injection / Parameter Update:
   • Navigate to Settings > Maintenance > Host Sync.
   • Run Remote Key Injection (RKI) if debit or PIN pad encryption error occurs.`,
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z'
  },
  {
    id: 'kb-account-maintenance-procedures',
    title: 'Account Maintenance & Terminal Re-Boarding SOP',
    category: 'Account Maintenance',
    tags: ['Account Maintenance'],
    description: `1. Verify Merchant Records:
   • Confirm MID, TID, DBA name, and bank routing numbers match CRM and processor boarding profile.

2. Profile Updates:
   • When updating batch auto-close time, terminal fee configuration, or tip settings:
   • Update host parameters in processor portal.
   • Perform parameter download on terminal to synchronize.

3. Account Closure / Swaps:
   • Verify batch is settled before de-activating terminal profile.
   • Log TID status and reason in ticketing system notes.`,
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z'
  },
  {
    id: 'kb-general-power-connectivity',
    title: 'General Terminal Power Cycle & Connectivity Troubleshooting',
    category: 'General',
    tags: ['General'],
    description: `1. Power Cycle Sequence:
   • Unplug power adapter and remove battery (if portable).
   • Wait 15 seconds to discharge internal capacitors.
   • Reconnect power and power on.

2. Inspect Physical Connections:
   • Ensure power supply meets terminal voltage requirements (e.g. 9V / 12V).
   • Reseat Ethernet and power cables securely.

3. Gateway Ping:
   • Test network connection and DNS resolution.`,
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z'
  }
];

// Helper: load stored items, migrating old default categories if needed
export function getStoredKnowledgeBaseItems() {
  if (typeof localStorage === 'undefined') return DEFAULT_KB_ITEMS;
  try {
    const raw = localStorage.getItem(KB_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(KB_STORAGE_KEY, JSON.stringify(DEFAULT_KB_ITEMS));
      return DEFAULT_KB_ITEMS;
    }
    let parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(KB_STORAGE_KEY, JSON.stringify(DEFAULT_KB_ITEMS));
      return DEFAULT_KB_ITEMS;
    }
    
    // Automatically migrate old categories and ensure tags array exists
    let needsUpdate = false;
    parsed = parsed.map(item => {
      let updated = { ...item };
      if (!Array.isArray(updated.tags) || updated.tags.length === 0) {
        updated.tags = updated.category ? [updated.category] : ['General'];
        needsUpdate = true;
      }
      if (updated.category === 'Ingenico') {
        needsUpdate = true;
        updated.category = 'Nexgo';
        updated.tags = updated.tags.map(t => t === 'Ingenico' ? 'Nexgo' : t);
        updated.title = updated.title && updated.title.includes('Nexgo') ? updated.title : 'Nexgo N5 / N8 Key Injection & Tamper Reset';
      }
      if (updated.category === 'Verifone') {
        needsUpdate = true;
        updated.category = 'Buypass';
        updated.tags = updated.tags.map(t => t === 'Verifone' ? 'Buypass' : t);
        updated.title = updated.title && updated.title.includes('Buypass') ? updated.title : 'Buypass Host Comm Error & Parameter Download';
      }
      if (updated.title && updated.title.includes('TSYS / Nashville Batch Out of Balance')) {
        needsUpdate = true;
        updated.category = 'Nashville';
        updated.tags = updated.tags.map(t => t === 'TSYS' ? 'Nashville' : t);
        updated.title = 'Nashville Batch Out of Balance & Reconciliation';
      }
      return updated;
    });

    // Ensure newly introduced default guide templates exist if not present
    const existingIds = new Set(parsed.map(i => i.id));
    DEFAULT_KB_ITEMS.forEach(defaultItem => {
      if (!existingIds.has(defaultItem.id)) {
        parsed.push(defaultItem);
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      localStorage.setItem(KB_STORAGE_KEY, JSON.stringify(parsed));
    }

    return parsed;
  } catch (err) {
    console.error('Error loading knowledge base items:', err);
    return DEFAULT_KB_ITEMS;
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
