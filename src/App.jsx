import React, { useEffect, useState, useRef, useMemo } from 'react';
import { initCreditcardApp } from './creditcardController';
import hierarchyImg from './hierarchy.png';
import teamBanner from './groupcc.jpeg';
import tatiBanner from './tati2.png';
import appLogo from './logo2.png';
import ShiftReportPage from './ShiftReportPage';
import ToolsPage from './ToolsPage';
import {
  fetchReminders,
  addReminder,
  updateReminder,
  deleteReminder,
  getLocalReminders,
} from './supabaseReminders';

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
  "NEXGO": `(NEXGO)\nStorename / MID\n[Address, City State - Zipcode]\nNexgo MFE V201 DwSrsSs [NASHVILLE]\nNMID# \nTID# \nGROUP ID# 10001`,
  "PAX": `(PAX)\nStorename / MID\n[Address, City State - Zipcode]\nPAX BROADPOS [NASHVILLE]\nNMID#\nTID#\nGROUP ID# 10001`,
  "FD150": `(FD150)\nStorename / MID\n[Address, City State - Zipcode]\nFD150 [NASHVILLE] \tOR \tFD150 W/ RP10 [NASHVILLE]\n(if Terminal Close) AUTO CLOSE - 12:23AM\nNMID -\nTID# , DLID# , RESET KEY:\nAPP: 751UN150\nD/L# 855-641-1001\nD/L IP ADDR: GDSPROD.FIRSTDATA.COM`,
  "VALOR": `(VALOR)\nStorename / MID\n[Address, City State - Zipcode]\nValorPay GTW RC SRS [NASHVILLE]\nNMID#\nTID#\nGROUP ID# 10001`,
  "DEJAVOO": `(DEJAVOO)\nStorename / MID\n[Address, City State - Zipcode]\nDejavooDvCreditRC1.20 [NASHVILLE]\nNMID#\nTID#\nGROUP ID# 10001`,
  "NMI": `(NMI)\nStorename / MID\n[Address, City State - Zipcode]\nNetwork Merchants Gateway\nNMID# \nTID# \nGROUP ID# 30001`,
  "VERIFONE COMMANDER / RUBY": `(VERIFONE COMMANDER / RUBY)\nStorename / MID\n[Address, City State - Zipcode]\nEQUIPMENT: VERIFONE COMMANDER / RUBY 2 / RUBY CI\nBUYPASS ID: RB(State) (BuypassID) 001\nFD Datawire: (800) 704-4202\nFD Buypass: (800) 733-3322`,
  "GILBARCO PASSPORT": `(GILBARCO PASSPORT)\nStorename / MID\n[Address, City State - Zipcode]\nEQUIPMENT: GILBARCO PASSPORT\nBUYPASS ID: L3(State) (BuypassID) 001\nFD Datawire: (800) 704-4202\nFD Buypass: (800) 733-3322`,
  "FD150 W/ RP10 BUYPASS": `(FD150 W/ RP10 BUYPASS)\nStorename / MID\n[Address, City State - Zipcode]\nEQUIPMENT: FD150 W/ RP10 (BUYPASS)\nBUYPASS ID: KS(State) (BuypassID) 001, DLID: [CALL BUYPASS]\nFD Datawire: (800) 704-4202\nFD Buypass: (800) 733-3322`,
  "AUTH.NET": `(AUTH.NET)\nDBA Name:\nFirst Data Merchant ID Number:\n[Address, City State - Zipcode]\nNashville Short MID:\nNetwork: FDC Nashville\nManufacturer: AUTHORIZE.NET\nEquipment Name: AUTHORIZENET(G/W)\nEquipment Type: TSOL\nProduct ID: 815300\nTerminal ID:\nTerminal PW: (LAST 4 OF THE NMID) (YOU CAN SEE ALSO ON THE PROGRAMMING IN FDPOS)\nProgram ID: 000\nFD Datawire: (800) 704-4202`,
  "World Bcard RC GTW": `(World Bcard RC GTW)\nStorename / MID\n[Address, City State - Zipcode]\nWorld Bcard RC GTW [NASHVILLE]\nNMID#\nTID# 4016974\nGROUP ID# 10001`,
  "DATACAP": `(DATACAP)\n[Address, City State - Zipcode]\nDTCP NETePAY 5.05 GTW RC\nNMID#\nTID#\nGROUP ID# 10001`,
  "NCR (RADIANT SYSTEMS)": `NCR (RADIANT SYSTEMS)\nStorename / MID\n[Address, City State - Zipcode]\nEQUIPMENT: NCR (RADIANT SYSTEMS)\nBUYPASS ID: RB(State) (BuypassID) 001\nFD Datawire: (800) 704-4202\nFD Buypass: (800) 733-3322`
};

// ==========================================
// ✅ ANNOUNCEMENTS & SYSTEM CHANGELOG DATA
// ==========================================

