export function initCreditcardApp() {
  if (window.__creditcardAppInitialized) return;
  window.__creditcardAppInitialized = true;

  (function() {
    'use strict';

    // ─── STATE ───
    let allEntries = [];
    let editId = null;
    let currentStatusFilter = null;
    let quillEditor = null;
    // undo/redo removed per request

    const EDIT_STORAGE_KEY = 'editingEntryId_creditcard';
    const EDIT_DRAFT_KEY = 'editingDraft_creditcard_';
    const DRAFT_TABS_KEY = 'ticketDraftTabs_creditcard';
    const collapseState = { months: {}, dates: {} };
    const STATUS_OPTIONS = ['RESOLVED', 'PENDING', 'OTHER TASK', 'UNSOLVED'];
    const CLOCK_TIMES = {
      '9PM - 6AM': ['09:00 PM', '06:00 AM'],
      '5AM - 2PM': ['05:00 AM', '02:00 PM'],
      '2PM - 11PM': ['02:00 PM', '11:00 PM'],
    };
    const GEMINI_API_KEY_STORAGE_KEY = 'creditcardGeminiApiKey';
    const GEMINI_MODEL = 'gemini-1.5-flash';

    // ─── HELPERS ───
    function showNotification(msg) {
      const el = document.getElementById('notification');
      el.textContent = msg;
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 2000);
    }

    function escapeHtml(text) {
      if (!text) return '';
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function escapeCSV(text) {
      if (text.includes('\n') || text.includes('"')) {
        text = text.replace(/"/g, '""');
        return `"${text}"`;
      }
      return text;
    }

    function formatMultilinePreview(text) {
      if (!text) return '';
      const escaped = text.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
      });
      return escaped.replace(/\n/g, '<br>');
    }

    function parseDateFromString(dateStr) {
      const parts = dateStr.split('/');
      if (parts.length !== 3) return null;
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      return new Date(year, month - 1, day);
    }

    function getESTDateString() {
      const now = new Date();
      const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      return estDate.toISOString().slice(0, 10);
    }

    function storeGetFormattedDateMinusOne() {
      const now = new Date();
      const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const mm = String(estDate.getMonth() + 1).padStart(2, '0');
      const dd = String(estDate.getDate()).padStart(2, '0');
      const yyyy = estDate.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    }

    function isHtmlEmpty(html) {
      if (!html) return true;
      const div = document.createElement('div');
      div.innerHTML = html;
      const text = div.textContent || div.innerText || '';
      return text.trim() === '';
    }

    function convertQuillLists(html) {
      const div = document.createElement('div');
      div.innerHTML = html;
      div.querySelectorAll('ol').forEach(ol => {
        const children = [...ol.children];
        if (children.length > 0 && children.every(li => li.dataset.list === 'bullet')) {
          const ul = document.createElement('ul');
          children.forEach(li => {
            li.removeAttribute('data-list');
            li.className = li.className.replace(/ql-indent-\d+/g, '');
            ul.appendChild(li);
          });
          ol.replaceWith(ul);
        }
      });
      return div.innerHTML;
    }

    function autoGrow(textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }

    function syncPreviewHeight() {
      const leftPanel = document.querySelector('.left-panel');
      const rightPanel = document.querySelector('.right-panel');
      if (!leftPanel || !rightPanel) return;
      rightPanel.style.maxHeight = leftPanel.offsetHeight + 'px';
      rightPanel.style.overflowY = 'auto';
    }

    function cloneEntries(entries) { return JSON.parse(JSON.stringify(entries)); }

    function htmlToPlainText(html) {
      if (!html) return '';
      const div = document.createElement('div');
      div.innerHTML = html;
      return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
    }

    function plainTextToRemarkHtml(text) {
      const normalized = (text || '').trim();
      if (!normalized) return '';
      return `<p>${escapeHtml(normalized).replace(/\n/g, '<br>')}</p>`;
    }

    function applyRemarksHtml(html) {
      const remarksHtml = html || '';
      const remarksField = document.getElementById('creditcard-remarks');
      if (quillEditor) {
        if (quillEditor.clipboard && quillEditor.clipboard.dangerouslyPasteHTML) {
          quillEditor.clipboard.dangerouslyPasteHTML(remarksHtml);
        } else {
          quillEditor.root.innerHTML = remarksHtml;
        }
      }
      if (remarksField) remarksField.value = remarksHtml;
      creditcardUpdatePreview();
      saveFormData('creditcard');
    }

    function getGeminiApiKey() {
      const storedKey = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
      if (storedKey && storedKey.trim()) return storedKey.trim();
      const enteredKey = window.prompt('Enter your Gemini API key to auto-generate remarks:');
      if (!enteredKey) return '';
      const trimmedKey = enteredKey.trim();
      if (!trimmedKey) return '';
      localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, trimmedKey);
      return trimmedKey;
    }

    function buildFallbackResolutionSummary(ticket) {
      const parts = [];
      if (ticket.issue) parts.push(`Issue: ${ticket.issue}`);
      if (ticket.rawResolution) parts.push(`Resolution notes: ${ticket.rawResolution}`);
      if (ticket.status) parts.push(`Status: ${ticket.status}`);
      if (ticket.escalated) parts.push(`Escalated to ${ticket.escalated}`);
      return parts.join('. ').replace(/\s+/g, ' ').trim();
    }

    async function generateResolutionSummary(ticket) {
      const rawResolution = htmlToPlainText(ticket.remarksHtml);
      const promptParts = [
        `Store: ${ticket.store || ''}`,
        `MID: ${ticket.mid || ''}`,
        `Merchant: ${ticket.merchant || ''}`,
        `Contact: ${ticket.contactNumber || ''}`,
        `Issue: ${ticket.issue || ''}`,
        `Escalated: ${ticket.escalated || ''}`,
        `Status: ${ticket.status || ''}`,
        `Resolution notes: ${rawResolution || ''}`,
      ];
      const prompt = [
        'Write a concise support-ticket resolution summary for the remarks field.',
        'Use the ticket details below and return only the final summary in one short paragraph.',
        'Do not add bullets, labels, markdown, or extra commentary.',
        '',
        promptParts.join('\n'),
      ].join('\n');

      const apiKey = getGeminiApiKey();
      if (!apiKey) return plainTextToRemarkHtml(buildFallbackResolutionSummary({ ...ticket, rawResolution }));

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: 'You write brief customer-support resolution notes. Keep the response under three sentences and return plain text only.',
                },
              ],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Gemini request failed with status ${response.status}`);
        }

        const data = await response.json();
        const summary = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
        if (summary) return plainTextToRemarkHtml(summary);
      } catch (error) {
        console.error('AI summary generation failed:', error);
      }

      return plainTextToRemarkHtml(buildFallbackResolutionSummary({ ...ticket, rawResolution }));
    }

    // pushUndo removed

    // ─── CLOCK ───
    window.clock = function(type, prefix) {
      const shift = document.getElementById(`${prefix}-shift`).value;
      if (!shift) { showNotification('Set SHIFT'); return; }
      if (!CLOCK_TIMES[shift]) { showNotification('Invalid SHIFT'); return; }
      const now = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dateStr = now.toLocaleDateString('en-US');
      const dayName = days[now.getDay()];
      const timeStr = CLOCK_TIMES[shift][type === 'IN' ? 0 : 1];
      const output = `${dateStr} - ${dayName} Shift\nClock ${type} - ${timeStr}`;
      navigator.clipboard.writeText(output).then(() => showNotification(`Clock ${type} copied!`));
    };

    // undo/redo handlers removed

    // ─── FORM DATA ───
    function saveFormData(prefix) {
      const fields = {
        creditcard: ['shift', 'mid', 'store', 'merchant', 'contactNumber', 'issue', 'escalated', 'status', 'remarks', 'date']
      };
      const formData = {};
      fields[prefix].forEach(id => {
        const el = document.getElementById(`${prefix}-${id}`);
        if (el) formData[id] = el.value;
      });
      localStorage.setItem(`${prefix}FormData_creditcard`, JSON.stringify(formData));
    }

    function loadFormData(prefix) {
      const saved = localStorage.getItem(`${prefix}FormData_creditcard`);
      if (saved) {
        try {
          const formData = JSON.parse(saved);
          Object.keys(formData).forEach(id => {
            const el = document.getElementById(`${prefix}-${id}`);
            if (el && formData[id] !== undefined) {
              el.value = formData[id];
              if (el.tagName === 'TEXTAREA') autoGrow(el);
            }
          });
        } catch (e) {}
      }
      creditcardUpdatePreview();
    }

    // ─── ENTRIES ───
    function saveAllEntries() {
      localStorage.setItem('unifiedEntries_creditcard', JSON.stringify(allEntries));
      updateStatusCounters();
    }

    function loadAllEntries() {
      const saved = localStorage.getItem('unifiedEntries_creditcard');
      if (saved) {
        try {
          allEntries = JSON.parse(saved);
          allEntries.forEach(entry => {
            if (entry.deleted === undefined) entry.deleted = false;
            if (entry.imported === undefined) entry.imported = false;
          });
        } catch (e) {}
      }
      renderTable();
      renderSidebar();
    }

    // ─── PREVIEW ───
    function creditcardUpdatePreview() {
      document.getElementById('creditcard-preview-mid').textContent = document.getElementById('creditcard-mid').value || '';
      document.getElementById('creditcard-preview-store').textContent = document.getElementById('creditcard-store').value || '';
      document.getElementById('creditcard-preview-merchant').textContent = document.getElementById('creditcard-merchant').value || '';
      document.getElementById('creditcard-preview-contactNumber').textContent = document.getElementById('creditcard-contactNumber').value || '';
      document.getElementById('creditcard-preview-issue').innerHTML = formatMultilinePreview(document.getElementById('creditcard-issue').value);
      const remarksHtml = document.getElementById('creditcard-remarks').value;
      document.getElementById('creditcard-preview-remarks').innerHTML = !isHtmlEmpty(remarksHtml) ? convertQuillLists(remarksHtml) : '';
      syncPreviewHeight();
    }

    // ─── ADD / EDIT / DELETE ───
    window.addEntry = async function(prefix) {
      if (prefix !== 'creditcard') return;

      const midEl = document.getElementById('creditcard-mid');
      const storeEl = document.getElementById('creditcard-store');
      let valid = true;
      [midEl, storeEl].forEach(el => {
        el.classList.remove('invalid');
        if (!el.value.trim()) {
          el.classList.add('invalid');
          valid = false;
        }
      });
      if (!valid) {
        showNotification('Please fill MID and STORE NAME!');
        return;
      }

      // undo removed

      const dateStr = document.getElementById('creditcard-date').value;
      const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('en-US') : storeGetFormattedDateMinusOne();
      const shift = document.getElementById('creditcard-shift').value;
      const support = document.getElementById('creditcard-support').value.toUpperCase() || 'AGENT';
      const mid = midEl.value.trim();
      const store = storeEl.value.trim();
      const merchant = document.getElementById('creditcard-merchant').value.trim();
      const contactNumber = document.getElementById('creditcard-contactNumber').value.trim();
      const issue = document.getElementById('creditcard-issue').value.trim();
      const escalated = document.getElementById('creditcard-escalated').value.trim();
      const status = document.getElementById('creditcard-status').value.trim();
      const remarksHtml = document.getElementById('creditcard-remarks').value;
      let remarks = remarksHtml;
      if (!editId) {
        const summaryHtml = await generateResolutionSummary({
          store,
          mid,
          merchant,
          contactNumber,
          issue,
          escalated,
          status,
          remarksHtml,
        });
        applyRemarksHtml(summaryHtml);
        remarks = document.getElementById('creditcard-remarks').value;
      }

      const newEntry = {
        id: Date.now(),
        date: formattedDate,
        shift,
        support,
        mid,
        store,
        merchant,
        contactNumber,
        issue,
        escalated,
        status,
        remarks,
        source: 'creditcard',
        deleted: false,
        imported: false,
      };

      if (editId) {
        const index = allEntries.findIndex(e => e.id === editId && e.source === 'creditcard');
        if (index !== -1) {
          allEntries[index] = { ...allEntries[index], ...newEntry, id: editId };
          showNotification('Credit Card entry updated!');
          localStorage.removeItem(EDIT_DRAFT_KEY + editId);
          editId = null;
          localStorage.removeItem(EDIT_STORAGE_KEY);
          const addBtn = document.querySelector('#tab-creditcard .add');
          if (addBtn) {
            addBtn.textContent = 'ADD ENTRY';
            addBtn.classList.remove('editing');
          }
        } else {
          allEntries.unshift(newEntry);
          showNotification('Credit Card entry added (edit target missing)!');
          localStorage.removeItem(EDIT_DRAFT_KEY + editId);
          editId = null;
          localStorage.removeItem(EDIT_STORAGE_KEY);
          const addBtn = document.querySelector('#tab-creditcard .add');
          if (addBtn) {
            addBtn.textContent = 'ADD ENTRY';
            addBtn.classList.remove('editing');
          }
        }
      } else {
        allEntries.unshift(newEntry);
        showNotification('Credit Card entry added!');
      }

      ['mid', 'store', 'merchant', 'contactNumber', 'issue', 'escalated', 'status'].forEach(id => {
        document.getElementById(`creditcard-${id}`).value = '';
      });
      if (quillEditor) {
        quillEditor.root.innerHTML = '';
        document.getElementById('creditcard-remarks').value = '';
      }

      saveAllEntries();
      updateStatusCounters();
      renderTable();
      renderSidebar();
      syncPreviewHeight();
    };

    function clearFormFields(prefix) {
      if (prefix === 'creditcard') {
        const fields = ['mid', 'store', 'merchant', 'contactNumber', 'issue', 'escalated', 'status'];
        fields.forEach(id => {
          const el = document.getElementById(`creditcard-${id}`);
          if (el) el.value = '';
        });
        if (quillEditor) {
          quillEditor.root.innerHTML = '';
          document.getElementById('creditcard-remarks').value = '';
        }
      }
      creditcardUpdatePreview();
      saveFormData(prefix);
    }

    window.clearFormOnly = function(prefix) {
      if (editId) {
        localStorage.removeItem(EDIT_DRAFT_KEY + editId);
        editId = null;
        localStorage.removeItem(EDIT_STORAGE_KEY);
        document.querySelectorAll('.add').forEach(btn => {
          btn.textContent = 'ADD ENTRY';
          btn.classList.remove('editing');
        });
        showNotification('Edit cancelled. Form cleared.');
      }
      clearFormFields(prefix);
      showNotification('Form cleared!');
      syncPreviewHeight();
    };

    function populateFormFromEntry(entry) {
      const dateParts = entry.date.split('/');
      if (dateParts.length === 3) {
        const month = dateParts[0].padStart(2, '0');
        const day = dateParts[1].padStart(2, '0');
        const year = dateParts[2];
        document.getElementById('creditcard-date').value = `${year}-${month}-${day}`;
      }
      document.getElementById('creditcard-shift').value = entry.shift || '';
      document.getElementById('creditcard-support').value = entry.support || '';
      document.getElementById('creditcard-mid').value = entry.mid || '';
      document.getElementById('creditcard-store').value = entry.store || '';
      document.getElementById('creditcard-merchant').value = entry.merchant || '';
      document.getElementById('creditcard-contactNumber').value = entry.contactNumber || '';
      document.getElementById('creditcard-issue').value = entry.issue || '';
      document.getElementById('creditcard-escalated').value = entry.escalated || '';
      document.getElementById('creditcard-status').value = entry.status || '';
      if (quillEditor && entry.remarks) {
        quillEditor.root.innerHTML = entry.remarks;
        document.getElementById('creditcard-remarks').value = entry.remarks;
      }
    }

    function attachDraftAutoSave(entryId) {
      const draftKey = EDIT_DRAFT_KEY + entryId;
      const saveDraft = () => {
        if (!editId || editId !== entryId) return;
        const formData = {};
        const fields = ['shift', 'mid', 'store', 'merchant', 'contactNumber', 'issue', 'escalated', 'status', 'remarks', 'date'];
        fields.forEach(id => {
          const el = document.getElementById(`creditcard-${id}`);
          if (el) formData[id] = el.value;
        });
        if (quillEditor) {
          formData.remarks = quillEditor.root.innerHTML;
        }
        formData.id = entryId;
        localStorage.setItem(draftKey, JSON.stringify(formData));
      };
      const elements = document.querySelectorAll('#tab-creditcard input, #tab-creditcard textarea, #tab-creditcard select');
      elements.forEach(el => {
        el.removeEventListener('input', saveDraft);
        el.addEventListener('input', saveDraft);
      });
      if (quillEditor) {
        quillEditor.off('text-change', saveDraft);
        quillEditor.on('text-change', saveDraft);
      }
      saveDraft();
    }

    window.editEntry = function(buttonOrId) {
      let entryId, entry;
      if (typeof buttonOrId === 'object' && buttonOrId !== null) {
        const id = buttonOrId.closest ? buttonOrId.closest('tr')?.dataset.id || buttonOrId.dataset.id : buttonOrId.dataset.id;
        if (!id) return;
        entryId = parseInt(id);
      } else if (typeof buttonOrId === 'number') {
        entryId = buttonOrId;
      } else {
        return;
      }
      entry = allEntries.find(e => e.id === entryId);
      if (!entry || entry.source !== 'creditcard') return;

      editId = entry.id;
      localStorage.setItem(EDIT_STORAGE_KEY, editId);

      const draftKey = EDIT_DRAFT_KEY + editId;
      localStorage.removeItem(draftKey);

      populateFormFromEntry(entry);
      creditcardUpdatePreview();

      const addBtn = document.querySelector('#tab-creditcard .add');
      if (addBtn) {
        addBtn.textContent = 'EDIT ENTRY';
        addBtn.classList.add('editing');
      }

      if (entry.imported) {
        entry.imported = false;
        saveAllEntries();
      }

      attachDraftAutoSave(editId);

      document.querySelectorAll('#tab-creditcard input, #tab-creditcard textarea, #tab-creditcard select').forEach(el => {
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      document.querySelectorAll('#tab-creditcard textarea').forEach(ta => autoGrow(ta));
      syncPreviewHeight();
    };

    window.softDeleteEntry = function(button) {
      const row = button.closest('tr');
      const id = row.dataset.id;
      // undo removed
      const entry = allEntries.find(e => e.id == id);
      if (entry) {
        entry.deleted = true;
        saveAllEntries();
        renderTable();
        renderSidebar();
        showNotification('Entry removed from main table (still in history)');
        if (editId == id) {
          editId = null;
          localStorage.removeItem(EDIT_STORAGE_KEY);
          document.querySelectorAll('.add').forEach(btn => {
            btn.textContent = 'ADD ENTRY';
            btn.classList.remove('editing');
          });
        }
      }
    };

    function hardDeleteEntry(entryId) {
      const entry = allEntries.find(e => e.id == entryId);
      if (!entry) { showNotification('Entry not found.'); return; }
      if (confirm('Delete this entry permanently? This action cannot be undone.')) {
        // undo removed
        const index = allEntries.findIndex(e => e.id == entryId);
        if (index !== -1) {
          allEntries.splice(index, 1);
          saveAllEntries();
          renderTable();
          renderSidebar();
          if (editId == entryId) {
            editId = null;
            localStorage.removeItem(EDIT_STORAGE_KEY);
            document.querySelectorAll('.add').forEach(btn => {
              btn.textContent = 'ADD ENTRY';
              btn.classList.remove('editing');
            });
          }
          showNotification('Entry permanently deleted.');
        }
      }
    }

    function restoreEntry(entryId) {
      const entry = allEntries.find(e => e.id == entryId);
      if (!entry) { showNotification('Entry not found.'); return; }
      if (!entry.deleted) { showNotification('Entry is already visible.'); return; }
      // undo removed
      entry.deleted = false;
      saveAllEntries();
      renderTable();
      renderSidebar();
      showNotification('Entry restored to main table.');
    }

    window.copyRow = function(button) {
      const tds = button.closest('tr').querySelectorAll('td');
      const dataTds = [...tds].slice(1, -1);
      const values = dataTds.map(td => escapeCSV(td.textContent || ''));
      navigator.clipboard.writeText(values.join('\t')).then(() => showNotification('Row copied!'));
    };

    // ─── TABLE ───
    function getVisibleEntries() {
      const todayEST = getESTDateString();
      let entries = allEntries.filter(entry => {
        if (entry.deleted) return false;
        const dateObj = parseDateFromString(entry.date);
        if (!dateObj) return false;
        const entryDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
        return entryDateStr <= todayEST && entry.source === 'creditcard';
      });
      if (currentStatusFilter) {
        entries = entries.filter(entry => (entry.status || '').toUpperCase() === currentStatusFilter);
      }
      return entries;
    }

    function renderTable() {
      const visibleEntries = getVisibleEntries();
      const tbody = document.querySelector('#entryTable tbody');
      tbody.innerHTML = '';
      visibleEntries.forEach(entry => {
        const row = document.createElement('tr');
        row.dataset.id = entry.id;
        row.innerHTML = `
                        <td><input type="checkbox" class="row-checkbox" value="${entry.id}"></td>
                        <td>${entry.date}</td>
                        <td>${entry.shift}</td>
                        <td>${entry.support}</td>
                        <td>${entry.mid}</td>
                        <td>${entry.store}</td>
                        <td>${entry.merchant || ''}</td>
                        <td>${entry.contactNumber}</td>
                        <td style="white-space:pre-wrap;">${entry.issue || ''}</td>
                        <td>${entry.escalated}</td>
                        <td>${entry.status}</td>
                        <td style="white-space:pre-wrap;">${entry.remarks || ''}</td>
                        <td class="action-cell">
                            <div class="action-container">
                                <button class="icon-btn copy-btn" onclick="copyRow(this)" title="Copy"><i class="bi bi-clipboard-fill"></i></button>
                                <button class="icon-btn edit-btn" onclick="editEntry(this)" title="Edit"><i class="bi bi-pencil-square"></i></button>
                                <button class="icon-btn delete-btn" onclick="softDeleteEntry(this)" title="Remove"><i class="bi bi-trash3-fill"></i></button>
                            </div>
                        </td>
                    `;
        tbody.appendChild(row);
      });
      updateSelectAllCheckboxState();
      updateStatusCounters();
    }

    function updateStatusCounters() {
      const todayEST = getESTDateString();
      const baseEntries = allEntries.filter(entry => {
        if (entry.deleted) return false;
        const dateObj = parseDateFromString(entry.date);
        if (!dateObj) return false;
        const entryDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
        return entryDateStr <= todayEST && entry.source === 'creditcard';
      });
      let resolved = 0, pending = 0, other = 0;
      baseEntries.forEach(entry => {
        const status = (entry.status || '').toUpperCase();
        if (status === 'RESOLVED') resolved++;
        else if (status === 'PENDING') pending++;
        else if (status === 'OTHER TASK') other++;
      });
      document.getElementById('counterResolved').innerText = resolved;
      document.getElementById('counterPending').innerText = pending;
      document.getElementById('counterOther').innerText = other;
    }

    function updateSelectAllCheckboxState() {
      const selectAllBar = document.getElementById('selectAllCheckbox');
      const rowCheckboxes = document.querySelectorAll('#entryTable tbody .row-checkbox');
      const allChecked = rowCheckboxes.length > 0 && Array.from(rowCheckboxes).every(cb => cb.checked);
      selectAllBar.checked = allChecked;
    }

    function handleSelectAll(checkbox) {
      const checked = checkbox.checked;
      document.querySelectorAll('#entryTable tbody .row-checkbox').forEach(cb => cb.checked = checked);
      updateSelectAllCheckboxState();
    }

    window.filterByStatus = function(status) {
      if (currentStatusFilter === status) {
        currentStatusFilter = null;
      } else {
        currentStatusFilter = status;
      }
      document.querySelectorAll('.status-filter-btn').forEach(btn => {
        if (btn.dataset.status === currentStatusFilter) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      renderTable();
    };

    // ─── CLEAR ALL ───
    function clearAllEntries() {
      if (!confirm('Delete ALL entries permanently? This cannot be undone.')) return;
      // undo removed
      allEntries = [];
      saveAllEntries();
      renderTable();
      renderSidebar();
      showNotification('All entries cleared.');
    }

    // ─── SIDEBAR ───
    function getYesterdayFormatted() {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    function renderSidebar() {
      const container = document.getElementById('creditcardHistoryContent');
      if (!container) return;

      const now = new Date();
      const currentMonthKey = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
      const todayEST = getESTDateString();
      const todayFormatted = new Date(todayEST).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      const historyEntries = allEntries.filter(entry => !entry.imported && entry.source === 'creditcard');

      const grouped = {};
      historyEntries.forEach(entry => {
        if (!entry.date) return;
        const parts = entry.date.split('/');
        if (parts.length !== 3) return;
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        const dateObj = new Date(year, month - 1, day);
        const monthKey = `${dateObj.toLocaleString('default', { month: 'long' })} ${year}`;
        const dateKey = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        if (!grouped[monthKey]) grouped[monthKey] = {};
        if (!grouped[monthKey][dateKey]) grouped[monthKey][dateKey] = [];
        grouped[monthKey][dateKey].push(entry);
      });

      const sortedMonths = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

      let html = '';
      for (const month of sortedMonths) {
        if (collapseState.months[month] === undefined) {
          collapseState.months[month] = month !== currentMonthKey;
        }
        const isMonthCollapsed = collapseState.months[month];
        const monthArrow = isMonthCollapsed ? '▶' : '▼';
        html += `<div class="sidebar-group">
                        <div class="month-header" onclick="toggleMonth('${month.replace(/'/g, "\\'")}')">
                            <span class="month-arrow">${monthArrow}</span> ${month}
                        </div>`;
        if (!isMonthCollapsed) {
          const dates = grouped[month];
          const sortedDates = Object.keys(dates).sort((a, b) => new Date(b) - new Date(a));
          for (const dateKey of sortedDates) {
            if (collapseState.dates[dateKey] === undefined) {
              collapseState.dates[dateKey] = dateKey !== todayFormatted;
            }
            const isDateCollapsed = collapseState.dates[dateKey];
            const dateArrow = isDateCollapsed ? '▶' : '▼';
            html += `<div class="date-group">
                                <div class="date-header" onclick="toggleDate('${dateKey.replace(/'/g, "\\'")}')">
                                    <span class="date-arrow">${dateArrow}</span> ${dateKey}
                                </div>`;
            if (!isDateCollapsed) {
              html += `<div class="date-entries">`;
              for (const entry of dates[dateKey]) {
                let issueDisplay = (entry.issue || '-').toUpperCase();
                if (entry.status && entry.status.toUpperCase() === 'OTHER TASK') {
                  issueDisplay = 'OTHER TASK';
                }
                let issueTextColor = '';
                switch ((entry.status || '').toUpperCase()) {
                  case 'RESOLVED': issueTextColor = '#11734b'; break;
                  case 'PENDING': issueTextColor = '#b10202'; break;
                  case 'OTHER TASK': issueTextColor = '#1a6d9f'; break;
                  default: issueTextColor = '';
                }
                const styleIssue = issueTextColor ? `style="color:${issueTextColor};"` : '';
                html += `
                                        <div class="sidebar-card" data-id="${entry.id}">
                                            <div class="preview-item issue-item" ${styleIssue}>${escapeHtml(issueDisplay)}</div>
                                            <div class="preview-item"><strong>MID:</strong> ${escapeHtml(entry.mid || '-')}</div>
                                            <div class="preview-item"><strong>Store:</strong> ${escapeHtml(entry.store || '-')}</div>
                                            <div class="preview-item"><strong>Merchant:</strong> ${escapeHtml(entry.merchant || '-')}</div>
                                            <div class="card-actions">
                                                <div class="card-actions-row stack-row">
                                                    <button class="copy-store" data-id="${entry.id}">📋 DETAILS</button>
                                                    <button class="copy-details" data-id="${entry.id}">📋 HRMS</button>
                                                </div>
                                                <div class="card-actions-row">
                                                    <button class="edit-entry stack-btn" data-id="${entry.id}">✏️<br>EDIT</button>
                                                    <button class="return-entry stack-btn" data-id="${entry.id}">↩️<br>RETURN</button>
                                                    <button class="delete-entry stack-btn" data-id="${entry.id}">🗑️<br>DELETE</button>
                                                </div>
                                            </div>
                                        </div>
                                    `;
              }
              html += `</div>`;
            }
            html += `</div>`;
          }
        }
        html += `</div>`;
      }

      if (historyEntries.length === 0) {
        html = '<div style="padding:20px; text-align:center; color:#64748b;">No entries yet.</div>';
      }

      container.innerHTML = html;
      attachSidebarEvents(container);
    }

    function saveCollapseState() {
      localStorage.setItem('sidebarCollapseState_creditcard', JSON.stringify({ months: collapseState.months, dates: collapseState.dates }));
    }

    window.toggleMonth = function(monthKey) {
      collapseState.months[monthKey] = !collapseState.months[monthKey];
      saveCollapseState();
      renderSidebar();
    };

    window.toggleDate = function(dateKey) {
      collapseState.dates[dateKey] = !collapseState.dates[dateKey];
      saveCollapseState();
      renderSidebar();
    };

    function attachSidebarEvents(container) {
      container.querySelectorAll('.copy-store').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const entry = allEntries.find(e => e.id == id);
          if (entry) {
            const plainText =
                `MID: ${entry.mid}\nSTORE NAME: ${entry.store}\nMERCHANT: ${entry.merchant || ''}\nCONTACT #: ${entry.contactNumber}\n\nISSUE:\n${entry.issue || ''}`;
            const htmlContent =
                `<strong>MID: </strong>${escapeHtml(entry.mid)}<br><strong>STORE NAME: </strong>${escapeHtml(entry.store)}<br><strong>MERCHANT: </strong>${escapeHtml(entry.merchant || '')}<br><strong>CONTACT #: </strong>${escapeHtml(entry.contactNumber)}<br><br><strong>ISSUE:</strong><br>${escapeHtml(entry.issue || '').replace(/\n/g, '<br>')}`;
            try {
              const blobHtml = new Blob([htmlContent], { type: 'text/html' });
              const blobPlain = new Blob([plainText], { type: 'text/plain' });
              await navigator.clipboard.write([
                new ClipboardItem({ 'text/plain': blobPlain, 'text/html': blobHtml })
              ]);
              showNotification('Details copied (rich format)');
            } catch (err) {
              navigator.clipboard.writeText(plainText);
              showNotification('Details copied (plain text)');
            }
          }
        });
      });

      container.querySelectorAll('.copy-details').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const entry = allEntries.find(e => e.id == id);
          if (entry) {
            const plainText = `📞 CONTACT:\nCALLER NAME: ${entry.merchant || ''}\nCONTACT NUMBER: ${entry.contactNumber}\n\n🔧 ISSUE:\n${entry.issue || ''}\n\n✅ RESOLUTION:\n${entry.remarks || ''}`;
            const htmlContent =
                `<strong>📞 CONTACT: </strong><br><strong>MERCHANT: </strong> ${escapeHtml(entry.merchant || '')}<br><strong>CONTACT NUMBER: </strong> ${escapeHtml(entry.contactNumber)}<br><br><strong>🔧 ISSUE: </strong><br>${escapeHtml(entry.issue || '').replace(/\n/g, '<br>')}<br><br><strong>✅ RESOLUTION: </strong><br>${escapeHtml(entry.remarks || '').replace(/\n/g, '<br>')}`;
            try {
              const blob = new Blob([htmlContent], { type: 'text/html' });
              const plainBlob = new Blob([plainText], { type: 'text/plain' });
              await navigator.clipboard.write([
                new ClipboardItem({ 'text/plain': plainBlob, 'text/html': blob })
              ]);
              showNotification('HRMS details copied (rich format)');
            } catch (err) {
              navigator.clipboard.writeText(plainText);
              showNotification('HRMS details copied (plain text)');
            }
          }
        });
      });

      container.querySelectorAll('.edit-entry').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.dataset.id);
          window.editEntry(id);
        });
      });

      container.querySelectorAll('.return-entry').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          restoreEntry(Number(id));
        });
      });

      container.querySelectorAll('.delete-entry').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          hardDeleteEntry(Number(id));
        });
      });
    }

    // ─── BULK OPERATIONS ───
    function getSelectedRowIds() {
      const checkboxes = document.querySelectorAll('#entryTable tbody .row-checkbox:checked');
      return Array.from(checkboxes).map(cb => cb.value);
    }

    function bulkDelete() {
      const ids = getSelectedRowIds();
      if (ids.length === 0) { showNotification('No rows selected'); return; }
      if (!confirm(`Remove ${ids.length} selected entries?`)) return;
      // undo removed
      ids.forEach(id => {
        const entry = allEntries.find(e => e.id == id);
        if (entry) entry.deleted = true;
      });
      saveAllEntries();
      renderTable();
      renderSidebar();
      showNotification(`${ids.length} entries removed.`);
    }

    function bulkCopy() {
      const ids = getSelectedRowIds();
      if (ids.length === 0) { showNotification('No rows selected'); return; }
      const selectedRows = allEntries.filter(entry => ids.includes(entry.id.toString()));
      selectedRows.reverse();
      const rows = selectedRows.map(entry =>
        [entry.date, entry.shift, entry.support, entry.mid, entry.store, entry.merchant || '', entry.contactNumber, entry.issue || '', entry.escalated || '', entry.status || '', entry.remarks || '']
        .map(f => escapeCSV(String(f ?? ''))).join('\t')
      );
      navigator.clipboard.writeText(rows.join('\n')).then(() => showNotification(`Copied ${rows.length} rows`));
    }

    // ─── COMBOBOX ───
    function initCombobox(comboboxId, hiddenId, optionsArray, suggestionsId, onSelectCallback) {
      const input = document.getElementById(comboboxId);
      const hidden = document.getElementById(hiddenId);
      const suggestionsDiv = document.getElementById(suggestionsId);
      if (!input || !hidden || !suggestionsDiv) return;
      let currentFocus = -1;
      let currentOptions = [];
      let ignoreNextRender = false;

      function renderSuggestions(filterText) {
        if (ignoreNextRender) return;
        const filter = filterText.trim().toLowerCase();
        currentOptions = filter === '' ? [...optionsArray] : optionsArray.filter(opt => opt.toLowerCase().includes(filter));
        suggestionsDiv.innerHTML = '';
        if (currentOptions.length === 0) { suggestionsDiv.style.display = 'none'; return; }
        currentOptions.forEach((opt, idx) => {
          const div = document.createElement('div');
          div.className = 'combobox-suggestion-item';
          div.textContent = opt;
          div.setAttribute('data-value', opt);
          div.addEventListener('click', (e) => { e.stopPropagation();
            selectOption(opt); });
          div.addEventListener('mouseenter', () => { setFocus(idx); });
          suggestionsDiv.appendChild(div);
        });
        suggestionsDiv.style.display = 'block';
        currentFocus = -1;
      }

      function selectOption(value) {
        input.value = value;
        hidden.value = value;
        suggestionsDiv.style.display = 'none';
        ignoreNextRender = true;
        if (onSelectCallback) onSelectCallback(value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(() => { ignoreNextRender = false; }, 100);
      }

      function setFocus(index) {
        const items = suggestionsDiv.querySelectorAll('.combobox-suggestion-item');
        items.forEach((item, i) => {
          if (i === index) item.classList.add('selected');
          else item.classList.remove('selected');
        });
        currentFocus = index;
        if (index >= 0 && items[index]) items[index].scrollIntoView({ block: 'nearest' });
      }

      input.addEventListener('input', (e) => {
        if (input._skipNextInput) { delete input._skipNextInput; return; }
        if (ignoreNextRender) return;
        const val = e.target.value;
        hidden.value = val;
        renderSuggestions(val);
        if (onSelectCallback) onSelectCallback(val);
      });

      input.addEventListener('focus', () => {
        if (ignoreNextRender) return;
        renderSuggestions(input.value);
      });

      input.addEventListener('keydown', (e) => {
        const items = suggestionsDiv.querySelectorAll('.combobox-suggestion-item');
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (currentFocus < items.length - 1) setFocus(currentFocus + 1);
          else if (items.length > 0) setFocus(0);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (currentFocus > 0) setFocus(currentFocus - 1);
          else if (items.length > 0) setFocus(items.length - 1);
        } else if (e.key === 'Enter' && currentFocus >= 0 && items[currentFocus]) {
          e.preventDefault();
          selectOption(items[currentFocus].textContent);
        } else if (e.key === 'Escape') {
          suggestionsDiv.style.display = 'none';
        }
      });

      document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestionsDiv.contains(e.target)) {
          suggestionsDiv.style.display = 'none';
          ignoreNextRender = false;
        }
      });

      if (hidden.value) input.value = hidden.value;
    }

    // ─── THEME ───
    function initTheme() {
      const savedTheme = localStorage.getItem('theme_creditcard');
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').textContent = '☀️';
      } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('themeToggle').textContent = '🌙';
      }
    }

    function toggleTheme() {
      const isDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem('theme_creditcard', isDark ? 'dark' : 'light');
      document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
      syncPreviewHeight();
    }

    // ─── INIT ───
    window.switchToTab = function(tab) {
      const mapping = {
        creditcard: 'tab-creditcard'
      };
      Object.values(mapping).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (id === mapping[tab]) ? 'block' : 'none';
      });
      document.querySelectorAll('.tab-btn').forEach(btn => {
        const expected = btn.id.replace('tabBtn-', '');
        if (expected === tab) btn.classList.add('active'); else btn.classList.remove('active');
      });
      syncPreviewHeight();
    };

    // Manage tab overflow into a dropdown when space is limited
    

    window.createNewTicket = function() {
      // Create a new draft tab and activate it (snapshot current if needed)
      const tabsContainer = document.querySelector('.top-tabs');
      if (!tabsContainer) return showNotification('Tabs container missing');
      // if there's work in form and no active draft, snapshot into a new tab
      const midVal = document.getElementById('creditcard-mid')?.value?.trim();
      const storeVal = document.getElementById('creditcard-store')?.value?.trim();
      const remarksVal = document.getElementById('creditcard-remarks')?.value?.trim();
      const hasContent = !!(midVal || storeVal || remarksVal);
      if (!currentDraftId && hasContent) {
        const snapId = `draft-${Date.now()}`;
        const snapBtn = document.createElement('button'); snapBtn.id = `ticketTab-${snapId}`; snapBtn.className = 'tab-btn';
        const lbl = document.createElement('span'); lbl.className = 'tab-label'; lbl.textContent = `${midVal || 'Ticket'} • ${storeVal || ''}`; lbl.title = lbl.textContent;
        const close = document.createElement('button'); close.className = 'tab-close'; close.textContent = '×'; close.title = 'Close tab'; close.onclick = (e) => { e.stopPropagation(); closeDraftTab(snapId); };
        snapBtn.appendChild(lbl); snapBtn.appendChild(close); snapBtn.onclick = () => activateDraftTab(snapId);
        tabsContainer.appendChild(snapBtn);
        const saved = JSON.parse(localStorage.getItem(DRAFT_TABS_KEY) || '[]'); saved.push({ id: snapId, label: lbl.textContent }); localStorage.setItem(DRAFT_TABS_KEY, JSON.stringify(saved));
        // save data
        const data = { shift:'', mid: midVal || '', store: storeVal || '', merchant:'', contactNumber:'', issue:'', escalated:'', status:'', remarks: remarksVal || '', date: getESTDateString(), support:'' };
        localStorage.setItem(`draftData_${snapId}`, JSON.stringify(data));
      }
      const draftId = `draft-${Date.now()}`;
      const btn = document.createElement('button'); btn.id = `ticketTab-${draftId}`; btn.className = 'tab-btn';
      const labelSpan = document.createElement('span'); labelSpan.className = 'tab-label'; labelSpan.textContent = 'Ticket'; labelSpan.title = 'Ticket';
      const closeBtn = document.createElement('button'); closeBtn.className = 'tab-close'; closeBtn.textContent = '×'; closeBtn.title = 'Close tab'; closeBtn.onclick = (e) => { e.stopPropagation(); closeDraftTab(draftId); };
      btn.appendChild(labelSpan); btn.appendChild(closeBtn); btn.onclick = () => activateDraftTab(draftId);
      tabsContainer.appendChild(btn);
      const savedNow = JSON.parse(localStorage.getItem(DRAFT_TABS_KEY) || '[]'); savedNow.push({ id: draftId, label: 'Ticket' }); localStorage.setItem(DRAFT_TABS_KEY, JSON.stringify(savedNow));
      activateDraftTab(draftId);
      manageTabOverflow();
      showNotification('New ticket tab created');
    };

    // Draft tabs / drafts state
    let currentDraftId = null;

    function saveDraftData(draftId) {
      if (!draftId) return;
      const fields = ['shift', 'mid', 'store', 'merchant', 'contactNumber', 'issue', 'escalated', 'status', 'remarks', 'date', 'support'];
      const data = {};
      fields.forEach(id => {
        const el = document.getElementById(`creditcard-${id}`);
        if (el) data[id] = el.value;
      });
      if (quillEditor) data.remarks = document.getElementById('creditcard-remarks').value;
      localStorage.setItem(`draftData_${draftId}`, JSON.stringify(data));
      // update tab label to include MID/store summary
      updateTabLabelFromDraft(draftId, data);
    }

    function loadDraftData(draftId) {
      const raw = localStorage.getItem(`draftData_${draftId}`);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (e) { return null; }
    }

    function activateDraftTab(draftId) {
      // mark UI
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      const thisBtn = document.getElementById(`ticketTab-${draftId}`);
      if (thisBtn) thisBtn.classList.add('active');
      // load draft into form
      const data = loadDraftData(draftId);
      editId = null;
      localStorage.removeItem(EDIT_STORAGE_KEY);
      if (data) {
        // populate
        ['date','shift','support','mid','store','merchant','contactNumber','issue','escalated','status'].forEach(id => {
          const el = document.getElementById(`creditcard-${id}`);
          if (el && data[id] !== undefined) el.value = data[id];
        });
        if (quillEditor && data.remarks) {
          quillEditor.root.innerHTML = data.remarks;
          document.getElementById('creditcard-remarks').value = data.remarks;
        }
      } else {
        clearFormFields('creditcard');
      }
      currentDraftId = draftId;
      creditcardUpdatePreview();
      syncPreviewHeight();
      // attach auto-save for this draft
      attachDraftAutoSaveForDraft(draftId);
      const midEl = document.getElementById('creditcard-mid');
      if (midEl) midEl.focus();
    }

    function attachDraftAutoSaveForDraft(draftId) {
      // Disable automatic per-keystroke draft saves for tabs.
      // This function intentionally does not attach input listeners.
      // It will update tab label from any existing saved data.
      const data = loadDraftData(draftId);
      if (data) updateTabLabelFromDraft(draftId, data);
    }

    function updateTabLabelFromDraft(draftId, data) {
      try {
        const btn = document.getElementById(`ticketTab-${draftId}`);
        if (!btn) return;
        const labelSpan = btn.querySelector('.tab-label');
        const mid = (data && data.mid) ? data.mid : document.getElementById('creditcard-mid')?.value || '';
        const store = (data && data.store) ? data.store : document.getElementById('creditcard-store')?.value || '';
        let label = 'Ticket';
        if (mid) label = mid;
        if (store) label = `${label} • ${store.length > 12 ? store.slice(0,12)+'…' : store}`;
        if (labelSpan) labelSpan.textContent = label;
        // persist label in DRAFT_TABS_KEY
        const saved = JSON.parse(localStorage.getItem(DRAFT_TABS_KEY) || '[]');
        const idx = saved.findIndex(s => s.id === draftId);
        if (idx !== -1) { saved[idx].label = label; localStorage.setItem(DRAFT_TABS_KEY, JSON.stringify(saved)); }
      } catch (e) {}
    }

    function closeDraftTab(draftId) {
      // remove UI
      const btn = document.getElementById(`ticketTab-${draftId}`);
      if (btn) btn.remove();
      // remove stored draft data and tab entry
      localStorage.removeItem(`draftData_${draftId}`);
      const saved = JSON.parse(localStorage.getItem(DRAFT_TABS_KEY) || '[]');
      const updated = saved.filter(s => s.id !== draftId);
      localStorage.setItem(DRAFT_TABS_KEY, JSON.stringify(updated));
      // if closed tab was active, switch to creditcard main tab
      if (currentDraftId === draftId) {
        currentDraftId = null;
        window.switchToTab && window.switchToTab('creditcard');
      }
      // update overflow handling
      manageTabOverflow();
      showNotification('Draft tab closed');
    }

    // Manual draft save API
    window.saveDraftNow = function(draftId) {
      if (!draftId) {
        showNotification('No draft selected');
        return;
      }
      saveDraftData(draftId);
      showNotification('Draft saved');
      manageTabOverflow();
    };

    window.saveCurrentDraft = function() {
      if (currentDraftId) { window.saveDraftNow(currentDraftId); return; }
      // if no active draft, create one from current form and save
      const draftId = `draft-${Date.now()}`;
      const tabsContainer = document.querySelector('.top-tabs');
      if (!tabsContainer) return showNotification('Tabs container missing');
      const btn = document.createElement('button'); btn.id = `ticketTab-${draftId}`; btn.className = 'tab-btn';
      const labelSpan = document.createElement('span'); labelSpan.className = 'tab-label'; labelSpan.textContent = 'Ticket'; labelSpan.title = 'Ticket';
      const closeBtn = document.createElement('button'); closeBtn.className = 'tab-close'; closeBtn.textContent = '×'; closeBtn.title = 'Close tab'; closeBtn.onclick = (e) => { e.stopPropagation(); closeDraftTab(draftId); };
      btn.appendChild(labelSpan); btn.appendChild(closeBtn); btn.onclick = () => activateDraftTab(draftId);
      tabsContainer.appendChild(btn);
      const savedNow = JSON.parse(localStorage.getItem(DRAFT_TABS_KEY) || '[]'); savedNow.push({ id: draftId, label: 'Ticket' }); localStorage.setItem(DRAFT_TABS_KEY, JSON.stringify(savedNow));
      // save data
      saveDraftData(draftId);
      activateDraftTab(draftId);
      manageTabOverflow();
      showNotification('Draft created and saved');
    };


    function init() {
      const todayEST = getESTDateString();
      document.getElementById('creditcard-date').value = todayEST;

      const savedCollapse = localStorage.getItem('sidebarCollapseState_creditcard');
      if (savedCollapse) {
        try {
          const parsed = JSON.parse(savedCollapse);
          collapseState.months = parsed.months || {};
          collapseState.dates = parsed.dates || {};
        } catch (e) {}
      }

      loadFormData('creditcard');
      loadAllEntries();

      // Restore draft tabs from storage
      (function restoreDraftTabs() {
        const tabsContainer = document.querySelector('.top-tabs');
        if (!tabsContainer) return;
        let saved = JSON.parse(localStorage.getItem(DRAFT_TABS_KEY) || '[]');
        if (!Array.isArray(saved)) return;
        // Deduplicate saved entries (preserve first occurrence)
        const seen = new Set();
        const deduped = [];
        saved.forEach(item => {
          const id = (typeof item === 'string') ? item : (item && item.id);
          if (!id) return;
          if (!seen.has(id)) {
            seen.add(id);
            deduped.push(item);
          }
        });
        // If duplicates were removed, persist the cleaned list
        if (deduped.length !== saved.length) {
          try { localStorage.setItem(DRAFT_TABS_KEY, JSON.stringify(deduped)); } catch (e) {}
          saved = deduped;
        }
        saved.forEach(item => {
          const draftId = (typeof item === 'string') ? item : item.id;
          const label = (typeof item === 'string') ? 'Ticket' : (item.label || 'Ticket');
          if (!draftId) return;
          if (document.getElementById(`ticketTab-${draftId}`)) return;
          const btn = document.createElement('button');
          btn.id = `ticketTab-${draftId}`;
          btn.className = 'tab-btn';
          const labelSpan = document.createElement('span');
          labelSpan.className = 'tab-label';
          labelSpan.textContent = label;
          const closeBtn = document.createElement('button');
          closeBtn.className = 'tab-close';
          closeBtn.textContent = '×';
          closeBtn.title = 'Close tab';
          closeBtn.onclick = (e) => { e.stopPropagation(); closeDraftTab(draftId); };
          btn.appendChild(labelSpan);
          btn.appendChild(closeBtn);
          btn.onclick = () => activateDraftTab(draftId);
          tabsContainer.appendChild(btn);
          // if draft data exists, update label from data
          const data = loadDraftData(draftId);
          if (data) updateTabLabelFromDraft(draftId, data);
        });
        // update overflow handling
        manageTabOverflow();
        // optionally activate last tab
        if (saved.length > 0) {
          const last = saved[saved.length - 1];
          const lastId = (typeof last === 'string') ? last : last.id;
          setTimeout(() => activateDraftTab(lastId), 200);
        }
      })();

      // Watch for tab list changes and reflow overflow accordingly
      const tabsContainerObserverTarget = document.querySelector('.top-tabs');
      if (tabsContainerObserverTarget) {
        const mo = new MutationObserver(() => manageTabOverflow());
        mo.observe(tabsContainerObserverTarget, { childList: true });
      }

      const storedEditId = localStorage.getItem(EDIT_STORAGE_KEY);
      if (storedEditId) {
        const id = parseInt(storedEditId);
        const entryToEdit = allEntries.find(e => e.id === id && !e.deleted);
        if (entryToEdit) {
          setTimeout(() => { window.editEntry(id); }, 100);
        } else {
          localStorage.removeItem(EDIT_STORAGE_KEY);
          localStorage.removeItem(EDIT_DRAFT_KEY + id);
        }
      }

      archiveOldEntries();
      saveAllEntries();

      initTheme();
      document.getElementById('themeToggle').addEventListener('click', toggleTheme);
      document.getElementById('clearAllBtn').addEventListener('click', clearAllEntries);
      document.getElementById('bulkDeleteBtn').addEventListener('click', bulkDelete);
      document.getElementById('bulkCopyBtn').addEventListener('click', bulkCopy);
      document.getElementById('selectAllCheckbox').addEventListener('change', (e) => handleSelectAll(e.target));
      document.addEventListener('change', (e) => {
        if (e.target.classList.contains('row-checkbox')) {
          updateSelectAllCheckboxState();
        }
      });

      // undo/redo keyboard shortcuts removed

      const fields = ['mid', 'store', 'merchant', 'contactNumber', 'issue', 'escalated', 'status'];
      fields.forEach(id => {
        const el = document.getElementById(`creditcard-${id}`);
        if (el) {
          el.addEventListener('input', () => {
            creditcardUpdatePreview();
            saveFormData('creditcard');
          });
        }
      });
      document.getElementById('creditcard-shift').addEventListener('change', () => saveFormData('creditcard'));

      const creditcardContactNumber = document.getElementById('creditcard-contactNumber');
      if (creditcardContactNumber) {
        creditcardContactNumber.addEventListener('input', function() {
          let digits = this.value.replace(/\D/g, '');
          if (digits.length > 10) digits = digits.slice(0, 10);
          let formatted = '';
          if (digits.length > 0) {
            if (digits.length <= 3) formatted = `(${digits}`;
            else if (digits.length <= 6) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
            else formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
          }
          this.value = formatted;
          saveFormData('creditcard');
          creditcardUpdatePreview();
        });
        creditcardContactNumber.addEventListener('blur', function() {
          let digits = this.value.replace(/\D/g, '');
          if (digits.length > 0 && digits.length < 10) {
            digits = digits.padStart(10, '0');
            let formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
            this.value = formatted;
            saveFormData('creditcard');
            creditcardUpdatePreview();
          }
        });
      }

      quillEditor = new Quill('#creditcard-remarks-editor', {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean']
          ]
        },
      });

      if (quillEditor && document.getElementById('creditcard-remarks').value) {
        quillEditor.root.innerHTML = document.getElementById('creditcard-remarks').value;
      }

      quillEditor.root.addEventListener('input', function() {
        const htmlContent = quillEditor.root.innerHTML;
        document.getElementById('creditcard-remarks').value = htmlContent;
        creditcardUpdatePreview();
        saveFormData('creditcard');
      });

      initCombobox('creditcard-status-combobox', 'creditcard-status', STATUS_OPTIONS, 'creditcard-status-suggestions', () => {
        creditcardUpdatePreview();
        saveFormData('creditcard');
      });

      window.addEventListener('resize', () => { syncPreviewHeight(); manageTabOverflow(); });

      // Manage tab overflow into a dropdown when space is limited
      function manageTabOverflow() {
        const container = document.querySelector('.top-tabs');
        if (!container) return;
        // remove existing dropdown if present
        const existingDropdown = container.querySelector('.tabs-dropdown');
        if (existingDropdown) existingDropdown.remove();

        const tabButtons = Array.from(container.querySelectorAll('.tab-btn'));
        if (tabButtons.length === 0) return;

        // Ensure static tabs are shown first
        const staticIds = ['tabBtn-creditcard', 'tabBtn-newticket'];
        const ordered = [];
        staticIds.forEach(id => {
          const b = tabButtons.find(t => t.id === id);
          if (b) ordered.push(b);
        });
        tabButtons.forEach(t => { if (!ordered.includes(t)) ordered.push(t); });

        // measure available width
        const containerWidth = container.clientWidth;
        let used = 0;
        const visible = [];
        const overflow = [];
        // reserve space for dropdown button (~40px)
        const reserve = 44;

        ordered.forEach(btn => {
          btn.style.display = 'inline-flex';
          const w = btn.offsetWidth + 8; // include gap
          if (used + w <= containerWidth - reserve) {
            visible.push(btn);
            used += w;
          } else {
            overflow.push(btn);
          }
        });

        if (overflow.length > 0) {
          // hide overflowed tabs
          overflow.forEach(b => { b.style.display = 'none'; });
          // create dropdown
          const dropdown = document.createElement('div');
          dropdown.className = 'tabs-dropdown';
          const ddBtn = document.createElement('button');
          ddBtn.type = 'button';
          ddBtn.textContent = '⋯';
          const ul = document.createElement('ul');
          overflow.forEach(b => {
            const li = document.createElement('li');
            const id = b.id;
            const label = b.querySelector('.tab-label')?.textContent || b.textContent || id;
            li.textContent = label;
            li.onclick = (e) => {
              e.stopPropagation();
              // activate tab
              const draftId = id.replace('ticketTab-','');
              activateDraftTab(draftId);
              manageTabOverflow();
              ul.classList.remove('show');
            };
            ul.appendChild(li);
          });
          ddBtn.onclick = (e) => { e.stopPropagation(); ul.classList.toggle('show'); };
          dropdown.appendChild(ddBtn);
          dropdown.appendChild(ul);
          container.appendChild(dropdown);
          // close on outside click
          document.addEventListener('click', () => { ul.classList.remove('show'); });
        }
      }

      function archiveOldEntries() {
        const today = getESTDateString();
        allEntries.forEach(entry => {
          if (entry.deleted) return;
          const dateObj = parseDateFromString(entry.date);
          if (!dateObj) return;
          const yyyy = dateObj.getFullYear();
          const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
          const dd = String(dateObj.getDate()).padStart(2, '0');
          const entryDate = `${yyyy}-${mm}-${dd}`;
          if (entryDate < today) {
            entry.deleted = true;
          }
        });
      }

      function checkAndRefreshTable() {
        const todayEST = getESTDateString();
        const storedDate = localStorage.getItem('lastClearDate_creditcard');
        if (storedDate !== todayEST) {
          archiveOldEntries();
          saveAllEntries();
          renderTable();
          renderSidebar();
          showNotification('New day detected. Previous entries moved to history.');
          setTimeout(() => { window.location.reload(); }, 2000);
          localStorage.setItem('lastClearDate_creditcard', todayEST);
        }
      }
      if (!localStorage.getItem('lastClearDate_creditcard')) {
        localStorage.setItem('lastClearDate_creditcard', getESTDateString());
      }
      setInterval(checkAndRefreshTable, 60000);

      const IDLE_REFRESH_DELAY = 900000;
      let idleTimeout;
      function idleReload() { window.location.reload(); }
      function resetIdleTimer() { if (idleTimeout) clearTimeout(idleTimeout);
        idleTimeout = setTimeout(idleReload, IDLE_REFRESH_DELAY); }
      ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'focusin', 'input'].forEach(eventName => {
        window.addEventListener(eventName, resetIdleTimer, { passive: true });
      });
      resetIdleTimer();

      setInterval(() => { updateStatusCounters(); }, 30000);

      window.addEventListener('beforeunload', () => {
        saveFormData('creditcard');
        if (editId) {
          attachDraftAutoSave(editId);
        }
      });

      creditcardUpdatePreview();
      syncPreviewHeight();
      manageTabOverflow();
    }

    init();
  })();
}