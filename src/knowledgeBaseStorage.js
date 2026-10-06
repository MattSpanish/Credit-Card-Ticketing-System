// src/knowledgeBaseStorage.js
// Local storage and management for Knowledge Base troubleshooting guides

export const KB_STORAGE_KEY = 'knowledge_base_articles_data';

export const DEFAULT_KB_ITEMS = [
  {
    id: 'kb-clover-offline-reset',
    title: 'Clover Mini / Flex Offline Mode & Network Reset',
    category: 'Clover',
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
    id: 'kb-ingenico-tamper-reset',
    title: 'Ingenico Move 5000 / Desk 3500 Key Injection & Tamper Reset',
    category: 'Ingenico',
    description: `1. Recognizing "Alert / Unauthorized / Tamper Detected":
   • For PCI-PTS compliance, Ingenico terminals lock permanently if internal physical sensor is triggered (dropped, opened, or extreme temperature shock).

2. Diagnosis:
   • If screen displays "Alert: Irruption Detected" or "TAMPER DETECTED", keys have zeroed out for merchant security.
   • This hardware state cannot be bypassed via menu codes or keypad combination.

3. Next Steps & Merchant Action:
   • Check if terminal is under warranty or hardware replacement lease.
   • Issue an RMA replacement request for immediate swap.
   • Ensure replacement unit has the correct DUKPT injection key (Nashville / TSYS PIN debit key).`,
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z'
  },
  {
    id: 'kb-pax-comm-error',
    title: 'PAX S80 / S300 Communication & Socket Error',
    category: 'PAX',
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
    id: 'kb-tsys-batch-out-of-balance',
    title: 'TSYS / Nashville Batch Out of Balance & Reconciliation',
    category: 'TSYS',
    description: `1. Identify Discrepancy:
   • "Out of Balance" occurs when the terminal batch count or dollar total differs from host records (often caused by an offline void, duplicate auth, or dropped transaction).

2. Print Detailed Audit Report:
   • From Terminal: Go to Reports > Detail Report (prints every card transaction in the active batch).
   • From Host Portal (e.g. TSYS Merchant Center / Nashville MMS): Generate current batch details.

3. Compare Transactions Line by Line:
   • Match sequence numbers and approval codes to identify the missing or duplicate item.
   • Note whether tip adjustments or voids were properly captured on the host.

4. Force Batch Close:
   • If all customer cards were charged and documented, perform "Force Settle / Force Close" on terminal.
   • If duplicate transaction exists, issue refund/credit in terminal before settling.
   • Document batch number, date, and adjusted total in ticketing system notes.`,
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z'
  },
  {
    id: 'kb-tsys-tid-mid-mismatch',
    title: 'TSYS Terminal ID (TID) / Merchant ID (MID) Mismatch',
    category: 'TSYS',
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
    id: 'kb-verifone-vx520-comm-error',
    title: 'Verifone VX520 Comm Error / Line Detection',
    category: 'Verifone',
    description: `1. Identify Comm Mode:
   • Check whether merchant uses Ethernet (LAN) or Dial-up phone line.
   • If Ethernet: Ensure cable is in port with 10BaseT / network symbol (ETH port), not RS232 port.

2. Comm Mode Settings:
   • Press F2 + F4 simultaneously, enter password (default: 1, alpha, 22, 333, 4444 or 1234).
   • Select Comm Config > Select Ethernet.
   • Verify DHCP is ON and terminal receives valid IP address.

3. Check Firewall Ports:
   • Ensure outbound ports 443, 80, and processor ports (e.g. 10002, 50000) are not blocked by merchant router.

4. Soft Reboot:
   • Press and hold the green ENTER key and 7 key together to soft restart the VX520.`,
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z'
  }
];

// Helper: load stored items, or initialize with defaults if empty
export function getStoredKnowledgeBaseItems() {
  if (typeof localStorage === 'undefined') return DEFAULT_KB_ITEMS;
  try {
    const raw = localStorage.getItem(KB_STORAGE_KEY);
    if (!raw) {
      // First time initialization
      localStorage.setItem(KB_STORAGE_KEY, JSON.stringify(DEFAULT_KB_ITEMS));
      return DEFAULT_KB_ITEMS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(KB_STORAGE_KEY, JSON.stringify(DEFAULT_KB_ITEMS));
      return DEFAULT_KB_ITEMS;
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
