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

    const EDIT_STORAGE_KEY = 'editingEntryId_creditcard';
    const EDIT_DRAFT_KEY = 'editingDraft_creditcard_';
    const DRAFT_TABS_KEY = 'ticketDraftTabs_creditcard';
    const collapseState = { months: {}, dates: {} };
    const STATUS_OPTIONS = ['RESOLVED', 'PENDING', 'OTHER TASK', 'UNSOLVED'];
    const CLOCK_TIMES = {
      '9PM - 8AM': ['09:00 PM', '06:00 AM'],
      '7:30AM - 6:30PM': ['05:00 AM', '02:00 PM'],
      '6PM - 5AM': ['02:00 PM', '11:00 PM'],
    };
    const GEMINI_API_KEY_STORAGE_KEY = 'creditcardGeminiApiKey';
    
    const GEMINI_MODELS = [
      'gemini-2.5-flash-lite',
      'gemini-3.1-flash-lite-preview',
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash',
      'gemini-3-flash-preview',
      'gemini-2.5-flash',
      'gemini-pro-latest',
      'gemini-3-pro-preview',
      'gemini-3.1-pro-preview',
      'gemini-2.5-pro',
    ];

    // ─── HELPERS ───
    function getESTDateString() {
      const now = new Date();
      const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      return estDate.toISOString().slice(0, 10);
    }

    function getLocalTodayString() {
      const now = new Date();
      const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const yyyy = estDate.getFullYear();
      const mm = String(estDate.getMonth() + 1).padStart(2, '0');
      const dd = String(estDate.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    
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

    function buildLocalTroubleshootingSummary(rawText) {
      const normalized = (rawText || '').replace(/\s+/g, ' ').trim();
      if (!normalized) return '';
      const sentenceParts = normalized.match(/[^.!?]+[.!?]*/g) || [];
      const picked = sentenceParts
          .map(s => s.trim())
          .filter(Boolean)
          .slice(0, 2)
          .join(' ')
          .trim();
      const shortText = picked || normalized;
      const limited = shortText.length > 220 ? `${shortText.slice(0, 220).trim()}...` : shortText;
      return plainTextToRemarkHtml(limited);
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
      if (typeof window !== 'undefined' && window.GEMINI_API_KEY) {
        return String(window.GEMINI_API_KEY).trim();
      }
      const storedKey = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
      if (storedKey && storedKey.trim()) return storedKey.trim();

      const enteredKey = window.prompt('Enter your Gemini API key to auto-generate remarks:');
      if (!enteredKey) return '';
      const trimmedKey = enteredKey.trim();
      if (!trimmedKey) return '';
      localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, trimmedKey);
      return trimmedKey;
    }

    async function generateGeminiSummary(prompt, systemText) {
      const apiKey = getGeminiApiKey();
      if (!apiKey) return '';

      let lastError = null;

      for (const model of GEMINI_MODELS) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemText }] },
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2 },
            }),
          });

          if (response.status === 400 || response.status === 403) {
            console.error(`Gemini API rejected request: ${response.status}. Check your API Key.`);
            return ''; 
          }

          if (!response.ok) {
            lastError = new Error(`Gemini request failed ${response.status} for model ${model}`);
            continue;
          }

          const data = await response.json();
          const summary = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
          if (summary) return summary;
        } catch (error) {
          lastError = error;
        }
      }
      if (lastError) console.error('Gemini summary generation failed:', lastError);
      return '';
    }

    async function generateRemarksSummary(remarksHtml) {
      const rawText = htmlToPlainText(remarksHtml || '');
      if (!rawText.trim()) return '';
      const prompt = [
        'Summarize the troubleshooting notes below into one concise paragraph under three sentences. Return plain text only, no labels or extra commentary.',
        '',
        rawText,
      ].join('\n');

      const summary = await generateGeminiSummary(
        prompt,
        'You write brief customer-support troubleshooting summaries. Keep under three sentences and return plain text only.'
      );
      if (summary) return plainTextToRemarkHtml(summary);

      return buildLocalTroubleshootingSummary(rawText);
    }

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

    // ─── FORM DATA ───
    function saveFormData(prefix) {
      const fields = {
        creditcard: ['shift', 'mid', 'store', 'merchant', 'contactNumber', 'issue', 'escalated', 'status', 'remarks', 'resolution', 'date']
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
      document.getElementById('creditcard-preview-resolution').innerHTML = formatMultilinePreview(document.getElementById('creditcard-resolution').value);
      
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

      const dateStr = document.getElementById('creditcard-date').value;
      let formattedDate = storeGetFormattedDateMinusOne();
      if (dateStr) {
        const [y, m, d] = dateStr.split('-');
        formattedDate = `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`;
      }

      const shift = document.getElementById('creditcard-shift').value;
      const support = document.getElementById('creditcard-support').value.toUpperCase() || 'AGENT';
      const mid = midEl.value.trim();
      const store = storeEl.value.trim();
      const merchant = document.getElementById('creditcard-merchant').value.trim();
      const contactNumber = document.getElementById('creditcard-contactNumber').value.trim();
      const issue = document.getElementById('creditcard-issue').value.trim();
      const escalated = document.getElementById('creditcard-escalated').value.trim();
      const status = document.getElementById('creditcard-status').value.trim();
      const resolution = document.getElementById('creditcard-resolution').value.trim();
      
      const remarksField = document.getElementById('creditcard-remarks');
      let remarksHtml = quillEditor ? quillEditor.root.innerHTML : (remarksField ? remarksField.value : '');
      
      // AI strictly ONLY summarizes the Remarks HTML
      if (!editId) {
        showNotification('Generating AI summary...');
        const summaryHtml = await generateRemarksSummary(remarksHtml);
        if (summaryHtml) {
          remarksHtml = summaryHtml;
          applyRemarksHtml(summaryHtml);
        }
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
        remarks: remarksHtml,
        resolution, 
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
        } 
      } else {
        allEntries.unshift(newEntry);
        showNotification('Credit Card entry added!');
      }

      clearFormFields(prefix);

      saveAllEntries();
      updateStatusCounters();
      renderTable();
      renderSidebar();
      creditcardUpdatePreview();
      syncPreviewHeight();
    };

    function clearFormFields(prefix) {
      if (prefix === 'creditcard') {
        const fields = ['mid', 'store', 'merchant', 'contactNumber', 'issue', 'escalated', 'status', 'resolution'];
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
      document.getElementById('creditcard-resolution').value = entry.resolution || '';
      
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
        const fields = ['shift', 'mid', 'store', 'merchant', 'contactNumber', 'issue', 'escalated', 'status', 'resolution', 'remarks', 'date'];
        fields.forEach(id => {
          const el = document.getElementById(`creditcard-${id}`);
          if (el) formData[id] = el.value;
        });
        if (quillEditor) formData.remarks = quillEditor.root.innerHTML;
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
      } else { return; }
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
      document.querySelectorAll('#tab-creditcard textarea').forEach(ta => autoGrow(ta));
      syncPreviewHeight();
    };

    window.softDeleteEntry = function(button) {
      const row = button.closest('tr');
      const id = row.dataset.id;
      const entry = allEntries.find(e => e.id == id);
      if (entry) {
        entry.deleted = true;
        saveAllEntries();
        renderTable();
        renderSidebar();
        showNotification('Entry removed from main table');
      }
    };

    function hardDeleteEntry(entryId) {
      const entry = allEntries.find(e => e.id == entryId);
      if (!entry) return;
      if (confirm('Delete this entry permanently?')) {
        const index = allEntries.findIndex(e => e.id == entryId);
        if (index !== -1) {
          allEntries.splice(index, 1);
          saveAllEntries();
          renderTable();
          renderSidebar();
          showNotification('Entry permanently deleted.');
        }
      }
    }

    function restoreEntry(entryId) {
      const entry = allEntries.find(e => e.id == entryId);
      if (!entry) return;
      entry.deleted = false;
      saveAllEntries();
      renderTable();
      renderSidebar();
      showNotification('Entry restored.');
    }

    window.copyRow = function(button) {
      const row = button.closest('tr');
      const id = row.dataset.id;
      const entry = allEntries.find(e => e.id == id);
      if (!entry) return;

      let exportDate = entry.date || '';
      const dateParts = exportDate.split('/');
      if (dateParts.length === 3) {
         const m = dateParts[0].padStart(2, '0');
         const d = dateParts[1].padStart(2, '0');
         const y = dateParts[2];
         exportDate = `${d}/${m}/${y}`;
      }

      // Merges Resolution without the label for export
      const combinedRemarks = entry.resolution 
        ? htmlToPlainText(entry.remarks || '') + '\n\n' + entry.resolution 
        : htmlToPlainText(entry.remarks || '');

      const rowData = [
        exportDate,
        entry.shift,
        entry.support,
        entry.mid,
        entry.store,
        entry.merchant || '',
        entry.contactNumber,
        entry.issue || '',
        entry.escalated || '',
        entry.status || '',
        combinedRemarks
      ];

      const values = rowData.map(f => escapeCSV(String(f ?? '')));
      navigator.clipboard.writeText(values.join('\t')).then(() => showNotification('Row copied!'));
    };

    // ─── TABLE ───
    function getVisibleEntries() {
      const selectedDateStr = document.getElementById('creditcard-date').value;
      let entries = allEntries.filter(entry => {
        if (entry.deleted) return false;
        const dateObj = parseDateFromString(entry.date);
        if (!dateObj) return false;
        const entryDateYMD = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
        return entryDateYMD === selectedDateStr && entry.source === 'creditcard';
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
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      visibleEntries.forEach(entry => {
        let displayDate = entry.date || '';
        const dateObj = parseDateFromString(entry.date);
        if (dateObj) {
          const m = dateObj.getMonth() + 1;
          const dd = String(dateObj.getDate()).padStart(2, '0');
          const yy = String(dateObj.getFullYear()).slice(-2);
          const dayName = dayNames[dateObj.getDay()];
          displayDate = `<strong>${m}/${dd}/${yy} - ${dayName}</strong>`; 
        }

        // Merges Resolution without the label for visual display
        const combinedRemarks = entry.resolution 
          ? htmlToPlainText(entry.remarks || '') + '\n\n' + escapeHtml(entry.resolution)
          : htmlToPlainText(entry.remarks || '');

        const row = document.createElement('tr');
        row.dataset.id = entry.id;
        row.innerHTML = `
            <td><input type="checkbox" class="row-checkbox" value="${entry.id}"></td>
            <td>${displayDate}</td>
            <td>${entry.shift || ''}</td>
            <td>${entry.support || ''}</td>
            <td>${entry.mid || ''}</td>
            <td>${entry.store || ''}</td>
            <td>${entry.merchant || ''}</td>
            <td>${entry.contactNumber || ''}</td>
            <td style="white-space:pre-wrap;">${entry.issue || ''}</td>
            <td>${entry.escalated || ''}</td>
            <td>${entry.status || ''}</td>
            <td style="white-space:pre-wrap;">${combinedRemarks}</td>
            <td class="action-cell">
              <div class="action-container">
                <button class="icon-btn copy-btn" onclick="copyRow(this)" title="Copy"><i class="bi bi-clipboard-fill" aria-hidden="true"></i></button>
                <button class="icon-btn edit-btn" onclick="editEntry(this)" title="Edit"><i class="bi bi-pencil-square" aria-hidden="true"></i></button>
                <button class="icon-btn delete-btn" onclick="softDeleteEntry(this)" title="Remove"><i class="bi bi-trash3-fill" aria-hidden="true"></i></button>
              </div>
            </td>
            `;
        tbody.appendChild(row);
      });
      updateSelectAllCheckboxState();
      updateStatusCounters();
    }

    function updateStatusCounters() {
      const selectedDateStr = document.getElementById('creditcard-date').value;
      const baseEntries = allEntries.filter(entry => {
        if (entry.deleted) return false;
        const dateObj = parseDateFromString(entry.date);
        if (!dateObj) return false;
        const entryDateYMD = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
        return entryDateYMD === selectedDateStr && entry.source === 'creditcard';
      });
      
      let resolved = 0, pending = 0, other = 0;
      baseEntries.forEach(entry => {
        const status = (entry.status || '').toUpperCase();
        if (status === 'RESOLVED') resolved++;
        else if (status === 'PENDING') pending++;
        else if (status === 'OTHER TASK') other++;
      });
      
      const open = Math.max(baseEntries.length - resolved, 0);
      
      if (document.getElementById('counterResolved')) document.getElementById('counterResolved').innerText = resolved;
      if (document.getElementById('counterPending')) document.getElementById('counterPending').innerText = pending;
      if (document.getElementById('counterOther')) document.getElementById('counterOther').innerText = other;
      
      const totalEl = document.getElementById('dashboardTotalTickets');
      const openEl = document.getElementById('dashboardOpenTickets');
      if (totalEl) totalEl.textContent = baseEntries.length;
      if (openEl) openEl.textContent = open;
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
      if (currentStatusFilter === status) currentStatusFilter = null;
      else currentStatusFilter = status;
      document.querySelectorAll('.status-filter-btn').forEach(btn => {
        if (btn.dataset.status === currentStatusFilter) btn.classList.add('active');
        else btn.classList.remove('active');
      });
      renderTable();
    }

    function clearAllEntries() {
      if (!confirm('Delete ALL entries permanently? This cannot be undone.')) return;
      allEntries = [];
      saveAllEntries();
      renderTable();
      renderSidebar();
      showNotification('All entries cleared.');
    }

    // ─── SIDEBAR ───
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
        if (collapseState.months[month] === undefined) collapseState.months[month] = month !== currentMonthKey;
        const isMonthCollapsed = collapseState.months[month];
        html += `<div class="sidebar-group">
                  <div class="month-header" onclick="toggleMonth('${month.replace(/'/g, "\\'")}')">
                      <span class="month-arrow">${isMonthCollapsed ? '▶' : '▼'}</span> ${month}
                  </div>`;
        if (!isMonthCollapsed) {
          const dates = grouped[month];
          const sortedDates = Object.keys(dates).sort((a, b) => new Date(b) - new Date(a));
          for (const dateKey of sortedDates) {
            if (collapseState.dates[dateKey] === undefined) collapseState.dates[dateKey] = dateKey !== todayFormatted;
            const isDateCollapsed = collapseState.dates[dateKey];
            html += `<div class="date-group">
                      <div class="date-header" onclick="toggleDate('${dateKey.replace(/'/g, "\\'")}')">
                          <span class="date-arrow">${isDateCollapsed ? '▶' : '▼'}</span> ${dateKey}
                      </div>`;
            if (!isDateCollapsed) {
              html += `<div class="date-entries">`;
              for (const entry of dates[dateKey]) {
                let issueDisplay = (entry.issue || '-').toUpperCase();
                if (entry.status && entry.status.toUpperCase() === 'OTHER TASK') issueDisplay = 'OTHER TASK';
                let issueTextColor = '';
                switch ((entry.status || '').toUpperCase()) {
                  case 'RESOLVED': issueTextColor = '#11734b'; break;
                  case 'PENDING': issueTextColor = '#b10202'; break;
                  case 'OTHER TASK': issueTextColor = '#1a6d9f'; break;
                }
                html += `
                  <div class="sidebar-card" data-id="${entry.id}">
                      <div class="preview-item issue-item" ${issueTextColor ? `style="color:${issueTextColor};"` : ''}>${escapeHtml(issueDisplay)}</div>
                      <div class="preview-item"><strong>Store:</strong> ${escapeHtml(entry.store || '-')}</div>
                      <div class="preview-item"><strong>MID:</strong> ${escapeHtml(entry.mid || '-')}</div>
                      <div class="card-actions">
                          <div class="card-actions-row stack-row">
                              <button class="copy-store" data-id="${entry.id}">📋 DETAILS</button>
                              <button class="copy-details" data-id="${entry.id}">📋 HRMS</button>
                          </div>
                          <div class="card-actions-row">
                              <button class="edit-entry stack-btn" data-id="${entry.id}">✏️<br>EDIT</button>
                          </div>
                      </div>
                  </div>`;
              }
              html += `</div>`;
            }
            html += `</div>`;
          }
        }
        html += `</div>`;
      }

      if (historyEntries.length === 0) html = '<div style="padding:20px; text-align:center;">No entries yet.</div>';
      container.innerHTML = html;
      attachSidebarEvents(container);
    }

    function saveCollapseState() { localStorage.setItem('sidebarCollapseState_creditcard', JSON.stringify({ months: collapseState.months, dates: collapseState.dates })); }
    window.toggleMonth = function(monthKey) { collapseState.months[monthKey] = !collapseState.months[monthKey]; saveCollapseState(); renderSidebar(); };
    window.toggleDate = function(dateKey) { collapseState.dates[dateKey] = !collapseState.dates[dateKey]; saveCollapseState(); renderSidebar(); };

    function attachSidebarEvents(container) {
      container.querySelectorAll('.copy-store').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const entry = allEntries.find(e => e.id == id);
          if (entry) {
            const plainText =
                `STORE NAME: ${entry.store}\nMID: ${entry.mid}\nMERCHANT: ${entry.merchant || ''}\nCONTACT #: ${entry.contactNumber}\n\nISSUE:\n${entry.issue || ''}`;
            navigator.clipboard.writeText(plainText);
            showNotification('Details copied (plain text)');
          }
        });
      });

      container.querySelectorAll('.copy-details').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const entry = allEntries.find(e => e.id == id);
          if (entry) {
            const plainText = `📞 CONTACT:\nMERCHANT: ${entry.merchant || ''}\nCONTACT NUMBER: ${entry.contactNumber}\n\n🔧 ISSUE:\n${entry.issue || ''}\n\n🛠️ TROUBLESHOOTING:\n${htmlToPlainText(entry.remarks || '')}\n\n🎯 RESOLUTION / BACKEND:\n${entry.resolution || ''}`;
            navigator.clipboard.writeText(plainText);
            showNotification('HRMS details copied');
          }
        });
      });

      container.querySelectorAll('.edit-entry').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.editEntry(parseInt(btn.dataset.id));
        });
      });
    }

    function attachGeminiKeyControls() {
      const input = document.getElementById('geminiApiKeyInput');
      const saveBtn = document.getElementById('saveGeminiKeyBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          const entered = window.prompt('Paste your Gemini API key:');
          if (entered && entered.trim()) {
            localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, entered.trim());
            showNotification('Gemini API key saved');
          }
        });
      }
    }

    // ─── BULK OPERATIONS ───
    function getSelectedRowIds() { return Array.from(document.querySelectorAll('#entryTable tbody .row-checkbox:checked')).map(cb => cb.value); }

    function bulkDelete() {
      const ids = getSelectedRowIds();
      if (ids.length === 0) return;
      if (!confirm(`Remove ${ids.length} selected entries?`)) return;
      ids.forEach(id => {
        const entry = allEntries.find(e => e.id == id);
        if (entry) entry.deleted = true;
      });
      saveAllEntries(); renderTable(); renderSidebar();
    }

    function bulkCopy() {
      const ids = getSelectedRowIds();
      if (ids.length === 0) { showNotification('No rows selected'); return; }
      const selectedRows = allEntries.filter(entry => ids.includes(entry.id.toString()));
      selectedRows.reverse();
      
      const rows = selectedRows.map(entry => {
        let exportDate = entry.date || '';
        const dateParts = exportDate.split('/');
        if (dateParts.length === 3) {
           const m = dateParts[0].padStart(2, '0');
           const d = dateParts[1].padStart(2, '0');
           const y = dateParts[2];
           exportDate = `${d}/${m}/${y}`; 
        }

        // Merges Resolution without the label for export
        const combinedRemarks = entry.resolution 
          ? htmlToPlainText(entry.remarks || '') + '\n\n' + entry.resolution 
          : htmlToPlainText(entry.remarks || '');

        return [
          exportDate, 
          entry.shift, 
          entry.support, 
          entry.mid, 
          entry.store, 
          entry.merchant || '', 
          entry.contactNumber, 
          entry.issue || '', 
          entry.escalated || '', 
          entry.status || '', 
          combinedRemarks 
        ].map(f => escapeCSV(String(f ?? ''))).join('\t')
      });
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
          div.addEventListener('click', (e) => { e.stopPropagation(); selectOption(opt); });
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
      
      input.addEventListener('input', (e) => {
        if (ignoreNextRender) return;
        hidden.value = e.target.value;
        renderSuggestions(e.target.value);
        if (onSelectCallback) onSelectCallback(e.target.value);
      });
      input.addEventListener('focus', () => { if (!ignoreNextRender) renderSuggestions(input.value); });
      document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestionsDiv.contains(e.target)) { suggestionsDiv.style.display = 'none'; ignoreNextRender = false; }
      });
      if (hidden.value) input.value = hidden.value;
    }

    // ─── INIT & TAB MANGEMENT ───
    function initTheme() {
      if (localStorage.getItem('theme_creditcard') === 'dark') document.body.classList.add('dark-mode');
    }

    window.switchToTab = function(tab) {
      document.getElementById('tab-creditcard').style.display = 'block';
      syncPreviewHeight();
    };

    window.createNewTicket = function() {
      const tabsContainer = document.querySelector('.top-tabs');
      if (!tabsContainer) return;
      const draftId = `draft-${Date.now()}`;
      const btn = document.createElement('button'); btn.id = `ticketTab-${draftId}`; btn.className = 'tab-btn active';
      btn.innerHTML = `<span class="tab-label">Ticket</span><button class="tab-close">×</button>`;
      btn.onclick = () => activateDraftTab(draftId);
      btn.querySelector('.tab-close').onclick = (e) => { e.stopPropagation(); closeDraftTab(draftId); };
      tabsContainer.appendChild(btn);
      
      const savedNow = JSON.parse(localStorage.getItem(DRAFT_TABS_KEY) || '[]'); savedNow.push({ id: draftId, label: 'Ticket' }); localStorage.setItem(DRAFT_TABS_KEY, JSON.stringify(savedNow));
      activateDraftTab(draftId);
    };

    let currentDraftId = null;

    function saveDraftData(draftId) {
      if (!draftId) return;
      const fields = ['shift', 'mid', 'store', 'merchant', 'contactNumber', 'issue', 'escalated', 'status', 'resolution', 'date', 'support'];
      const data = {};
      fields.forEach(id => {
        const el = document.getElementById(`creditcard-${id}`);
        if (el) data[id] = el.value;
      });
      if (quillEditor) data.remarks = document.getElementById('creditcard-remarks').value;
      localStorage.setItem(`draftData_${draftId}`, JSON.stringify(data));
      updateTabLabelFromDraft(draftId, data);
    }

    function loadDraftData(draftId) {
      const raw = localStorage.getItem(`draftData_${draftId}`);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (e) { return null; }
    }

    function activateDraftTab(draftId) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      const thisBtn = document.getElementById(`ticketTab-${draftId}`);
      if (thisBtn) thisBtn.classList.add('active');
      const data = loadDraftData(draftId);
      editId = null;
      localStorage.removeItem(EDIT_STORAGE_KEY);
      if (data) {
        ['date','shift','support','mid','store','merchant','contactNumber','issue','escalated','status', 'resolution'].forEach(id => {
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
    }

    function updateTabLabelFromDraft(draftId, data) {
      try {
        const btn = document.getElementById(`ticketTab-${draftId}`);
        if (!btn) return;
        const mid = (data && data.mid) ? data.mid : document.getElementById('creditcard-mid')?.value || '';
        let label = mid || 'Ticket';
        btn.querySelector('.tab-label').textContent = label;
      } catch (e) {}
    }

    function closeDraftTab(draftId) {
      const btn = document.getElementById(`ticketTab-${draftId}`);
      if (btn) btn.remove();
      localStorage.removeItem(`draftData_${draftId}`);
      const saved = JSON.parse(localStorage.getItem(DRAFT_TABS_KEY) || '[]');
      localStorage.setItem(DRAFT_TABS_KEY, JSON.stringify(saved.filter(s => s.id !== draftId)));
      if (currentDraftId === draftId) { currentDraftId = null; clearFormFields('creditcard'); }
    }

    window.saveCurrentDraft = function() {
      if (currentDraftId) { saveDraftData(currentDraftId); showNotification('Draft saved'); return; }
      window.createNewTicket();
    };

    function init() {
      document.getElementById('creditcard-date').value = getLocalTodayString();
      loadFormData('creditcard');
      loadAllEntries();
      attachGeminiKeyControls();
      initTheme();

      document.getElementById('themeToggle').addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme_creditcard', isDark ? 'dark' : 'light');
      });
      document.getElementById('clearAllBtn').addEventListener('click', clearAllEntries);
      document.getElementById('bulkDeleteBtn').addEventListener('click', bulkDelete);
      document.getElementById('bulkCopyBtn').addEventListener('click', bulkCopy);
      document.getElementById('selectAllCheckbox').addEventListener('change', (e) => handleSelectAll(e.target));
      
      const dateFieldEl = document.getElementById('creditcard-date');
      if (dateFieldEl) {
        dateFieldEl.addEventListener('change', () => {
          renderTable();
          saveFormData('creditcard');
        });
      }

      ['mid', 'store', 'merchant', 'contactNumber', 'issue', 'escalated', 'status', 'resolution'].forEach(id => {
        const el = document.getElementById(`creditcard-${id}`);
        if (el) {
          el.addEventListener('input', () => { creditcardUpdatePreview(); saveFormData('creditcard'); });
        }
      });
      document.getElementById('creditcard-shift').addEventListener('change', () => saveFormData('creditcard'));

      quillEditor = new Quill('#creditcard-remarks-editor', {
        theme: 'snow',
        modules: { toolbar: [ ['bold', 'italic', 'underline', 'strike'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean'] ] },
      });

      if (quillEditor && document.getElementById('creditcard-remarks').value) {
        quillEditor.root.innerHTML = document.getElementById('creditcard-remarks').value;
      }
      quillEditor.on('text-change', function() {
        document.getElementById('creditcard-remarks').value = quillEditor.root.innerHTML;
        creditcardUpdatePreview();
        saveFormData('creditcard');
      });

      initCombobox('creditcard-status-combobox', 'creditcard-status', STATUS_OPTIONS, 'creditcard-status-suggestions', () => {
        creditcardUpdatePreview(); saveFormData('creditcard');
      });
      
      setInterval(() => {
        const todayEST = getESTDateString();
        if (localStorage.getItem('lastClearDate_creditcard') !== todayEST) {
          document.getElementById('creditcard-date').value = getLocalTodayString();
          saveAllEntries(); renderTable(); renderSidebar();
          localStorage.setItem('lastClearDate_creditcard', todayEST);
        }
      }, 60000);

      window.addEventListener('beforeunload', () => { saveFormData('creditcard'); if (editId) attachDraftAutoSave(editId); });
      creditcardUpdatePreview(); syncPreviewHeight();
    }

    init();
  })();
}