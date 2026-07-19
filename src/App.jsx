import React, { useEffect } from 'react';
import { initCreditcardApp } from './creditcardController';

const bodyMarkup = `
    <!-- ─── MAIN APP ─── -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:2rem;">
        <h1 style="margin:0;">💳 Credit Card · Support System</h1>
        <button class="theme-toggle" id="themeToggle" title="Toggle dark mode">🌙</button>
    </div>

    <!-- Top tabs -->
    <div class="top-tabs" style="display:flex; gap:0.5rem; margin-bottom:1rem;">
        <button id="tabBtn-creditcard" class="tab-btn active" onclick="window.switchToTab && window.switchToTab('creditcard')">Credit Card</button>
        <button id="tabBtn-newticket" class="tab-btn" onclick="window.createNewTicket && window.createNewTicket()">New Ticket</button>
    </div>

    <div class="app-container">
        <div class="main-content">

            <!-- ─── CREDIT CARD TAB ─── -->
            <div id="tab-creditcard" style="display:block;">
                <div class="three-panels">
                    <!-- History Panel -->
                    <div class="history-panel">
                        <div class="sidebar-header">
                            <h3><i class="bi bi-credit-card-fill"></i> CREDIT CARD HISTORY</h3>
                        </div>
                        <div id="creditcardHistoryContent" class="history-content"></div>
                    </div>

                    <!-- Left Panel: Form -->
                    <div class="left-panel">
                        <h3>📋 CREDIT CARD TICKET FORM</h3>
                        <table>
                            <tr>
                                <th><label for="creditcard-date">DATE</label></th>
                                <td><input type="date" id="creditcard-date" /></td>
                            </tr>
                            <tr>
                                <th><label for="creditcard-shift">SHIFT SCHEDULE</label></th>
                                <td>
                                    <select id="creditcard-shift">
                                        <option value="">-- SELECT --</option>
                                        <option value="9PM - 8AM">9PM - 6AM</option>
                                        <option value="7:30AM - 6:30PM">5AM - 2PM</option>
                                        <option value="6PM - 5AM">2PM - 11PM</option>
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <th><label for="creditcard-support">SUPPORT NAME</label></th>
                                <td><input type="text" id="creditcard-support" placeholder="Enter your name" /></td>
                            </tr>
                             <tr>
                                <th><label for="creditcard-store">STORE NAME *</label></th>
                                <td><input type="text" id="creditcard-store" class="required-field" /></td>
                            </tr>
                            <tr>
                                <th><label for="creditcard-mid">MID *</label></th>
                                <td><input type="text" id="creditcard-mid" class="required-field" /></td>
                            </tr>
                            <tr>
                                <th><label for="creditcard-merchant">MERCHANT NAME</label></th>
                                <td><input type="text" id="creditcard-merchant" /></td>
                            </tr>
                            <tr>
                                <th><label for="creditcard-contactNumber">CONTACT #</label></th>
                                <td><input type="text" id="creditcard-contactNumber" class="no-uppercase" maxlength="14" /></td>
                            </tr>
                            <tr>
                                <th><label for="creditcard-issue">ISSUE</label></th>
                                <td><textarea id="creditcard-issue" class="no-uppercase" rows="2"></textarea></td>
                            </tr>
                            <tr>
                                <th><label for="creditcard-escalated">ESCALATED</label></th>
                                <td><input type="text" id="creditcard-escalated" class="no-uppercase" /></td>
                            </tr>
                            <tr>
                                <th><label for="creditcard-status">STATUS</label></th>
                                <td>
                                    <div class="combobox-wrapper">
                                        <input type="text" id="creditcard-status-combobox" class="combobox-input no-uppercase" autocomplete="off" placeholder="Type or select status" />
                                        <input type="hidden" id="creditcard-status" />
                                        <div id="creditcard-status-suggestions" class="combobox-suggestions"></div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <th><label for="creditcard-remarks">REMARKS (Resolution)</label></th>
                                <td>
                                    <div id="creditcard-remarks-editor" style="height:200px;"></div>
                                    <textarea id="creditcard-remarks" style="display:none;"></textarea>
                                </td>
                            </tr>
                        </table>
                        <div class="button-row">
                            <button class="add" onclick="window.addEntry('creditcard')"><i class="bi bi-plus-circle-fill"></i> ADD ENTRY</button>
                            <button class="save-draft" onclick="window.saveCurrentDraft()"><i class="bi bi-save2-fill"></i> SAVE DRAFT</button>
                            <button class="form-clear-btn" onclick="window.clearFormOnly('creditcard')"><i class="bi bi-eraser-fill"></i> CLEAR FORM</button>
                            <button class="clock" onclick="window.clock('IN', 'creditcard')"><i class="bi bi-hourglass-top"></i> CLOCK IN</button>
                            <button class="clock" onclick="window.clock('OUT', 'creditcard')"><i class="bi bi-hourglass-bottom"></i> CLOCK OUT</button>
                        </div>
                    </div>

                    <!-- Right Panel: Preview -->
                    <div class="right-panel" id="creditcard-previewPanel">
                        <h3>🔍 PREVIEW</h3>
                        <div><strong>STORE:</strong> <span id="creditcard-preview-store"></span></div>
                        <div><strong>MID:</strong> <span id="creditcard-preview-mid"></span></div>
                        <div><strong>MERCHANT:</strong> <span id="creditcard-preview-merchant"></span></div>
                        <div><strong>CONTACT #:</strong> <span id="creditcard-preview-contactNumber"></span></div>
                        <br />
                        <div><strong>ISSUE:</strong></div>
                        <div><span id="creditcard-preview-issue" class="preview-multiline"></span></div>
                        <br />
                        <div><strong>REMARKS:</strong></div>
                        <div><span id="creditcard-preview-remarks" class="preview-multiline"></span></div>
                    </div>
                </div>
            </div>

            <!-- ─── BULK BAR ─── -->
                <div class="bulk-bar">
                <label><input type="checkbox" id="selectAllCheckbox" /> Select All</label>
                <button id="bulkDeleteBtn" title="Remove selected rows"><i class="bi bi-trash-fill"></i> REMOVE</button>
                <button id="bulkCopyBtn" title="Copy selected rows"><i class="bi bi-copy"></i> COPY</button>
                <button class="counter-badge status-filter-btn" data-status="RESOLVED" onclick="window.filterByStatus('RESOLVED')">✅ RESOLVED: <span id="counterResolved">0</span></button>
                <button class="counter-badge status-filter-btn" data-status="PENDING" onclick="window.filterByStatus('PENDING')">⏳ PENDING: <span id="counterPending">0</span></button>
                <button class="counter-badge status-filter-btn" data-status="OTHER TASK" onclick="window.filterByStatus('OTHER TASK')">📋 OTHER TASK: <span id="counterOther">0</span></button>
                <button id="clearAllBtn" class="clear-all-btn" title="Delete all entries permanently"><i class="bi bi-trash3-fill"></i> CLEAR ALL</button>
            </div>

            <!-- ─── MAIN TABLE ─── -->
            <div style="overflow-x:auto;">
                <table id="entryTable">
                    <thead>
                        <tr>
                            <th style="width:30px;"></th>
                            <th>DATE</th>
                            <th>SHIFT</th>
                            <th>SUPPORT</th>
                            <th>STORE NAME</th>
                            <th>MID</th>
                            <th>MERCHANT NAME</th>
                            <th>CONTACT #</th>
                            <th>ISSUE</th>
                            <th>ESCALATED</th>
                            <th>STATUS</th>
                            <th>REMARKS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- ─── NOTIFICATION ─── -->
    <div id="notification"></div>
`;

export default function App() {
  useEffect(() => {
    initCreditcardApp();
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: bodyMarkup }} />;
}