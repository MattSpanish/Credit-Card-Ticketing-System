import React, { useEffect, useState } from 'react';
import { initCreditcardApp } from './creditcardController';

function Sidebar() {
  // State to handle opening/closing the TID Template popup modal
  const [showTemplates, setShowTemplates] = useState(false);

  // Native React handler for dark mode
  const toggleTheme = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme_creditcard', isDark ? 'dark' : 'light');
  };

  // ✅ Dictionary of specific templates
  const TID_TEMPLATES = {
    "PAX": `(PAX) - MSD
 / 
[]
PAX BROADPOS [NASHVILLE]
NMID#
TID#
GROUP ID# 10001`,
    "NEXGO": `(NEXGO)
 / 
[ADDRESS]
Nexgo MFE V201 DwSrsSs [NASHVILLE]
NMID#
TID#
GROUP ID# 10001
MCC#`,
    "FD150": `(FD150) - FD150
 /
[]
FD150 [NASHVILLE] OR FD150 W/ RP10 [NASHVILLE]
AUTO CLOSE - 12:23AM
NMID -
TID# , DLID#, RESET KEY:
APP: 751UN150
D/L# 855-641-1001
D/L IP ADDR: GDSPROD.FIRSTDATA.COM`,
    "FD130": `(FD130) - FD130
 / 
[]
EQUIPMENT: FD130 [NASHVILLE]
AUTO CLOSE - 12:00AM
NMID -
TID#, DLID# , RESET KEY:
APP: 751UN130
D/L# 855-641-1001
D/L IP ADDR: GDSPROD.FIRSTDATA.COM`,
    "VALOR": `(VALOR) -ValorPay GTW RC SRS
 / 
[]
ValorPay GTW RC SRS [NASHVILLE]
NMID#
TID#
GROUP ID# 10001
MCC#`,
    "DEJAVOO": `(DEJAVOO) - DVC
 / 
[ ]
DejavooDvCreditRC1.20 [NASHVILLE]
NMID#
TID#
GROUP ID# 10001
MCC#`,
    "NMI": `(NMI) - Network Merchants Gateway
 / 
[]
Network Merchants Gateway
NMID#
TID#
GROUP ID# 30001`,
    "AUTH.NET": `(AUTH.NET) - AUTHORIZENET(G/W)
DBA Name:
First Data Merchant ID Number:
[,  - ]
Nashville Short MID:
Network: FDC Nashville
Manufacturer: AUTHORIZE.NET
Equipment Name: AUTHORIZENET(G/W)
Equipment Type: TSOL
Product ID: 815300
Terminal ID:
Terminal PW:
Program ID: 000
FD Data wire: (800) 704-4202`,
    "VERIFONE COMMANDER / RUBY": `BUYPASS TID 
VERIFONE COMMANDER / RUBY 2 / RUBY CI

 /
[]
EQUIPMENT: VERIFONE COMMANDER / RUBY 2 / RUBY CI  
BUYPASS ID: 
FD Datawire: (800) 704-4202
FD Buypass: (800) 733-3322`,
    "GILBARCO PASSPORT": `GILBARCO PASSPORT
[Address, City State - Zipcode]
EQUIPMENT: GILBARCO PASSPORT
BUYPASS ID: L3(State) (BuypassID) 001
FD Datawire: (800) 704-4202
FD Buypass: (800) 733-3322`,
    "FD150 W/ RP10 (BUYPASS)": `FD150 W/ RP10 (BUYPASS)
 / 
[]
EQUIPMENT: FD150 W/ RP10 (BUYPASS)
BUYPASS ID: , DLID: [CALL BUYPASS]
FD Datawire: (800) 704-4202
FD Buypass: (800) 733-3322`
  };

  // ✅ Function to copy a specific template
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
      setShowTemplates(false); // Auto-close modal after copying
    });
  };

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar-top">
        <div className="logo">CC Tickets</div>
        <button 
          className="theme-toggle" 
          id="themeToggle" 
          title="Toggle dark mode"
          onClick={toggleTheme}
        >
          🌙
        </button>
      </div>
      <nav className="nav-list">
        <button className="nav-item active" onClick={() => window.switchToTab && window.switchToTab('creditcard')}>Dashboard</button>
        <button className="nav-item" onClick={() => window.createNewTicket && window.createNewTicket()}>New Ticket</button>
        <button className="nav-item" onClick={() => window.switchToTab && window.switchToTab('creditcard')}>Tickets</button>
        
        {/* ✅ Button that opens the Popup Modal */}
        <button className="nav-item" onClick={() => setShowTemplates(true)}>📋 TID Templates</button>
      </nav>
      <div className="sidebar-foot">Logged in as <strong>Support</strong></div>
      <div className="sidebar-key">
        <button id="saveGeminiKeyBtn" className="btn btn-sm btn-primary" style={{marginTop:8, width:'100%'}}>Set Gemini API Key</button>
      </div>

      {/* ✅ Pop-up Box (Modal) for Templates */}
      {showTemplates && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.6)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000 
          }}
          onClick={() => setShowTemplates(false)} 
        >
          <div 
            style={{
              backgroundColor: 'var(--panel-bg, #fff)', 
              color: 'var(--text-color, #333)',
              padding: '24px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '650px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()} 
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Select a TID Template</h3>
              <button 
                onClick={() => setShowTemplates(false)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'inherit', fontWeight: 'bold' }}
              >
                ✖
              </button>
            </div>
            
            {/* Grid Layout for the device buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
              {Object.keys(TID_TEMPLATES).map((device) => (
                <button 
                  key={device} 
                  onClick={() => copySpecificTemplate(device)}
                  style={{
                    padding: '12px 10px',
                    backgroundColor: 'var(--accent-color, #1a6d9f)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    transition: 'background-color 0.2s',
                    fontSize: '0.85em'
                  }}
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

function DashboardGrid() {
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
            <th><label htmlFor="creditcard-support">SUPPORT NAME</label></th>
            <td><input type="text" id="creditcard-support" placeholder="Enter your name" /></td>
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
              {/* ✅ NEW: Auto-AI Toggle Options (Gaps removed) */}
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
  return (
    <div className="history-panel">
      <div className="panel-header panel-header-history">
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
      <div id="creditcardHistoryContent" className="history-content"></div>
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