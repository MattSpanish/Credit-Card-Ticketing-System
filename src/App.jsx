import React, { useEffect, useState } from 'react';
import { initCreditcardApp } from './creditcardController';

// ✅ GLOBAL BREAK SCHEDULE DATA
const BREAK_SCHEDULE = {
  "Monday": [
    { person: "YASMINE", time: "1:00–2:00 AM" },
    { person: "MAT", time: "1:30–2:30 AM" },
    { person: "ERNEST", time: "2:00–3:00 AM" },
    { person: "SEAN", time: "2:30–3:30 AM" },
    { person: "CHARLES", time: "3:30–4:30 AM" },
    { person: "RONIE", time: "4:45–5:45 AM" }
  ],
  "Tuesday": [
    { person: "MAT", time: "1:00–2:00 AM" },
    { person: "ERNEST", time: "1:30–2:30 AM" },
    { person: "SEAN", time: "2:00–3:00 AM" },
    { person: "CHARLES", time: "3:30–4:30 AM" },
    { person: "RONIE / ADI", time: "4:45–5:45 AM" }
  ],
  "Wednesday": [
    { person: "SEAN", time: "1:30–2:30 AM" },
    { person: "MAT", time: "2:30–3:30 AM" },
    { person: "CHARLES", time: "3:30–4:30 AM" },
    { person: "RONIE / ADI", time: "4:45–5:45 AM" }
  ],
  "Thursday": [
    { person: "YASMINE", time: "1:30–2:30 AM" },
    { person: "MAT", time: "2:30–3:30 AM" },
    { person: "CHARLES", time: "3:30–4:30 AM" },
    { person: "RONIE / ADI", time: "4:45–5:45 AM" }
  ],
  "Friday": [
    { person: "ERNEST", time: "1:30–2:30 AM" },
    { person: "YASMINE", time: "2:30–3:30 AM" },
    { person: "MAT", time: "3:30–4:30 AM" },
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

function Sidebar() {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBreakSchedule, setShowBreakSchedule] = useState(false);

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const updateView = () => setIsMobileView(window.innerWidth <= 1000);
    updateView();
    window.addEventListener('resize', updateView);
    return () => window.removeEventListener('resize', updateView);
  }, []);

  useEffect(() => {
    if (!isMobileView) {
      setIsMobileNavOpen(false);
    }
  }, [isMobileView]);

  const toggleTheme = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme_creditcard', isDark ? 'dark' : 'light');
  };

  const handleNavAction = (action) => {
    if (typeof action === 'function') {
      action();
    }
    if (isMobileView) {
      setIsMobileNavOpen(false);
    }
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
      setShowTemplates(false); 
    });
  };

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar-top">
        <div className="logo">CC Tickets</div>
        <div className="sidebar-actions">
          <button 
            className="theme-toggle" 
            id="themeToggle" 
            title="Toggle dark mode"
            onClick={toggleTheme}
          >
            🌙
          </button>
          {isMobileView && (
            <button
              className="sidebar-toggle"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={isMobileNavOpen}
              onClick={() => setIsMobileNavOpen((prev) => !prev)}
            >
              ☰
            </button>
          )}
        </div>
      </div>
      <nav className={`nav-list ${isMobileView && !isMobileNavOpen ? 'nav-list-collapsed' : 'nav-list-open'}`}>
        <button className="nav-item active" onClick={() => handleNavAction(() => window.switchToTab && window.switchToTab('creditcard'))}>Dashboard</button>
        <button className="nav-item" onClick={() => handleNavAction(() => window.createNewTicket && window.createNewTicket())}>New Ticket</button>
        <button className="nav-item" onClick={() => handleNavAction(() => window.switchToTab && window.switchToTab('creditcard'))}>Tickets</button>
        
        <button className="nav-item" onClick={() => handleNavAction(() => setShowTemplates(true))}>📋 TID Templates</button>
        <button className="nav-item" onClick={() => handleNavAction(() => setShowBreakSchedule(true))}>☕ Break Schedule</button>
      </nav>
      
      <div className="sidebar-foot">Logged in as <strong>Support</strong></div>
      <div className="sidebar-key">
        <button id="saveGeminiKeyBtn" className="btn btn-sm btn-primary" style={{marginTop:8, width:'100%'}}>Set Gemini API Key</button>
      </div>

      {showTemplates && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px', boxSizing: 'border-box' }}
          onClick={() => setShowTemplates(false)} 
        >
          <div 
            style={{ backgroundColor: 'var(--panel-bg, #fff)', color: 'var(--text-color, #333)', padding: '24px', borderRadius: '8px', width: 'min(100%, 650px)', maxWidth: '650px', maxHeight: 'min(90vh, 800px)', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', position: 'relative', boxSizing: 'border-box' }}
            onClick={(e) => e.stopPropagation()} 
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Select a TID Template</h3>
              <button onClick={() => setShowTemplates(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'inherit', fontWeight: 'bold' }}>✖</button>
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
      )}

      {showBreakSchedule && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px', boxSizing: 'border-box' }}
          onClick={() => setShowBreakSchedule(false)} 
        >
          <div 
            style={{ backgroundColor: 'var(--panel-bg, #fff)', color: 'var(--text-color, #333)', padding: '24px', borderRadius: '8px', width: 'min(100%, 650px)', maxWidth: '650px', maxHeight: 'min(90vh, 800px)', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', position: 'relative', boxSizing: 'border-box' }}
            onClick={(e) => e.stopPropagation()} 
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: 'var(--accent-color)' }}>☕ Break Schedule (9:00 PM - 6:00 AM)</h3>
              <button onClick={() => setShowBreakSchedule(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'inherit', fontWeight: 'bold' }}>✖</button>
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', fontStyle: 'italic' }}>
              * Regarding the short break you can use it anytime. If you have any concern just let us know. Thank you!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.keys(BREAK_SCHEDULE).map(day => (
                <div key={day} style={{ background: 'var(--bg-tertiary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                    {day} — {BREAK_SCHEDULE[day].length} People
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                    {BREAK_SCHEDULE[day].map((slot, i) => (
                      <div key={i} style={{ fontSize: '13.5px', display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ color: 'var(--text-secondary)' }}>{slot.person}:</strong> 
                        <span style={{ fontWeight: '500' }}>{slot.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function Header() {
  return (
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
  );
}

// ✅ DASHBOARD WITH FULL FORM SYNC (BOTH SUPPORT NAME & DATE)
function DashboardGrid() {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const [selectedPerson, setSelectedPerson] = useState(localStorage.getItem('myBreakPerson') || '');
  const [todayBreak, setTodayBreak] = useState('--:--');
  const [selectedDateStr, setSelectedDateStr] = useState(''); // State para sa date galing sa form

  // ✅ SYNC SUPPORT NAME GALING SA FORM
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

  // ✅ SYNC DATE GALING SA FORM
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

  // Compute ang Day at Date format
  let activeDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  if (selectedDateStr) {
    const [y, m, d] = selectedDateStr.split('-');
    if (y && m && d) {
      // Create new date specifically for the parsed YYYY-MM-DD
      activeDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }
  }
  
  const currentDayName = dayNames[activeDate.getDay()];
  const currentDateString = activeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // ✅ CHECK ANG SCHEDULE BASE SA PANGALAN AT KUNG ANONG ARAW SA FORM
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
  }, [selectedPerson, currentDayName]); // Mag-uupdate ito kapag nag-change ang person o ang araw

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

      <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6', display: 'flex', flexDirection: 'column' }}>
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
            <option value="NICHOLLE">NICHOLLE</option>
            <option value="ERNEST">EJ</option>
          </select>
        </div>
        <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: '12px', color: '#8b5cf6', whiteSpace: 'nowrap' }}>
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
              <select 
                id="creditcard-support" 
                className="required-field no-uppercase"
              >
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
                <option value="NICHOLLE">NICHOLLE</option>
              </select>
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
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    zIndex: 2
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
              <div style={{ marginTop: '5px', fontSize: '0.85em', backgroundColor: 'var(--panel-bg, #f8f9fa)', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>                
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '6px', cursor: 'pointer', marginBottom: '5px' }}>
                  <input type="radio" name="aiActionMode" value="summarize" defaultChecked style={{ margin: 0, width: 'auto' }} /> 
                  <span style={{ color: '#673ab7', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'left' }}>Summarize</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '6px', cursor: 'pointer', marginBottom: '5px' }}>
                  <input type="radio" name="aiActionMode" value="grammar" style={{ margin: 0, width: 'auto' }} /> 
                  <span style={{ color: '#009688', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'left' }}>Fix Grammar</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '6px', cursor: 'pointer' }}>
                  <input type="radio" name="aiActionMode" value="none" style={{ margin: 0, width: 'auto' }} /> 
                  <span style={{ color: '#666', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'left' }}>Off (Raw Text)</span>
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
  const [notepadText, setNotepadText] = useState(localStorage.getItem('creditcard_notepad') || '');

  const handleNotepadChange = (e) => {
    setNotepadText(e.target.value);
    localStorage.setItem('creditcard_notepad', e.target.value);
  };

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
              style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
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

      <div style={{ padding: '15px', borderTop: '1px solid var(--border-color, #eee)', backgroundColor: 'var(--panel-bg, #fff)', flexShrink: 0 }}>
        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>
          📝 Scratchpad
        </label>
        <textarea
          value={notepadText}
          onChange={handleNotepadChange}
          placeholder="Paste messy notes here..."
          style={{
            width: '100%',
            minHeight: '180px',
            resize: 'vertical',
            borderRadius: '6px',
            border: '1px solid var(--border-color, #ccc)',
            backgroundColor: 'var(--panel-bg, #fafafa)',
            color: 'var(--text-color, #333)',
            padding: '10px',
            fontSize: '12px',
            lineHeight: '1.4',
            fontFamily: 'inherit',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
          }}
        />
      </div>
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

export default function App() {
  useEffect(() => {
    initCreditcardApp();
  }, []);

  return (
    <div className="page-shell layout">
      <Sidebar />
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
  );
}