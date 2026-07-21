import React, { useEffect } from 'react';
import { initCreditcardApp } from './creditcardController';

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar-top">
        <div className="logo">CC Tickets</div>
        <button className="theme-toggle" id="themeToggle" title="Toggle dark mode">🌙</button>
      </div>
      <nav className="nav-list">
        <button className="nav-item active" onClick={() => window.switchToTab && window.switchToTab('creditcard')}>Dashboard</button>
        <button className="nav-item" onClick={() => window.switchToTab && window.switchToTab('creditcard')}>Tickets</button>
        <button className="nav-item" onClick={() => window.createNewTicket && window.createNewTicket()}>New Ticket</button>
      </nav>
      <div className="sidebar-foot">Logged in as <strong>Support</strong></div>
      <div className="sidebar-key">
        <button id="saveGeminiKeyBtn" className="btn btn-sm btn-primary" style={{marginTop:8, width:'100%'}}>Set Gemini API Key</button>
      </div>
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
        <input className="header-search" placeholder="Search tickets, stores, MID..." />
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
      <div className="stat-card">
        <div className="stat-label">Open</div>
        <div className="stat-value" id="dashboardOpenTickets">0</div>
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
                <option value="730AM - 630PM">5AM - 2PM</option>
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
              <div className="combobox-wrapper">
                <input type="text" id="creditcard-status-combobox" className="combobox-input no-uppercase" autoComplete="off" placeholder="Type or select status" />
                <input type="hidden" id="creditcard-status" />
                <div id="creditcard-status-suggestions" className="combobox-suggestions"></div>
              </div>
            </td>
          </tr>
          <tr>
            <th><label htmlFor="creditcard-remarks">Troubleshooting (AI)</label></th>
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
        <div>
          <p className="panel-kicker">Activity feed</p>
          <h3>Credit Card History</h3>
          <p className="panel-subtitle">Recent tickets, grouped by date.</p>
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