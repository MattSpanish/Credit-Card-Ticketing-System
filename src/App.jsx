import React, { useEffect, useState } from 'react';
import { initCreditcardApp } from './creditcardController';

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
          <button onClick={onClose} className="break-close-btn">✖</button>
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
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.5rem' }}>
              ☕ Break Schedule
            </h2>
            <p className="modal-subtitle">
              9:00 PM - 6:00 AM Shift
            </p>
          </div>
          <button onClick={onClose} className="break-close-btn" aria-label="Close">✖</button>
        </div>
        
        <div style={{ padding: '24px' }}>
          <div className="info-box">
            <span style={{ fontSize: '18px' }}>💡</span>
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

// ==========================================
// ✅ SIDEBAR
// ==========================================

function Sidebar({ onOpenTemplates, onOpenBreakSchedule }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const updateView = () => setIsMobileView(window.innerWidth <= 1000);
    updateView();
    window.addEventListener('resize', updateView);
    return () => window.removeEventListener('resize', updateView);
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
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar-top">
        <div className="logo">CC Tickets</div>
        <div className="sidebar-actions">
          <button className="theme-toggle" onClick={toggleTheme}>🌙</button>
          {isMobileView && (
            <button className="sidebar-toggle" onClick={() => setIsMobileNavOpen((prev) => !prev)}>☰</button>
          )}
        </div>
      </div>
      <nav className={`nav-list ${isMobileView && !isMobileNavOpen ? 'nav-list-collapsed' : 'nav-list-open'}`}>
        <button className="nav-item active" onClick={() => handleNavAction(() => window.switchToTab && window.switchToTab('creditcard'))}>Dashboard</button>
        <button className="nav-item" onClick={() => handleNavAction(() => window.createNewTicket && window.createNewTicket())}>New Ticket</button>
        <button className="nav-item" onClick={() => handleNavAction(() => window.switchToTab && window.switchToTab('creditcard'))}>Tickets</button>
        
        <button className="nav-item" onClick={() => handleNavAction(onOpenTemplates)}>📋 TID Templates</button>
        <button className="nav-item" onClick={() => handleNavAction(onOpenBreakSchedule)}>☕ Break Schedule</button>
      </nav>
      
      <div className="sidebar-foot" style={{ marginTop: 'auto' }}>Logged in as <strong>Support</strong></div>
      <div className="sidebar-key">
        <button id="saveGeminiKeyBtn" className="btn btn-sm btn-primary" style={{marginTop:8, width:'100%'}}>Set Gemini API Key</button>
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
  return (
    <>
      {/* 1. ORIGINAL HEADER: Title sa kaliwa, Search bar sa kanan */}
      <header className="app-header">
        <div className="header-left">
          <h1>Credit Card Support Center</h1>
          <p className="small">Capture issues quickly and resolve faster.</p>
        </div>
        <div className="header-actions">
          <input 
            className="header-search" 
            placeholder="Search tickets, stores, MID..." 
            onChange={(e) => window.handleGlobalSearch && window.handleGlobalSearch(e.target.value)}
          />
        </div>
      </header>

      {/* 2. HIWALAY NA DIV PARA SA PICTURE (CROPPED ANG TAAS AT BABA) */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <img 
          src="https://lh3.googleusercontent.com/d/1bNuogEEjtyWMvy5vSu_pNHiji2T2vrTJ" 
          alt="Support Team" 
          style={{ 
            width: '1000px', 
            height: '325px', /* ✅ PINA-LIIT ANG HEIGHT PARA PUMUTOL SA TAAS AT BABA */
            borderRadius: '8px', 
            objectFit: 'cover', 
            objectPosition: 'center', /* ✅ NAKA-GITNA PARA PANTAY ANG PUTOL */
            border: '2px solid var(--border-color)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }} 
        />
      </div>
    </>
  );
}
// ==========================================
// ✅ DASHBOARD GRID
// ==========================================
function DashboardGrid() {
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
    <section className="dashboard-grid compact" aria-label="Ticket dashboard summary">
      <div className="stat-card accent">
        <div className="stat-label">Total</div>
        <div className="stat-value" id="dashboardTotalTickets">0</div>
      </div>
      
      <div className="stat-card success">
        <div className="stat-label">Resolved</div>
        <div className="stat-value" id="dashboardResolvedTickets">0</div>
      </div>
      <div className="stat-card warning">
        <div className="stat-label">Pending</div>
        <div className="stat-value" id="dashboardPendingTickets">0</div>
      </div>

      <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-color, #8b5cf6)', display: 'flex', flexDirection: 'column' }}>
        <div className="stat-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>1 Hr Break</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'none', letterSpacing: 'normal' }}>
              {currentDayName}, {currentDateString}
            </span>
          </div>
          <select 
            value={selectedPerson} 
            onChange={handlePersonChange}
            style={{ 
              fontSize: '10px', padding: '2px 4px', height: 'auto', width: 'auto', 
              background: 'transparent', border: '1px solid var(--border-color)', 
              borderRadius: '4px', color: 'var(--text-secondary)' 
            }}
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
            <option value="YASMINE">YASMINE (YAS)</option>
            <option value="GABRIEL">GABRIEL</option>
            <option value="ERNEST">ERNEST</option>
            <option value="REGS">REGS</option>
            <option value="NICHOLLE">NICHOLLE</option>
            <option value="ERNEST">EJ</option>
          </select>
        </div>
        <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: '12px', color: 'var(--accent-color, #8b5cf6)', whiteSpace: 'nowrap' }}>
          {selectedPerson ? todayBreak : 'Select name ☝️'}
        </div>
      </div>
    </section>
  );
}

