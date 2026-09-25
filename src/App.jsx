import React, { useEffect, useState, useRef } from 'react';
import { initCreditcardApp } from './creditcardController';
import teamPhoto from './group-photo.jpeg';
import teamBanner from './groupcc.jpeg';
import appLogo from './logo2.png';
import ShiftReportPage from './ShiftReportPage';

// ✅ GLOBAL DATA
const BREAK_SCHEDULE = {
  "Monday": [
    { person: "YASMINE", time: "1:00–2:00 AM" },
    { person: "MAT", time: "1:30–2:30 AM" },
    { person: "ERNEST", time: "2:00–3:00 AM" },
    { person: "SEAN", time: "2:30–3:30 AM" },
    { person: "CHARLES", time: "3:30–4:30 AM" },
    { person: "KENNETH", time: "NO SCHEDULE" },
    { person: "RONIE", time: "4:45–5:45 AM" }
  ],
  "Tuesday": [
    { person: "MAT", time: "1:00–2:00 AM" },
    { person: "ERNEST", time: "1:30–2:30 AM" },
    { person: "SEAN", time: "2:00–3:00 AM" },
    { person: "CHARLES", time: "3:30–4:30 AM" },
    { person: "KENNETH", time: "NO SCHEDULE" },
    { person: "RONIE / ADI", time: "4:45–5:45 AM" }
  ],
  "Wednesday": [
    { person: "SEAN", time: "1:30–2:30 AM" },
    { person: "MAT", time: "2:30–3:30 AM" },
    { person: "CHARLES", time: "3:30–4:30 AM" },
    { person: "KENNETH", time: "NO SCHEDULE" },
    { person: "RONIE / ADI", time: "4:45–5:45 AM" }
  ],
  "Thursday": [
    { person: "YASMINE", time: "1:30–2:30 AM" },
    { person: "MAT", time: "2:30–3:30 AM" },
    { person: "CHARLES", time: "3:30–4:30 AM" },
    { person: "KENNETH", time: "NO SCHEDULE" },
    { person: "RONIE / ADI", time: "4:45–5:45 AM" }
  ],
  "Friday": [
    { person: "ERNEST", time: "1:30–2:30 AM" },
    { person: "YASMINE", time: "2:30–3:30 AM" },
    { person: "MAT", time: "3:30–4:30 AM" },
    { person: "KENNETH", time: "NO SCHEDULE" },
    { person: "RONIE / ADI", time: "4:45–5:45 AM" }
  ],
  "Saturday": [
    { person: "ERNEST", time: "1:30–2:30 AM" },
    { person: "YASMINE", time: "2:30–3:30 AM" },
    { person: "SEAN", time: "3:30–4:30 AM" },
    { person: "ADI", time: "4:45–5:45 AM" }
  ],
  "Sunday": [
    { person: "YASMINE", time: "1:30–2:30 AM" },
    { person: "SEAN", time: "2:30–3:30 AM" },
    { person: "ERNEST", time: "3:30–4:30 AM" },
    { person: "CHARLES", time: "4:45–5:45 AM" },
  ]
};

const TID_TEMPLATES = {
  "PAX": `(PAX) - MSD\n /\n[]\nPAX BROADPOS [NASHVILLE]\nNMID#\nTID#\nGROUP ID# 10001`,
  "NEXGO": `(NEXGO)\n /\n[ADDRESS]\nNexgo MFE V201 DwSrsSs [NASHVILLE]\nNMID#\nTID#\nGROUP ID# 10001\nMCC#`,
  "FD150": `(FD150) - FD150\n /\n[]\nFD150 [NASHVILLE] OR FD150 W/ RP10 [NASHVILLE]\nAUTO CLOSE - 12:23AM\nNMID -\nTID# , DLID#, RESET KEY:\nAPP: 751UN150\nD/L# 855-641-1001\nD/L IP ADDR: GDSPROD.FIRSTDATA.COM`,
  "FD130": `(FD130) - FD130\n /\n[]\nEQUIPMENT: FD130 [NASHVILLE]\nAUTO CLOSE - 12:00AM\nNMID -\nTID#, DLID# , RESET KEY:\nAPP: 751UN130\nD/L# 855-641-1001\nD/L IP ADDR: GDSPROD.FIRSTDATA.COM`,
  "VALOR": `(VALOR) -ValorPay GTW RC SRS\n /\n[]\nValorPay GTW RC SRS [NASHVILLE]\nNMID#\nTID#\nGROUP ID# 10001\nMCC#`,
  "DEJAVOO": `(DEJAVOO) - DVC\n /\n[ ]\nDejavooDvCreditRC1.20 [NASHVILLE]\nNMID#\nTID#\nGROUP ID# 10001\nMCC#`,
  "NMI": `(NMI) - Network Merchants Gateway\n /\n[]\nNetwork Merchants Gateway\nNMID#\nTID#\nGROUP ID# 30001`,
  "AUTH.NET": `(AUTH.NET) - AUTHORIZENET(G/W)\nDBA Name:\nFirst Data Merchant ID Number:\n[,  - ]\nNashville Short MID:\nNetwork: FDC Nashville\nManufacturer: AUTHORIZE.NET\nEquipment Name: AUTHORIZENET(G/W)\nEquipment Type: TSOL\nProduct ID: 815300\nTerminal ID:\nTerminal PW:\nProgram ID: 000\nFD Data wire: (800) 704-4202`,
  "VERIFONE COMMANDER / RUBY": `BUYPASS TID \nVERIFONE COMMANDER / RUBY 2 / RUBY CI\n\n /\n[]\nEQUIPMENT: VERIFONE COMMANDER / RUBY 2 / RUBY CI  \nBUYPASS ID: \nFD Datawire: (800) 704-4202\nFD Buypass: (800) 733-3322`,
  "GILBARCO PASSPORT": `GILBARCO PASSPORT\n[Address, City State - Zipcode]\nEQUIPMENT: GILBARCO PASSPORT\nBUYPASS ID: L3(State) (BuypassID) 001\nFD Datawire: (800) 704-4202\nFD Buypass: (800) 733-3322`,
  "FD150 W/ RP10 (BUYPASS)": `FD150 W/ RP10 (BUYPASS)\n /\n[]\nEQUIPMENT: FD150 W/ RP10 (BUYPASS)\nBUYPASS ID: , DLID: [CALL BUYPASS]\nFD Datawire: (800) 704-4202\nFD Buypass: (800) 733-3322`
};

// ==========================================
// ✅ ANNOUNCEMENTS & SYSTEM CHANGELOG DATA
// ==========================================

