document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements ---
  const themeToggle = document.getElementById('theme-toggle');
  const liveClock = document.getElementById('live-clock');
  const toastContainer = document.getElementById('toast-container');
  
  // Storage fields
  const formCoordName = document.getElementById('coord-name');
  const formCoordDept = document.getElementById('coord-dept');
  const formCoordPin = document.getElementById('coord-pin');
  const formSessionNotes = document.getElementById('session-notes');
  const btnSave = document.getElementById('btn-save');
  const btnRetrieve = document.getElementById('btn-retrieve');
  const btnClear = document.getElementById('btn-clear');
  const consoleDisplay = document.getElementById('console-display');
  
  // Diagnostic Elements
  const diagLastEvent = document.getElementById('diag-last-event');
  const diagDragItem = document.getElementById('diag-drag-item');
  const diagLocalCount = document.getElementById('diag-local-count');
  const diagSessionCount = document.getElementById('diag-session-count');
  const closeDiag = document.getElementById('close-diag');
  const diagnosticAside = document.getElementById('diagnostic-aside');
  
  // Gauges Elements
  const localSizeVal = document.getElementById('local-size-val');
  const sessionSizeVal = document.getElementById('session-size-val');
  const localGaugeFill = document.getElementById('local-gauge-fill');
  const sessionGaugeFill = document.getElementById('session-gauge-fill');

  // Drag and Drop Elements
  const caregiverCards = document.querySelectorAll('.caregiver-card');
  const dropZones = document.querySelectorAll('.drop-zone');
  const trashZone = document.getElementById('trash-zone');
  const caregiversDeck = document.getElementById('caregivers-deck');

  // --- Clock Init ---
  function updateClock() {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }) + ' | ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    liveClock.textContent = formatted;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // --- Theme Toggle System ---
  function initTheme() {
    const savedTheme = localStorage.getItem('assisterly_theme') || 'light';
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    updateStorageGauges();
  }

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('assisterly_theme', isDark ? 'dark' : 'light');
    showToast(`Swapped to ${isDark ? 'Dark' : 'Light'} Theme`, 'info');
    updateStorageGauges();
  });

  // --- Accordion FAQ System ---
  const faqTriggers = document.querySelectorAll('.faq-trigger');
  faqTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const parent = trigger.parentElement;
      const isActive = parent.classList.contains('active');
      
      // Close all FAQs first
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
      });

      if (!isActive) {
        parent.classList.add('active');
      }
    });
  });

  // --- Toast Notification Helper ---
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '🔔';
    if (type === 'success') icon = '✅';
    else if (type === 'danger') icon = '🚨';
    else if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    // Auto-remove toast from DOM after animation completes
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  // --- Diagnostic Panel System ---
  closeDiag.addEventListener('click', () => {
    diagnosticAside.classList.toggle('minimized');
    if (diagnosticAside.classList.contains('minimized')) {
      closeDiag.innerHTML = '&plus;';
    } else {
      closeDiag.innerHTML = '&times;';
    }
  });

  function updateDiagnosticLog(eventStr, itemIdStr) {
    if (eventStr) diagLastEvent.textContent = eventStr;
    if (itemIdStr) diagDragItem.textContent = itemIdStr;
    diagLocalCount.textContent = localStorage.length;
    diagSessionCount.textContent = sessionStorage.length;
  }

  // --- Gauge Meter Storage Estimator ---
  function updateStorageGauges() {
    let localBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      localBytes += (key.length + localStorage.getItem(key).length) * 2;
    }

    let sessionBytes = 0;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      sessionBytes += (key.length + sessionStorage.getItem(key).length) * 2;
    }

    localSizeVal.textContent = `${localBytes} Bytes`;
    sessionSizeVal.textContent = `${sessionBytes} Bytes`;

    // Maximum safe simulation gauge is 1000 bytes for demo purposes
    const maxDemoBytes = 1000;
    const localPct = Math.min((localBytes / maxDemoBytes) * 100, 100);
    const sessionPct = Math.min((sessionBytes / maxDemoBytes) * 100, 100);

    localGaugeFill.style.width = `${localPct}%`;
    sessionGaugeFill.style.width = `${sessionPct}%`;
    
    updateDiagnosticLog();
  }

  // --- Drag and Drop Logic (S.No 7) ---
  caregiverCards.forEach(card => {
    // 1. dragstart
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.id);
      // Optional glow effect during dragging
      e.dataTransfer.effectAllowed = 'move';
      
      updateDiagnosticLog('dragstart', card.id);
    });

    // 2. dragend
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      updateDiagnosticLog('dragend', card.id);
    });
  });

  dropZones.forEach(zone => {
    // 3. dragover
    zone.addEventListener('dragover', (e) => {
      e.preventDefault(); // Must prevent default to allow drop
      e.dataTransfer.dropEffect = 'move';
      if (!zone.classList.contains('dragover')) {
        zone.classList.add('dragover');
        updateDiagnosticLog('dragover', zone.id);
      }
    });

    // 4. dragleave
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
      updateDiagnosticLog('dragleave', zone.id);
    });

    // 5. drop
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      
      const cardId = e.dataTransfer.getData('text/plain');
      const card = document.getElementById(cardId);
      
      if (!card) return;

      // Handle replacing existing card in this drop zone
      const existingCard = zone.querySelector('.caregiver-card');
      if (existingCard) {
        // Return existing card to the available deck
        caregiversDeck.appendChild(existingCard);
      }

      // Move the card to this zone
      zone.appendChild(card);
      zone.classList.add('has-item');
      
      // Update clean layouts for empty source slots
      cleanEmptyDropZoneClasses();
      
      // Save schedule mapping
      saveScheduleToStorage();
      
      // Notify
      const caregiverName = card.getAttribute('data-name');
      const shiftName = zone.parentElement.getAttribute('data-shift');
      showToast(`Assigned ${caregiverName} to ${shiftName}`, 'success');
      updateStorageGauges();
      updateDiagnosticLog('drop', cardId);
    });
  });

  // Trash Zone Handlers
  trashZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    trashZone.classList.add('dragover');
  });

  trashZone.addEventListener('dragleave', () => {
    trashZone.classList.remove('dragover');
  });

  trashZone.addEventListener('drop', (e) => {
    e.preventDefault();
    trashZone.classList.remove('dragover');
    
    const cardId = e.dataTransfer.getData('text/plain');
    const card = document.getElementById(cardId);
    
    if (card) {
      // Append card back to original deck
      caregiversDeck.appendChild(card);
      cleanEmptyDropZoneClasses();
      saveScheduleToStorage();
      
      const caregiverName = card.getAttribute('data-name');
      showToast(`Unassigned ${caregiverName} from active schedule.`, 'info');
      updateStorageGauges();
      updateDiagnosticLog('unassigned', cardId);
    }
  });

  // Ensure dropzones that lose their items lose the 'has-item' class
  function cleanEmptyDropZoneClasses() {
    dropZones.forEach(zone => {
      const hasCard = zone.querySelector('.caregiver-card');
      if (!hasCard) {
        zone.classList.remove('has-item');
      } else {
        zone.classList.add('has-item');
      }
    });
  }

  // --- Local Storage Schedule Mapping ---
  function saveScheduleToStorage() {
    const schedule = {
      morning: getCardIdInZone('dz-morning'),
      afternoon: getCardIdInZone('dz-afternoon'),
      night: getCardIdInZone('dz-night')
    };
    
    localStorage.setItem('assisterly_schedule', JSON.stringify(schedule));
  }

  function getCardIdInZone(zoneId) {
    const zone = document.getElementById(zoneId);
    const card = zone.querySelector('.caregiver-card');
    return card ? card.id : null;
  }

  function loadScheduleFromStorage() {
    const savedStr = localStorage.getItem('assisterly_schedule');
    if (!savedStr) return;

    try {
      const schedule = JSON.parse(savedStr);
      if (schedule.morning) moveCardToZone(schedule.morning, 'dz-morning');
      if (schedule.afternoon) moveCardToZone(schedule.afternoon, 'dz-afternoon');
      if (schedule.night) moveCardToZone(schedule.night, 'dz-night');
      cleanEmptyDropZoneClasses();
    } catch (e) {
      console.error("Error parsing schedule configurations", e);
    }
  }

  function moveCardToZone(cardId, zoneId) {
    const card = document.getElementById(cardId);
    const zone = document.getElementById(zoneId);
    if (card && zone) {
      zone.appendChild(card);
      zone.classList.add('has-item');
    }
  }

  // --- Web Storage Form Controls (S.No 8, 9, 10 & 11) ---

  // Save data to storage
  btnSave.addEventListener('click', () => {
    // Get values
    const name = formCoordName.value.trim();
    const dept = formCoordDept.value;
    const pin = formCoordPin.value.trim();
    const notes = formSessionNotes.value.trim();

    // Verification
    if (!name) {
      showToast("Coordinator Full Name is required.", "danger");
      formCoordName.focus();
      return;
    }
    if (!pin) {
      showToast("Emergency Contact PIN is required.", "danger");
      formCoordPin.focus();
      return;
    }

    // Save to Local Storage (Permanent - S.No 8)
    localStorage.setItem('assisterly_coord_name', name);
    localStorage.setItem('assisterly_coord_dept', dept);
    localStorage.setItem('assisterly_coord_pin', pin);

    // Save to Session Storage (Temporary - S.No 9)
    if (notes) {
      sessionStorage.setItem('assisterly_session_notes', notes);
    } else {
      sessionStorage.removeItem('assisterly_session_notes');
    }
    
    // Save session timestamp if not exists
    if (!sessionStorage.getItem('assisterly_session_start')) {
      sessionStorage.setItem('assisterly_session_start', new Date().toISOString());
    }

    showToast("Coordinator Profile saved successfully!", "success");
    updateStorageGauges();
    
    // Auto-update console output if it was active
    if (consoleDisplay.querySelector('.console-table')) {
      renderConsoleData();
    }
  });

  // Retrieve data on click (S.No 10)
  btnRetrieve.addEventListener('click', () => {
    renderConsoleData();
    showToast("Web Storage values retrieved.", "info");
  });

  function renderConsoleData() {
    consoleDisplay.innerHTML = '';
    
    const hasLocal = localStorage.length > 0;
    const hasSession = sessionStorage.length > 0;

    if (!hasLocal && !hasSession) {
      consoleDisplay.innerHTML = `
        <div class="console-empty-state">
          <p>⚠️ Browser Web Storage is empty.</p>
          <p class="console-sub-empty">Fill out the Coordinator forms, match caregivers, and click Save to populate values.</p>
        </div>`;
      return;
    }

    // Create diagnostic container
    const diagnosticWrap = document.createElement('div');
    
    // Render Schedule mapping if present
    const savedSchedStr = localStorage.getItem('assisterly_schedule');
    let schedHTML = '';
    if (savedSchedStr) {
      try {
        const sched = JSON.parse(savedSchedStr);
        schedHTML = `
          <div class="console-title">🎯 ACTIVE SCHEDULE MAPPING (LOCALSTORAGE)</div>
          <table class="console-table">
            <thead>
              <tr>
                <th>Shift ID</th>
                <th>Caregiver Assigned</th>
                <th>Database Key</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Morning Shift</td>
                <td class="val-string">${sched.morning ? getCaregiverNameById(sched.morning) : 'None'}</td>
                <td>morning</td>
              </tr>
              <tr>
                <td>Afternoon Shift</td>
                <td class="val-string">${sched.afternoon ? getCaregiverNameById(sched.afternoon) : 'None'}</td>
                <td>afternoon</td>
              </tr>
              <tr>
                <td>Night Shift</td>
                <td class="val-string">${sched.night ? getCaregiverNameById(sched.night) : 'None'}</td>
                <td>night</td>
              </tr>
            </tbody>
          </table>
          <br>
        `;
      } catch (err) {}
    }

    // Renders key-value table for standard items
    let tableRows = '';
    
    // Read Local Storage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Skip schedule and theme keys to display them cleanly separately or as standard string values
      if (key === 'assisterly_schedule') continue;
      
      const val = localStorage.getItem(key);
      const displayVal = key.includes('pin') ? '••••• (Masked PIN)' : val;
      
      tableRows += `
        <tr>
          <td><span class="storage-origin-badge badge-local">Local</span></td>
          <td><span class="key-badge">${key}</span></td>
          <td class="val-string">"${displayVal}"</td>
          <td class="val-number">${displayVal.length * 2} B</td>
        </tr>
      `;
    }

    // Read Session Storage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const val = sessionStorage.getItem(key);
      tableRows += `
        <tr>
          <td><span class="storage-origin-badge badge-session">Session</span></td>
          <td><span class="key-badge">${key}</span></td>
          <td class="val-string">"${val}"</td>
          <td class="val-number">${val.length * 2} B</td>
        </tr>
      `;
    }

    const tableHTML = `
      <div class="console-title">🔑 KEY-VALUE CACHE MAP</div>
      <table class="console-table">
        <thead>
          <tr>
            <th>API Origin</th>
            <th>Cache Key</th>
            <th>Value String</th>
            <th>Est. Memory Size</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows || '<tr><td colspan="4" style="text-align:center; opacity:0.5;">No active metadata variables found.</td></tr>'}
        </tbody>
      </table>
    `;

    diagnosticWrap.innerHTML = schedHTML + tableHTML;
    consoleDisplay.appendChild(diagnosticWrap);
  }

  function getCaregiverNameById(id) {
    const card = document.getElementById(id);
    return card ? card.getAttribute('data-name') : id;
  }

  // Clear data on click (S.No 11)
  btnClear.addEventListener('click', () => {
    // Clear items containing 'assisterly_' from localStorage (preserving theme if we want, or clearing it too)
    const keysToRemoveLocal = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('assisterly_')) {
        keysToRemoveLocal.push(key);
      }
    }
    keysToRemoveLocal.forEach(key => localStorage.removeItem(key));

    // Clear session storage
    sessionStorage.clear();

    // Reset Form inputs
    formCoordName.value = '';
    formCoordDept.selectedIndex = 0;
    formCoordPin.value = '';
    formSessionNotes.value = '';

    // Reset Caregivers back to deck
    caregiverCards.forEach(card => {
      caregiversDeck.appendChild(card);
    });
    cleanEmptyDropZoneClasses();

    // Notify
    showToast("All Local and Session Storage items cleared successfully.", "danger");
    
    // Reset console retrieval center
    consoleDisplay.innerHTML = `
      <div class="console-empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        <p>Storage Wiped.</p>
        <p class="console-sub-empty">All Cache partitions were cleared from browser memory.</p>
      </div>`;

    updateStorageGauges();
  });

  // --- Initial Data Load (Auto-retrieve inputs) ---
  function loadFormFieldsFromStorage() {
    const savedName = localStorage.getItem('assisterly_coord_name');
    const savedDept = localStorage.getItem('assisterly_coord_dept');
    const savedPin = localStorage.getItem('assisterly_coord_pin');
    const savedNotes = sessionStorage.getItem('assisterly_session_notes');

    if (savedName) formCoordName.value = savedName;
    if (savedDept) formCoordDept.value = savedDept;
    if (savedPin) formCoordPin.value = savedPin;
    if (savedNotes) formSessionNotes.value = savedNotes;
  }

  // --- App Startup ---
  initTheme();
  loadFormFieldsFromStorage();
  loadScheduleFromStorage();
  updateStorageGauges();
});