function Tabs() {
  return (
    <div className="top-tabs shell-tabs">
      <button id="tabBtn-creditcard" className="tab-btn active" onClick={() => window.switchToTab && window.switchToTab('creditcard')}>Credit Card</button>
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
            <th><label htmlFor="creditcard-store-search">🔍 SEARCH STORE</label></th>
            <td>
              <div className="combobox-wrapper" style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  id="creditcard-store-search" 
                  className="combobox-input no-uppercase" 
                  placeholder="Type Store Name or MID..." 
                  autoComplete="off" 
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
                  style={{ paddingRight: '28px' }}
                  onClick={() => {
                    const suggestions = document.getElementById('creditcard-status-suggestions');
                    if (suggestions) suggestions.style.display = 'block';
                  }}
                />
                <input type="hidden" id="creditcard-status" />
                
                <div className="form-group" id="creditcard-other-task-container" style={{ display: 'none', marginTop: '10px' }}>
                  <label>Select Other Task:</label>
                  <select id="creditcard-other-task-select" className="form-control">
                    <option value="">Choose a task</option>
                    <option value="Program PAX A35 w/ P98">Program PAX A35 w/ P98</option>
                    <option value="PAX TID ">PAX TID </option>
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
                  style={{
                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted, #888)', fontSize: '14px',
                    fontWeight: 'bold', cursor: 'pointer', padding: '2px 4px', zIndex: 2
                  }}
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
                  ✖
                </button>
                    
                <div id="creditcard-status-suggestions" className="combobox-suggestions"></div>
              </div>
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="creditcard-remarks">Troubleshooting</label>
              <div style={{ marginTop: '5px', fontSize: '0.85em', backgroundColor: 'var(--panel-bg, #f8f9fa)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color, #ccc)' }}>                
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '6px', cursor: 'pointer', marginBottom: '5px' }}>
                  <input type="radio" name="aiActionMode" value="summarize" defaultChecked style={{ margin: 0, width: 'auto' }} /> 
                  <span className="text-summarize" style={{ fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'left' }}>Summarize</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '6px', cursor: 'pointer', marginBottom: '5px' }}>
                  <input type="radio" name="aiActionMode" value="grammar" style={{ margin: 0, width: 'auto' }} /> 
                  <span className="text-grammar" style={{ fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'left' }}>Fix Grammar</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '6px', cursor: 'pointer' }}>
                  <input type="radio" name="aiActionMode" value="none" style={{ margin: 0, width: 'auto' }} /> 
                  <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'left' }}>Off (Raw Text)</span>
                </label>
              </div>
            </th>
            <td>
              <div id="creditcard-remarks-editor" style={{ height: 200 }}></div>
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
    <div className="history-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header panel-header-history" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div>
            <p className="panel-kicker">Activity feed</p>
            <h3>Credit Card History</h3>
            <p className="panel-subtitle">Recent tickets, grouped by date.</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
            <input 
              type="date" 
              id="workload-date-picker" 
              style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color, #ccc)', background: 'var(--panel-bg)', color: 'var(--text-primary)' }}
            />
            <button 
              className="btn btn-sm btn-primary" 
              onClick={() => window.generateWorkload && window.generateWorkload()}
            >
              Workload Tracker
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
      <button className="counter-badge status-filter-btn" data-status="RESOLVED" onClick={() => window.filterByStatus && window.filterByStatus('RESOLVED')}>✅ Resolved: <span id="counterResolved">0</span></button>
      <button className="counter-badge status-filter-btn" data-status="PENDING" onClick={() => window.filterByStatus && window.filterByStatus('PENDING')}>⏳ Pending: <span id="counterPending">0</span></button>
      <button className="counter-badge status-filter-btn" data-status="OTHER TASK" onClick={() => window.filterByStatus && window.filterByStatus('OTHER TASK')}>📋 Other task: <span id="counterOther">0</span></button>
      <button id="clearAllBtn" className="clear-all-btn">Clear all</button>
    </div>
  );
}

function EntryTable() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table id="entryTable">
        <thead>
          <tr>
            <th></th>
            <th>DATE</th>
            <th>SHIFT SCHEDULE</th>
            <th>SUPPORT NAME</th>
            <th>MID</th>
            <th>STORE NAME</th>
            <th>MERCHANT NAME</th>
            <th>CONTACT #</th>
            <th>ISSUE</th>
            <th>ESCALATED</th>
            <th>STATUS</th>
            <th>REMARKS</th>
            <th></th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  );
}

// ==========================================
// ✅ MAIN APP WRAPPER
// ==========================================

export default function App() {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBreakSchedule, setShowBreakSchedule] = useState(false);

  useEffect(() => {
    initCreditcardApp();
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

      <div className="page-shell layout">
        <Sidebar 
          onOpenTemplates={() => setShowTemplates(true)} 
          onOpenBreakSchedule={() => setShowBreakSchedule(true)} 
        />
        <main className="main-area">
          <Header />
          <DashboardGrid />
          <Tabs />
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
              <EntryTable />
            </div>
          </div>
          <div id="notification"></div>
        </main>
      </div>

      {/* MODALS OUTSIDE LAYOUT */}
      {showTemplates && <TidTemplatesModal onClose={() => setShowTemplates(false)} />}
      {showBreakSchedule && <BreakScheduleModal onClose={() => setShowBreakSchedule(false)} />}
    </>
  );
}