const ANNOUNCEMENTS_DATA = [
  {
    id: "rel-2026-09-26",
    version: "v2.7.1",
    date: "September 26, 2026",
    isLatest: true,
    badge: "TODAY'S RELEASE",
    title: "Shift Report Quick-Copy Button & Enhanced Responsiveness",
    summary: "Added a one-click Copy button directly next to the Edit button in the Shift Reports History feed for instant clipboard copying, along with responsive improvements across all screen sizes.",
    items: [
      {
        type: "feature",
        icon: "bi-clipboard-check",
        title: "1-Click Copy in Shift Reports History",
        desc: "Each card in the Shift Reports History feed now features a dedicated Copy button right next to the Edit button. Clicking instantly copies the formatted report text to the clipboard with an emerald checkmark confirmation.",
        tag: "Quick Action"
      },
      {
        type: "ui",
        icon: "bi-phone",
        title: "Optimized Responsiveness",
        desc: "Dashboard metrics grid, side-by-side Ticket Form and Preview panels, and horizontal table scrolling have been optimized across mobile, tablet, and desktop displays.",
        tag: "Responsiveness"
      }
    ]
  },
  {
    id: "rel-2026-09-21",
    version: "v2.7.0",
    date: "September 21, 2026",
    isLatest: false,
    badge: "PREVIOUS RELEASE",
    title: "Dedicated Shift Report Tab (Beta) with Cloud Sync & Smart Calculation",
    summary: "Introducing the new Shift Report workspace (Beta) with real-time Supabase cloud synchronization, smart dynamic metrics calculation from previous shifts, automatic pending case enumeration, and a smooth scrollable report composer.",
    items: [
      {
        type: "feature",
        icon: "bi-file-earmark-bar-graph",
        title: "Dedicated Shift Report Workspace (Beta)",
        desc: "A centralized, dedicated space for Nashville CC Support where each shift handover report can be pasted, organized, and retrieved by date so important logs never get buried in chat channels. Includes pre-formatted shift templates for 09:00 PM – 06:00 AM, 05:00 AM – 02:00 PM, and 02:00 PM – 11:00 PM.",
        tag: "New Feature"
      },
      {
        type: "feature",
        icon: "bi-cloud-check",
        title: "Real-Time Cloud Synchronization (Supabase)",
        desc: "All shift reports automatically sync to a shared cloud database in real time. Support team members on different computers can instantly view, search, and edit shift handover reports without manual file sharing or exposed credentials.",
        tag: "Cloud Sync"
      },
      {
        type: "feature",
        icon: "bi-calculator",
        title: "Smart Daily Work Report Auto-Calculation (05:00 AM – 02:00 PM)",
        desc: "For the morning shift report, HRMS TICKET REVIEW and PENDING TICKET REVIEW automatically calculate by summing the TOTAL CALLS and PENDING counts from the two most recent previous shift reports. Numbers update dynamically in real time as you edit your shift's numbers.",
        tag: "Automation"
      },
      {
        type: "feature",
        icon: "bi-list-ol",
        title: "Automatic Pending Case Enumeration under OTHER",
        desc: "Entering or updating the PENDING count automatically creates matching numbered slots ([1], [2], [3]...) under OTHER. Multi-line case details (customer names, phone numbers, emails, notes) can be entered freely under each number without duplicating or altering the enumeration.",
        tag: "Smart Template"
      },
      {
        type: "ui",
        icon: "bi-arrows-vertical",
        title: "Scrollable Report Composer with Themed Scrollbar",
        desc: "The Paste Shift Report field is now smoothly scrollable with a visible, custom-themed scrollbar in both dark and light mode. The composer keeps bottom action buttons (Attach Image, Copy Text, Post Shift Report) easily accessible regardless of report length.",
        tag: "UI / UX"
      },
      {
        type: "warning",
        icon: "bi-shield-exclamation",
        title: "CRITICAL: Do Not Delete or Erase Browser Cache (Chrome & Edge)",
        desc: "Important reminder: Please DO NOT delete or erase your browser cache or browsing data in Google Chrome or Microsoft Edge because your data and tickets are currently saved in your browser cache. If you delete your cache or site data, your tickets and saved records will be permanently deleted and cannot be recovered.",
        tag: "Critical Reminder"
      }
    ]
  },
  {
    id: "rel-2026-09-20",
    version: "v2.6.0",
    date: "September 20, 2026",
    isLatest: false,
    badge: "PREVIOUS RELEASE",
    title: "Global Search Engine, Pending Hover Popover & Navigation Upgrades",
    summary: "Introducing comprehensive multi-field global search with keyboard shortcuts, live match count pill, auto-expanding sidebar results, interactive hover popover for Pending tickets, and refined layout improvements.",
    items: [
      {
        type: "feature",
        icon: "bi-hourglass-split",
        title: "Interactive Pending Tickets Hover Popover",
        desc: "Hovering your cursor over the Pending card on the dashboard stats grid now instantly reveals an interactive popover listing all pending tickets with their ticket numbers, store names, MIDs, issues, and assigned agents. Includes one-click copy buttons (📋) and click-to-locate integration that loads the ticket straight into your search view.",
        tag: "New Feature"
      },
      {
        type: "feature",
        icon: "bi-search",
        title: "Comprehensive Global Search & Keyboard Shortcuts",
        desc: "The top search bar is now fully functional across all ticket fields (Ticket #, Store Name, MID, Support Agent, Issue, Remarks, Resolution, Status, and Dates). Press Ctrl+K (or ⌘K on Mac) to focus anywhere. Features a live match counter badge, one-click clear button (✕ / Esc), and an active search status indicator bar above the table.",
        tag: "New Feature"
      },
      {
        type: "improvement",
        icon: "bi-arrows-expand",
        title: "Auto-Expanding History Accordions on Search",
        desc: "When searching for tickets, past month and date groups in the History sidebar containing matching entries automatically expand with live match counts, ensuring you never miss a result hidden inside collapsed drawers.",
        tag: "Improvements"
      },
      {
        type: "ui",
        icon: "bi-layout-sidebar-inset",
        title: "Optimized Sidebar Layout & Break Card Width",
        desc: "Relocated the DAYOFF / 1 HR Break Card cleanly above the sidebar footer navigation, with perfectly aligned select borders and full support for longer agent names without text cutoff.",
        tag: "UI / UX"
      },
      {
        type: "warning",
        icon: "bi-shield-exclamation",
        title: "CRITICAL: Do Not Delete or Erase Browser Cache (Chrome & Edge)",
        desc: "Important reminder: Please DO NOT delete or erase your browser cache or browsing data in Google Chrome or Microsoft Edge because your data and tickets are currently saved in your browser cache. If you delete your cache or site data, your tickets and saved records will be permanently deleted and cannot be recovered.",
        tag: "Critical Reminder"
      }
    ]
  },
  {
    id: "rel-2026-09-18",
    version: "v2.5.0",
    date: "September 18, 2026",
    isLatest: false,
    badge: "PREVIOUS RELEASE",
    title: "One-Click 'Copy All', Direct Ticket # Intake, Midnight Tab Reset & Revamped Dashboard",
    summary: "A major usability update featuring one-click 'Copy all', streamlined ticket creation, automated tab resets, non-scrolling table grid, and upgraded productivity metrics.",
    items: [
      {
        type: "warning",
        icon: "bi-shield-exclamation",
        title: "CRITICAL: Do Not Delete or Erase Browser Cache (Chrome & Edge)",
        desc: "Important reminder: Please DO NOT delete or erase your browser cache or browsing data in Google Chrome or Microsoft Edge because your data and tickets are currently saved in your browser cache. If you delete your cache or site data, your tickets and saved records will be permanently deleted and cannot be recovered.",
        tag: "Critical Reminder"
      },
      {
        type: "feature",
        icon: "bi-clipboard2-check-fill",
        title: "One-Click 'Copy All' Quick Action",
        desc: "Added a 'Copy all' button directly next to 'Copy' on the bulk bar. Export every ticket in your current view to your clipboard formatted for Google Sheets with a single click—no need to check 'Select all' first. Automatically respects your active date, status, and search filters.",
        tag: "New Feature"
      },
      {
        type: "feature",
        icon: "bi-ticket-perforated-fill",
        title: "Direct 'Ticket #' Intake Field",
        desc: "Added a Ticket # input field directly at the top of the intake form. Any entered ticket number is automatically assigned to the ticket, saved across drafts and localStorage, and displayed prominently in the activity feed card header (TICKET #: <number>). Editing tickets automatically populates this field for seamless updates.",
        tag: "New Feature"
      },
      {
        type: "improvement",
        icon: "bi-clock-history",
        title: "Automated Midnight Ticket Tab Reset",
        desc: "Ticket draft tabs now automatically clear when a new calendar day begins (at midnight EST). Overnight tickets from yesterday will no longer linger on your tab bar, providing a fresh start for every support shift.",
        tag: "Automation"
      },
      {
        type: "improvement",
        icon: "bi-speedometer2",
        title: "Revamped Dashboard Metrics Cards",
        desc: "Redesigned the top stat cards to display: Your Tickets (overall system total), Yesterday Tickets (with date-based comparison), Today Tickets (real-time daily count), Resolved, Pending, and a compact 1-Hour Break Card with an inline agent selector.",
        tag: "Dashboard"
      },
      {
        type: "ui",
        icon: "bi-layout-sidebar-inset",
        title: "Collapsible Left Sidebar with Edge Toggle",
        desc: "The left navigation sidebar is now fully collapsible with an interactive edge pill button centered directly on the dividing line. Collapses down to an icon-only rail to give you maximum screen width for forms and tables.",
        tag: "UI / UX"
      },
      {
        type: "feature",
        icon: "bi-megaphone-fill",
        title: "Dedicated Announcements & News Center",
        desc: "Added this standalone Announcements page to keep the entire support team informed on recent releases, workflow improvements, and upcoming features.",
        tag: "New Page"
      },
      {
        type: "improvement",
        icon: "bi-table",
        title: "Zero Horizontal Scrolling & Responsive Grid",
        desc: "Refined the credit card history table layout to fit 100% of your screen width without horizontal scrollbars. Stacked date badges, pixel-perfect column alignment, and compact action controls ensure clean readability.",
        tag: "UI / UX"
      },
      {
        type: "improvement",
        icon: "bi-magic",
        title: "Live Preview & Clipboard Auto-Fill",
        desc: "The Live Preview panel now displays the entered Ticket # in real time, and the smart clipboard parser automatically recognizes 'TICKET NUMBER:' or 'TICKET #:' when pasting ticket details.",
        tag: "Quality of Life"
      },
      {
        type: "improvement",
        icon: "bi-file-earmark-spreadsheet-fill",
        title: "Updated Google Sheet Copy/Paste Order",
        desc: "Updated clipboard copy and paste ordering so Store Name is positioned before MID (Date, Shift Schedule, Support Name, Store Name, MID, Merchant Name, Contact #, Issue, Escalated, Status, Remarks). Both single-row Copy, Copy All, and Bulk Copy now match this exact sequence.",
        tag: "Google Sheets"
      }
    ]
  },
  {
    id: "rel-2026-09-15",
    version: "v2.4.0",
    date: "September 15, 2026",
    isLatest: false,
    badge: "WORKFLOW PACK",
    title: "AI Troubleshooting Modes, TID Quick Templates & Shift Schedule",
    summary: "Empowered the Nashville credit-card support team with automated AI remark summaries and fast-copy terminal templates.",
    items: [
      {
        type: "feature",
        icon: "bi-stars",
        title: "AI-Powered Remark Actions",
        desc: "Select between Summarize, Fix Grammar, or Off to auto-polish ticket troubleshooting notes before saving or escalating.",
        tag: "AI Integration"
      },
      {
        type: "feature",
        icon: "bi-clipboard-check",
        title: "TID Quick Copy Templates",
        desc: "Instant one-click clipboard copying for PAX, NEXGO, FD150, FD130, Valor, Dejavoo, NMI, and Authorize.Net configurations.",
        tag: "Templates"
      },
      {
        type: "feature",
        icon: "bi-cup-hot",
        title: "Interactive Shift Break Schedule",
        desc: "Full Mon–Sun break schedule modal highlighting today's active schedule for the 9 PM – 6 AM shift team.",
        tag: "Schedule"
      },
      {
        type: "improvement",
        icon: "bi-bar-chart-line",
        title: "Workload Tracker & HRMS Formatter",
        desc: "Quickly export clean formatted ticket logs ready for HRMS submission and shift handoffs.",
        tag: "Reporting"
      }
    ]
  }
];

