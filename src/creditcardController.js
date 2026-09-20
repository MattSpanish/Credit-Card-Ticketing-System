import { ensureDraftForSaving } from './draftStorage';

export function initCreditcardApp() {
  if (window.__creditcardAppInitialized) return;
  window.__creditcardAppInitialized = true;

  (function() {
    'use strict';

    // ─── STATE ───
    let allEntries = [];
    let editId = null;
    let currentStatusFilter = null;
    let currentSearchQuery = ''; 
    let quillEditor = null;
    let globalMerchantArray = []; // Memory cache para sa API

    // ✅ GOOGLE SHEETS API LINK:
    const MERCHANT_API_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7Te8cSSVUsKh0Ms4xJvibikE9ZCj_lB0tkoZx-2mZv5jOKjEpSdqa436wFP72LdH3cm2AmbsoMFgq/pub?output=csv";

    const EDIT_STORAGE_KEY = 'editingEntryId_creditcard';
    const EDIT_DRAFT_KEY = 'editingDraft_creditcard_';
    const DRAFT_TABS_KEY = 'ticketDraftTabs_creditcard';
    const collapseState = { months: {}, dates: {} };
    const STATUS_OPTIONS = ['RESOLVED', 'PENDING', 'OTHER TASK'];

// ✅ OTHER TASK TEMPLATES DICTIONARY
    const OTHER_TASK_TEMPLATES = {
      "Program PAX A35 w/ P98": {
        issue: "Program PAX A35 w/ P98",
        troubleshooting: "Open BroadPOS Portal\nAdd the Store\nAdd the S/N of the terminal\nPush the Manager, P98 Payment App, and Rapid Connect\nInput the MID and Terminal ID\nGo to P98Pay\nEmulate “RetailzPOS”\nAdd Reseller\nInput the details of the store\nAdd the terminal\nSave and Continue\nRetrieve Merchant API Key",
        resolution: "Program PAX A35 w/ P98"
      },
      "PAX TID ": {
        issue: "TID CREATION",
        troubleshooting: "GO TO FD POS PORTAL\nSEARCH MID OF THE STORE\nGO TO ADD EQUIPMENT\nSELECT EQUIPMENT\nADD MSD FOR PAX\nAND SELECT DATAWIRE\nGO TO IRIS PORTAL\nGO TO NOTE\nCREATE VARSHEET\nSEND WHATSAPP GROUP\nDONE, CREATED ON FDPOS. TID#",
        resolution: "CREATE PAX TID "
      },
      "DEJAVOO TID ": {
        issue: "TID CREATION",
        troubleshooting: "GO TO FD POS PORTAL\nSEARCH MID OF THE STORE\nGO TO ADD EQUIPMENT\nSELECT EQUIPMENT\nADD DVC FOR DEJAVOO\nAND SELECT DATAWIRE\nGO TO IRIS PORTAL\nGO TO NOTE\nCREATE VARSHEET\nSEND WHATSAPP GROUP\nDONE, CREATED ON FDPOS. TID#",
        resolution: "CREATE DEJAVOO TID "
      },
      "VALOR TID": {
        issue: "TID CREATION",
        troubleshooting: "GO TO FD POS PORTAL\nSEARCH MID OF THE STORE\nGO TO ADD EQUIPMENT\nSELECT EQUIPMENT\nADD ValorPay GTW RC SRS FOR Valor\nAND SELECT DATAWIRE\nGO TO IRIS PORTAL\nGO TO NOTE\nCREATE VARSHEET\nSEND WHATSAPP GROUP\nDONE, CREATED ON FDPOS. TID#",
        resolution: "CREATE VALOR TID "
      },
        "CLOVER DEPROVISIONED": {
        issue: "TID CREATION",
        troubleshooting: "OPEN THE CLOVER PORTAL\nSEARCH THE S/N\nCLICK THE DEPROVISIONED \nCHECK THE BOXES \nCLICK OK\nDONE, DEPROVISONED THE CLOVER DEVICES ON CLOVER PORTAL",
        resolution: "CLOVER DEPROVISIONED - S/N: "
      },
      "BANK CHANGE": {
        issue: "BANK CHANGE",
        troubleshooting: "I GOT THE SUPPORTING DOCUMENT AND THE VOIDED CHECK\nGO TO THE ACCESSONE\nSEARCH THE STORE\nENTER DDA AND ABA\nATTACHED BOTH DOCUMENTS\nDDA HAS BEEN SUBMITTED ON ACCESS ONE",
        resolution: "WANT TO CHANGE THE BANK ACCOUNT"
      },
      "DEJAVOO PROGRAMMING": {
        issue: "DEJAVOO PROGRAMMING",
        troubleshooting: "Go to 'IPOSPAY'\nSelect 'Merchants'\nSelect the 3 bar - Add Merchant\nEnter information\nAdd store\nAdd MCC\nAdd devices\nSelect Nashville - North\nEdit Parameters\nCopy TPN\nSAVE\n\nAdditonal Information \n \nTPN:\nTID# ",
        resolution: "DEJAVOO P1/P5 PROGRAMMING STANDALONE/STANDALONE AND NEED TPN"
      },

      "TSYS V2 DEJAVOO PROGRAMMING": {
        issue: "TSYS V2 PROGRAMMING",
        troubleshooting:"OPEN THE DEJAVOO PORTAL\nADD THE MERCHANT\nINPUT THE DETAILS BASED ON THE VARSHEET\nADD THE EQUIPMENT\nEDIT THE PARAMETERS\n\nDONE, PROGRAMMED ON IPOSPAY. TPN: ",
        resolution:"PROGRAM TSYS V2 DEJAVOO P5/P1 AS INTEGRATED/STANDALONE AND NEED TPN"
      },

      "LEADS CREATION": {
        issue: "LEADS CREATION",
        troubleshooting: "GET THE DOCUMENTS (SS4 FORM, VOID CHECK, DRIVERS LICENSE )\nOPEN THE IRIS PORTAL\nCLICK THE CREATE LEADS\nINPUT INFORMATION THAT NEEDS BASED ON THE DOCUMENTS\nDONE, CREATED LEADS ON IRIS PORTAL, FORWARDED TO MISBAH MA'AM" ,
        resolution: "LEAD HAS BEEN CREATED ON IRIS, FORWARDED TO FILLING GROUP "
      },
      
      "DISPUTE LETTER": {
        issue: "DISPUTE LETTER",
        troubleshooting: "OPEN THE CLIENTLINE\nCLICK THE APPS\nOPEN THE DISPUTE MANAGEMENT\nSEARCH THE MID\nRETRIEVED FROM DISPUTE MANAGEMENT AND SENT TO AGENT GROUP",
        resolution: "REQUEST FOR DISPUTE LETTER  "
      },

      "FILLING TSYS V2": {
        issue: "FILLING TSYS V2",
        troubleshooting: "CREATE LEAD\nCREATE A FOLDER FOR ALL STORE DOCUMENTS\nGENERATE MPA\nGET MERCHANT SIGN\nGO TO CORVIA PORTAL\nSUBMIT THE APPLICATION\nINPUT THE NECESSARY INFORMATION BASED ON IRIS\nGENERATE MPA\nGET MERCHANT SIGN\nGO TO CORVIA PORTAL\nSUBMIT THE APPLICATION\nINPUT THE NECESSARY INFORMATION BASED ON IRIS\nUPLOAD MPA AND VOID CHECK\nCREATED LEADS ON IRIS AND SUBMITTED ON CORVIA PORTAL",
        resolution: "STORE FILLING ON TSYS V2"
      },

      "1099-K REPORT": {
        issue: "1099-K REPORT",
        troubleshooting: "RETRIEVED FROM MERCHANTANSWER STAR\nRETRIVED THE 1099-K REPORT UNDER OF STATEMENTS\nSENT THE REPORT TO AGENT GROUP",
        resolution: "REQUEST FOR 1099-K REPORT"
      },

      "RETURN LABEL": {
        issue: "RETURN LABEL",
        troubleshooting: "OPEN THE UPS PORTAL\nCLICK THE SHIPPING\nCLICK THE RETURN PACKAGE\nINPUT THE INFORMATION NEED\nDONE, CREATED ON UPS PORTAL AND SEND VIA EMAIL.",
        resolution: "CREATE RETURN LABEL"
      },

      "CLOSE ACCOUNT FISERV": {
        issue: "CLOSE ACCOUNT FISERV",
        troubleshooting: "FILL-OUT THE CHECKLIST\nCONFIRM TO KRUPALI MA'AM IF THERE'S NEEDED TO RETURN THE TERMINAL\nCONFIRM ALSO TO BILLING TEAM IF THERE A PENDING FEES\nOPEN THE CLIENTLINE\nOPEN THE MERCHANT MANAGER\nCLICK THE CANCELLATIONS\nSEARCH FOR THE MID\nFOR IRIS\nSEARCH FOR THE MID\nCLICK THE MID\nEDIT USER\nCHECK THE CLOSE AND SAVE\nACCOUNT HAS BEEN CLOSED ON MM/IRIS",
        resolution: "Account has been closed on merchant manager and iris portal"
      },

      "CLOVER PROVISION": {
        issue: "CLOVER PROVISION",
        troubleshooting: "OPEN THE CLOVER PORTAL\nSEARCH FOR THE S/N\nCLICK DEPROVISION\nCHECK THE BOXES\nCLICK PROVISION\nINPUT THE MID \nDONE, PROVISONED ON CLOVER PORTAL. SENT THE ACTIVATION CODE: ",
        resolution: "CLOVER PROVISION - S/N: "
      },

      "CLOVER DEPROVISIONED": {
        issue: "CLOVER DEPROVISIONED",
        troubleshooting: "OPEN THE CLOVER PORTAL\nSEARCH FOR THE S/N\nCLICK DEPROVISION\nCHECK THE BOXES\nCLICK DEPROVISION\n CHECK THE BOXES\nCLICK OK\n DONE, DEPROVISIONED ON CLOVER PORTAL.",
        resolution: "REQUEST TO DEPROVISIONED THE (PRODUCT) - S/N: "
      },

      "PROGRAM PAX S300 PROGRAMMING": {
        issue: "PROGRAM PAX S300 PROGRAMMING",
        troubleshooting:"OPEN BROADPOS PORTAL\nSEARCH FOR THE STORE\nADD THE S/N\nPUSHED THE SOFTWARE\nINPUT THE MID AND TID ON FD RAPIDCONNECT\nPUSHED THE SOFTWARE\nDONE, PROGRAMMED ON BROADPOS. S/N:",
        resolution: "PROGRAM PAX S300 PROGRAMMING - S/N: "
      },

      "REQUEST FOR TSYS VARSHEET": {
        issue:"REQUEST FOR TSYS VARSHEET",
        troubleshooting:"OPEN THE ZENDESK\nSUBMIT A TICKET\nTICKET HAS BEEN ON ZENDESK. ",
        resolution:"REQUEST FOR 1 STAGE PAX VARSHEET"
      },

      "RESET THE ACCESS FOR IRIS PORTAL": {
        issue: "RESET THE ACCESS FOR IRIS PORTAL",
        troubleshooting: "OPEN THE IRIS PORTAL\nCLICKED THE MANAGE DROPDOWN MENU.\nSELECTED USER ACCOUNT.\nSEARCHED FOR THE USERNAME\nCLICKED RESET TO RESET THE PASSWORD.",
        resolution: "REQUEST TO RESET THE IRIS PASSWORD (USERNAME: )"
      },

      "ACCESS FOR IRIS PORTAL": {
        issue: "ACCESS FOR IRIS PORTAL",
        troubleshooting: "SEARCHED FOR THE USERNAMES IN IRIS UNDER USER ACCOUNTS.\nLINKED THE MID ( / ).\nASSIGNED (NAME) TO THE PROFILE USING THE IRIS PORTAL.",
        resolution: "- ADD THE MIDS TO THE EXISTING IRIS ACCOUNTS (USERNAMES: ).\n ADD () GROUP TO THE ACCOUNT. )"
      },

       "BUYPASS TID CREATION": {
        issue: "BUYPASS TID CREATION",
        troubleshooting: "OPEN THE BUYPASS TOOL , MERCHANT MANAGER AND FDPOS\nNEED A COPY FOR THE EXISTING BUYPASS ID\nMERCHANT SETUP TO INPUT THE INFORMATION OF THE MERCHANT\nTERMINAL SET UP TO ADD THE EQUIPMENT\nDEBIT NETWORKS CHECKED THE BOXES\nPROP SHARE GROUP ENTITLE THE (5 , 7 , 50)\nPLUGGED FOR TABLE LOAD\nBUYPASS TID HAS BEEN CREATED ON BUYPASS TOOL AND ADDED ON FDPOS. BUYPASS ID: ",
        resolution: "BUYPASS TID CREATION - TID: "
      }
    };

    const CLOCK_TIMES = {
      '9PM - 8AM': ['09:00 PM', '06:00 AM'],
      '730AM - 630PM': ['05:00 AM', '02:00 PM'],
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

    function getLocalYesterdayString() {
      const now = new Date();
      const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      estDate.setDate(estDate.getDate() - 1);
      const yyyy = estDate.getFullYear();
      const mm = String(estDate.getMonth() + 1).padStart(2, '0');
      const dd = String(estDate.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    function getEntryDateYMD(entryDate) {
      if (!entryDate) return '';
      if (entryDate.includes('-')) {
        const parts = entryDate.split('-');
        if (parts.length === 3) {
          return `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
        }
      }
      const dateObj = parseDateFromString(entryDate);
      if (dateObj) {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      return '';
    }
    
    function showNotification(msg) {
      const el = document.getElementById('notification');
      if (!el) return;
      el.textContent = msg;
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 2000);
    }

    function escapeHtml(text) {
      if (!text) return '';
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    
    function formatMultiline(html) {
      if (!html) return '';
      let text = html.replace(/<br\s*\/?>/gi, '\n')
                     .replace(/<\/p>/gi, '\n')
                     .replace(/<\/li>/gi, '\n')
                     .replace(/<li>/gi, '- ');
      const div = document.createElement('div');
      div.innerHTML = text;
      return (div.textContent || div.innerText || '').replace(/\n\s*\n/g, '\n').trim();
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
      if (!dateStr) return null;
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

    // ✅ NEW HELPER: FORMAT PHONE NUMBER (XXX) XXX - XXXX
    function formatPhoneNumber(phoneStr) {
      if (!phoneStr) return '';
      // Tanggalin lahat ng hindi numbers
      let digits = phoneStr.replace(/\D/g, '');
      
      // Tanggalin ang "1" sa unahan kung USA code ito
      if (digits.length === 11 && digits.startsWith('1')) {
        digits = digits.slice(1);
      }
      
      // I-format kapag eksaktong 10 digits
      if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      
      return phoneStr; // Kapag kulang o sobra, ibalik na lang ang original
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

    async function generateRemarksSummary(issueText, remarksHtml, mode) {
      const rawText = htmlToPlainText(remarksHtml || '');
      if (!rawText.trim()) return '';
      
      let prompt = '';
      let systemText = '';

      if (mode === 'grammar') {
        prompt = `Fix the grammar, spelling, and formatting of the following technical support troubleshooting notes. Keep the exact technical meaning, details, and steps intact. Format it cleanly as plain text:\n\n${rawText}`;
        systemText = 'You are a technical support editor. Fix grammar and spelling but do not remove any technical details or steps. Return plain text only.';
      } else {
        prompt = `Issue Reported: ${issueText}\n\nTroubleshooting Notes:\n${rawText}\n\nBased on the issue and notes above, summarize the specific steps taken to resolve the issue. Write a clear, 1 to 2 sentence resolution summary detailing exactly what actions were performed to fix the problem or what the final outcome was. Return plain text only, no labels, no bullet points, and no extra commentary.`;
        systemText = 'You are a merchant-support specialist. Your job is to read an issue and raw troubleshooting steps, and extract a concise, 1 to 2 sentence summary of the resolution (the actions taken to solve the ticket). Return plain text only.';
      }

      const aiResponse = await generateGeminiSummary(prompt, systemText);
      if (aiResponse) return plainTextToRemarkHtml(aiResponse);

      if (mode === 'summarize') {
        return buildLocalTroubleshootingSummary(rawText);
      }
      return plainTextToRemarkHtml(rawText); 
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
    }

    // ─── API FETCH & AUTOFILL ───
    function parseCSV(text) {
        let rows = [];
        let currentRow = [];
        let currentCell = "";
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            let nextChar = text[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentCell += '"';
                    i++; 
                } else {
                    inQuotes = !inQuotes; 
                }
            } else if (char === ',' && !inQuotes) {
                currentRow.push(currentCell.trim());
                currentCell = "";
            } else if ((char === '\n' || char === '\r') && !inQuotes) {
                if (char === '\r' && nextChar === '\n') i++; 
                currentRow.push(currentCell.trim());
                rows.push(currentRow);
                currentRow = [];
                currentCell = "";
            } else {
                currentCell += char;
            }
        }
        if (currentCell || currentRow.length > 0) {
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
        }
        return rows.filter(r => r.join('').trim() !== ''); 
    }

    async function fetchMerchantDatabase() {
      if (!MERCHANT_API_URL || MERCHANT_API_URL === "I-PASTE_DITO_ANG_LINK_MULA_SA_GOOGLE_SHEETS") {
        console.warn("No valid Merchant API URL provided.");
        return;
      }
      
      try {
        const response = await fetch(MERCHANT_API_URL);
        if (!response.ok) throw new Error("Failed to fetch CSV");
        
        const text = await response.text();
        const rows = parseCSV(text);
        
        if (rows.length < 2) return;
        
        const headers = rows[0].map(h => (h || '').trim().toLowerCase());
        
        const midIdx = headers.findIndex(h => h === 'mid' || h.includes('merchant id'));
        const storeIdx = headers.findIndex(h => h === 'merchant dba' || h.includes('dba') || h.includes('store'));
        const contactIdx = headers.findIndex(h => h === 'contact name' || h.includes('contact') || h === 'merchant name');
        const phoneIdx = headers.findIndex(h => h === 'phone number' || h.includes('phone'));
        
        if (midIdx === -1) {
          console.error("Hindi mahanap ang 'MID' column sa CSV.");
          return;
        }

        globalMerchantArray = []; 
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length <= midIdx) continue;
          
          const midVal = (row[midIdx] || '').trim();
          const storeVal = storeIdx !== -1 ? (row[storeIdx] || '').trim() : '';
          const contactVal = contactIdx !== -1 ? (row[contactIdx] || '').trim() : '';
          const phoneVal = phoneIdx !== -1 ? (row[phoneIdx] || '').trim() : '';

          if (midVal || storeVal) {
            globalMerchantArray.push({
              mid: midVal,
              store: storeVal,
              merchant: contactVal,
              phone: phoneVal
            });
          }
        }
        console.log(`✅ Loaded ${globalMerchantArray.length} merchants from API into Search Bar.`);
      } catch (error) {
        console.error("Merchant API Fetch Error:", error);
      }
    }

    function initStoreSearch() {
      const input = document.getElementById('creditcard-store-search');
      const suggestionsDiv = document.getElementById('creditcard-store-search-suggestions');
      if (!input || !suggestionsDiv) return;

      input.addEventListener('input', function() {
        const val = this.value.trim().toLowerCase();
        suggestionsDiv.innerHTML = '';
        
        if (!val || val.length < 2) {
          suggestionsDiv.style.display = 'none';
          return;
        }

        const matches = globalMerchantArray.filter(m => 
          (m.store && m.store.toLowerCase().includes(val)) || 
          (m.mid && m.mid.toLowerCase().includes(val))
        ).slice(0, 15); 

        if (matches.length === 0) {
          suggestionsDiv.style.display = 'none';
          return;
        }

        matches.forEach(match => {
          const div = document.createElement('div');
          div.className = 'combobox-suggestion-item';
          div.innerHTML = `<strong>${escapeHtml(match.store || 'Unknown Store')}</strong> <span style="color:var(--text-muted, #888); font-size:0.85em;">(${escapeHtml(match.mid)})</span>`;
          
          div.addEventListener('click', () => {
            const storeField = document.getElementById('creditcard-store');
            const midField = document.getElementById('creditcard-mid');
            const merchantField = document.getElementById('creditcard-merchant');
            const phoneField = document.getElementById('creditcard-contactNumber');

            // ✅ APPLY PHONE NUMBER FORMATTING HERE
            if (storeField) storeField.value = match.store || '';
            if (midField) midField.value = match.mid || '';
            if (merchantField) merchantField.value = match.merchant || '';
            if (phoneField) phoneField.value = formatPhoneNumber(match.phone || '');

            input.value = ''; 
            suggestionsDiv.style.display = 'none';

            showNotification('✅ Details Auto-filled!');
            creditcardUpdatePreview();
            saveFormData('creditcard');
            if (window.currentDraftId) window.saveDraftData(window.currentDraftId);
          });

          suggestionsDiv.appendChild(div);
        });
        suggestionsDiv.style.display = 'block';
      });

      document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestionsDiv.contains(e.target)) {
          suggestionsDiv.style.display = 'none';
        }
      });
    }

    // ─── FORM DATA ───
    function saveFormData(prefix) {
      const fields = {
        creditcard: ['ticketNumber', 'shift', 'mid', 'store', 'merchant', 'contactNumber', 'issue', 'escalated', 'status', 'remarks', 'resolution', 'date']
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
      const previewTicket = document.getElementById('creditcard-preview-ticketNumber');
      const previewMid = document.getElementById('creditcard-preview-mid');
      const previewStore = document.getElementById('creditcard-preview-store');
      const previewMerchant = document.getElementById('creditcard-preview-merchant');
      const previewContact = document.getElementById('creditcard-preview-contactNumber');
      const previewIssue = document.getElementById('creditcard-preview-issue');
      const previewRes = document.getElementById('creditcard-preview-resolution');
      const previewRemarks = document.getElementById('creditcard-preview-remarks');
      
      if (previewTicket) previewTicket.textContent = document.getElementById('creditcard-ticketNumber')?.value || '';
      if (previewMid) previewMid.textContent = document.getElementById('creditcard-mid')?.value || '';
      if (previewStore) previewStore.textContent = document.getElementById('creditcard-store')?.value || '';
      if (previewMerchant) previewMerchant.textContent = document.getElementById('creditcard-merchant')?.value || '';
      if (previewContact) previewContact.textContent = document.getElementById('creditcard-contactNumber')?.value || '';
      if (previewIssue) previewIssue.innerHTML = formatMultilinePreview(document.getElementById('creditcard-issue')?.value);
      if (previewRes) previewRes.innerHTML = formatMultilinePreview(document.getElementById('creditcard-resolution')?.value);
      
      const remarksHtml = document.getElementById('creditcard-remarks')?.value;
      if (previewRemarks) previewRemarks.innerHTML = !isHtmlEmpty(remarksHtml) ? convertQuillLists(remarksHtml) : '';
      
      syncPreviewHeight();
    }

   // ─── ADD / EDIT / DELETE ───
    window.addEntry = async function(prefix) {
      if (prefix !== 'creditcard') return;

      const midEl = document.getElementById('creditcard-mid');
      const storeEl = document.getElementById('creditcard-store');
      const supportEl = document.getElementById('creditcard-support'); 
      
      let valid = true;
      
      [midEl, storeEl, supportEl].forEach(el => {
        if (el) {
          el.classList.remove('invalid');
          if (!el.value.trim()) {
            el.classList.add('invalid');
            valid = false;
          }
        }
      });
      
      if (!valid) {
        showNotification('Please fill SUPPORT NAME, MID, and STORE NAME!'); 
        return;
      }

      const dateStr = document.getElementById('creditcard-date').value;
      let formattedDate = storeGetFormattedDateMinusOne();
      if (dateStr) {
        const [y, m, d] = dateStr.split('-');
        formattedDate = `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`;
      }

      const ticketNumber = document.getElementById('creditcard-ticketNumber')?.value.trim() || '';
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
      
      let rawRemarksHtml = quillEditor ? quillEditor.root.innerHTML : (remarksField ? remarksField.value : '');
      let remarksHtmlToSave = rawRemarksHtml;
      
      let originalRemarksHtml = rawRemarksHtml;

      if (editId) {
        const existing = allEntries.find(e => e.id === editId && e.source === 'creditcard');
        if (existing && existing.originalRemarks) {
          originalRemarksHtml = existing.originalRemarks;
        }
      }

      const aiActionMode = document.querySelector('input[name="aiActionMode"]:checked')?.value || 'summarize';

      if (status.toUpperCase() !== 'OTHER TASK') {
        if (aiActionMode !== 'none') {
          showNotification(`Generating AI ${aiActionMode === 'grammar' ? 'Grammar Fix' : 'Summary'}...`);
          const aiResultHtml = await generateRemarksSummary(issue, rawRemarksHtml, aiActionMode);
          if (aiResultHtml) {
            remarksHtmlToSave = aiResultHtml; 
          }
        } else {
          remarksHtmlToSave = '';
        }
      }

      const newEntry = {
        id: Date.now(),
        ticketNumber,
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
        remarks: remarksHtmlToSave,          
        originalRemarks: originalRemarksHtml, 
        resolution: resolution,              
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
      if (!editId) {
        window.createNewTicket();
      }

      saveAllEntries();
      updateStatusCounters();
      renderTable();
      renderSidebar();
      creditcardUpdatePreview();
      syncPreviewHeight();
    };

    function clearFormFields(prefix) {
      if (prefix === 'creditcard') {
        const fields = ['ticketNumber', 'mid', 'store', 'merchant', 'contactNumber', 'issue', 'escalated', 'status', 'resolution', 'store-search'];
        fields.forEach(id => {
          const el = document.getElementById(`creditcard-${id}`);
          if (el) el.value = '';
        });
        
        const statusCombobox = document.getElementById('creditcard-status-combobox');
        if (statusCombobox) statusCombobox.value = '';

        const otherTaskContainer = document.getElementById('creditcard-other-task-container');
        if (otherTaskContainer) otherTaskContainer.style.display = 'none';

        const otherTaskSelect = document.getElementById('creditcard-other-task-select');
        if (otherTaskSelect) otherTaskSelect.value = '';

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
      const ticketEl = document.getElementById('creditcard-ticketNumber');
      if (ticketEl) ticketEl.value = entry.ticketNumber || '';
      document.getElementById('creditcard-shift').value = entry.shift || '';
      document.getElementById('creditcard-support').value = entry.support || '';
      document.getElementById('creditcard-mid').value = entry.mid || '';
      document.getElementById('creditcard-store').value = entry.store || '';
      document.getElementById('creditcard-merchant').value = entry.merchant || '';
      document.getElementById('creditcard-contactNumber').value = entry.contactNumber || '';
      document.getElementById('creditcard-issue').value = entry.issue || '';
      document.getElementById('creditcard-escalated').value = entry.escalated || '';
      
      document.getElementById('creditcard-status').value = entry.status || '';
      const statusCombobox = document.getElementById('creditcard-status-combobox');
      if (statusCombobox) statusCombobox.value = entry.status || '';

      const otherTaskContainer = document.getElementById('creditcard-other-task-container');
      if (otherTaskContainer) {
        otherTaskContainer.style.display = (entry.status || '').toUpperCase() === 'OTHER TASK' ? 'block' : 'none';
      }
      
      document.getElementById('creditcard-resolution').value = entry.resolution || '';
      
      if (quillEditor) {
        const textToLoad = entry.originalRemarks || entry.remarks || '';
        quillEditor.root.innerHTML = textToLoad;
        document.getElementById('creditcard-remarks').value = textToLoad;
      }
    }

    function attachDraftAutoSave(entryId) {
      const draftKey = EDIT_DRAFT_KEY + entryId;
      const saveDraft = () => {
        if (!editId || editId !== entryId) return;
        const formData = {};
        const fields = ['ticketNumber', 'shift', 'mid', 'store', 'merchant', 'contactNumber', 'issue', 'escalated', 'status', 'resolution', 'remarks', 'date'];
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

      if (typeof window.switchToDashboardView === 'function') {
        window.switchToDashboardView();
      } else if (typeof window.switchToFormTab === 'function') {
        window.switchToFormTab();
      }
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

    // ✅ PURE DATE FORMAT PARA SA EXCEL (DD/MM/YYYY)
    window.copyRow = function(button) {
      const row = button.closest('tr');
      const id = row.dataset.id;
      const entry = allEntries.find(e => e.id == id);
      if (!entry) return;

      let exportDate = entry.date || '';
      if (exportDate) {
        const parts = exportDate.split('/');
        if (parts.length === 3) {
          const m = String(parseInt(parts[0], 10)).padStart(2, '0');
          const d = String(parseInt(parts[1], 10)).padStart(2, '0');
          const y = parts[2];
          exportDate = `${d}/${m}/${y}`;
        }
      }

      let combinedRemarks = '';
      if ((entry.status || '').toUpperCase() === 'OTHER TASK') {
        combinedRemarks = entry.resolution || '';
      } else {
        const parsedRem = formatMultiline(entry.remarks || '');
        const parsedRes = entry.resolution || '';
        if (parsedRem && parsedRes) {
          combinedRemarks = parsedRem + '\n\n' + parsedRes;
        } else {
          combinedRemarks = parsedRem || parsedRes;
        }
      }

      const rowData = [
        exportDate,
        entry.shift,
        entry.support,
        entry.store,
        entry.mid,
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

    // Global search clearing fallback
    window.clearGlobalSearch = window.clearGlobalSearch || function() {
      currentSearchQuery = '';
      const input = document.getElementById('headerSearch');
      if (input) input.value = '';
      if (window.updateSearchMatchCount) window.updateSearchMatchCount(null);
      renderTable();
      renderSidebar();
    };

    window.handleGlobalSearch = function(query) {
      currentSearchQuery = (query || '').toLowerCase().trim();
      renderTable();
      renderSidebar();
    };

    // Comprehensive multi-term search matching across all ticket fields
    function ticketMatchesSearch(entry, query) {
      if (!query) return true;
      const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
      if (terms.length === 0) return true;

      const cleanRemarks = formatMultiline(entry.remarks || '');
      const cleanOriginal = formatMultiline(entry.originalRemarks || '');

      let dateVariants = entry.date || '';
      const dateObj = parseDateFromString(entry.date);
      if (dateObj) {
        const monthLong = dateObj.toLocaleString('en-US', { month: 'long' }).toLowerCase();
        const monthShort = dateObj.toLocaleString('en-US', { month: 'short' }).toLowerCase();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dateObj.getDay()] || '';
        const ymd = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        dateVariants += ` ${monthLong} ${monthShort} ${dayName} ${ymd}`;
      }

      const searchableText = [
        entry.ticketNumber || '',
        entry.store || '',
        entry.mid || '',
        entry.merchant || '',
        entry.contactNumber || '',
        entry.issue || '',
        entry.resolution || '',
        cleanRemarks,
        cleanOriginal,
        entry.support || '',
        entry.shift || '',
        entry.status || '',
        entry.escalated || '',
        dateVariants
      ].join(' ').toLowerCase();

      return terms.every(term => searchableText.includes(term));
    }

    // ─── TABLE ───
    function getVisibleEntries() {
      const selectedDateStr = document.getElementById('creditcard-date')?.value || '';
      
      let entries = allEntries.filter(entry => !entry.deleted && entry.source === 'creditcard');

      if (currentSearchQuery) {
        entries = entries.filter(entry => ticketMatchesSearch(entry, currentSearchQuery));
      } else {
        entries = entries.filter(entry => {
          const dateObj = parseDateFromString(entry.date);
          if (!dateObj) return false;
          const entryDateYMD = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
          return entryDateYMD === selectedDateStr;
        });
      }

      if (currentStatusFilter === 'PENDING') {
        entries = entries.filter(entry => {
          const s = (entry.status || '').toUpperCase().trim();
          return s !== 'RESOLVED' && s !== 'OTHER TASK';
        });
      } else if (currentStatusFilter) {
        entries = entries.filter(entry => (entry.status || '').toUpperCase().trim() === currentStatusFilter);
      }
      return entries;
    }

    function renderTable() {
      const visibleEntries = getVisibleEntries();

      // Update match count badge in header
      if (window.updateSearchMatchCount) {
        window.updateSearchMatchCount(currentSearchQuery ? visibleEntries.length : null);
      }

      // Update search status banner above table
      const searchBanner = document.getElementById('searchStatusBar');
      const searchStatusQuery = document.getElementById('searchStatusQuery');
      const searchStatusCount = document.getElementById('searchStatusCount');
      if (searchBanner && searchStatusQuery && searchStatusCount) {
        if (currentSearchQuery) {
          searchBanner.style.display = 'flex';
          searchStatusQuery.textContent = `"${currentSearchQuery}"`;
          searchStatusCount.textContent = visibleEntries.length;
        } else {
          searchBanner.style.display = 'none';
        }
      }

      const tbody = document.querySelector('#entryTable tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      if (visibleEntries.length === 0) {
        if (currentSearchQuery) {
          tbody.innerHTML = `
            <tr>
              <td colspan="13" style="text-align: center; padding: 48px 16px; color: var(--text-muted); font-size: 0.88rem;">
                <i class="bi bi-search" style="font-size: 1.8rem; display: block; margin-bottom: 10px; opacity: 0.45;"></i>
                <div style="font-weight: 600; margin-bottom: 4px; color: var(--text-primary);">No tickets found matching "${escapeHtml(currentSearchQuery)}"</div>
                <div style="font-size: 0.78rem; opacity: 0.75; margin-bottom: 12px;">Try searching by Ticket #, Store Name, MID, Agent Name, Issue, Remarks, or Status.</div>
                <button type="button" class="btn btn-sm" style="font-size: 0.8rem; padding: 4px 12px; cursor: pointer;" onclick="window.clearGlobalSearch && window.clearGlobalSearch()">
                  <i class="bi bi-x-circle me-1" aria-hidden="true"></i> Clear Search
                </button>
              </td>
            </tr>
          `;
        } else {
          tbody.innerHTML = `
            <tr>
              <td colspan="13" style="text-align: center; padding: 40px 16px; color: var(--text-muted); font-size: 0.85rem;">
                <i class="bi bi-inbox" style="font-size: 1.6rem; display: block; margin-bottom: 8px; opacity: 0.4;"></i>
                No tickets found for this view
              </td>
            </tr>
          `;
        }
        updateSelectAllCheckboxState();
        updateStatusCounters();
        return;
      }
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      visibleEntries.forEach(entry => {
        let displayDate = `<span class="date-main">${escapeHtml(entry.date || '')}</span>`;
        const dateObj = parseDateFromString(entry.date);
        if (dateObj) {
          const m = dateObj.getMonth() + 1;
          const dd = String(dateObj.getDate()).padStart(2, '0');
          const yy = String(dateObj.getFullYear()).slice(-2);
          const dayName = dayNames[dateObj.getDay()];
          displayDate = `<div class="cell-date"><span class="date-main">${m}/${dd}/${yy}</span><span class="day-subtext">${dayName}</span></div>`; 
        }

        let combinedRemarks = '';
        if ((entry.status || '').toUpperCase() === 'OTHER TASK') {
          combinedRemarks = escapeHtml(entry.resolution || '');
        } else {
          const parsedRem = formatMultiline(entry.remarks || '');
          const parsedRes = entry.resolution || '';
          if (parsedRem && parsedRes) {
            combinedRemarks = escapeHtml(parsedRem) + '\n\n' + escapeHtml(parsedRes);
          } else {
            combinedRemarks = escapeHtml(parsedRem || parsedRes);
          }
        }

        const row = document.createElement('tr');
        row.dataset.id = entry.id;
        row.dataset.status = (entry.status || '').toUpperCase();
        row.innerHTML = `
            <td><input type="checkbox" class="row-checkbox" value="${entry.id}"></td>
            <td>${displayDate}</td>
            <td>${entry.shift || ''}</td>
            <td>${entry.support || ''}</td>
            <td>${entry.store || ''}</td>
            <td>${entry.mid || ''}</td>
            <td>${entry.merchant || ''}</td>
            <td>${entry.contactNumber || ''}</td>
            <td style="white-space:pre-wrap;">${entry.issue || ''}</td>
            <td>${entry.escalated || ''}</td>
            <td data-status="${(entry.status || '').toUpperCase()}" class="status-pill-cell"><span class="status-pill">${escapeHtml(entry.status || '—')}</span></td>
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
      const selectedDateStr = document.getElementById('creditcard-date')?.value || '';
      
      const allCreditCardEntries = allEntries.filter(entry => !entry.deleted && entry.source === 'creditcard');

      let baseEntries = allCreditCardEntries;
      if (currentSearchQuery) {
        baseEntries = baseEntries.filter(entry => ticketMatchesSearch(entry, currentSearchQuery));
      } else if (selectedDateStr) {
        baseEntries = baseEntries.filter(entry => {
          return getEntryDateYMD(entry.date) === selectedDateStr;
        });
      }
      
      // BulkBar table status counters (current view)
      let resolved = 0, pending = 0, other = 0;
      baseEntries.forEach(entry => {
        const status = (entry.status || '').toUpperCase().trim();
        if (status === 'RESOLVED') resolved++;
        else if (status === 'OTHER TASK') other++;
        else pending++;
      });
      
      if (document.getElementById('counterResolved')) document.getElementById('counterResolved').innerText = resolved;
      if (document.getElementById('counterPending')) document.getElementById('counterPending').innerText = pending;
      if (document.getElementById('counterOther')) document.getElementById('counterOther').innerText = other;
      
      // Dashboard Cards (overall metrics)
      const todayYMD = getLocalTodayString();
      const yesterdayYMD = getLocalYesterdayString();

      let yourTicketsTotal = allCreditCardEntries.length;
      let yesterdayTicketsTotal = 0;
      let todayTicketsTotal = 0;
      let overallResolvedTotal = 0;
      let overallPendingTotal = 0;

      allCreditCardEntries.forEach(entry => {
        const entryYMD = getEntryDateYMD(entry.date);
        if (entryYMD === todayYMD) {
          todayTicketsTotal++;
        }
        if (entryYMD === yesterdayYMD) {
          yesterdayTicketsTotal++;
        }

        const status = (entry.status || '').toUpperCase().trim();
        if (status === 'RESOLVED' || status === 'OTHER TASK') {
          overallResolvedTotal++;
        } else {
          overallPendingTotal++;
        }
      });
      
      const yourTicketsEl = document.getElementById('dashboardYourTickets');
      const yesterdayTicketsEl = document.getElementById('dashboardYesterdayTickets');
      const todayTicketsEl = document.getElementById('dashboardTodayTickets');
      const dashResolvedEl = document.getElementById('dashboardResolvedTickets');
      const dashPendingEl = document.getElementById('dashboardPendingTickets');
      
      if (yourTicketsEl) yourTicketsEl.textContent = yourTicketsTotal;
      if (yesterdayTicketsEl) yesterdayTicketsEl.textContent = yesterdayTicketsTotal;
      if (todayTicketsEl) todayTicketsEl.textContent = todayTicketsTotal;
      if (dashResolvedEl) dashResolvedEl.textContent = overallResolvedTotal;
      if (dashPendingEl) dashPendingEl.textContent = overallPendingTotal;
    }

    window.setFilterToToday = function() {
      const dateEl = document.getElementById('creditcard-date');
      if (dateEl) {
        dateEl.value = getLocalTodayString();
        dateEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    window.setFilterToYesterday = function() {
      const dateEl = document.getElementById('creditcard-date');
      if (dateEl) {
        dateEl.value = getLocalYesterdayString();
        dateEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    window.showAllTickets = function() {
      if (window.clearGlobalSearch) {
        window.clearGlobalSearch();
      } else {
        const searchEl = document.getElementById('headerSearch');
        if (searchEl) searchEl.value = '';
        currentSearchQuery = '';
      }
      currentStatusFilter = null;
      document.querySelectorAll('.status-filter-btn').forEach(btn => btn.classList.remove('active'));
      renderTable();
    };

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
    };

    window.getPendingTickets = function() {
      return allEntries
        .filter(entry => {
          if (entry.deleted || entry.source !== 'creditcard') return false;
          const status = (entry.status || '').toUpperCase().trim();
          return status !== 'RESOLVED' && status !== 'OTHER TASK';
        })
        .map(entry => ({
          id: entry.id,
          ticketNumber: entry.ticketNumber || '',
          store: entry.store || '',
          mid: entry.mid || '',
          merchant: entry.merchant || '',
          contactNumber: entry.contactNumber || '',
          issue: entry.issue || '',
          resolution: entry.resolution || '',
          support: entry.support || '',
          date: entry.date || '',
          escalated: entry.escalated || '',
          status: entry.status || ''
        }));
    };

    window.showNotification = showNotification;

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

      let historyEntries = allEntries.filter(entry => !entry.deleted && !entry.imported && entry.source === 'creditcard');

      if (currentSearchQuery) {
        historyEntries = historyEntries.filter(entry => ticketMatchesSearch(entry, currentSearchQuery));
      }

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
        // When searching, auto-expand any month group containing matching tickets
        const isMonthCollapsed = currentSearchQuery ? false : collapseState.months[month];
        const monthTotal = Object.values(grouped[month]).reduce((sum, arr) => sum + arr.length, 0);
        const monthBadge = currentSearchQuery ? `<span class="search-match-count">(${monthTotal})</span>` : '';
        html += `<div class="sidebar-group">
                  <div class="month-header" onclick="toggleMonth('${month.replace(/'/g, "\\'")}')">
                      <i class="bi bi-chevron-down collapse-caret ${isMonthCollapsed ? 'is-collapsed' : ''}" aria-hidden="true"></i> ${month} ${monthBadge}
                  </div>`;
        if (!isMonthCollapsed) {
          const dates = grouped[month];
          const sortedDates = Object.keys(dates).sort((a, b) => new Date(b) - new Date(a));
          for (const dateKey of sortedDates) {
            if (collapseState.dates[dateKey] === undefined) collapseState.dates[dateKey] = dateKey !== todayFormatted;
            // When searching, auto-expand any date group containing matching tickets
            const isDateCollapsed = currentSearchQuery ? false : collapseState.dates[dateKey];
            const dateBadge = currentSearchQuery ? `<span class="search-match-count">(${dates[dateKey].length})</span>` : '';
            html += `<div class="date-group">
                      <div class="date-header" onclick="toggleDate('${dateKey.replace(/'/g, "\\'")}')">
                          <i class="bi bi-chevron-down collapse-caret ${isDateCollapsed ? 'is-collapsed' : ''}" aria-hidden="true"></i> ${dateKey} ${dateBadge}
                      </div>`;
            if (!isDateCollapsed) {
              html += `<div class="date-entries">`;
              for (const entry of dates[dateKey]) {
                
                let ticketDisplay = entry.ticketNumber ? `TICKET #: ${entry.ticketNumber}` : 'NO TICKET #';
                
                let issueTextColor = '';
                switch ((entry.status || '').toUpperCase()) {
                  case 'RESOLVED': issueTextColor = '#11734b'; break;
                  case 'PENDING': issueTextColor = '#b10202'; break;
                  case 'OTHER TASK': issueTextColor = '#1a6d9f'; break;
                }
                
                html += `
                  <div class="sidebar-card" data-id="${entry.id}">
                      <div class="preview-item issue-item" ${issueTextColor ? `style="color:${issueTextColor};"` : ''}>${escapeHtml(ticketDisplay)}</div>
                      <div class="preview-item"><strong>Store:</strong> ${escapeHtml(entry.store || '-')}</div>
                      <div class="preview-item"><strong>MID:</strong> ${escapeHtml(entry.mid || '-')}</div>
                      <div class="card-actions">
                          <div class="card-actions-row stack-row">
                              <button class="copy-store" data-id="${entry.id}"><i class="bi bi-clipboard" aria-hidden="true"></i> DETAILS</button>
                              <button class="copy-details" data-id="${entry.id}"><i class="bi bi-clipboard-data" aria-hidden="true"></i> HRMS</button>
                              <button class="add-ticket-btn" data-id="${entry.id}"><i class="bi bi-ticket-perforated" aria-hidden="true"></i> TICKET #</button>
                          </div>
                          <div class="card-actions-row">
                              <button class="edit-entry stack-btn" data-id="${entry.id}"><i class="bi bi-pencil-square" aria-hidden="true"></i> EDIT</button>
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

      if (historyEntries.length === 0) {
        if (currentSearchQuery) {
          html = `
            <div class="sidebar-search-empty">
              <i class="bi bi-search" style="font-size: 1.4rem; display: block; margin-bottom: 8px; opacity: 0.4;"></i>
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">No history matches</div>
              <div style="font-size: 0.75rem; opacity: 0.75; margin-top: 4px;">No tickets match "${escapeHtml(currentSearchQuery)}"</div>
              <button type="button" class="btn btn-sm" style="margin-top: 10px; font-size: 0.75rem; padding: 4px 10px; cursor: pointer;" onclick="window.clearGlobalSearch && window.clearGlobalSearch()">
                Clear search
              </button>
            </div>
          `;
        } else {
          html = '<div style="padding:20px; text-align:center;">No entries yet.</div>';
        }
      }
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
            
            const statusUp = (entry.status || '').toUpperCase();
            
            const dayEntries = allEntries.filter(e => e.date === entry.date && e.source === 'creditcard' && !e.deleted)
                                         .sort((a, b) => a.id - b.id);
            const dailyNumber = dayEntries.findIndex(e => e.id === entry.id) + 1;

            let dateHeader = '';
            if (dailyNumber === 1 && entry.date) {
              const parts = entry.date.split('/');
              let shortDate = entry.date;
              if (parts.length === 3) {
                shortDate = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2].slice(-2)}`;
              }
              dateHeader = `--------------\n${shortDate}\n--------------\n\n`;
            }

            let rawTroubleshootingText = formatMultiline(entry.originalRemarks || entry.remarks);
            let troubleshootingSection = rawTroubleshootingText ? `TROUBLESHOOTING:\n${rawTroubleshootingText}\n\n` : '';
            
            let summaryText = formatMultiline(entry.remarks || entry.aiSummary || '');
            let manualResolution = entry.resolution || '';
            let resolutionText = '';
            let footerType = "CALL & BACKEND"; 
            let footerStatus = "SOLVED"; 

            if (statusUp === 'RESOLVED') {
              footerType = "CALL";
              resolutionText = (summaryText && manualResolution) ? `${summaryText}\n${manualResolution}` : (summaryText || manualResolution);
            } else if (statusUp === 'OTHER TASK') {
              footerType = "BACKEND";
              resolutionText = manualResolution; 
            } else if (statusUp === 'PENDING') {
              footerStatus = "PENDING"; 
              footerType = "CALL"; 
              resolutionText = (summaryText && manualResolution) ? `${summaryText}\n${manualResolution}` : (summaryText || manualResolution);
            } else {
              resolutionText = (summaryText && manualResolution) ? `${summaryText}\n${manualResolution}` : (summaryText || manualResolution);
            }

            const blockText = 
`${dateHeader}TICKET NUMBER: ${entry.ticketNumber || ''}
STORE NAME: ${entry.store || ''}
MID: ${entry.mid || ''}
PERSON NAME: ${entry.merchant || ''}
PHONE NUMBER: ${entry.contactNumber || ''}
ISSUE: ${entry.issue || ''}
-

${troubleshootingSection}RESOLUTION:
${resolutionText}

-
TICKET IN HRMS [${footerStatus}] OF ${footerType}`;

            navigator.clipboard.writeText(blockText);
            showNotification('Details copied!');
          }
        });
      });

      container.querySelectorAll('.add-ticket-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const entry = allEntries.find(e => e.id == id);
          if (entry) {
            const ticketNum = prompt('Enter Ticket Number:', entry.ticketNumber || '');
            
            if (ticketNum !== null) {
              entry.ticketNumber = ticketNum.trim();
              if (editId && editId == entry.id) {
                const tInput = document.getElementById('creditcard-ticketNumber');
                if (tInput) tInput.value = entry.ticketNumber;
                creditcardUpdatePreview();
              }
              saveAllEntries();
              renderSidebar(); 
              showNotification('Ticket number saved!');
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
            
            const statusUp = (entry.status || '').toUpperCase();
            const rawTroubleshooting = formatMultiline(entry.originalRemarks || entry.remarks || entry.resolution || '');
            const steps = rawTroubleshooting.split('\n')
                                            .map(s => s.trim().replace(/^[-•]\s*/, ''))
                                            .filter(s => s.length > 0);
            
            let plainText = '';
            let htmlText = '';

            if (statusUp === 'OTHER TASK') {
              steps.forEach(step => { plainText += `• ${step}\n`; });
            
              htmlText = `<strong style="font-weight: bold;">TROUBLESHOOTING:</strong><br><ul>`;
              steps.forEach(step => { htmlText += `<li>${escapeHtml(step)}</li>`; });
              htmlText += `</ul>`;
            } else {
              plainText = `CONTACT INFORMATION:\nPERSON NAME: ${entry.merchant || ''}\nPHONE NUMBER: ${entry.contactNumber || ''}\n\nTROUBLESHOOTING:\n`;
              steps.forEach(step => { plainText += `• ${step}\n`; });
              
              htmlText = `
<strong style="font-weight: bold;">CONTACT INFORMATION:</strong><br>
PERSON NAME: ${escapeHtml(entry.merchant || '')}<br>
PHONE NUMBER: ${escapeHtml(entry.contactNumber || '')}<br><br>
<strong style="font-weight: bold;">TROUBLESHOOTING:</strong><br>
<ul>
`;
              steps.forEach(step => { htmlText += `<li>${escapeHtml(step)}</li>`; });
              htmlText += `</ul>`;
            }

            try {
              const clipboardItem = new ClipboardItem({
                'text/plain': new Blob([plainText.trim()], { type: 'text/plain' }),
                'text/html': new Blob([htmlText.trim()], { type: 'text/html' })
              });
              await navigator.clipboard.write([clipboardItem]);
              showNotification('HRMS format copied!');
            } catch (err) {
              navigator.clipboard.writeText(plainText.trim());
              showNotification('HRMS plain text copied!');
            }
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
    
 // ─── WORKLOAD TRACKER ───
    window.generateWorkload = function() {
      const workloadDatePicker = document.getElementById('workload-date-picker');
      const mainDatePicker = document.getElementById('creditcard-date');
      
      const entries = (allEntries && allEntries.length > 0) 
        ? allEntries 
        : (JSON.parse(localStorage.getItem('unifiedEntries_creditcard')) || []);
      
      if (entries.length === 0) {
        alert("No tickets found in the system.");
        return;
      }

      let selectedYMD = "";
      if (workloadDatePicker && workloadDatePicker.value) {
        selectedYMD = workloadDatePicker.value;
      } else if (mainDatePicker && mainDatePicker.value) {
        selectedYMD = mainDatePicker.value;
      }

      if (!selectedYMD) {
        alert("Please select a specific date to generate the workload tracker.");
        return;
      }

      const filteredEntries = entries.filter(entry => {
        if (!entry.date || entry.deleted || entry.source !== 'creditcard') return false;
        
        const dateObj = parseDateFromString(entry.date);
        if (!dateObj) return false;
        
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const entryDateYMD = `${yyyy}-${mm}-${dd}`;
        
        return entryDateYMD === selectedYMD; 
      });
      
      if (filteredEntries.length === 0) {
        alert(`No tickets found for ${selectedYMD}`);
        return;
      }

      filteredEntries.sort((a, b) => a.id - b.id);
      
      let outputText = "";
      
      filteredEntries.forEach((entry, index) => {
        const statusUp = (entry.status || '').toUpperCase();
        const dailyNumber = index + 1;

        let dateHeader = '';
        if (dailyNumber === 1 && entry.date) {
          const parts = entry.date.split('/');
          let shortDate = entry.date;
          if (parts.length === 3) {
            shortDate = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2].slice(-2)}`;
          }
          dateHeader = `--------------\n${shortDate}\n--------------\n\n`;
        }

        let summaryText = formatMultiline(entry.remarks || entry.aiSummary || '');
        let manualResolution = entry.resolution || '';
        let resolutionText = '';
        let footerType = "CALL & BACKEND"; 
        let footerStatus = "SOLVED"; 

        if (statusUp === 'RESOLVED') {
          footerType = "CALL";
          resolutionText = (summaryText && manualResolution) ? `${summaryText}\n${manualResolution}` : (summaryText || manualResolution);
        } else if (statusUp === 'OTHER TASK') {
          footerType = "BACKEND";
          resolutionText = manualResolution;
        } else if (statusUp === 'PENDING') {
          footerStatus = "PENDING"; 
          footerType = "CALL"; 
          resolutionText = (summaryText && manualResolution) ? `${summaryText}\n${manualResolution}` : (summaryText || manualResolution);
        } else {
          resolutionText = (summaryText && manualResolution) ? `${summaryText}\n${manualResolution}` : (summaryText || manualResolution);
        }

        const blockText = 
`${dateHeader}[${dailyNumber}]
TICKET NUMBER: ${entry.ticketNumber || ''}
STORE NAME: ${entry.store || ''}
MID: ${entry.mid || ''}
PERSON NAME: ${entry.merchant || ''}
PHONE NUMBER: ${entry.contactNumber || ''}
ISSUE: ${entry.issue || ''}
RESOLUTION: ${resolutionText}
TICKET IN HRMS [${footerStatus}] OF ${footerType}`;

        outputText += blockText + '\n\n';
      });
      
      navigator.clipboard.writeText(outputText).then(() => {
        if (typeof showNotification === 'function') {
          showNotification(`Workload for ${selectedYMD} copied to clipboard!`);
        } else {
          alert(`Workload for ${selectedYMD} copied to clipboard!`);
        }
      }).catch(err => {
        console.error('Failed to copy workload: ', err);
        alert('Failed to copy to clipboard. Check the console for details.');
      });
    };
    
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

    function updateSelectAllCheckboxState() {
      const selectAllCb = document.getElementById('selectAllCheckbox');
      const rowCbs = document.querySelectorAll('#entryTable tbody .row-checkbox');
      if (!selectAllCb) return;
      if (rowCbs.length === 0) {
        selectAllCb.checked = false;
        selectAllCb.indeterminate = false;
        return;
      }
      const checkedCount = Array.from(rowCbs).filter(cb => cb.checked).length;
      if (checkedCount === 0) {
        selectAllCb.checked = false;
        selectAllCb.indeterminate = false;
      } else if (checkedCount === rowCbs.length) {
        selectAllCb.checked = true;
        selectAllCb.indeterminate = false;
      } else {
        selectAllCb.checked = false;
        selectAllCb.indeterminate = true;
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

    // ✅ PURE DATE FORMAT PARA SA EXCEL (DD/MM/YYYY)
    function bulkCopy() {
      const ids = getSelectedRowIds();
      if (ids.length === 0) { showNotification('No rows selected'); return; }
      const selectedRows = allEntries.filter(entry => ids.includes(entry.id.toString()));
      selectedRows.reverse();
      
      const rows = selectedRows.map(entry => {
        let exportDate = entry.date || '';
        if (exportDate) {
          const parts = exportDate.split('/');
          if (parts.length === 3) {
            // Binabasa bilang DD/MM/YYYY para pumasok ng tama sa Excel
            const m = String(parseInt(parts[0], 10)).padStart(2, '0');
            const d = String(parseInt(parts[1], 10)).padStart(2, '0');
            const y = parts[2];
            exportDate = `${d}/${m}/${y}`;
          }
        }

        let combinedRemarks = '';
        if ((entry.status || '').toUpperCase() === 'OTHER TASK') {
          combinedRemarks = entry.resolution || '';
        } else {
          const parsedRem = formatMultiline(entry.remarks || '');
          const parsedRes = entry.resolution || '';
          if (parsedRem && parsedRes) {
            combinedRemarks = parsedRem + '\n\n' + parsedRes;
          } else {
            combinedRemarks = parsedRem || parsedRes;
          }
        }

        return [
          exportDate, 
          entry.shift, 
          entry.support, 
          entry.store, 
          entry.mid, 
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

    function copyAllEntries() {
      const visibleEntries = getVisibleEntries();
      if (!visibleEntries || visibleEntries.length === 0) {
        showNotification('No tickets to copy');
        return;
      }
      
      const rows = visibleEntries.map(entry => {
        let exportDate = entry.date || '';
        if (exportDate) {
          const parts = exportDate.split('/');
          if (parts.length === 3) {
            const m = String(parseInt(parts[0], 10)).padStart(2, '0');
            const d = String(parseInt(parts[1], 10)).padStart(2, '0');
            const y = parts[2];
            exportDate = `${d}/${m}/${y}`;
          }
        }

        let combinedRemarks = '';
        if ((entry.status || '').toUpperCase() === 'OTHER TASK') {
          combinedRemarks = entry.resolution || '';
        } else {
          const parsedRem = formatMultiline(entry.remarks || '');
          const parsedRes = entry.resolution || '';
          if (parsedRem && parsedRes) {
            combinedRemarks = parsedRem + '\n\n' + parsedRes;
          } else {
            combinedRemarks = parsedRem || parsedRes;
          }
        }

        return [
          exportDate, 
          entry.shift, 
          entry.support, 
          entry.store, 
          entry.mid, 
          entry.merchant || '', 
          entry.contactNumber, 
          entry.issue || '', 
          entry.escalated || '', 
          entry.status || '', 
          combinedRemarks 
        ].map(f => escapeCSV(String(f ?? ''))).join('\t');
      });

      navigator.clipboard.writeText(rows.join('\n')).then(() => showNotification(`Copied all ${rows.length} tickets`));
    }
    window.copyAllEntries = copyAllEntries;

   // ─── COMBOBOX ───
    function initCombobox(comboboxId, hiddenId, optionsArray, suggestionsId, onSelectCallback) {
      const input = document.getElementById(comboboxId);
      const hidden = document.getElementById(hiddenId);
      const suggestionsDiv = document.getElementById(suggestionsId);
      if (!input || !hidden || !suggestionsDiv) return;
      let currentFocus = -1;
      let currentOptions = [];
      let ignoreNextRender = false;

      function renderSuggestions(filterText, forceShowAll = false) {
        if (ignoreNextRender) return;
        const filter = filterText.trim().toLowerCase();
        
        currentOptions = (filter === '' || forceShowAll) 
            ? [...optionsArray] 
            : optionsArray.filter(opt => opt.toLowerCase().includes(filter));
            
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
      
      input.addEventListener('click', () => { 
        if (!ignoreNextRender) renderSuggestions(input.value, true); 
      });
      
      input.addEventListener('focus', () => { 
        if (!ignoreNextRender) renderSuggestions(input.value, true); 
      });

      document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestionsDiv.contains(e.target)) { 
          suggestionsDiv.style.display = 'none'; 
          ignoreNextRender = false; 
        }
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

    function createDraftTabButton(draftId, label = 'Ticket') {
      const btn = document.createElement('button');
      btn.id = `ticketTab-${draftId}`;
      btn.className = 'tab-btn';
      btn.innerHTML = `<span class="tab-label">${label}</span><button class="tab-close">×</button>`;
      btn.onclick = () => activateDraftTab(draftId);
      btn.querySelector('.tab-close').onclick = (e) => { e.stopPropagation(); closeDraftTab(draftId); };
      return btn;
    }

    function persistActiveDraftId(draftId) {
      if (draftId) {
        localStorage.setItem('activeDraftId_creditcard', draftId);
      }
    }

    function resetDraftTabs() {
      const tabsContainer = document.querySelector('.top-tabs');
      if (tabsContainer) {
        tabsContainer.querySelectorAll('.tab-btn[id^="ticketTab-"]').forEach(btn => btn.remove());
      }
      
      try {
        const savedTabs = JSON.parse(localStorage.getItem(DRAFT_TABS_KEY) || '[]');
        savedTabs.forEach(tab => {
          if (tab && tab.id) {
            localStorage.removeItem(`draftData_${tab.id}`);
          }
        });
      } catch (e) {}

      localStorage.removeItem(DRAFT_TABS_KEY);
      localStorage.removeItem('activeDraftId_creditcard');
      currentDraftId = null;

      const ccTabBtn = document.getElementById('tabBtn-creditcard');
      if (ccTabBtn) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        ccTabBtn.classList.add('active');
      }
      clearFormFields('creditcard');
      creditcardUpdatePreview();
    }
    window.resetDraftTabs = resetDraftTabs;

    window.createNewTicket = function() {
      const tabsContainer = document.querySelector('.top-tabs');
      if (!tabsContainer) return;
      const todayEST = getESTDateString();
      const draftId = `draft-${Date.now()}`;
      const btn = createDraftTabButton(draftId, 'Ticket');
      tabsContainer.appendChild(btn);
      
      const savedNow = JSON.parse(localStorage.getItem(DRAFT_TABS_KEY) || '[]');
      savedNow.push({ id: draftId, label: 'Ticket', date: todayEST });
      localStorage.setItem(DRAFT_TABS_KEY, JSON.stringify(savedNow));
      if (typeof window.switchToDashboardView === 'function') {
        window.switchToDashboardView();
      } else if (typeof window.switchToFormTab === 'function') {
        window.switchToFormTab();
      }
      clearFormFields('creditcard');
      activateDraftTab(draftId);
      return draftId;
    };

    let currentDraftId = null;

    function saveDraftData(draftId) {
      if (!draftId) return;
      const fields = ['ticketNumber', 'shift', 'mid', 'store', 'merchant', 'contactNumber', 'issue', 'escalated', 'status', 'resolution', 'date', 'support'];
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
        ['ticketNumber', 'date','shift','support','mid','store','merchant','contactNumber','issue','escalated','status', 'resolution'].forEach(id => {
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
      persistActiveDraftId(draftId);
      creditcardUpdatePreview();
    }

    function updateTabLabelFromDraft(draftId, data) {
      try {
        const btn = document.getElementById(`ticketTab-${draftId}`);
        if (!btn) return;
        
        const storeName = (data && data.store) ? data.store : document.getElementById('creditcard-store')?.value || '';
        const mid = (data && data.mid) ? data.mid : document.getElementById('creditcard-mid')?.value || '';
        const ticketNum = (data && data.ticketNumber) ? data.ticketNumber : document.getElementById('creditcard-ticketNumber')?.value || '';
        
        let label = storeName || mid || (ticketNum ? `Ticket #${ticketNum}` : 'Ticket');
        btn.querySelector('.tab-label').textContent = label;
      } catch (e) {}
    }

    function closeDraftTab(draftId) {
      const btn = document.getElementById(`ticketTab-${draftId}`);
      if (btn) btn.remove();
      localStorage.removeItem(`draftData_${draftId}`);
      const saved = JSON.parse(localStorage.getItem(DRAFT_TABS_KEY) || '[]');
      const remaining = saved.filter(s => s.id !== draftId);
      localStorage.setItem(DRAFT_TABS_KEY, JSON.stringify(remaining));
      if (currentDraftId === draftId) {
        currentDraftId = null;
        localStorage.removeItem('activeDraftId_creditcard');
        clearFormFields('creditcard');
        if (remaining.length > 0) {
          const nextDraft = remaining[remaining.length - 1];
          activateDraftTab(nextDraft.id);
        } else {
          const ccTabBtn = document.getElementById('tabBtn-creditcard');
          if (ccTabBtn) {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            ccTabBtn.classList.add('active');
          }
        }
      }
    }

    window.saveCurrentDraft = function() {
      const savedDraftId = ensureDraftForSaving({
        currentDraftId,
        createNewDraft: () => window.createNewTicket(),
        saveDraftData: (draftId) => {
          saveDraftData(draftId);
        }
      });

      if (savedDraftId) {
        showNotification('Draft saved');
      }
    };

    // ─── AUTO-FILL FROM TEXT ───
    window.autoFillFromText = function(text) {
      if (!text) return;
      
      let updated = false;

      const parseField = (regex, id, formatter = null) => {
        const match = text.match(regex);
        if (match && match[1]) {
          const el = document.getElementById(id);
          if (el) {
            let val = match[1].trim();
            if (formatter) val = formatter(val);
            el.value = val;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            updated = true;
          }
        }
      };

      parseField(/TICKET (?:NUMBER|#):\s*(.*)/i, 'creditcard-ticketNumber');
      parseField(/STORE NAME:\s*(.*)/i, 'creditcard-store');
      parseField(/MID:\s*(.*)/i, 'creditcard-mid');
      parseField(/PERSON NAME:\s*(.*)/i, 'creditcard-merchant');
      parseField(/PHONE NUMBER:\s*(.*)/i, 'creditcard-contactNumber', formatPhoneNumber);
      
      const issueMatch = text.match(/ISSUE:\s*([\s\S]*?)(?=RESOLUTION:|$)/i);
      if (issueMatch && issueMatch[1]) {
         const el = document.getElementById('creditcard-issue');
         if (el) { 
           let val = issueMatch[1].trim().replace(/^[-•]\s*/, ''); 
           el.value = val; 
           el.dispatchEvent(new Event('input', { bubbles: true }));
           updated = true; 
         }
      }

      const resolutionMatch = text.match(/RESOLUTION:\s*([\s\S]*)/i);
      if (resolutionMatch && resolutionMatch[1]) {
         const el = document.getElementById('creditcard-resolution');
         if (el) { 
           let val = resolutionMatch[1];
           val = val.split(/TICKET IN HRMS/i)[0];
           val = val.replace(/\n-\s*$/, '');
           val = val.trim().replace(/^[-•]\s*/, ''); 
           
           el.value = val; 
           el.dispatchEvent(new Event('input', { bubbles: true }));
           updated = true; 
         }
      }

      // Support tab-separated Google Sheet rows:
      // Order: Date, Shift Schedule, Support Name, Store Name, MID, Merchant Name, Contact #, Issue, Escalated, Status, Remarks
      if (text.includes('\t') && !/STORE NAME:/i.test(text)) {
        const firstLine = text.trim().split(/\r?\n/)[0];
        const cols = firstLine.split('\t');
        if (cols.length >= 4) {
          if (cols[0]) {
            const dateEl = document.getElementById('creditcard-date');
            const parsedD = parseDateFromString(cols[0].trim());
            if (dateEl && parsedD) {
              const yyyy = parsedD.getFullYear();
              const mm = String(parsedD.getMonth() + 1).padStart(2, '0');
              const dd = String(parsedD.getDate()).padStart(2, '0');
              dateEl.value = `${yyyy}-${mm}-${dd}`;
              dateEl.dispatchEvent(new Event('input', { bubbles: true }));
              updated = true;
            }
          }
          if (cols[1]) {
            const shiftEl = document.getElementById('creditcard-shift');
            if (shiftEl) {
              shiftEl.value = cols[1].trim();
              shiftEl.dispatchEvent(new Event('change', { bubbles: true }));
              updated = true;
            }
          }
          if (cols[2]) {
            const supportEl = document.getElementById('creditcard-support');
            if (supportEl) {
              supportEl.value = cols[2].trim().toUpperCase();
              supportEl.dispatchEvent(new Event('change', { bubbles: true }));
              updated = true;
            }
          }
          if (cols[3]) {
            const storeEl = document.getElementById('creditcard-store');
            if (storeEl) {
              storeEl.value = cols[3].trim();
              storeEl.dispatchEvent(new Event('input', { bubbles: true }));
              updated = true;
            }
          }
          if (cols[4]) {
            const midEl = document.getElementById('creditcard-mid');
            if (midEl) {
              midEl.value = cols[4].trim();
              midEl.dispatchEvent(new Event('input', { bubbles: true }));
              updated = true;
            }
          }
          if (cols.length > 5 && cols[5]) {
            const merchEl = document.getElementById('creditcard-merchant');
            if (merchEl) {
              merchEl.value = cols[5].trim();
              merchEl.dispatchEvent(new Event('input', { bubbles: true }));
              updated = true;
            }
          }
          if (cols.length > 6 && cols[6]) {
            const phoneEl = document.getElementById('creditcard-contactNumber');
            if (phoneEl) {
              phoneEl.value = formatPhoneNumber(cols[6].trim());
              phoneEl.dispatchEvent(new Event('input', { bubbles: true }));
              updated = true;
            }
          }
          if (cols.length > 7 && cols[7]) {
            const issueEl = document.getElementById('creditcard-issue');
            if (issueEl) {
              issueEl.value = cols[7].trim();
              issueEl.dispatchEvent(new Event('input', { bubbles: true }));
              updated = true;
            }
          }
          if (cols.length > 8 && cols[8]) {
            const escEl = document.getElementById('creditcard-escalated');
            if (escEl) {
              escEl.value = cols[8].trim();
              escEl.dispatchEvent(new Event('input', { bubbles: true }));
              updated = true;
            }
          }
          if (cols.length > 9 && cols[9]) {
            const statusVal = cols[9].trim();
            const statusInput = document.getElementById('creditcard-status');
            const statusCombo = document.getElementById('creditcard-status-combobox');
            if (statusInput) statusInput.value = statusVal;
            if (statusCombo) statusCombo.value = statusVal;
            updated = true;
          }
          if (cols.length > 10 && cols[10]) {
            const remarksVal = cols[10].trim();
            if (quillEditor) {
              quillEditor.setText(remarksVal + '\n');
            }
            const remarksHidden = document.getElementById('creditcard-remarks');
            if (remarksHidden) remarksHidden.value = remarksVal;
            updated = true;
          }
        }
      }

      if (updated) {
        creditcardUpdatePreview();
        saveFormData('creditcard');
        showNotification('✨ Form auto-filled from clipboard!');
      }
    };

    function init() {
      // ✅ TATAWAGIN NA ANG API PAGKABUKAS NG APP
      fetchMerchantDatabase();
      initStoreSearch(); // ✅ INITIATE SEARCH DROPDOWN

      document.addEventListener('paste', (e) => {
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        if (!pastedText) return;
        if (/STORE NAME:/i.test(pastedText) && /MID:/i.test(pastedText)) {
            setTimeout(() => {
                window.autoFillFromText(pastedText);
            }, 50);
        } else if (pastedText.includes('\t')) {
            const firstLine = pastedText.trim().split(/\r?\n/)[0];
            const cols = firstLine.split('\t');
            if (cols.length >= 4) {
                setTimeout(() => {
                    window.autoFillFromText(pastedText);
                }, 50);
            }
        }
      });

      document.getElementById('creditcard-date').value = getLocalTodayString();
      loadFormData('creditcard');
      loadAllEntries();
      attachGeminiKeyControls();
      initTheme();

      const todayEST = getESTDateString();
      const lastActiveDate = localStorage.getItem('lastActiveDate_creditcard');

      if (lastActiveDate && lastActiveDate !== todayEST) {
        // Automatically reset all ticket tabs from the previous day
        resetDraftTabs();
      } else {
        // Prune any tabs that are from yesterday
        const rawSavedTabs = JSON.parse(localStorage.getItem(DRAFT_TABS_KEY) || '[]');
        const validTodayTabs = [];
        rawSavedTabs.forEach(tab => {
          let isToday = false;
          if (tab && tab.date) {
            isToday = (tab.date === todayEST);
          } else if (tab && tab.id) {
            const ts = parseInt(tab.id.replace('draft-', ''), 10);
            if (!isNaN(ts) && ts > 1000000000000) {
              const tabDateObj = new Date(ts);
              const tabEST = new Date(tabDateObj.toLocaleString('en-US', { timeZone: 'America/New_York' })).toISOString().slice(0, 10);
              isToday = (tabEST === todayEST);
            }
          }
          if (isToday) {
            validTodayTabs.push(tab);
          } else if (tab && tab.id) {
            localStorage.removeItem(`draftData_${tab.id}`);
          }
        });

        localStorage.setItem(DRAFT_TABS_KEY, JSON.stringify(validTodayTabs));

        const tabsContainer = document.querySelector('.top-tabs');
        if (tabsContainer) {
          tabsContainer.querySelectorAll('.tab-btn[id^="ticketTab-"]').forEach(btn => btn.remove());
          validTodayTabs.forEach(tab => {
            tabsContainer.appendChild(createDraftTabButton(tab.id, tab.label || 'Ticket'));
          });
        }

        const activeDraftId = localStorage.getItem('activeDraftId_creditcard');
        const restoreTarget = validTodayTabs.find(tab => tab.id === activeDraftId) || validTodayTabs[validTodayTabs.length - 1];
        if (restoreTarget) {
          currentDraftId = restoreTarget.id;
          activateDraftTab(restoreTarget.id);
        } else {
          currentDraftId = null;
          localStorage.removeItem('activeDraftId_creditcard');
          const ccTabBtn = document.getElementById('tabBtn-creditcard');
          if (ccTabBtn) {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            ccTabBtn.classList.add('active');
          }
        }
      }

      localStorage.setItem('lastActiveDate_creditcard', todayEST);
      localStorage.setItem('lastClearDate_creditcard', todayEST);

      document.getElementById('clearAllBtn').addEventListener('click', clearAllEntries);
      document.getElementById('bulkDeleteBtn').addEventListener('click', bulkDelete);
      document.getElementById('bulkCopyBtn').addEventListener('click', bulkCopy);
      const copyAllBtn = document.getElementById('copyAllBtn');
      if (copyAllBtn) copyAllBtn.addEventListener('click', copyAllEntries);
      document.getElementById('selectAllCheckbox').addEventListener('change', (e) => handleSelectAll(e.target));
      
      const dateFieldEl = document.getElementById('creditcard-date');
      if (dateFieldEl) {
        dateFieldEl.addEventListener('change', () => {
          if (currentSearchQuery) {
            if (window.clearGlobalSearch) {
              window.clearGlobalSearch();
              return;
            } else {
              currentSearchQuery = '';
            }
          }
          renderTable();
          saveFormData('creditcard');
        });
      }

      ['ticketNumber', 'mid', 'store', 'merchant', 'contactNumber', 'issue', 'escalated', 'status', 'resolution'].forEach(id => {
        const el = document.getElementById(`creditcard-${id}`);
        if (el) {
          el.addEventListener('input', () => {
            creditcardUpdatePreview();
            saveFormData('creditcard');
            if (currentDraftId) saveDraftData(currentDraftId);
          });
        }
      });
      document.getElementById('creditcard-shift').addEventListener('change', () => {
        saveFormData('creditcard');
        if (currentDraftId) saveDraftData(currentDraftId);
      });

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
        if (currentDraftId) saveDraftData(currentDraftId);
      });

      initCombobox('creditcard-status-combobox', 'creditcard-status', STATUS_OPTIONS, 'creditcard-status-suggestions', (selectedValue) => {
        creditcardUpdatePreview(); 
        saveFormData('creditcard');

        const container = document.getElementById('creditcard-other-task-container');
        if (container) {
          if (selectedValue.toUpperCase() === 'OTHER TASK') {
            container.style.display = 'block';
          } else {
            container.style.display = 'none';
            const otherTaskSelect = document.getElementById('creditcard-other-task-select');
            
            if (otherTaskSelect && otherTaskSelect.value !== '') {
              otherTaskSelect.value = ''; 
              
              if (selectedValue.toUpperCase() === 'RESOLVED') {
                document.getElementById('creditcard-issue').value = '';
                document.getElementById('creditcard-resolution').value = '';
                document.getElementById('creditcard-remarks').value = '';
                
                if (quillEditor) {
                  quillEditor.root.innerHTML = '';
                }
                
                if (typeof showNotification === 'function') {
                  showNotification('Template removed');
                }
              }
              
              creditcardUpdatePreview();
              saveFormData('creditcard');
            }
          }
        }
      });
      
      const otherTaskSelect = document.getElementById('creditcard-other-task-select');
      if (otherTaskSelect) {
        otherTaskSelect.addEventListener('change', function(e) {
          const selectedTask = e.target.value;
          const template = OTHER_TASK_TEMPLATES[selectedTask];
          
          if (template) {
            document.getElementById('creditcard-issue').value = template.issue;
            document.getElementById('creditcard-resolution').value = template.resolution;
            
            document.getElementById('creditcard-remarks').value = template.troubleshooting;
            
            if (quillEditor) {
              quillEditor.root.innerHTML = template.troubleshooting
                .split('\n')
                .map(line => `<p>${line}</p>`)
                .join('');
            }
            
            creditcardUpdatePreview();
            saveFormData('creditcard');
            showNotification('Task auto-filled!');
          }
        });
      }

      setInterval(() => {
        const todayEST = getESTDateString();
        if (localStorage.getItem('lastClearDate_creditcard') !== todayEST) {
          document.getElementById('creditcard-date').value = getLocalTodayString();
          resetDraftTabs(); // Fresh start: ticket tabs from previous day automatically disappear!
          saveAllEntries();
          renderTable();
          renderSidebar();
          localStorage.setItem('lastClearDate_creditcard', todayEST);
          localStorage.setItem('lastActiveDate_creditcard', todayEST);
          showNotification('New day started: Ticket tabs reset for today.');
        }
      }, 30000);

      window.addEventListener('beforeunload', () => {
        saveFormData('creditcard');
        if (currentDraftId) saveDraftData(currentDraftId);
        if (editId) attachDraftAutoSave(editId);
      });
      creditcardUpdatePreview(); syncPreviewHeight();
    }

    init();
  })();
}