const ANNOUNCEMENTS_DATA = [
  {
    id: "rel-2026-10-02-v21010",
    version: "v2.10.10",
    date: "October 2, 2026",
    isLatest: true,
    badge: "TODAY'S TWEAK",
    title: "PDF Generator Fidelity: Matched Original Template",
    summary: "Refined Close Account PDF typography and checkboxes to faithfully match the original template using Calibri font, removed artificial blue headers, and perfected alignment.",
    items: [
      {
        type: "ui",
        icon: "bi-file-earmark-check-fill",
        title: "Original Template Match",
        desc: "Updated PDF generator and live preview to match the original document: removed blue header, embedded genuine Calibri font, corner-to-corner checkbox markers, and refined section indents.",
        tag: "PDF Fidelity"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2109",
    version: "v2.10.9",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Clean Screen: Removed Notification Banner",
    summary: "Removed the full-width toast notification banner from the Tools page for an uncluttered and completely distraction-free workspace.",
    items: [
      {
        type: "ui",
        icon: "bi-bell-slash",
        title: "Removed Toast Banner",
        desc: "Removed the full-width green status banner from the Tools page to keep the layout clean, quiet, and streamlined.",
        tag: "UI Polish"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2108",
    version: "v2.10.8",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Tool Header Polish & Default Downloads Clarification",
    summary: "Removed the 'READY' badge from the tool selector, removed the external preview button from the document preview header, and made default downloads folder save path explicitly clear.",
    items: [
      {
        type: "ui",
        icon: "bi-check2-circle",
        title: "Clean Tool Header & Default Downloads",
        desc: "Streamlined tool badges and preview controls, and clearly confirmed that without custom folder setup, all generated PDFs save automatically into the computer's Downloads folder.",
        tag: "UI Polish"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2107",
    version: "v2.10.7",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Clean Minimalist PDF File Name Input",
    summary: "Removed the redundant PDF icon and reset button from the file name input in the Close Account generator for a clean, sleek, and professional look.",
    items: [
      {
        type: "ui",
        icon: "bi-file-earmark-text",
        title: "Clean File Name Field",
        desc: "Streamlined the PDF File Name field to a single full-width minimalist text input without cluttered icon addons or awkward reset buttons.",
        tag: "UI Polish"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2106",
    version: "v2.10.6",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "High-Contrast Input Text in Close Account Generator",
    summary: "Fixed text contrast in the Close Account generator form: reason textarea and file name inputs now render bright, sharp, highly readable text when typing in dark mode.",
    items: [
      {
        type: "bugfix",
        icon: "bi-pencil-square",
        title: "Crystal-Clear Input Text",
        desc: "Removed Bootstrap form-control color overrides and added high-contrast text color tokens so typed text and placeholders in the reason and file name fields are crisp and completely readable.",
        tag: "UI Fix"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2105",
    version: "v2.10.5",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Sleek Folder Settings Modal & Cleaned Headers",
    summary: "Refined the Save Folder Settings modal with a modern close button, concise description, polished custom action buttons, and removed unnecessary folder labels from the header.",
    items: [
      {
        type: "ui",
        icon: "bi-sliders",
        title: "Modernized Settings Modal",
        desc: "Upgraded modal close button, shortened folder explanation text, applied clean custom button styling, and removed clutter from the Tools header.",
        tag: "UI Polish"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2104",
    version: "v2.10.4",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Compact Tools & Minimalist Generator UI",
    summary: "Cleaned up the Close Account PDF Generator by compacting navigation and input fields, removing preview-in-tab/reset buttons, and refining to a single sleek Generate PDF action.",
    items: [
      {
        type: "ui",
        icon: "bi-layout-sidebar-inset",
        title: "Compact Form & Minimalist Controls",
        desc: "Optimized processor selectors, reason textarea, and file inputs for desktop view, removed redundant buttons, and simplified document generation.",
        tag: "Tools"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2103",
    version: "v2.10.3",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Clean Document PDF Preview",
    summary: "Removed browser PDF reader toolbars from the Close Account generator preview, presenting a clean continuous 2-page document stream.",
    items: [
      {
        type: "ui",
        icon: "bi-file-earmark-check",
        title: "Toolbar-Free Document Stream",
        desc: "Removed unwanted browser PDF controls and toolbars, providing a clean continuous 2-page document view with Page 1 / Page 2 quick navigation.",
        tag: "PDF Preview"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2102",
    version: "v2.10.2",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Live PDF Preview in Close Account Generator",
    summary: "Transformed the Close Account generator preview into a true PDF view with an embedded live vector PDF viewer and realistic document paper sheet view.",
    items: [
      {
        type: "feature",
        icon: "bi-file-earmark-pdf-fill",
        title: "True PDF Document Preview",
        desc: "The right-side preview now renders the actual live PDF with zoom, scrolling, and page controls, plus an interactive paper sheet mode.",
        tag: "PDF Viewer"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2101",
    version: "v2.10.1",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Streamlined Tools & PDF Generator",
    summary: "Refined the Tools workspace: removed placeholder items, simplified processor selector cards, added sleek top-right folder settings, and improved step number readability.",
    items: [
      {
        type: "ui",
        icon: "bi-layout-text-window",
        title: "Clean Generator Interface",
        desc: "Removed placeholder cards and suggestions, streamlined processor selection to clean NASHVILLE and TSYS options, and placed folder configuration in a top-right settings button.",
        tag: "Tools"
      },
      {
        type: "ui",
        icon: "bi-123",
        title: "Readable Step Numbers",
        desc: "Redesigned form step indicators with high-contrast, modern badges for effortless legibility.",
        tag: "UI Refinement"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2100",
    version: "v2.10.0",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Tools Tab & Close Account PDF Generator",
    summary: "Introduced a dedicated Tools hub under Shift Report featuring the new Close Account PDF Generator supporting TSYS and NASHVILLE workflow variants, folder output configuration, and live template preview.",
    items: [
      {
        type: "feature",
        icon: "bi-tools",
        title: "Dedicated Tools Workspace",
        desc: "Added a dedicated Tools tab to the navigation panel providing productivity utilities and PDF generators designed to streamline support workflows.",
        tag: "Tools"
      },
      {
        type: "feature",
        icon: "bi-file-earmark-pdf-fill",
        title: "Close Account PDF Generator",
        desc: "Easily generate 2-page account closure PDFs for TSYS and NASHVILLE processors with customized reason input, automatic checkbox rule mapping, live mockup preview, and custom download/save directory selection.",
        tag: "PDF Generator"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2922",
    version: "v2.9.22",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Clean Shift Report Gallery Header",
    summary: "Removed secondary instruction text under the Shift Report Attached Screenshots header.",
    items: [
      {
        type: "ui",
        icon: "bi-card-image",
        title: "Clean Gallery Header",
        desc: "Removed 'Click image to preview • Click Copy Image to paste into chat' instruction text for a clean layout.",
        tag: "Shift Report"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2921",
    version: "v2.9.21",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Compact Post Button Sizing",
    summary: "Refined the Shift Report Post button dimensions to match the adjacent Attach Image button.",
    items: [
      {
        type: "ui",
        icon: "bi-aspect-ratio",
        title: "Balanced Button Sizing",
        desc: "Decreased padding and font size of the Post button to perfectly align with secondary composer buttons.",
        tag: "Shift Report"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2920",
    version: "v2.9.20",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Simplified Shift Report Action Button",
    summary: "Shortened the Shift Report composer submit button label to 'Post'.",
    items: [
      {
        type: "ui",
        icon: "bi-send",
        title: "Concise Post Button",
        desc: "Updated the Shift Report submission button to read 'Post' for a cleaner and more compact interface.",
        tag: "Shift Report"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2919",
    version: "v2.9.19",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Updated Team Hierarchy Chart",
    summary: "Updated the Support Team Hierarchy organizational chart with the latest team roster and roles.",
    items: [
      {
        type: "improvement",
        icon: "bi-diagram-3-fill",
        title: "Latest Organization Roster",
        desc: "Loaded the updated Credit Card PH Support organizational chart graphic in the Team modal.",
        tag: "Team"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2918",
    version: "v2.9.18",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Official Shift Report Release",
    summary: "Removed the 'BETA' tag from the Shift Report navigation item, graduating it to a core official feature.",
    items: [
      {
        type: "ui",
        icon: "bi-check2-circle",
        title: "Graduated Shift Report",
        desc: "Removed the 'BETA' badge from the Shift Report sidebar tab for a cleaner, unified menu.",
        tag: "Sidebar"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2917",
    version: "v2.9.17",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Clean Announcements Header",
    summary: "Removed the 'CC Support' secondary tag from the System Announcements kicker header.",
    items: [
      {
        type: "ui",
        icon: "bi-tag",
        title: "Clean Kicker Header",
        desc: "Removed the 'CC Support' tag next to the System News & Updates pill for a clean, minimal header.",
        tag: "Announcements"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2916",
    version: "v2.9.16",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Team Header Chip Label",
    summary: "Updated the top header button to display 'Team' with the team logo.",
    items: [
      {
        type: "ui",
        icon: "bi-people",
        title: "Team Label Display",
        desc: "Set the header navigation chip label to 'Team', keeping a clean and friendly identifier next to the logo.",
        tag: "Header"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2915",
    version: "v2.9.15",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Minimal CC Team Chip Icon",
    summary: "Removed the text label from the CC Team header button, leaving a clean logo-only chip.",
    items: [
      {
        type: "ui",
        icon: "bi-person-badge",
        title: "Icon-Only CC Team Button",
        desc: "Removed the 'CC Team' text label from the top navigation bar for a cleaner, compact logo-only button.",
        tag: "Header"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2914",
    version: "v2.9.14",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Fixed-Size Team Hierarchy Modal",
    summary: "Simplified the Support Team Hierarchy modal to a clean, fixed-size layout without scrollbars or size buttons.",
    items: [
      {
        type: "improvement",
        icon: "bi-aspect-ratio",
        title: "Clean Fixed-Size Layout",
        desc: "Set a clear fixed width (1200px) so the hierarchy chart is readable with no scrollbars or awkward overflowing.",
        tag: "Team Modal"
      },
      {
        type: "ui",
        icon: "bi-slash-circle",
        title: "Streamlined Modal Header",
        desc: "Removed the zoom controls, preset size buttons, and toolbar for a clean, distraction-free view.",
        tag: "UI Clean-up"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2913",
    version: "v2.9.13",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Interactive Hierarchy Viewer & Zoom Controls",
    summary: "Significantly enlarged the CC Team hierarchy modal with zoom controls, fullscreen mode, panning, and high-resolution reading support.",
    items: [
      {
        type: "improvement",
        icon: "bi-zoom-in",
        title: "Zoom & Pan Hierarchy Viewer",
        desc: "Added interactive zoom controls (Fit, 150%, 200%, +/-) and drag-to-pan so names, extensions, and emails are crystal clear.",
        tag: "Team Modal"
      },
      {
        type: "feature",
        icon: "bi-arrows-fullscreen",
        title: "Fullscreen & Wide-view Layout",
        desc: "Expanded modal width up to 1500px with a one-click fullscreen mode for maximized reading comfort.",
        tag: "Team Modal"
      },
      {
        type: "improvement",
        icon: "bi-box-arrow-up-right",
        title: "Open Original High-Res",
        desc: "Added direct link to open the full 2560x1440 image in a new tab for native high-definition viewing.",
        tag: "Team Modal"
      }
    ]
  },
  {
    id: "rel-2026-10-02-v2912",
    version: "v2.9.12",
    date: "October 2, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "Support Team Hierarchy Chart",
    summary: "Updated CC Team modal to display the Credit Card Support organizational hierarchy chart and removed legacy shift subtitle.",
    items: [
      {
        type: "feature",
        icon: "bi-diagram-3-fill",
        title: "Credit Card Support Hierarchy Chart",
        desc: "Integrated the official organizational hierarchy chart in the CC Team modal for easy team structure reference.",
        tag: "Team"
      },
      {
        type: "ui",
        icon: "bi-layout-text-window-reverse",
        title: "Clean Team Modal Layout",
        desc: "Removed the 'Nashville credit-card support, 9 PM – 6 AM shift' subtitle from the CC Team modal for a cleaner view.",
        tag: "UI Clean-up"
      }
    ]
  },
  {
    id: "rel-2026-09-30-v2911",
    version: "v2.9.11",
    date: "September 30, 2026",
    isLatest: false,
    badge: "RELEASED",
    title: "PH Portal System & UX Updates",
    summary: "Consolidated release featuring PH Portal branding, reminder pop-ups & scrolling, cleaner stat cards, and interface clean-ups.",
    items: [
      {
        type: "improvement",
        icon: "bi-arrows-vertical",
        title: "Scrollable Reminder Description",
        desc: "Added vertical scrolling with custom themed scrollbars to the description field when creating or editing reminders.",
        tag: "Reminders"
      },
      {
        type: "ui",
        icon: "bi-card-heading",
        title: "Clean Announcement Cards",
        desc: "Removed the secondary summary text under update titles on the announcements feed.",
        tag: "Announcements"
      },
      {
        type: "ui",
        icon: "bi-textarea-t",
        title: "Clean Shift Report Textarea",
        desc: "Removed the multi-line placeholder from the shift report composer textarea for a clean input view.",
        tag: "Shift Report"
      },
      {
        type: "ui",
        icon: "bi-pencil-square",
        title: "Clean Shift Report Header",
        desc: "Simplified the composer header to 'Shift Report' and removed unnecessary instruction text.",
        tag: "Shift Report"
      },
      {
        type: "ui",
        icon: "bi-layout-text-sidebar",
        title: "Simplified Form & Feed Headers",
        desc: "Removed secondary description text under Ticket form and Credit Card History headers.",
        tag: "UI Clean-up"
      },
      {
        type: "ui",
        icon: "bi-layout-text-window-reverse",
        title: "Clean Header Branding",
        desc: "Removed the secondary subtitle under the Credit Card Support Center title in the header.",
        tag: "Header"
      },
      {
        type: "ui",
        icon: "bi-bar-chart-fill",
        title: "Clean Stat Cards",
        desc: "Removed sub-labels below stat numbers across all metric cards.",
        tag: "Dashboard"
      },
      {
        type: "ui",
        icon: "bi-tag-fill",
        title: "Branding Update to PH Portal",
        desc: "Updated sidebar logo title and text from 'Tickets' to 'PH Portal'.",
        tag: "Branding"
      },
      {
        type: "feature",
        icon: "bi-bell-fill",
        title: "New Reminder Pop-up Notification",
        desc: "Displays a clean notification pop-up whenever a new reminder is posted, showing its subject with a 'Don't show again' option.",
        tag: "Reminders"
      },
      {
        type: "feature",
        icon: "bi-search",
        title: "Inline Subject Search in Reminders",
        desc: "Permanently visible search box on the All Reminders tab allows fast keyword filtering across reminder subjects.",
        tag: "Search"
      },
      {
        type: "ui",
        icon: "bi-moon-stars-fill",
        title: "Default Dark Mode & Backdrop Blur",
        desc: "First-time visitors now default directly to dark mode, and all pop-ups feature an elegant frosted glass background blur.",
        tag: "UI / UX"
      }
    ]
  },
  {
    id: "rel-2026-09-28-v283",
    version: "v2.8.3",
    date: "September 28, 2026",
    isLatest: false,
    badge: "PREVIOUS RELEASE",
    title: "What's New?",
    summary: "Fixed mobile responsive sidebar layout so the 1 HR break card and Gemini API key panel collapse cleanly when the mobile menu is closed.",
    items: [
      {
        type: "bugfix",
        icon: "bi-layout-sidebar-inset",
        title: "Mobile Sidebar Auto-Collapse Fix",
        desc: "Fixed an issue on smaller/shrunk screens where the 1 HR Break card and Set Gemini API Key button remained visible under the header bar when navigation was closed.",
        tag: "Mobile / Responsive"
      },
      {
        type: "feature",
        icon: "bi-cloud-check-fill",
        title: "Dedicated Cloud Database for Reminders",
        desc: "Team Reminders are synced to a dedicated Supabase cloud database across devices in real time with automatic offline fallback.",
        tag: "Cloud Sync"
      }
    ]
  },
  {
    id: "rel-2026-09-28-v282",
    version: "v2.8.2",
    date: "September 28, 2026",
    isLatest: false,
    badge: "PREVIOUS RELEASE",
    title: "Dedicated Cloud Database for Reminders",
    summary: "Refined Team Reminders header design and integrated dedicated real-time Supabase cloud database.",
    items: [
      {
        type: "feature",
        icon: "bi-cloud-check-fill",
        title: "Dedicated Cloud Database for Reminders",
        desc: "Team Reminders are now synced to a dedicated Supabase cloud database. All team members see the same active reminders across devices in real time with automatic offline fallback.",
        tag: "Cloud Sync"
      },
      {
        type: "ui",
        icon: "bi-aspect-ratio",
        title: "Update Popup Frosted Backdrop Blur",
        desc: "Restored frosted glass backdrop blur exclusively to the update popup modal overlay so release announcements stand out cleanly.",
        tag: "UI / UX"
      }
    ]
  },
  {
    id: "rel-2026-09-28-v280",
    version: "v2.8.0",
    date: "September 28, 2026",
    isLatest: false,
    badge: "PREVIOUS RELEASE",
    title: "Frosted Blur Update Modal & Appreciation Header",
    summary: "Added frosted background blur exclusively to the update notification popup, refined transparent glass dashboard panels, and updated appreciation slideshow header.",
    items: [
      {
        type: "ui",
        icon: "bi-aspect-ratio",
        title: "Update Popup Frosted Backdrop Blur",
        desc: "Restored frosted glass backdrop blur exclusively to the update popup modal overlay so release announcements stand out cleanly, while keeping dashboard boxes completely transparent.",
        tag: "UI / UX"
      },
      {
        type: "ui",
        icon: "bi-layers-fill",
        title: "Transparent Glass Dashboard",
        desc: "Dashboard containers, form panels, metrics cards, table, and sidebar maintain pure transparent glassmorphism matching the Announcements tab.",
        tag: "UI / UX"
      },
      {
        type: "feature",
        icon: "bi-images",
        title: "New Header Appreciation Banner",
        desc: "Updated the header slideshow with coworker appreciation banner slide.",
        tag: "Visual"
      }
    ]
  },
  {
    id: "rel-2026-09-28-v276",
    version: "v2.7.6",
    date: "September 28, 2026",
    isLatest: false,
    badge: "PREVIOUS RELEASE",
    title: "Transparent Glass & Button Contrast",
    summary: "Refined dashboard boxes to full transparency matching Announcements, updated header banner with coworker appreciation slide, and restored high-contrast button styling.",
    items: [
      {
        type: "ui",
        icon: "bi-layers-fill",
        title: "Transparent Glass Dashboard",
        desc: "Removed background blur from all dashboard containers, form panels, metrics cards, table, and sidebar for an ultra-clean transparent glassmorphism look matching the Announcements tab.",
        tag: "UI / UX"
      },
      {
        type: "feature",
        icon: "bi-images",
        title: "New Header Appreciation Banner",
        desc: "Updated the header slideshow with coworker appreciation banner slide.",
        tag: "Visual"
      },
      {
        type: "ui",
        icon: "bi-cursor-fill",
        title: "+ New Ticket Button Contrast",
        desc: "Restored bold, high-contrast text styling for the active '+ New Ticket' button across both dark and light modes.",
        tag: "UI / UX"
      }
    ]
  },
  {
    id: "rel-2026-09-26-v275",
    version: "v2.7.5",
    date: "September 26, 2026",
    isLatest: false,
    badge: "PREVIOUS RELEASE",
    title: "What's New?",
    summary: "Introducing an automatic blurred-backdrop Update Notification popup when opening the website so the team is always notified of new updates.",
    items: [
      {
        type: "feature",
        icon: "bi-bell-fill",
        title: "Daily / New Update Notification Popup",
        desc: "When team members open the website for the first time in a day or whenever a new version is released, an update modal appears with a frosted background blur, showcasing the version number and key highlights. Includes a 'Do not show again' option and 'OK, got it' confirmation.",
        tag: "System Alert"
      },
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
    id: "rel-2026-09-26",
    version: "v2.7.1",
    date: "September 26, 2026",
    isLatest: false,
    badge: "PREVIOUS RELEASE",
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

function UpdateNotificationModal({ onConfirm, onViewAnnouncements }) {
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const latestAnnouncement = ANNOUNCEMENTS_DATA[0] || {};
  const version = latestAnnouncement.version || 'v2.10.10';
  const title = latestAnnouncement.title || 'System Update';
  const date = latestAnnouncement.date || 'September 30, 2026';
  const items = latestAnnouncement.items || [];

  return (
    <div className="update-modal-overlay">
      <div className="update-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="update-modal-header">
          <div className="update-header-info">
            <div className="update-header-tags">
              <div className="update-header-left-meta">
                <span className="update-version-chip">{version}</span>
                <span className="update-date-text">{date}</span>
              </div>
              <span className="update-pill-badge">
                <i className="bi bi-stars"></i> {latestAnnouncement.badge || "TODAY'S RELEASE"}
              </span>
            </div>
            <h3 className="update-title">{title}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="update-modal-body">
          {items.length > 0 && (
            <div className="update-highlights-list">
              {items.map((item, idx) => (
                <div key={idx} className="update-highlight-item" style={{ alignItems: 'center' }}>
                  <div className="update-highlight-icon-box">
                    <i className={`bi ${item.icon || 'bi-check-circle-fill'}`}></i>
                  </div>
                  <div className="update-highlight-content">
                    <div className="update-highlight-header-row" style={{ marginBottom: 0 }}>
                      <span className="update-highlight-title">{item.title}</span>
                      {item.tag && <span className="update-highlight-tag">{item.tag}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="update-view-all-link"
            onClick={onViewAnnouncements}
          >
            <i className="bi bi-journal-text me-1"></i> View full details
          </button>
        </div>

        {/* Footer */}
        <div className="update-modal-footer">
          <label className="update-checkbox-label">
            <input
              type="checkbox"
              checked={doNotShowAgain}
              onChange={(e) => setDoNotShowAgain(e.target.checked)}
            />
            <span>Don’t show again</span>
          </label>

          <button
            type="button"
            className="btn-update-ok"
            onClick={() => onConfirm(doNotShowAgain)}
          >
            <i className="bi bi-check-lg"></i> OK, got it
          </button>
        </div>
      </div>
    </div>
  );
}

function formatReminderDate(isoString) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}

function NewReminderNotificationModal({ reminder, onConfirm }) {
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  if (!reminder) return null;

  const dateStr = formatReminderDate(reminder.createdAt);

  return (
    <div className="update-modal-overlay" onClick={() => onConfirm(doNotShowAgain)}>
      <div 
        className="update-modal-card reminder-popup-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-popup-title"
      >
        {/* Header */}
        <div className="update-modal-header reminder-popup-header">
          <div className="update-header-info">
            <div className="update-header-tags">
              <div className="update-header-left-meta">
                <span className="reminder-popup-pill">
                  <i className="bi bi-bell me-1" aria-hidden="true"></i> Notice
                </span>
                {dateStr && (
                  <span className="update-date-text">
                    <i className="bi bi-clock me-1" aria-hidden="true"></i> {dateStr}
                  </span>
                )}
              </div>
            </div>
            <h3 id="reminder-popup-title" className="update-title" style={{ fontSize: '1.16rem', margin: '4px 0 0' }}>
              New Reminder Added
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="update-modal-body">
          <p className="update-summary-text" style={{ color: 'var(--text-muted)' }}>
            A new team reminder has been posted. Please review the subject below:
          </p>

          <div className="reminder-popup-subject-card">
            <div className="reminder-popup-subject-header">
              <span className="reminder-popup-subject-label">
                <i className="bi bi-pin-angle-fill me-1" aria-hidden="true"></i> Reminder Subject
              </span>
              {reminder.isImportant && (
                <span className="reminder-popup-important-tag">Important</span>
              )}
            </div>
            <div className="reminder-popup-subject-text">
              {reminder.subject}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="update-modal-footer reminder-popup-footer">
          <label className="update-checkbox-label">
            <input
              type="checkbox"
              checked={doNotShowAgain}
              onChange={(e) => setDoNotShowAgain(e.target.checked)}
            />
            <span>Don’t show again</span>
          </label>

          <button
            type="button"
            className="btn-reminder-popup-ok"
            onClick={() => onConfirm(doNotShowAgain)}
          >
            <i className="bi bi-check-lg" aria-hidden="true"></i> OK, Got It
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const currentVersion = ANNOUNCEMENTS_DATA[0]?.version || 'v2.9.17';

  return (
    <div className="announcement-page">
      <div className="announcement-page-header">
        <div>
          <div className="announcement-kicker">
            <span className="kicker-pill"><i className="bi bi-broadcast me-1" aria-hidden="true"></i> System News & Updates</span>
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
          <span className="announcement-stat-val">{currentVersion}</span>
        </div>
        <div className="announcement-stat-box">
          <span className="announcement-stat-label">Latest Release</span>
          <span className="announcement-stat-val">Sep 28, 2026</span>
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

  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem('theme_creditcard');
    return saved !== 'light';
  });

  const toggleTheme = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme_creditcard', isDark ? 'dark' : 'light');
    setIsDarkTheme(isDark);
  };

  const handleNavAction = (action) => {
    if (typeof action === 'function') action();
    if (isMobileView) setIsMobileNavOpen(false);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'is-collapsed' : ''} ${isMobileView && isMobileNavOpen ? 'mobile-open' : ''}`} aria-label="Primary navigation">
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
          <div className="logo" title="PH Portal v2.10.10">
            <img src={appLogo} alt="Logo" className="sidebar-logo-img" />
            <div className="logo-content">
              <span className="logo-text">PH Portal</span>
              <span className="logo-version">v2.10.10</span>
            </div>
          </div>
          <div className="sidebar-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={isDarkTheme ? "Switch to light mode" : "Switch to dark mode"}
              title={isDarkTheme ? "Switch to light mode" : "Switch to dark mode"}
            >
              <i className={`bi ${isDarkTheme ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`} aria-hidden="true"></i>
            </button>
            {isMobileView && (
              <button
                type="button"
                className="sidebar-toggle"
                onClick={() => setIsMobileNavOpen((prev) => !prev)}
                aria-label={isMobileNavOpen ? "Close navigation" : "Open navigation"}
                title={isMobileNavOpen ? "Close navigation" : "Open navigation"}
              >
                <i className={`bi ${isMobileNavOpen ? 'bi-x-lg' : 'bi-list'}`} aria-hidden="true"></i>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible content on mobile: Nav, Break Card, User foot, Gemini Key */}
        <div className={`sidebar-collapse-content ${isMobileView && !isMobileNavOpen ? 'is-closed' : 'is-open'}`}>
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
            </button>

            {/* Tools Tab */}
            <button 
              id="nav-tools"
              className={`nav-item ${currentView === 'tools' ? 'active' : ''}`}
              onClick={() => handleNavAction(() => {
                onSelectView && onSelectView('tools');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              })}
              aria-current={currentView === 'tools' ? 'page' : undefined}
              title="Tools"
            >
              <i className="bi bi-tools me-1" aria-hidden="true"></i>
              <span className="nav-text">Tools</span>
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
          ) : null}
        </div>
        <button
          className="team-chip"
          onClick={() => window.openTeamPhoto && window.openTeamPhoto()}
          title="View team hierarchy"
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

      <button 
        id="tabBtn-tools" 
        className={`tab-btn ${currentView === 'tools' ? 'active' : ''}`} 
        onClick={() => {
          onSelectView && onSelectView('tools');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        title="Open Tools & Utilities"
      >
        <i className="bi bi-tools me-1" aria-hidden="true"></i> TOOLS
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
    <div className="break-modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <div
        className="break-modal-content"
        style={{
          width: 'min(95vw, 1200px)',
          maxWidth: '1200px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="break-modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 className="modal-title modal-title-row" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '1.15rem' }}>
              <i className="bi bi-diagram-3-fill" style={{ color: 'var(--accent)' }} aria-hidden="true"></i> Support Team Hierarchy
            </h2>
          </div>
          <button onClick={onClose} className="icon-close" aria-label="Close team hierarchy" title="Close">
            <i className="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
        <div style={{ padding: '16px 20px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img
            src={hierarchyImg}
            alt="Credit Card PH Team Hierarchy"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow-sm)'
            }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}

function AppBanner() {
  const slides = [
    {
      id: 'group',
      src: teamBanner,
      alt: 'Credit Card support team',
      position: 'center top'
    },
    {
      id: 'appreciation',
      src: tatiBanner,
      alt: 'Appreciation message for coworker',
      position: 'center center'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  return (
    <div
      className="app-banner"
      role="region"
      aria-label="Support team header slideshow"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`app-banner-slide ${index === currentIndex ? 'active' : ''}`}
          style={{
            backgroundImage: `url(${slide.src})`,
            backgroundPosition: slide.position
          }}
          role="img"
          aria-label={slide.alt}
          aria-hidden={index !== currentIndex}
        />
      ))}

      {/* Slide Navigation Indicators */}
      <div className="app-banner-dots" role="tablist" aria-label="Slideshow controls">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={`app-banner-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(index);
            }}
            aria-label={`Go to slide ${index + 1}: ${slide.alt}`}
            title={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ==========================================
// REMINDER BAR & MODAL
// ==========================================

const REMINDERS_STORAGE_KEY = 'team_reminders_creditcard';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const isReminderInSlideshow = (reminder) => {
  if (!reminder) return false;
  if (reminder.removedFromSlideshow) return false;
  if (reminder.isImportant) return true;
  if (!reminder.createdAt) return true;
  const createdTime = new Date(reminder.createdAt).getTime();
  if (isNaN(createdTime)) return true;
  return Date.now() - createdTime <= SEVEN_DAYS_MS;
};

function ReminderBar({ reminders = [], onOpenModal }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Only show reminders in the slideshow that are important or within the 7-day window and not removed
  const activeReminders = useMemo(() => {
    return reminders.filter(isReminderInSlideshow);
  }, [reminders]);

  // Keep index within bounds if activeReminders list changes
  useEffect(() => {
    if (activeReminders.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= activeReminders.length) {
      setCurrentIndex(activeReminders.length - 1);
    }
  }, [activeReminders.length, currentIndex]);

  // Slideshow interval: 10 seconds per reminder
  useEffect(() => {
    if (activeReminders.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeReminders.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeReminders.length, isPaused]);

  const handlePrev = (e) => {
    e.stopPropagation();
    if (activeReminders.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + activeReminders.length) % activeReminders.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (activeReminders.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % activeReminders.length);
  };

  const currentReminder = activeReminders[currentIndex];

  return (
    <div
      className="reminder-bar"
      role="region"
      aria-label="Team Reminders Bar"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="reminder-icon-box" title="Team Reminder">
        <i className="bi bi-bell-fill reminder-bell-icon" aria-hidden="true"></i>
      </div>

      <div className="reminder-content">
        {!currentReminder ? (
          <div
            className="reminder-empty-state"
            onClick={() => onOpenModal('all', null, null, 'view_reminders')}
            title="Click to view reminders"
          >
            <span className="reminder-empty-title">Team Reminders</span>
            <p className="reminder-empty-desc">
              {reminders.length > 0
                ? 'No active reminders in slideshow. Click to view all reminders or add a new one.'
                : 'No reminders yet. Click to view or add a new reminder for the team.'}
            </p>
          </div>
        ) : (
          (() => {
            const rawDesc = currentReminder.description || '';
            const cleanPreviewText = rawDesc.replace(/\s+/g, ' ').trim();
            const isLongText = rawDesc.length > 120 || rawDesc.includes('\n');

            return (
              <div
                key={currentReminder.id || currentIndex}
                className="reminder-slide-item"
                onClick={() => onOpenModal('all', null, currentReminder, 'slide')}
                title="Click to view full details"
              >
                <div className="reminder-header-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
                    <h4 className="reminder-title">{currentReminder.subject}</h4>
                    {currentReminder.isImportant && (
                      <span className="reminder-tag-important">
                        <i className="bi bi-star-fill me-1" aria-hidden="true"></i> Important
                      </span>
                    )}
                  </div>
                  {activeReminders.length > 1 && (
                    <span className="reminder-counter-tag">
                      {currentIndex + 1} of {activeReminders.length}
                    </span>
                  )}
                </div>
                <div className="reminder-desc-preview-wrap">
                  <p className="reminder-desc-text">{cleanPreviewText}</p>
                  {isLongText && (
                    <button
                      type="button"
                      className="reminder-view-details-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenModal('all', null, currentReminder, 'slide');
                      }}
                      title="View full reminder details"
                    >
                      <span>View Details</span>
                      <i className="bi bi-arrow-right" aria-hidden="true"></i>
                    </button>
                  )}
                </div>
              </div>
            );
          })()
        )}
      </div>

      <div className="reminder-actions-right">
        {activeReminders.length > 1 && (
          <div className="reminder-nav-group">
            <button
              type="button"
              className="reminder-nav-btn"
              onClick={handlePrev}
              title="Previous reminder"
              aria-label="Previous reminder"
            >
              <i className="bi bi-chevron-left" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              className="reminder-nav-btn"
              onClick={handleNext}
              title="Next reminder"
              aria-label="Next reminder"
            >
              <i className="bi bi-chevron-right" aria-hidden="true"></i>
            </button>
          </div>
        )}
        <button
          type="button"
          className="btn-add-reminder btn-view-reminders"
          onClick={() => onOpenModal('all', null, null, 'view_reminders')}
          title="View all team reminders"
        >
          <i className="bi bi-eye" aria-hidden="true"></i>
          <span>View Reminders</span>
        </button>
      </div>
    </div>
  );
}

function ReminderModal({
  onClose,
  reminders,
  onSave,
  onDelete,
  onToggleSlideshow,
  onRefreshReminders,
  isSyncing = false,
  initialTab = 'all',
  editingReminder = null,
  initialViewingReminder = null,
  modalSource = 'view_reminders',
  onClearEditing
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentEditItem, setCurrentEditItem] = useState(editingReminder);
  const [viewingReminder, setViewingReminder] = useState(initialViewingReminder);
  const [currentModalSource, setCurrentModalSource] = useState(modalSource);
  const [subject, setSubject] = useState(editingReminder?.subject || '');
  const [description, setDescription] = useState(editingReminder?.description || '');
  const [isImportant, setIsImportant] = useState(editingReminder?.isImportant || false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReminders = useMemo(() => {
    if (!searchQuery.trim()) return reminders;
    const q = searchQuery.toLowerCase().trim();
    return reminders.filter((r) => (r.subject || '').toLowerCase().includes(q));
  }, [reminders, searchQuery]);

  useEffect(() => {
    setCurrentModalSource(modalSource);
  }, [modalSource]);

  useEffect(() => {
    if (editingReminder) {
      setCurrentEditItem(editingReminder);
      setSubject(editingReminder.subject || '');
      setDescription(editingReminder.description || '');
      setIsImportant(Boolean(editingReminder.isImportant));
      setViewingReminder(null);
      setActiveTab('add');
    }
  }, [editingReminder]);

  useEffect(() => {
    if (initialViewingReminder) {
      setViewingReminder(initialViewingReminder);
      setActiveTab('all');
    }
  }, [initialViewingReminder]);

  const handleStartEdit = (reminder) => {
    setCurrentEditItem(reminder);
    setSubject(reminder.subject || '');
    setDescription(reminder.description || '');
    setIsImportant(Boolean(reminder.isImportant));
    setErrorMessage('');
    setViewingReminder(null);
    setActiveTab('add');
  };

  const handleCancelEdit = () => {
    setCurrentEditItem(null);
    setSubject('');
    setDescription('');
    setIsImportant(false);
    setErrorMessage('');
    if (onClearEditing) onClearEditing();
    setActiveTab('all');
  };

  const handleRemoveFromSlideshow = (id) => {
    if (onToggleSlideshow) onToggleSlideshow(id, true);
    setViewingReminder((prev) => (prev && prev.id === id ? { ...prev, removedFromSlideshow: true } : prev));
  };

  const handleRestoreToSlideshow = (id) => {
    if (onToggleSlideshow) onToggleSlideshow(id, false);
    setViewingReminder((prev) => (prev && prev.id === id ? { ...prev, removedFromSlideshow: false } : prev));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setErrorMessage('Please enter a subject.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please enter a description.');
      return;
    }

    onSave(
      {
        subject: subject.trim(),
        description: description.trim(),
        isImportant: Boolean(isImportant)
      },
      currentEditItem ? currentEditItem.id : null
    );

    setCurrentEditItem(null);
    setSubject('');
    setDescription('');
    setIsImportant(false);
    setErrorMessage('');
    if (onClearEditing) onClearEditing();
    setViewingReminder(null);
    setCurrentModalSource('view_reminders');
    setActiveTab('all');
  };

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // Top header is hidden in Full View, and only shown on + Add Reminder if opened via View Reminders
  const showTopHeader = viewingReminder
    ? false
    : activeTab === 'all' && !currentEditItem
      ? true
      : currentModalSource === 'view_reminders';

  const handleOverlayClick = () => {
    // You cannot close via blur background when in + add reminder tab or editing
    if (activeTab === 'add' || currentEditItem) {
      return;
    }
    // In Full View (or list view), click blur background to back / close
    onClose();
  };

  return (
    <div
      className="break-modal-overlay"
      onClick={handleOverlayClick}
      style={{ cursor: activeTab === 'add' || currentEditItem ? 'default' : 'pointer' }}
    >
      <div
        className="break-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 680, padding: 24, cursor: 'default' }}
      >
        {/* Top Header Section */}
        {showTopHeader && (
          <div className="break-modal-header" style={{ padding: '0 0 16px', marginBottom: 16 }}>
            <div>
              <h2 className="modal-title modal-title-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-bell-fill" style={{ color: '#f59e0b' }} aria-hidden="true"></i> Team Reminders
              </h2>
              <p className="modal-subtitle">Share important notices and announcements with the entire team in real time</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {onRefreshReminders && (
                <button
                  type="button"
                  className="feed-refresh-btn"
                  onClick={onRefreshReminders}
                  title="Sync / Refresh reminders from cloud"
                  style={{ width: 34, height: 34 }}
                >
                  <i className={`bi bi-arrow-clockwise ${isSyncing ? 'spin-anim' : ''}`}></i>
                </button>
              )}
              <button onClick={onClose} className="break-close-btn" aria-label="Close reminders modal" title="Close">
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        )}

        {/* Tab Headers (Only shown when opened via "View Reminders" and not viewing reminder details) */}
        {currentModalSource !== 'slide' && !viewingReminder && (
          <div className="reminder-modal-tabs-bar">
            <div className="reminder-modal-tabs" role="tablist">
              <button
                type="button"
                className={`reminder-modal-tab ${activeTab === 'all' && !currentEditItem ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('all');
                  setViewingReminder(null);
                  if (currentEditItem) handleCancelEdit();
                }}
                role="tab"
                aria-selected={activeTab === 'all' && !currentEditItem}
              >
                <i className="bi bi-collection" aria-hidden="true"></i>
                <span>All Reminders ({searchQuery.trim() ? `${filteredReminders.length}/${reminders.length}` : reminders.length})</span>
              </button>
            </div>

            <div className="reminder-modal-tabs-actions">
              {activeTab !== 'add' && !currentEditItem && (
                <>
                  <div className="reminder-inline-search-box">
                    <i className="bi bi-search reminder-inline-search-icon" aria-hidden="true"></i>
                    <input
                      type="text"
                      className="reminder-inline-search-input"
                      placeholder="Search subject..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setSearchQuery('');
                        }
                      }}
                      aria-label="Search reminder subjects"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="reminder-inline-search-clear"
                        onClick={() => setSearchQuery('')}
                        title="Clear search"
                        aria-label="Clear search"
                      >
                        <i className="bi bi-x-circle-fill" aria-hidden="true"></i>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-add-reminder btn-plus-only"
                    onClick={() => {
                      if (currentEditItem) handleCancelEdit();
                      setActiveTab('add');
                      setViewingReminder(null);
                    }}
                    title="Add a new reminder"
                    aria-label="Add reminder"
                  >
                    <i className="bi bi-plus-lg" aria-hidden="true"></i>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Dedicated header when in slide mode and creating/editing a reminder */}
        {currentModalSource === 'slide' && (activeTab === 'add' || currentEditItem) && (
          <div className="break-modal-header" style={{ padding: '0 0 16px', marginBottom: 16 }}>
            <h2 className="modal-title modal-title-row" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '1.1rem' }}>
              <i className="bi bi-plus-circle" style={{ color: '#d97706' }} aria-hidden="true"></i> {currentEditItem ? 'Edit Reminder' : 'Add Reminder'}
            </h2>
            <button onClick={onClose} className="break-close-btn" aria-label="Close reminders modal" title="Close">
              <i className="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          </div>
        )}

        {/* Tab 1: All Reminders List & Full Detail View */}
        {activeTab === 'all' && !currentEditItem && (
          <div>
            {viewingReminder ? (
              /* Full Reminder View (Subject and multiline Description) */
              <div className="reminder-full-detail-view">
                <div
                  className="reminder-detail-header-bar"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}
                >
                  {currentModalSource === 'slide' ? (
                    <button
                      type="button"
                      className="btn-add-reminder"
                      onClick={() => {
                        setActiveTab('add');
                      }}
                      title="Add a new reminder"
                    >
                      <i className="bi bi-plus-lg" aria-hidden="true"></i>
                      <span>Reminder</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-reminder-back"
                      onClick={() => setViewingReminder(null)}
                      title="Back to reminders list"
                    >
                      <i className="bi bi-arrow-left" aria-hidden="true"></i>
                      <span>Back</span>
                    </button>
                  )}

                  <div className="reminder-detail-quick-actions" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      className="btn-reminder-action"
                      onClick={() => handleStartEdit(viewingReminder)}
                      title="Edit this reminder"
                      aria-label="Edit reminder"
                    >
                      <i className="bi bi-pencil" aria-hidden="true"></i>
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="btn-reminder-action danger"
                      onClick={() => {
                        if (window.confirm(`Delete reminder "${viewingReminder.subject}"?`)) {
                          onDelete(viewingReminder.id);
                          setViewingReminder(null);
                          if (currentModalSource === 'slide') onClose();
                        }
                      }}
                      title="Delete this reminder"
                      aria-label="Delete reminder"
                    >
                      <i className="bi bi-trash3" aria-hidden="true"></i>
                      <span>Delete</span>
                    </button>
                    <button
                      onClick={onClose}
                      className="break-close-btn"
                      aria-label="Close reminder modal"
                      title="Close"
                      style={{ marginLeft: 4 }}
                    >
                      <i className="bi bi-x-lg" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>

                <div className="reminder-detail-content-card">
                  <div className="reminder-detail-title-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h3 className="reminder-detail-subject">{viewingReminder.subject}</h3>
                      {viewingReminder.isImportant ? (
                        <span className="reminder-tag-important">
                          <i className="bi bi-star-fill me-1" aria-hidden="true"></i> Important
                        </span>
                      ) : (
                        <span className="reminder-tag-standard">
                          <i className="bi bi-clock me-1" aria-hidden="true"></i> 7 Days
                        </span>
                      )}
                    </div>
                    {viewingReminder.createdAt && (
                      <span className="reminder-detail-date">
                        <i className="bi bi-clock me-1" aria-hidden="true"></i>
                        {formatDate(viewingReminder.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="reminder-detail-divider"></div>

                  <div className="reminder-detail-body">
                    {viewingReminder.description}
                  </div>
                </div>

                {/* Bottom Footer Section: Remove / Restore Slideshow */}
                <div className="reminder-detail-footer">
                  <div className="reminder-detail-status-info">
                    {isReminderInSlideshow(viewingReminder) ? (
                      <span className="reminder-status-text in-slideshow">
                        <i className="bi bi-broadcast me-1" aria-hidden="true"></i>
                        {viewingReminder.isImportant ? 'Permanent' : 'Expiration after 7 days'}
                      </span>
                    ) : (
                      <span className="reminder-status-text off-slideshow">
                        <i className="bi bi-eye-slash me-1" aria-hidden="true"></i>
                        {viewingReminder.removedFromSlideshow
                          ? 'Manually removed from Dashboard slideshow'
                          : 'Expired from Dashboard slideshow (available in All Reminders)'}
                      </span>
                    )}
                  </div>

                  <div className="reminder-detail-footer-actions">
                    {isReminderInSlideshow(viewingReminder) ? (
                      <button
                        type="button"
                        className="btn-remove-slideshow"
                        onClick={() => handleRemoveFromSlideshow(viewingReminder.id)}
                        title="Remove this reminder from the Dashboard slideshow"
                      >
                        <i className="bi bi-eye-slash" aria-hidden="true"></i>
                        <span>Remove from Slideshow</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-restore-slideshow"
                        onClick={() => handleRestoreToSlideshow(viewingReminder.id)}
                        title="Restore this reminder to the Dashboard slideshow"
                      >
                        <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                        <span>Restore to Slideshow</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {reminders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                    <i className="bi bi-clipboard-x" style={{ fontSize: '2.4rem', opacity: 0.6, display: 'block', marginBottom: 12 }}></i>
                    <p style={{ margin: '0 0 16px', fontSize: '0.92rem' }}>No reminders yet. Add a new reminder for the team.</p>
                    <button
                      type="button"
                      className="btn-add-reminder"
                      onClick={() => setActiveTab('add')}
                    >
                      <i className="bi bi-plus-lg" aria-hidden="true"></i> Add Reminder
                    </button>
                  </div>
                ) : filteredReminders.length === 0 ? (
                  <div className="reminder-empty-search-state">
                    <i className="bi bi-search reminder-empty-search-icon" aria-hidden="true"></i>
                    <p className="reminder-empty-search-text">
                      No reminders match "<strong>{searchQuery}</strong>" in the subject
                    </p>
                    <button
                      type="button"
                      className="btn-clear-reminder-search"
                      onClick={() => setSearchQuery('')}
                    >
                      <i className="bi bi-x-lg me-1" aria-hidden="true"></i> Clear search
                    </button>
                  </div>
                ) : (
                  /* All Reminders List: Only display the Subject of each reminder */
                  <div className="reminder-cards-list">
                    {filteredReminders.map((reminder) => (
                      <div key={reminder.id} className="reminder-card-item">
                        <div className="reminder-card-main-info">
                          <div className="reminder-card-title-group" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <i className="bi bi-pin-angle-fill reminder-pin-icon" aria-hidden="true"></i>
                            <h4
                              className="reminder-card-subject"
                              onClick={() => setViewingReminder(reminder)}
                              style={{ cursor: 'pointer' }}
                              title="Click to view details"
                            >
                              {reminder.subject}
                            </h4>
                            {reminder.isImportant ? (
                              <span className="reminder-tag-important">
                                <i className="bi bi-star-fill me-1" aria-hidden="true"></i> Important
                              </span>
                            ) : (
                              <span className="reminder-tag-standard">
                                <i className="bi bi-clock me-1" aria-hidden="true"></i> 7 Days
                              </span>
                            )}
                            {reminder.removedFromSlideshow ? (
                              <span className="reminder-tag-removed" title="Manually removed from Dashboard slideshow">
                                Off Slideshow
                              </span>
                            ) : !isReminderInSlideshow(reminder) ? (
                              <span className="reminder-tag-expired" title="Expired from Dashboard slideshow after 7 days">
                                Slideshow Expired
                              </span>
                            ) : null}
                          </div>
                          {reminder.createdAt && (
                            <span className="reminder-card-date">{formatDate(reminder.createdAt)}</span>
                          )}
                        </div>

                        <div className="reminder-card-actions">
                          <button
                            type="button"
                            className="btn-reminder-action primary-view"
                            onClick={() => setViewingReminder(reminder)}
                            title="View full reminder details"
                          >
                            <i className="bi bi-eye" aria-hidden="true"></i> View Details
                          </button>
                          <button
                            type="button"
                            className="btn-reminder-action icon-only"
                            onClick={() => handleStartEdit(reminder)}
                            title="Edit this reminder"
                            aria-label="Edit reminder"
                          >
                            <i className="bi bi-pencil" aria-hidden="true"></i>
                          </button>
                          <button
                            type="button"
                            className="btn-reminder-action danger icon-only"
                            onClick={() => {
                              if (window.confirm(`Delete reminder "${reminder.subject}"?`)) {
                                onDelete(reminder.id);
                              }
                            }}
                            title="Delete this reminder"
                            aria-label="Delete reminder"
                          >
                            <i className="bi bi-trash3" aria-hidden="true"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Add / Edit Form */}
        {(activeTab === 'add' || currentEditItem) && (
          <form onSubmit={handleSubmit}>
            {errorMessage && (
              <div style={{ padding: '8px 12px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 6, fontSize: '0.84rem', marginBottom: 14 }}>
                <i className="bi bi-exclamation-triangle-fill me-1"></i> {errorMessage}
              </div>
            )}
            <div className="reminder-form-group">
              <label className="reminder-form-label" htmlFor="reminder-subject-input">
                Subject *
              </label>
              <input
                id="reminder-subject-input"
                type="text"
                className="reminder-form-input"
                placeholder="e.g., Scheduled Maintenance, Break Schedule Changes, Support Notice"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
                required
                autoFocus
              />
            </div>
            <div className="reminder-form-group">
              <label className="reminder-form-label" htmlFor="reminder-description-input">
                Description *
              </label>
              <textarea
                id="reminder-description-input"
                className="reminder-form-textarea"
                rows={5}
                placeholder="Enter details, instructions, or notes for the team..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="reminder-form-group">
              <label className="reminder-form-label">Duration</label>
              <div className="reminder-type-selector">
                <label className={`reminder-type-option ${!isImportant ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="reminder-importance"
                    value="standard"
                    checked={!isImportant}
                    onChange={() => setIsImportant(false)}
                    className="reminder-type-radio"
                  />
                  <span className="reminder-type-label">
                    <i className="bi bi-clock-history me-1" aria-hidden="true"></i> 7 days
                  </span>
                </label>

                <label className={`reminder-type-option ${isImportant ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="reminder-importance"
                    value="important"
                    checked={isImportant}
                    onChange={() => setIsImportant(true)}
                    className="reminder-type-radio"
                  />
                  <span className="reminder-type-label">
                    <i className="bi bi-star-fill me-1" style={{ color: isImportant ? '#f59e0b' : 'inherit' }} aria-hidden="true"></i> Important
                  </span>
                </label>
              </div>
            </div>
            <div className="reminder-form-actions">
              {currentEditItem ? (
                <button
                  type="button"
                  className="btn-reminder-action"
                  onClick={handleCancelEdit}
                >
                  Cancel Edit
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-reminder-action"
                  onClick={() => {
                    setActiveTab('all');
                    setViewingReminder(currentModalSource === 'slide' ? (initialViewingReminder || viewingReminder) : null);
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn-add-reminder"
                style={{ padding: '8px 20px', fontSize: '0.88rem' }}
              >
                <i className={`bi ${currentEditItem ? 'bi-check-lg' : 'bi-plus-lg'}`} aria-hidden="true"></i>
                <span>{currentEditItem ? 'Save Changes' : 'Add Reminder'}</span>
              </button>
            </div>
          </form>
        )}
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

  // Team Reminders state (cached in localStorage, synced in real-time to Supabase)
  const [reminders, setReminders] = useState(() => {
    return getLocalReminders();
  });
  const [isSyncingReminders, setIsSyncingReminders] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderModalTab, setReminderModalTab] = useState('all');
  const [editingReminder, setEditingReminder] = useState(null);
  const [viewingReminder, setViewingReminder] = useState(null);
  const [reminderModalSource, setReminderModalSource] = useState('view_reminders');

  const [newReminderNotification, setNewReminderNotification] = useState(null);

  const checkForNewReminderNotification = (reminderList) => {
    if (!reminderList || reminderList.length === 0) return;
    try {
      const sorted = [...reminderList].sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      const latest = sorted[0];
      if (!latest || !latest.id) return;

      const lastSeenId = localStorage.getItem('last_seen_reminder_id');
      const isDismissed = localStorage.getItem(`dismissed_reminder_pop_${latest.id}`) === 'true';

      if (lastSeenId !== latest.id && !isDismissed) {
        setNewReminderNotification(latest);
      }
    } catch (e) {
      console.error('Error checking for new reminder notification:', e);
    }
  };

  // Load reminders from dedicated Supabase database on mount & on demand
  const loadRemindersFromDb = async () => {
    setIsSyncingReminders(true);
    try {
      const res = await fetchReminders();
      if (res && res.reminders) {
        setReminders(res.reminders);
        checkForNewReminderNotification(res.reminders);
      }
    } catch (e) {
      console.error('Failed to sync reminders from Supabase:', e);
    } finally {
      setIsSyncingReminders(false);
    }
  };

  useEffect(() => {
    const cached = getLocalReminders();
    if (cached && cached.length > 0) {
      checkForNewReminderNotification(cached);
    }
    loadRemindersFromDb();
  }, []);

  const handleOpenReminderModal = (tab = 'all', itemToEdit = null, itemToView = null, source = 'view_reminders') => {
    setReminderModalTab(tab);
    setEditingReminder(itemToEdit);
    setViewingReminder(itemToView);
    setReminderModalSource(source);
    setShowReminderModal(true);
  };

  const handleDismissNewReminderModal = (reminderId, doNotShowAgain = false) => {
    try {
      localStorage.setItem('last_seen_reminder_id', reminderId);
      if (doNotShowAgain) {
        localStorage.setItem(`dismissed_reminder_pop_${reminderId}`, 'true');
      }
    } catch (e) {
      console.error(e);
    }
    setNewReminderNotification(null);
  };

  const handleViewReminderFromNotification = (reminder) => {
    handleDismissNewReminderModal(reminder.id, true);
    handleOpenReminderModal('all', null, reminder, 'view_reminders');
  };

  const handleSaveReminder = async (data, editId) => {
    if (editId) {
      // Optimistic update
      const now = new Date().toISOString();
      setReminders((prev) =>
        prev.map((rem) =>
          rem.id === editId
            ? {
                ...rem,
                subject: data.subject,
                description: data.description,
                isImportant: Boolean(data.isImportant),
                updatedAt: now,
              }
            : rem
        )
      );
      await updateReminder(editId, {
        subject: data.subject,
        description: data.description,
        isImportant: Boolean(data.isImportant),
      });
    } else {
      const res = await addReminder(data);
      if (res && res.reminder) {
        try {
          localStorage.setItem('last_seen_reminder_id', res.reminder.id);
          localStorage.setItem(`dismissed_reminder_pop_${res.reminder.id}`, 'true');
        } catch {}
        setReminders((prev) => [res.reminder, ...prev.filter((r) => r.id !== res.reminder.id)]);
      }
    }

    setViewingReminder(null);
    setReminderModalSource('view_reminders');
    setReminderModalTab('all');
  };

  const handleToggleSlideshow = async (id, shouldRemove) => {
    setReminders((prev) =>
      prev.map((rem) => (rem.id === id ? { ...rem, removedFromSlideshow: shouldRemove } : rem))
    );
    setViewingReminder((prev) =>
      prev && prev.id === id ? { ...prev, removedFromSlideshow: shouldRemove } : prev
    );
    await updateReminder(id, { removedFromSlideshow: shouldRemove });
  };

  const handleDeleteReminder = async (id) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    await deleteReminder(id);
  };

  const [showUpdateModal, setShowUpdateModal] = useState(() => {
    try {
      const latestAnnouncement = ANNOUNCEMENTS_DATA[0];
      const currentVersion = latestAnnouncement?.version || 'v2.10.10';

      // Check if user already acknowledged or dismissed this version update
      const isDismissed = localStorage.getItem(`dismissed_update_pop_${currentVersion}`) === 'true';
      const lastSeenVersion = localStorage.getItem('last_seen_update_version');

      // ONLY show if it's a new update version that hasn't been seen/dismissed yet
      return lastSeenVersion !== currentVersion && !isDismissed;
    } catch (e) {
      return false;
    }
  });

  const handleConfirmUpdateModal = (doNotShowAgain) => {
    try {
      const latestAnnouncement = ANNOUNCEMENTS_DATA[0];
      const currentVersion = latestAnnouncement?.version || 'v2.10.10';

      // Mark this update version as seen and acknowledged so it never pops up again until a new update
      localStorage.setItem('last_seen_update_version', currentVersion);
      localStorage.setItem(`dismissed_update_pop_${currentVersion}`, 'true');
    } catch (e) {
      console.error(e);
    }
    setShowUpdateModal(false);
  };

  const handleViewAnnouncementsFromModal = () => {
    handleConfirmUpdateModal(false);
    setCurrentView('announcement');
  };

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

    const savedTheme = localStorage.getItem('theme_creditcard');
    if (savedTheme === 'light') {
      document.body.classList.remove('dark-mode');
    } else {
      document.body.classList.add('dark-mode');
    }

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
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .break-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background-color: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(14px) saturate(160%);
            -webkit-backdrop-filter: blur(14px) saturate(160%);
            display: flex; align-items: center; justify-content: center;
            z-index: 99999 !important; 
            padding: 16px; box-sizing: border-box;
            animation: overlayFadeIn 0.3s ease forwards;
          }
          body.dark-mode .break-modal-overlay {
            background-color: rgba(3, 7, 18, 0.72);
            backdrop-filter: blur(16px) saturate(160%);
            -webkit-backdrop-filter: blur(16px) saturate(160%);
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
            <AppBanner />
            <Header />
            <ReminderBar
              reminders={reminders}
              onOpenModal={handleOpenReminderModal}
            />
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

          {/* ✅ INDEPENDENT TOOLS PAGE (Utilities & PDF Generators) */}
          <div style={{ display: currentView === 'tools' ? 'block' : 'none' }}>
            <ToolsPage onBackToDashboard={() => setCurrentView('dashboard')} />
          </div>

          <div id="notification"></div>
        </main>
      </div>

      {showUpdateModal && (
        <UpdateNotificationModal
          onConfirm={handleConfirmUpdateModal}
          onViewAnnouncements={handleViewAnnouncementsFromModal}
        />
      )}
      {!showUpdateModal && newReminderNotification && (
        <NewReminderNotificationModal
          reminder={newReminderNotification}
          onConfirm={(doNotShowAgain) => handleDismissNewReminderModal(newReminderNotification.id, doNotShowAgain)}
        />
      )}
      {showTemplates && <TidTemplatesModal onClose={() => setShowTemplates(false)} />}
      {showBreakSchedule && <BreakScheduleModal onClose={() => setShowBreakSchedule(false)} />}
      {showTeamPhoto && <TeamPhotoModal onClose={() => setShowTeamPhoto(false)} />}
      {showReminderModal && (
        <ReminderModal
          onClose={() => {
            setShowReminderModal(false);
            setEditingReminder(null);
            setViewingReminder(null);
          }}
          reminders={reminders}
          onSave={handleSaveReminder}
          onDelete={handleDeleteReminder}
          onToggleSlideshow={handleToggleSlideshow}
          onRefreshReminders={loadRemindersFromDb}
          isSyncing={isSyncingReminders}
          initialTab={reminderModalTab}
          editingReminder={editingReminder}
          initialViewingReminder={viewingReminder}
          modalSource={reminderModalSource}
          onClearEditing={() => setEditingReminder(null)}
        />
      )}
    </>
  );
}