// ==========================================
// ✅ EXTRACTED MODAL COMPONENTS 
// ==========================================

function TidTemplatesModal({ onClose }) {
  const copySpecificTemplate = (device) => {
    const text = TID_TEMPLATES[device];
    navigator.clipboard.writeText(text).then(() => {
      const notif = document.getElementById('notification');
      if (notif) {
        notif.textContent = `${device} Template copied!`;
        notif.classList.add('show');
        setTimeout(() => notif.classList.remove('show'), 2000);
      } else {
        alert(`${device} Template copied!`);
      }
      onClose(); 
    });
  };

  return (
    <div className="break-modal-overlay" onClick={onClose}>
      <div className="break-modal-content" style={{ padding: '24px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
          <h3 className="modal-title">Select a TID Template</h3>
          <button onClick={onClose} className="break-close-btn" aria-label="Close TID templates" title="Close"><i className="bi bi-x-lg" aria-hidden="true"></i></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
          {Object.keys(TID_TEMPLATES).map((device) => (
            <button 
              key={device} 
              onClick={() => copySpecificTemplate(device)}
              style={{ padding: '12px 10px', backgroundColor: 'var(--accent-color, #1a6d9f)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', textAlign: 'center', transition: 'background-color 0.2s', fontSize: '0.85em' }}
              onMouseOver={(e) => e.target.style.opacity = '0.8'}
              onMouseOut={(e) => e.target.style.opacity = '1'}
            >
              {device}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BreakScheduleModal({ onClose }) {
  const estDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[estDate.getDay()];

  return (
    <div className="break-modal-overlay" onClick={onClose}>
      <div className="break-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="break-modal-header">
          <div>
            <h2 className="modal-title modal-title-row">
              <i className="bi bi-cup-hot" aria-hidden="true"></i> Break Schedule
            </h2>
            <p className="modal-subtitle">
              9:00 PM - 6:00 AM Shift
            </p>
          </div>
          <button onClick={onClose} className="break-close-btn icon-close" aria-label="Close break schedule" title="Close"><i className="bi bi-x-lg" aria-hidden="true"></i></button>
        </div>
        
        <div style={{ padding: '24px' }}>
          <div className="info-box">
            <i className="bi bi-lightbulb info-box-icon" aria-hidden="true"></i>
            <span>Regarding the short break you can use it anytime. If you have any concern just let us know. Thank you!</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {Object.keys(BREAK_SCHEDULE).map(day => {
              const isToday = day === todayName;
              return (
                <div key={day} className={`break-day-card ${isToday ? 'is-today' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <h4 className="day-title">
                      {day}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isToday && <span className="badge-today">Today</span>}
                      <span className="people-count">
                        {BREAK_SCHEDULE[day].length} People
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {BREAK_SCHEDULE[day].map((slot, i) => (
                      <div key={i} className="break-slot">
                        <strong className="slot-person">{slot.person}</strong> 
                        <span className="slot-time">
                          {slot.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnnouncementPanel({ onOpenModal, hideHeader = false }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredAnnouncements = ANNOUNCEMENTS_DATA.map(rel => {
    const matchingItems = rel.items.filter(item => {
      const matchesFilter = filter === 'all' || item.type === filter;
      const matchesSearch = !search.trim() || 
        item.title.toLowerCase().includes(search.toLowerCase()) || 
        item.desc.toLowerCase().includes(search.toLowerCase()) || 
        rel.title.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
    return { ...rel, items: matchingItems };
  }).filter(rel => rel.items.length > 0);

  return (
    <div className="announcement-feed">
      {!hideHeader && (
        <div className="panel-header panel-header-form">
          <div>
            <p className="panel-kicker"><i className="bi bi-broadcast" aria-hidden="true"></i> System News & Updates</p>
            <h3>Announcements</h3>
            <p className="panel-subtitle">Explore latest features, enhancements, and workflow improvements.</p>
          </div>
          {onOpenModal && (
            <button 
              type="button" 
              className="btn btn-sm btn-outline-secondary"
              onClick={onOpenModal}
              title="Open in Fullscreen Modal"
              style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
            >
              <i className="bi bi-arrows-fullscreen" aria-hidden="true"></i> Full View
            </button>
          )}
        </div>
      )}

      {/* ⚠️ CRITICAL BROWSER CACHE ADVISORY BANNER */}
      <div className="announcement-cache-warning" role="alert">
        <div className="cache-warning-icon">
          <i className="bi bi-shield-exclamation" aria-hidden="true"></i>
        </div>
        <div className="cache-warning-content">
          <h4 className="cache-warning-title">
            ⚠️ Critical Reminder: Do Not Delete or Erase Browser Cache (Chrome & Edge)
          </h4>
          <p className="cache-warning-text">
            Your tickets and drafts are currently saved in your browser cache. Please <strong>do not delete or erase the cache in Google Chrome or Microsoft Edge</strong>. If you delete your cache or site data, <strong>your saved data and tickets will be permanently deleted</strong>.
          </p>
        </div>
      </div>

      <div className="announcement-toolbar">
        <div className="announcement-search-wrap">
          <i className="bi bi-search" aria-hidden="true"></i>
          <input
            type="text"
            className="announcement-search-input"
            placeholder="Search updates, features, improvements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search announcements"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              title="Clear search"
            >
              <i className="bi bi-x-circle-fill" aria-hidden="true"></i>
            </button>
          )}
        </div>

        <div className="announcement-filter-chips" role="group" aria-label="Filter updates by category">
          <button 
            type="button" 
            className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Updates
          </button>
          <button 
            type="button" 
            className={`filter-chip ${filter === 'warning' ? 'active' : ''}`}
            onClick={() => setFilter('warning')}
          >
            ⚠️ Notices
          </button>
          <button 
            type="button" 
            className={`filter-chip ${filter === 'feature' ? 'active' : ''}`}
            onClick={() => setFilter('feature')}
          >
            ✨ New Features
          </button>
          <button 
            type="button" 
            className={`filter-chip ${filter === 'improvement' ? 'active' : ''}`}
            onClick={() => setFilter('improvement')}
          >
            🚀 Improvements
          </button>
          <button 
            type="button" 
            className={`filter-chip ${filter === 'ui' ? 'active' : ''}`}
            onClick={() => setFilter('ui')}
          >
            🎨 UI / UX
          </button>
        </div>
      </div>

      {filteredAnnouncements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--text-muted)', background: 'var(--bg-soft)', borderRadius: 'var(--r-md)', border: '1px dashed var(--line)' }}>
          <i className="bi bi-search" style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px', opacity: 0.5 }}></i>
          No updates found matching "<strong>{search}</strong>".
        </div>
      ) : (
        filteredAnnouncements.map(rel => (
          <article key={rel.id} className={`announcement-release-card ${rel.isLatest ? 'is-latest' : ''}`}>
            <div className="release-card-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="release-version-tag">{rel.version}</span>
                <span className="release-date-text">{rel.date}</span>
              </div>
              {rel.isLatest && (
                <span className="release-badge-latest">
                  <i className="bi bi-stars me-1" aria-hidden="true"></i> {rel.badge}
                </span>
              )}
            </div>

            <div>
              <h4 className="release-title">{rel.title}</h4>
              <p className="release-summary">{rel.summary}</p>
            </div>

            <div className="release-items-list">
              {rel.items.map((item, idx) => (
                <div key={idx} className={`release-item-row ${item.type === 'warning' ? 'is-warning' : ''}`}>
                  <div className="release-item-icon">
                    <i className={`bi ${item.icon}`} aria-hidden="true"></i>
                  </div>
                  <div className="release-item-content">
                    <div className="release-item-header">
                      <h5 className="release-item-title">{item.title}</h5>
                      <span className="release-item-tag">{item.tag}</span>
                    </div>
                    <p className="release-item-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))
      )}
    </div>
  );
}

function AnnouncementPage({ onBackToDashboard }) {
  return (
    <div className="announcement-page">
      <div className="announcement-page-header">
        <div>
          <div className="announcement-kicker">
            <span className="kicker-pill"><i className="bi bi-broadcast me-1" aria-hidden="true"></i> System News & Updates</span>
            <span className="kicker-release">Nashville CC Support</span>
          </div>
          <h1>System Announcements</h1>
          <p className="panel-subtitle">Official release updates, new tools, and upcoming platform improvements.</p>
        </div>
        <button 
          type="button" 
          className="announcement-back-btn" 
          onClick={onBackToDashboard}
          title="Return to Ticketing Dashboard"
        >
          <i className="bi bi-arrow-left" aria-hidden="true"></i> Back to Dashboard
        </button>
      </div>

      {/* Quick stats strip */}
      <div className="announcement-stats-strip">
        <div className="announcement-stat-box">
          <span className="announcement-stat-label">Current Version</span>
          <span className="announcement-stat-val">v2.7.1</span>
        </div>
        <div className="announcement-stat-box">
          <span className="announcement-stat-label">Latest Release</span>
          <span className="announcement-stat-val">Sep 26, 2026</span>
        </div>
        <div className="announcement-stat-box">
          <span className="announcement-stat-label">New Features</span>
          <span className="announcement-stat-val">15 Updates</span>
        </div>
        <div className="announcement-stat-box">
          <span className="announcement-stat-label">System Status</span>
          <span className="announcement-stat-val" style={{ color: 'var(--teal-600)' }}>● Operational</span>
        </div>
      </div>

      {/* Announcement feed with search & category filters */}
      <AnnouncementPanel hideHeader={true} />
    </div>
  );
}

function AnnouncementModal({ onClose }) {
  return (
    <div className="break-modal-overlay" onClick={onClose}>
      <div className="announcement-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="break-modal-header">
          <div>
            <h2 className="modal-title modal-title-row">
              <i className="bi bi-megaphone-fill text-teal" aria-hidden="true"></i> System Announcements & Changelog
            </h2>
            <p className="modal-subtitle">
              Official update log, feature additions, and platform improvements
            </p>
          </div>
          <button onClick={onClose} className="break-close-btn icon-close" aria-label="Close announcements modal" title="Close">
            <i className="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
        
        <div style={{ padding: '24px' }}>
          <AnnouncementPanel />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ✅ SIDEBAR BREAK CARD (DAYOFF / 1 HR BREAK)
// ==========================================

function SidebarBreakCard() {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [selectedPerson, setSelectedPerson] = useState(localStorage.getItem('myBreakPerson') || '');
  const [todayBreak, setTodayBreak] = useState('--:--');
  const [selectedDateStr, setSelectedDateStr] = useState('');

  useEffect(() => {
    const supportEl = document.getElementById('creditcard-support');
    const syncFromForm = (e) => {
      const val = e.target.value;
      setSelectedPerson(val);
      localStorage.setItem('myBreakPerson', val);
    };

    if (supportEl) {
      setTimeout(() => {
        if (supportEl.value && supportEl.value !== selectedPerson) {
          setSelectedPerson(supportEl.value);
          localStorage.setItem('myBreakPerson', supportEl.value);
        }
      }, 500);

      supportEl.addEventListener('input', syncFromForm);
      supportEl.addEventListener('change', syncFromForm);
    }

    return () => {
      if (supportEl) {
        supportEl.removeEventListener('input', syncFromForm);
        supportEl.removeEventListener('change', syncFromForm);
      }
    };
  }, []);

  useEffect(() => {
    const dateEl = document.getElementById('creditcard-date');
    const syncDateFromForm = (e) => {
      setSelectedDateStr(e.target.value);
    };

    if (dateEl) {
      setTimeout(() => {
        if (dateEl.value) {
          setSelectedDateStr(dateEl.value);
        }
      }, 500);

      dateEl.addEventListener('input', syncDateFromForm);
      dateEl.addEventListener('change', syncDateFromForm);
    }

    return () => {
      if (dateEl) {
        dateEl.removeEventListener('input', syncDateFromForm);
        dateEl.removeEventListener('change', syncDateFromForm);
      }
    };
  }, []);

  let activeDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  if (selectedDateStr) {
    const [y, m, d] = selectedDateStr.split('-');
    if (y && m && d) {
      activeDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }
  }

  const currentDayName = dayNames[activeDate.getDay()];
  const currentDateString = activeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    if (selectedPerson && BREAK_SCHEDULE[currentDayName]) {
      const schedule = BREAK_SCHEDULE[currentDayName].find(s => {
        const schedName = s.person.toUpperCase();
        const myName = selectedPerson.toUpperCase();
        return schedName.includes(myName) || myName.includes(schedName);
      });
      setTodayBreak(schedule ? schedule.time : 'DAYOFF');
    } else if (selectedPerson) {
      setTodayBreak('Off / Weekend');
    } else {
      setTodayBreak('--:--');
    }
  }, [selectedPerson, currentDayName]);

  const handlePersonChange = (e) => {
    const val = e.target.value;
    setSelectedPerson(val);
    localStorage.setItem('myBreakPerson', val);

    const supportEl = document.getElementById('creditcard-support');
    if (supportEl) {
      supportEl.value = val;
      supportEl.dispatchEvent(new Event('input', { bubbles: true }));
      supportEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  return (
    <div className="sidebar-break-card stat-card violet" title="1 Hour Break Schedule">
      <div className="sidebar-break-top">
        <span className="sidebar-break-title">
          <i className="bi bi-cup-hot" aria-hidden="true"></i> 1 HR BREAK
        </span>
        <select
          value={selectedPerson}
          onChange={handlePersonChange}
          className="break-name-select"
          aria-label="Select your name"
        >
          <option value="">-- Name --</option>
          <option value="HANZ">HANZ</option>
          <option value="CHARLES">CHARLES</option>
          <option value="KENNETH">KENNETH</option>
          <option value="ADI">ADI</option>
          <option value="TATI">TATI</option>
          <option value="RONIE">RONIE</option>
          <option value="SEAN">SEAN</option>
          <option value="MAT">MAT</option>
          <option value="ZEL">ZEL</option>
          <option value="JR">JR</option>
          <option value="YASMINE">YASMINE</option>
          <option value="GABRIEL">GABRIEL</option>
          <option value="ERNEST">ERNEST</option>
          <option value="REGS">REGS</option>
          <option value="NICHOLLE">NICHOLLE</option>
          <option value="EJ">EJ</option>
        </select>
      </div>
      <div className="sidebar-break-date">
        {currentDayName}, {currentDateString}
      </div>
      <div className="stat-value stat-value-break">
        {selectedPerson ? todayBreak : (<>Select name <i className="bi bi-hand-index stat-select-arrow" aria-hidden="true"></i></>)}
      </div>
    </div>
  );
}

// ==========================================
// ✅ SIDEBAR & NAVIGATION
// ==========================================

function Sidebar({ 
  isCollapsed, 
  onToggleCollapse, 
  onOpenTemplates, 
  onOpenBreakSchedule,
  currentView = 'dashboard',
  onSelectView
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 1100);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobileView) setIsMobileNavOpen(false);
  }, [isMobileView]);

  const toggleTheme = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme_creditcard', isDark ? 'dark' : 'light');
  };

  const handleNavAction = (action) => {
    if (typeof action === 'function') action();
    if (isMobileView) setIsMobileNavOpen(false);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'is-collapsed' : ''}`} aria-label="Primary navigation">
      {/* Edge toggle pill button on the middle of the dividing line */}
      <button
        type="button"
        className="sidebar-edge-toggle"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`} aria-hidden="true"></i>
      </button>

      <div className="sidebar-inner">
        <div className="sidebar-top">
          <div className="logo" title="Tickets v2.7.1">
            <img src={appLogo} alt="Logo" className="sidebar-logo-img" />
            <div className="logo-content">
              <span className="logo-text">Tickets</span>
              <span className="logo-version">v2.7.1</span>
            </div>
          </div>
          <div className="sidebar-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              title="Toggle theme"
            >
              <i className="bi bi-moon-stars-fill" aria-hidden="true"></i>
            </button>
            {isMobileView && (
              <button
                type="button"
                className="sidebar-toggle"
                onClick={() => setIsMobileNavOpen((prev) => !prev)}
                aria-label="Toggle navigation"
                title="Toggle navigation"
              >
                <i className="bi bi-list" aria-hidden="true"></i>
              </button>
            )}
          </div>
        </div>
        <nav className={`nav-list ${isMobileView && !isMobileNavOpen ? 'nav-list-collapsed' : 'nav-list-open'}`} aria-label="Primary">
          <button 
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} 
            onClick={() => handleNavAction(() => {
              onSelectView && onSelectView('dashboard');
              window.switchToTab && window.switchToTab('creditcard');
            })} 
            aria-current={currentView === 'dashboard' ? 'page' : undefined} 
            title="Dashboard"
          >
            <i className="bi bi-speedometer2 me-2" aria-hidden="true"></i>
            <span className="nav-text">Dashboard</span>
          </button>

          <button className="nav-item" onClick={() => handleNavAction(onOpenTemplates)} title="TID Templates">
            <i className="bi bi-clipboard-data me-2" aria-hidden="true"></i>
            <span className="nav-text">TID Templates</span>
          </button>
          <button className="nav-item" onClick={() => handleNavAction(onOpenBreakSchedule)} title="Break Schedule">
            <i className="bi bi-cup-hot me-2" aria-hidden="true"></i>
            <span className="nav-text">Break Schedule</span>
          </button>

          {/* Dedicated Announcement Tab */}
          <button 
            className={`nav-item ${currentView === 'announcement' ? 'active' : ''}`}
            onClick={() => handleNavAction(() => {
              onSelectView && onSelectView('announcement');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            })}
            aria-current={currentView === 'announcement' ? 'page' : undefined}
            title="Announcement"
          >
            <i className="bi bi-megaphone me-2" aria-hidden="true"></i>
            <span className="nav-text">Announcement</span>
          </button>

          {/* Dedicated Shift Report Tab */}
          <button 
            className={`nav-item ${currentView === 'shift-report' ? 'active' : ''}`}
            onClick={() => handleNavAction(() => {
              onSelectView && onSelectView('shift-report');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            })}
            aria-current={currentView === 'shift-report' ? 'page' : undefined}
            title="Shift Report"
          >
            <i className="bi bi-file-earmark-bar-graph me-1" aria-hidden="true"></i>
            <span className="nav-text">Shift Report</span>
            <span className="nav-item-badge">BETA</span>
          </button>
        </nav>

        {/* ☕ DAYOFF / 1 HR Break Card positioned at bottom of left panel */}
        <SidebarBreakCard />

        <div className="sidebar-foot">
          <span className="sidebar-foot-full">Logged in as <strong>Support</strong></span>
          <span className="sidebar-foot-compact" title="Logged in as Support"><i className="bi bi-person-circle" aria-hidden="true"></i></span>
        </div>
        <div className="sidebar-key">
          <button id="saveGeminiKeyBtn" className="btn btn-sm btn-primary sidebar-key-btn" title="Set Gemini API Key" style={{marginTop:8, width:'100%'}}>
            <i className="bi bi-key-fill sidebar-key-icon me-1" aria-hidden="true"></i>
            <span className="sidebar-key-text">Set Gemini API Key</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

// ==========================================
// ✅ HEADER (KASAMA ANG SEARCH) & SEPARATE PIC DIV
// ==========================================

// ==========================================
// ✅ HEADER (KASAMA ANG SEARCH) & SEPARATE PIC DIV
// ==========================================

// ==========================================
// ✅ HEADER (KASAMA ANG SEARCH) & SEPARATE PIC DIV
// ==========================================

// ==========================================
// ✅ HEADER (KASAMA ANG SEARCH) & SEPARATE PIC DIV
// ==========================================

function Header() {
  const [query, setQuery] = useState('');
  const [matchCount, setMatchCount] = useState(null);

  useEffect(() => {
    // Expose global clear function for other components/controller
    window.clearGlobalSearch = () => {
      setQuery('');
      setMatchCount(null);
      if (window.handleGlobalSearch) {
        window.handleGlobalSearch('');
      }
      const input = document.getElementById('headerSearch');
      if (input) input.value = '';
    };

    // Callback for controller to report matching ticket count
    window.updateSearchMatchCount = (count) => {
      setMatchCount(count);
    };

    // Keyboard shortcut: Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.switchToDashboardView) window.switchToDashboardView();
        const input = document.getElementById('headerSearch');
        if (input) {
          input.focus();
          input.select();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      delete window.clearGlobalSearch;
      delete window.updateSearchMatchCount;
    };
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) {
      setMatchCount(null);
    }
    if (window.switchToDashboardView) {
      window.switchToDashboardView();
    }
    if (window.handleGlobalSearch) {
      window.handleGlobalSearch(val);
    }
  };

  const handleClear = () => {
    if (window.clearGlobalSearch) {
      window.clearGlobalSearch();
    }
    const input = document.getElementById('headerSearch');
    if (input) {
      input.focus();
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-brand-wrap">
          <img src={appLogo} alt="CC Support Logo" className="header-logo-img" />
          <div className="header-titles">
            <h1>Credit Card Support Center</h1>
            <p className="small">Capture issues quickly and resolve faster.</p>
          </div>
        </div>
      </div>
      <div className="header-actions">
        <div className="header-search-wrap">
          <i className="bi bi-search header-search-icon" aria-hidden="true"></i>
          <input
            id="headerSearch"
            type="text"
            role="searchbox"
            value={query}
            className="header-search"
            placeholder="Search tickets, stores, MID..."
            aria-label="Search tickets, stores, or MID"
            onChange={handleChange}
            onFocus={() => {
              if (window.switchToDashboardView) window.switchToDashboardView();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleClear();
                e.target.blur();
              }
            }}
          />
          {query.trim() ? (
            <div className="header-search-actions">
              {matchCount !== null && (
                <span className="header-search-count" title={`${matchCount} matching ticket(s)`}>
                  {matchCount}
                </span>
              )}
              <button
                type="button"
                className="header-search-clear-btn"
                onClick={handleClear}
                title="Clear search (Esc)"
                aria-label="Clear search"
              >
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </div>
          ) : (
            <span
              className="header-search-kbd is-clickable"
              aria-hidden="true"
              title="Press Ctrl+K or ⌘K to search"
              onClick={() => {
                const input = document.getElementById('headerSearch');
                if (input) input.focus();
              }}
            >
              ⌘K
            </span>
          )}
        </div>
        <button
          className="team-chip"
          onClick={() => window.openTeamPhoto && window.openTeamPhoto()}
          title="View team photo"
          type="button"
        >
          <img src={appLogo} alt="Team Logo" className="team-chip-avatar" />
          <span className="team-chip-label">Team</span>
        </button>
      </div>
    </header>
  );
}


// ==========================================
// DASHBOARD STATS GRID (6 METRICS)
// ==========================================

function DashboardGrid() {
  const [isPendingHovered, setIsPendingHovered] = useState(false);
  const [pendingList, setPendingList] = useState([]);
  const hoverTimeoutRef = useRef(null);

  const loadPendingTickets = () => {
    let list = [];
    if (typeof window !== 'undefined' && window.getPendingTickets) {
      list = window.getPendingTickets();
    } else {
      try {
        const raw = localStorage.getItem('unifiedEntries_creditcard');
        if (raw) {
          const parsed = JSON.parse(raw);
          list = parsed.filter(e => {
            if (e.deleted || e.source !== 'creditcard') return false;
            const status = (e.status || '').toUpperCase().trim();
            return status !== 'RESOLVED' && status !== 'OTHER TASK';
          });
        }
      } catch (err) {
        list = [];
      }
    }
    setPendingList(list);
  };

  const handlePendingMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    loadPendingTickets();
    setIsPendingHovered(true);
  };

  const handlePendingMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsPendingHovered(false);
    }, 140);
  };

  return (
    <section className="dashboard-grid compact" aria-label="Ticket dashboard summary">
      {/* 1. YOUR TICKETS */}
      <div className="stat-card hero is-clickable" title="Overall total number of tickets" onClick={() => window.showAllTickets && window.showAllTickets()}>
        <div className="stat-label">
          <i className="bi bi-collection-fill" aria-hidden="true"></i> Your Tickets
        </div>
        <div className="stat-value" id="dashboardYourTickets">0</div>
        <div className="stat-meta">Overall total tickets</div>
        <svg className="stat-sparkline" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="0,18 12,14 24,16 36,8 48,12 60,5 72,9 84,3 100,7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* 2. YESTERDAY TICKETS */}
      <div className="stat-card slate is-clickable" title="Click to view yesterday's tickets" onClick={() => window.setFilterToYesterday && window.setFilterToYesterday()}>
        <div className="stat-label">
          <i className="bi bi-clock-history" aria-hidden="true"></i> Yesterday Tickets
        </div>
        <div className="stat-value" id="dashboardYesterdayTickets">0</div>
        <div className="stat-meta">Created yesterday</div>
        <svg className="stat-sparkline" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="0,16 12,14 24,15 36,11 48,13 60,8 72,10 84,6 100,8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* 3. TODAY TICKETS */}
      <div className="stat-card accent is-clickable" title="Click to view today's tickets" onClick={() => window.setFilterToToday && window.setFilterToToday()}>
        <div className="stat-label">
          <i className="bi bi-calendar2-check-fill" aria-hidden="true"></i> Today Tickets
        </div>
        <div className="stat-value" id="dashboardTodayTickets">0</div>
        <div className="stat-meta">Created today</div>
        <svg className="stat-sparkline" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="0,18 12,14 24,16 36,8 48,12 60,5 72,9 84,3 100,7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* 4. RESOLVED */}
      <div className="stat-card success is-clickable" title="Click to filter by Resolved" onClick={() => window.filterByStatus && window.filterByStatus('RESOLVED')}>
        <div className="stat-label">
          <i className="bi bi-check-circle-fill" aria-hidden="true"></i> Resolved
        </div>
        <div className="stat-value" id="dashboardResolvedTickets">0</div>
        <div className="stat-meta">Total resolved tickets</div>
        <svg className="stat-sparkline" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="0,16 12,12 24,14 36,10 48,12 60,7 72,9 84,4 100,6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* 5. BACKEND */}
      <div 
        className="stat-card violet is-clickable" 
        title="Click to filter by Backend (Other Task)" 
        onClick={() => window.filterByStatus && window.filterByStatus('OTHER TASK')}
      >
        <div className="stat-label">
          <i className="bi bi-cpu-fill" aria-hidden="true"></i> Backend
        </div>
        <div className="stat-value" id="dashboardBackendTickets">0</div>
        <div className="stat-meta">Other task tickets</div>
        <svg className="stat-sparkline" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="0,15 12,18 24,10 36,14 48,9 60,13 72,8 84,11 100,6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* 6. PENDING */}
      <div 
        className="stat-card warning is-clickable pending-card-wrap" 
        title="Click to filter by Pending · Hover to view pending ticket numbers" 
        onClick={() => window.filterByStatus && window.filterByStatus('PENDING')}
        onMouseEnter={handlePendingMouseEnter}
        onMouseLeave={handlePendingMouseLeave}
      >
        <div className="stat-label">
          <i className="bi bi-hourglass-split" aria-hidden="true"></i> Pending
        </div>
        <div className="stat-value" id="dashboardPendingTickets">0</div>
        <div className="stat-meta">Total pending tickets</div>
        <svg className="stat-sparkline" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="0,20 12,18 24,16 36,14 48,16 60,12 72,14 84,10 100,12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Hover Popover showing all pending tickets */}
        {isPendingHovered && (
          <div 
            className="pending-popover" 
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={handlePendingMouseEnter}
            onMouseLeave={handlePendingMouseLeave}
          >
            <div className="pending-popover-header">
              <div className="pending-popover-title">
                <i className="bi bi-hourglass-split" aria-hidden="true"></i>
                <span>Pending Tickets</span>
                <span className="pending-count-badge">{pendingList.length}</span>
              </div>
              <span className="pending-popover-hint">{pendingList.length === 1 ? '1 ticket' : `${pendingList.length} tickets`}</span>
            </div>

            {pendingList.length === 0 ? (
              <div className="pending-popover-empty">
                <i className="bi bi-check2-circle" aria-hidden="true"></i>
                <span>No pending tickets right now</span>
              </div>
            ) : (
              <div className="pending-popover-list">
                {pendingList.map((ticket, idx) => (
                  <div 
                    key={ticket.id || idx} 
                    className="pending-popover-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      const query = ticket.ticketNumber || ticket.store || ticket.mid;
                      if (query && window.handleGlobalSearch) {
                        window.handleGlobalSearch(query);
                        const sInput = document.getElementById('headerSearch');
                        if (sInput) sInput.value = query;
                      } else if (window.filterByStatus) {
                        window.filterByStatus('PENDING');
                      }
                    }}
                    title="Click to search and view this ticket in table"
                  >
                    <div className="pending-item-top">
                      <span className="pending-ticket-badge">
                        <i className="bi bi-ticket-perforated-fill me-1" aria-hidden="true"></i>
                        {ticket.ticketNumber ? `TICKET #: ${ticket.ticketNumber}` : 'NO TICKET #'}
                      </span>
                      {(!ticket.status || ticket.status.trim() === '') ? (
                        <span className="pending-status-pill no-status" title="This ticket has no status assigned">
                          No Status
                        </span>
                      ) : (ticket.status.toUpperCase() !== 'PENDING') ? (
                        <span className="pending-status-pill alt-status" title={`Status: ${ticket.status}`}>
                          {ticket.status}
                        </span>
                      ) : null}
                      {ticket.ticketNumber && (
                        <button
                          type="button"
                          className="pending-copy-btn"
                          title="Copy ticket number"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(ticket.ticketNumber);
                            if (window.showNotification) {
                              window.showNotification(`Copied ticket #${ticket.ticketNumber}`);
                            }
                          }}
                        >
                          <i className="bi bi-clipboard" aria-hidden="true"></i>
                        </button>
                      )}
                    </div>
                    <div className="pending-item-details">
                      <span className="pending-store-name">{ticket.store || 'Store —'}</span>
                      {ticket.mid && <span className="pending-mid">MID: {ticket.mid}</span>}
                    </div>
                    {ticket.issue && (
                      <div className="pending-item-issue" title={ticket.issue}>
                        {ticket.issue}
                      </div>
                    )}
                    <div className="pending-item-meta">
                      {ticket.date && <span className="pending-meta-date"><i className="bi bi-calendar3 me-1"></i>{ticket.date}</span>}
                      {ticket.support && <span className="pending-meta-agent"><i className="bi bi-person me-1"></i>{ticket.support}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pending-popover-footer">
              <span className="pending-footer-tip">
                <i className="bi bi-info-circle me-1"></i> Click ticket to search · Click card to filter table
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Tabs({ currentView = 'dashboard', onSelectView }) {
  return (
    <div className="top-tabs shell-tabs">
      <button 
        id="tabBtn-creditcard" 
        className={`tab-btn ${currentView === 'dashboard' ? 'active' : ''}`} 
        onClick={() => {
          onSelectView && onSelectView('dashboard');
          if (window.createNewTicket) {
            window.createNewTicket();
          } else if (window.switchToTab) {
            window.switchToTab('creditcard');
          }
          const formEl = document.querySelector('.left-panel');
          if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
          const ticketNumEl = document.getElementById('creditcard-ticketNumber');
          if (ticketNumEl) ticketNumEl.focus();
        }}
        title="Create a new ticket"
      >
        + New Ticket
      </button>

      <button 
        id="tabBtn-shiftreport" 
        className={`tab-btn ${currentView === 'shift-report' ? 'active' : ''}`} 
        onClick={() => {
          onSelectView && onSelectView('shift-report');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        title="Open Shift Reports"
      >
        <i className="bi bi-file-earmark-bar-graph me-1" aria-hidden="true"></i> SHIFT REPORT
      </button>
    </div>
  );
}

function LeftPanel() {
  return (
    <div className="left-panel">
      <div className="panel-header panel-header-form">
        <div>
          <p className="panel-kicker">Ticket intake</p>
          <h3>Ticket form</h3>
          <p className="panel-subtitle">Enter the issue once and use the preview to confirm the final ticket.</p>
        </div>
      </div>
      <table>
        <tbody>
          <tr>
            <th><label htmlFor="creditcard-ticketNumber">TICKET #</label></th>
            <td><input type="text" id="creditcard-ticketNumber" className="no-uppercase" placeholder="Enter Ticket #" /></td>
          </tr>
          <tr>
            <th><label htmlFor="creditcard-date">DATE</label></th>
            <td><input type="date" id="creditcard-date" /></td>
          </tr>
          <tr>
            <th><label htmlFor="creditcard-shift">SHIFT SCHEDULE</label></th>
            <td>
              <select id="creditcard-shift">
                <option value="">-- SELECT --</option>
                <option value="9PM - 8AM">9PM - 8AM</option>
                <option value="7:30AM - 6:30PM">5AM - 2PM</option>
                <option value="6PM - 5AM">2PM - 11PM</option>
              </select>
            </td>
          </tr>
          <tr>
            <th><label htmlFor="creditcard-support">SUPPORT NAME *</label></th>
            <td>
              <select id="creditcard-support" className="required-field no-uppercase">
                <option value="">-- SELECT NAME --</option>
                <option value="HANZ">HANZ</option>
                <option value="CHARLES">CHARLES</option>
                <option value="KENNETH">KENNETH</option>
                <option value="ADI">ADI</option>
                <option value="TATI">TATI</option>
                <option value="RONIE">RONIE</option>
                <option value="SEAN">SEAN</option>
                <option value="MAT">MAT</option>
                <option value="ZEL">ZEL</option>
                <option value="JR">JR</option>
                <option value="YASMINE">YASMINE</option>
                <option value="GABRIEL">GABRIEL</option>
                <option value="ERNEST">ERNEST</option>
                <option value="REGS">REGS</option>
                <option value="NICHOLLE">NICHOLLE</option>
              </select>
            </td>
          </tr>
          {/* ✅ SEARCH STORE FIELD */}
          <tr>
            <th><label htmlFor="creditcard-store-search"><i className="bi bi-search" aria-hidden="true"></i> SEARCH STORE</label></th>
            <td>
              <div className="combobox-wrapper" style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="creditcard-store-search"
                  className="combobox-input no-uppercase"
                  placeholder="Type Store Name or MID..."
                  autoComplete="off"
                  aria-label="Search store or MID"
                />
                <div id="creditcard-store-search-suggestions" className="combobox-suggestions"></div>
              </div>
            </td>
          </tr>
          <tr>
            <th><label htmlFor="creditcard-store">STORE NAME *</label></th>
            <td><input type="text" id="creditcard-store" className="required-field" /></td>
          </tr>
          <tr>
            <th><label htmlFor="creditcard-mid">MID *</label></th>
            <td><input type="text" id="creditcard-mid" className="required-field" /></td>
          </tr>
          <tr>
            <th><label htmlFor="creditcard-merchant">MERCHANT NAME</label></th>
            <td><input type="text" id="creditcard-merchant" /></td>
          </tr>
          <tr>
            <th><label htmlFor="creditcard-contactNumber">CONTACT #</label></th>
            <td><input type="text" id="creditcard-contactNumber" className="no-uppercase" maxLength={14} /></td>
          </tr>
          <tr>
            <th><label htmlFor="creditcard-issue">ISSUE</label></th>
            <td><textarea id="creditcard-issue" className="no-uppercase" rows={2}></textarea></td>
          </tr>
          <tr>
            <th><label htmlFor="creditcard-escalated">ESCALATED</label></th>
            <td><input type="text" id="creditcard-escalated" className="no-uppercase" /></td>
          </tr>
          <tr>
            <th><label htmlFor="creditcard-status">STATUS</label></th>
            <td>
              <div className="combobox-wrapper" style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="creditcard-status-combobox"
                  className="combobox-input no-uppercase"
                  autoComplete="off"
                  placeholder="Type or select status"
                  aria-label="Status"
                  style={{ paddingRight: '28px' }}
                  onClick={() => {
                    const suggestions = document.getElementById('creditcard-status-suggestions');
                    if (suggestions) suggestions.style.display = 'block';
                  }}
                />
                <input type="hidden" id="creditcard-status" />
                
                {/* OPTION TEMPLATES FOR 'OTHER TASK' */}
                <div id="creditcard-other-task-container" style={{ display: 'none', marginTop: '5px' }}>
                  <select id="creditcard-other-task-select" className="combobox-input no-uppercase">
                    <option value="">-- SELECT OTHER TASK TEMPLATE --</option>
                    <option value="DEJAVOO TID ">DEJAVOO TID </option>
                    <option value="VALOR TID">VALOR TID </option>
                    <option value="CLOVER DEPROVISIONED">CLOVER DEPROVISIONED</option>
                    <option value="BANK CHANGE">BANK CHANGE</option>
                    <option value="DEJAVOO PROGRAMMING">DEJAVOO PROGRAMMING</option>
                    <option value="TSYS V2 DEJAVOO PROGRAMMING">TSYS V2 DEJAVOO PROGRAMMING</option>
                    <option value="LEADS CREATION">LEADS CREATION</option>
                    <option value="DISPUTE LETTER">DISPUTE LETTER</option>
                    <option value="FILLING TSYS V2">FILLING TSYS V2</option>
                    <option value="1099-K REPORT">1099-K REPORT</option>
                    <option value="RETURN LABEL">RETURN LABEL</option>
                    <option value="CLOSE ACCOUNT FISERV">CLOSE ACCOUNT FISERV</option>
                    <option value="CLOVER PROVISION">CLOVER PROVISION</option>
                    <option value="CLOVER DEPROVISIONED">CLOVER DEPROVISIONED</option>
                    <option value="PROGRAM PAX S300 PROGRAMMING">PROGRAM PAX S300 PROGRAMMING</option>
                    <option value="REQUEST FOR TSYS VARSHEET">REQUEST FOR TSYS VARSHEET</option>
                    <option value="RESET THE ACCESS FOR IRIS PORTAL">RESET THE ACCESS FOR IRIS PORTAL</option>
                    <option value="ACCESS FOR IRIS PORTAL">ACCESS FOR IRIS PORTAL</option>
                    <option value="BUYPASS TID CREATION">BUYPASS TID CREATION</option>
                  </select>
                </div>

                <button
                  type="button"
                  title="Clear Status"
                  aria-label="Clear status"
                  className="combobox-clear-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    const combo = document.getElementById('creditcard-status-combobox');
                    const hidden = document.getElementById('creditcard-status');
                    if (combo) combo.value = '';
                    if (hidden) hidden.value = '';

                    const suggestions = document.getElementById('creditcard-status-suggestions');
                    if (suggestions) suggestions.style.display = 'block';
                  }}
                >
                  <i className="bi bi-x-lg" aria-hidden="true"></i>
                </button>
                    
                <div id="creditcard-status-suggestions" className="combobox-suggestions"></div>
              </div>
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="creditcard-remarks">Troubleshooting</label>
            </th>
            <td>
              <div className="ai-mode-panel" role="radiogroup" aria-label="AI action mode">
                <label>
                  <input type="radio" name="aiActionMode" value="summarize" defaultChecked />
                  <i className="bi bi-stars" aria-hidden="true"></i>
                  <span className="text-summarize ai-mode-label">Summarize</span>
                </label>

                <label>
                  <input type="radio" name="aiActionMode" value="grammar" />
                  <i className="bi bi-spellcheck" aria-hidden="true"></i>
                  <span className="text-grammar ai-mode-label">Fix Grammar</span>
                </label>

                <label>
                  <input type="radio" name="aiActionMode" value="none" />
                  <i className="bi bi-pencil" aria-hidden="true"></i>
                  <span className="ai-mode-label ai-mode-label-muted">Off</span>
                </label>
              </div>
              <div id="creditcard-remarks-editor" className="remarks-editor" style={{ marginTop: 10 }}></div>
              <textarea id="creditcard-remarks" style={{ display: 'none' }}></textarea>
            </td>
          </tr>
          <tr>
            <th><label htmlFor="creditcard-resolution">Backend / Resolution</label></th>
            <td><textarea id="creditcard-resolution" className="no-uppercase" rows={3}></textarea></td>
          </tr>
        </tbody>
      </table>
      <div className="button-row">
        <button className="add" onClick={() => window.addEntry && window.addEntry('creditcard')}>Add entry</button>
        <button className="save-draft" onClick={() => window.saveCurrentDraft && window.saveCurrentDraft()}>Save draft</button>
        <button className="form-clear-btn" onClick={() => window.clearFormOnly && window.clearFormOnly('creditcard')}>Clear form</button>
        <button className="clock" onClick={() => window.clock && window.clock('IN', 'creditcard')}>Clock in</button>
        <button className="clock" onClick={() => window.clock && window.clock('OUT', 'creditcard')}>Clock out</button>
      </div>
    </div>
  );
}

function RightPanel() {
  return (
    <div className="right-panel" id="creditcard-previewPanel">
      <div className="panel-header panel-header-preview">
        <div>
          <p className="panel-kicker">Live preview</p>
          <h3>Ticket preview</h3>
        </div>
      </div>
      <div className="preview-summary">
        <div className="preview-summary-row"><span>Ticket #</span><strong id="creditcard-preview-ticketNumber"></strong></div>
        <div className="preview-summary-row"><span>Store</span><strong id="creditcard-preview-store"></strong></div>
        <div className="preview-summary-row"><span>MID</span><strong id="creditcard-preview-mid"></strong></div>
        <div className="preview-summary-row"><span>Merchant</span><strong id="creditcard-preview-merchant"></strong></div>
        <div className="preview-summary-row"><span>Contact</span><strong id="creditcard-preview-contactNumber"></strong></div>
      </div>
      <div className="preview-section">
        <span className="preview-label">Issue</span>
        <div className="preview-box"><span id="creditcard-preview-issue" className="preview-multiline"></span></div>
      </div>
      <div className="preview-section">
        <span className="preview-label">Troubleshooting</span>
        <div className="preview-box preview-box-accent"><span id="creditcard-preview-remarks" className="preview-multiline"></span></div>
      </div>
      <div className="preview-section">
        <span className="preview-label">Backend / Resolution</span>
        <div className="preview-box"><span id="creditcard-preview-resolution" className="preview-multiline"></span></div>
      </div>
    </div>
  );
}

function HistoryPanel() {
  return (
    <div className="history-panel history-panel-flex">
      <div className="panel-header panel-header-history history-panel-header">
        <div className="history-panel-header-inner">
          <div>
            <p className="panel-kicker">Activity feed</p>
            <h3>Credit Card History</h3>
            <p className="panel-subtitle">Recent tickets, grouped by date.</p>
          </div>
          
          <div className="history-panel-actions">
            <label htmlFor="workload-date-picker" className="sr-only">Workload date</label>
            <input
              type="date"
              id="workload-date-picker"
              className="history-date-picker"
            />
            <button
              className="btn btn-sm btn-primary"
              onClick={() => window.generateWorkload && window.generateWorkload()}
            >
              <i className="bi bi-bar-chart-line me-1" aria-hidden="true"></i> Workload Tracker
            </button>
          </div>
        </div>
      </div>
      <div id="creditcardHistoryContent" className="history-content" style={{ flexGrow: 1, overflowY: 'auto' }}></div>
    </div>
  );
}

function BulkBar() {
  return (
    <div className="bulk-bar">
      <label><input type="checkbox" id="selectAllCheckbox" /> Select all</label>
      <button id="bulkDeleteBtn">Remove</button>
      <button id="bulkCopyBtn">Copy</button>
      <button id="copyAllBtn" className="copy-all-btn" onClick={() => window.copyAllEntries && window.copyAllEntries()} title="Copy all visible tickets to clipboard">Copy all</button>
      <button className="counter-badge status-filter-btn" data-status="RESOLVED" onClick={() => window.filterByStatus && window.filterByStatus('RESOLVED')}><i className="bi bi-check-circle-fill" aria-hidden="true"></i> Resolved: <span id="counterResolved">0</span></button>
      <button className="counter-badge status-filter-btn" data-status="PENDING" onClick={() => window.filterByStatus && window.filterByStatus('PENDING')}><i className="bi bi-hourglass-split" aria-hidden="true"></i> Pending: <span id="counterPending">0</span></button>
      <button className="counter-badge status-filter-btn" data-status="OTHER TASK" onClick={() => window.filterByStatus && window.filterByStatus('OTHER TASK')}><i className="bi bi-card-list" aria-hidden="true"></i> Other task: <span id="counterOther">0</span></button>
      <button id="clearAllBtn" className="clear-all-btn">Clear all</button>
    </div>
  );
}

function EntryTable() {
  return (
    <div id="entryTable-wrap">
      <table id="entryTable">
        <thead>
          <tr>
            <th className="th-select"><span className="sr-only">Select</span></th>
            <th className="th-date">DATE</th>
            <th className="th-shift">SHIFT SCHEDULE</th>
            <th className="th-support">SUPPORT NAME</th>
            <th className="th-store">STORE NAME</th>
            <th className="th-mid">MID</th>
            <th className="th-merchant">MERCHANT NAME</th>
            <th className="th-contact">CONTACT #</th>
            <th className="th-issue">ISSUE</th>
            <th className="th-escalated">ESCALATED</th>
            <th className="th-status">STATUS</th>
            <th className="th-remarks">REMARKS</th>
            <th className="th-actions">ACTIONS</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  );
}

function TeamPhotoModal({ onClose }) {
  return (
    <div className="break-modal-overlay" onClick={onClose}>
      <div className="break-modal-content" style={{ maxWidth: 1040 }} onClick={(e) => e.stopPropagation()}>
        <div className="break-modal-header">
          <div>
            <h2 className="modal-title modal-title-row">
              <i className="bi bi-people-fill" aria-hidden="true"></i> Support Team
            </h2>
            <p className="modal-subtitle">Nashville credit-card support, 9 PM – 6 AM shift</p>
          </div>
          <button onClick={onClose} className="icon-close" aria-label="Close team photo" title="Close">
            <i className="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
        <div style={{ padding: 20 }}>
          <img
            src={teamPhoto}
            alt="Credit Card support team"
            style={{
              width: '100%',
              maxHeight: '70vh',
              objectFit: 'cover',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--line)'
            }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ✅ MAIN APP WRAPPER
// ==========================================

export default function App() {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBreakSchedule, setShowBreakSchedule] = useState(false);
  const [showTeamPhoto, setShowTeamPhoto] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed_creditcard') === 'true';
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed_creditcard', String(next));
      return next;
    });
  };

  useEffect(() => {
    // Expose globals so child components / controller can trigger actions
    window.openTeamPhoto = () => setShowTeamPhoto(true);
    window.switchToFormTab = () => setCurrentView('dashboard');
    window.switchToDashboardView = () => setCurrentView('dashboard');
    initCreditcardApp();
    return () => { 
      delete window.openTeamPhoto; 
      delete window.switchToFormTab;
      delete window.switchToDashboardView;
    };
  }, []);

  return (
    <>
      {/* ✅ INJECTED STYLES WITH FULL DARK MODE OVERRIDES */}
      <style>
        {`
          :root {
            --color-summarize: #673ab7;
            --color-grammar: #009688;
          }
          body.dark-mode {
            --color-summarize: #a78bfa; 
            --color-grammar: #2dd4bf;
          }
          
          .text-summarize { color: var(--color-summarize); }
          .text-grammar { color: var(--color-grammar); }

          /* MODAL TYPOGRAPHY CLASSES */
          .modal-title { margin: 0; color: var(--text-primary, #333); }
          .modal-subtitle { margin: 4px 0 0; font-size: 13px; color: var(--text-muted, #666); }
          .day-title { margin: 0; font-size: 15px; color: var(--text-primary, #333); }
          .people-count { font-size: 12px; padding: 2px 6px; border-radius: 12px; background: var(--bg-secondary, #e2e8f0); color: var(--text-muted, #666); }
          .slot-person { color: var(--text-secondary, #555); }
          .slot-time { font-weight: 500; font-family: monospace; font-size: 12.5px; color: var(--text-primary, #111); }
          .badge-today { background: var(--accent-color, #8b5cf6); color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase; }

          .is-today .day-title { color: var(--accent-color, #8b5cf6); }

          .info-box {
            background: rgba(14, 165, 233, 0.1);
            color: #0369a1;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 13px;
            margin-bottom: 24px;
            display: flex;
            gap: 10px;
            align-items: center;
          }
          body.dark-mode .info-box {
            background: rgba(56, 189, 248, 0.15);
            color: #7dd3fc;
          }

          /* --- DARK MODE SPECIFIC OVERRIDES --- */
          body.dark-mode .break-modal-content {
            background-color: var(--panel-bg, #1e293b);
            border: 1px solid var(--border-color, #334155);
          }
          body.dark-mode .break-modal-header {
            background-color: var(--panel-bg, #1e293b);
            border-bottom: 1px solid var(--border-color, #334155);
          }
          
          body.dark-mode .modal-title,
          body.dark-mode .day-title,
          body.dark-mode .slot-time {
            color: var(--text-primary, #f8fafc) !important;
          }
          body.dark-mode .modal-subtitle,
          body.dark-mode .slot-person {
            color: var(--text-muted, #cbd5e1) !important;
          }
          body.dark-mode .is-today .day-title { 
            color: var(--accent-color, #a78bfa) !important; 
          }
          body.dark-mode .badge-today {
            background: var(--accent-color, #a78bfa);
            color: #1e1e1e;
          }
          body.dark-mode .people-count {
            background: var(--bg-secondary, #334155);
            color: var(--text-muted, #cbd5e1);
          }

          body.dark-mode .pending-popover {
            background-color: var(--panel-bg, #1e293b);
            border-color: var(--border-color, #334155);
            box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.5), 0 4px 14px rgba(0, 0, 0, 0.3);
          }
          body.dark-mode .pending-popover::before {
            background-color: var(--panel-bg, #1e293b);
            border-color: var(--border-color, #334155);
          }
          body.dark-mode .pending-popover-item {
            background-color: rgba(255, 255, 255, 0.03);
            border-color: var(--border-color, #334155);
          }
          body.dark-mode .pending-popover-item:hover {
            background-color: rgba(255, 255, 255, 0.07);
          }
          body.dark-mode .pending-copy-btn {
            background-color: var(--panel-bg, #1e293b);
            border-color: var(--border-color, #334155);
            color: var(--text-muted, #cbd5e1);
          }

          @keyframes overlayFadeIn {
            from { opacity: 0; backdrop-filter: blur(0px); }
            to { opacity: 1; backdrop-filter: blur(5px); }
          }
          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .break-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background-color: rgba(15, 23, 42, 0.75);
            display: flex; align-items: center; justify-content: center;
            z-index: 99999 !important; 
            padding: 16px; box-sizing: border-box;
            animation: overlayFadeIn 0.3s ease forwards;
          }
          .break-modal-content {
            background-color: var(--panel-bg, #ffffff);
            border-radius: 16px; width: min(100%, 750px); max-width: 750px;
            max-height: 90vh; overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            position: relative; box-sizing: border-box;
            animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .break-modal-header {
            position: sticky; top: 0; background-color: var(--panel-bg, #ffffff);
            padding: 24px 24px 16px; z-index: 10;
            border-bottom: 1px solid var(--border-color, #eaeaea);
            display: flex; justify-content: space-between; align-items: flex-start;
          }
          .break-close-btn {
            background: var(--bg-tertiary, #f1f5f9); border: none; border-radius: 50%;
            width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-size: 16px; color: var(--text-secondary); transition: all 0.2s;
          }
          .break-close-btn:hover { background: #fee2e2; color: #ef4444; transform: rotate(90deg); }
          
          body.dark-mode .break-close-btn { background: var(--bg-tertiary, #334155); color: #cbd5e1; }
          body.dark-mode .break-close-btn:hover { background: #7f1d1d; color: #fca5a5; }

          .break-day-card {
            background: var(--bg-tertiary, #f8fafc);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: 12px; padding: 16px; transition: all 0.2s ease;
          }
          .break-day-card:hover { transform: translateY(-3px); box-shadow: 0 8px 16px rgba(0,0,0,0.06); border-color: var(--border-color); }
          .break-day-card.is-today { border: 2px solid var(--accent-color, #8b5cf6); background: rgba(139, 92, 246, 0.05); }
          
          body.dark-mode .break-day-card { background: var(--bg-tertiary, #0f172a); border-color: var(--border-color, #334155); }
          body.dark-mode .break-day-card.is-today { background: rgba(139, 92, 246, 0.15); border-color: var(--accent-color, #a78bfa); }

          .break-slot {
            display: flex; justify-content: space-between; align-items: center;
            padding: 8px; border-radius: 6px; transition: background-color 0.2s;
          }
          .break-slot:hover { background-color: rgba(0,0,0,0.04); }
          body.dark-mode .break-slot:hover { background-color: rgba(255,255,255,0.06); }
        `}
      </style>

      <div className={`page-shell layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Sidebar 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          onOpenTemplates={() => setShowTemplates(true)} 
          onOpenBreakSchedule={() => setShowBreakSchedule(true)} 
          currentView={currentView}
          onSelectView={setCurrentView}
        />
        <main className="main-area">
          {/* ✅ TICKETING DASHBOARD VIEW (Preserved in DOM to retain Quill, form drafts & event listeners) */}
          <div className="dashboard-view-wrapper" style={{ display: currentView === 'dashboard' ? 'flex' : 'none' }}>
            <div
              className="app-banner"
              style={{ backgroundImage: `url(${teamBanner})` }}
              role="img"
              aria-label="Credit Card support team"
            ></div>
            <Header />
            <DashboardGrid />
            <Tabs currentView={currentView} onSelectView={setCurrentView} />
            <div className="app-container">
              <div className="main-content">
                <div id="tab-creditcard" style={{ display: 'block' }}>
                  <div className="three-panels">
                    <HistoryPanel />
                    <LeftPanel />
                    <RightPanel />
                  </div>
                </div>
                <BulkBar />
                <div id="searchStatusBar" className="search-status-bar" style={{ display: 'none' }}>
                  <div className="search-status-info">
                    <i className="bi bi-search" aria-hidden="true"></i>
                    <span>
                      Showing <strong id="searchStatusCount">0</strong> ticket(s) matching <strong id="searchStatusQuery">""</strong> across all dates
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-clear-search"
                    onClick={() => window.clearGlobalSearch && window.clearGlobalSearch()}
                    title="Clear search and return to selected date"
                  >
                    <i className="bi bi-x-circle me-1" aria-hidden="true"></i> Clear search
                  </button>
                </div>
                <EntryTable />
              </div>
            </div>
          </div>

          {/* ✅ INDEPENDENT ANNOUNCEMENT PAGE (Solely announcement content, completely separate) */}
          <div style={{ display: currentView === 'announcement' ? 'block' : 'none' }}>
            <AnnouncementPage onBackToDashboard={() => setCurrentView('dashboard')} />
          </div>

          {/* ✅ INDEPENDENT SHIFT REPORT PAGE (Paste-only, Supabase shared sync) */}
          <div style={{ display: currentView === 'shift-report' ? 'block' : 'none' }}>
            <ShiftReportPage onBackToDashboard={() => setCurrentView('dashboard')} />
          </div>

          <div id="notification"></div>
        </main>
      </div>

      {/* MODALS OUTSIDE LAYOUT */}
      {showTemplates && <TidTemplatesModal onClose={() => setShowTemplates(false)} />}
      {showBreakSchedule && <BreakScheduleModal onClose={() => setShowBreakSchedule(false)} />}
      {showTeamPhoto && <TeamPhotoModal onClose={() => setShowTeamPhoto(false)} />}
    </>
  );
}