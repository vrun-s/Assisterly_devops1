// ===========================================================================
// Assisterly — Caregiver/Family Shift Dashboard (Backend Connected)
// Connects to Flask REST API: GET /api/shifts, PUT /api/checklist/:id
// Checklist updates persist to SQLite database across page reloads.
// ===========================================================================

document.addEventListener('DOMContentLoaded', () => {

  // --- Live Clock ---
  const liveClock = document.getElementById('live-clock');
  function updateClock() {
    if (!liveClock) return;
    const now = new Date();
    liveClock.textContent = now.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    }) + ' | ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
  }
  updateClock();
  setInterval(updateClock, 1000);

  // --- Theme Toggle ---
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.body.classList.add('dark-theme');
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });
  }

  const shiftList = document.getElementById('shift-list');
  let shifts = [];

  function computeProgress(shift) {
    if (!shift.tasks || shift.tasks.length === 0) return 0;
    const done = shift.tasks.filter(t => t.done).length;
    return Math.round((done / shift.tasks.length) * 100);
  }

  function buildShiftCard(shift) {
    const pct = computeProgress(shift);
    const card = document.createElement('div');
    card.className = 'shift-card';
    card.dataset.id = shift.id;

    card.innerHTML = `
      <div class="shift-card-header" data-role="toggle">
        <div class="shift-card-title">
          <h3>${shift.title}</h3>
          <span>${shift.meta}</span>
        </div>
        <div class="shift-card-progress-wrap">
          <div class="progress-bar-container" data-pct-tooltip="${pct}% Complete" style="flex: 1;">
            <div class="progress-bar-fill" style="width: ${pct}%;"></div>
          </div>
          <span class="shift-progress-pct">${pct}%</span>
        </div>
        <svg class="shift-card-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <div class="shift-card-body">
        <ul class="shift-task-list">
          ${(shift.tasks || []).map((t) => `
            <li class="shift-task-item${t.done ? ' completed' : ''}" data-task-id="${t.id}">
              <input type="checkbox" id="task-${t.id}" ${t.done ? 'checked' : ''}>
              <label for="task-${t.id}"><span>${t.label}</span></label>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
    return card;
  }

  async function loadShifts() {
    if (!shiftList) return;
    shiftList.innerHTML = '<p style="text-align: center; color: var(--color-sage); padding: 2rem;">Loading shift schedule and tasks from database...</p>';

    try {
      const res = await fetch('/api/shifts');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      shifts = await res.json();

      shiftList.innerHTML = '';
      if (shifts.length === 0) {
        shiftList.innerHTML = '<p style="text-align: center; color: var(--color-sage); padding: 2rem;">No scheduled shifts found.</p>';
        return;
      }

      shifts.forEach(shift => shiftList.appendChild(buildShiftCard(shift)));
    } catch (err) {
      console.error('Failed to load shifts from API:', err);
      shiftList.innerHTML = `
        <div style="text-align: center; padding: 2rem; background: var(--bg-linen); border-radius: 8px;">
          <p style="color: var(--color-terracotta); font-weight: 600;">Unable to connect to the shift database.</p>
          <button id="retry-shifts-btn" class="btn btn-submit" style="margin-top: 1rem;">Retry Connection</button>
        </div>
      `;
      document.getElementById('retry-shifts-btn')?.addEventListener('click', loadShifts);
    }
  }

  if (shiftList) {
    // Event: click shift card header → expand/collapse task checklist
    shiftList.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-role="toggle"]');
      if (toggle) {
        toggle.closest('.shift-card').classList.toggle('expanded');
      }
    });

    // Event: mouseover on progress bar → tooltip with exact % complete
    shiftList.addEventListener('mouseover', (e) => {
      const bar = e.target.closest('.progress-bar-container');
      if (bar) {
        const card = bar.closest('.shift-card');
        const shift = shifts.find(s => s.id === card.dataset.id);
        if (shift) {
          bar.setAttribute('data-pct-tooltip', `${computeProgress(shift)}% Complete`);
        }
      }
    });

    // Event: click/change on "Mark as Complete" checkbox → persists to backend SQLite
    shiftList.addEventListener('change', async (e) => {
      if (e.target.type !== 'checkbox') return;

      const checkbox = e.target;
      const card = checkbox.closest('.shift-card');
      const taskItem = checkbox.closest('.shift-task-item');
      const taskId = taskItem.dataset.taskId;
      const shift = shifts.find(s => s.id === card.dataset.id);

      if (!shift || !taskId) return;

      const targetTask = shift.tasks.find(t => String(t.id) === String(taskId));
      const newDoneState = checkbox.checked;

      // Optimistic UI update
      if (targetTask) targetTask.done = newDoneState;
      taskItem.classList.toggle('completed', newDoneState);
      const newPct = computeProgress(shift);
      card.querySelector('.progress-bar-fill').style.width = newPct + '%';
      card.querySelector('.shift-progress-pct').textContent = newPct + '%';

      try {
        const res = await fetch(`/api/checklist/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ done: newDoneState })
        });

        if (!res.ok) throw new Error('Update failed on server');
      } catch (err) {
        console.error('Error persisting task update to server:', err);
        // Revert on failure
        checkbox.checked = !newDoneState;
        if (targetTask) targetTask.done = !newDoneState;
        taskItem.classList.toggle('completed', !newDoneState);
        const revertedPct = computeProgress(shift);
        card.querySelector('.progress-bar-fill').style.width = revertedPct + '%';
        card.querySelector('.shift-progress-pct').textContent = revertedPct + '%';
        alert('Could not save task status to the database. Reverted.');
      }
    });
  }

  loadShifts();
});
