// ===========================================================================
// Assisterly — Shift Notes / Care Log (Assignment 1, Feature 6)
// Events demonstrated: submit/click Post (adds note to log), delegated click
// on "Reply" (notes are added dynamically, so the listener lives on the
// container), dblclick on own note → inline edit.
// ===========================================================================

document.addEventListener('DOMContentLoaded', () => {

  // --- Live Clock ---
  const liveClock = document.getElementById('live-clock');
  function updateClock() {
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
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
  });

  // ===========================================================================
  // Shift Notes / Care Log
  // ===========================================================================
  const noteForm = document.getElementById('note-form');
  const authorInput = document.getElementById('note-author');
  const bodyInput = document.getElementById('note-body');
  const notesLog = document.getElementById('notes-log');

  let noteIdCounter = 0;

  const SEED_NOTES = [
    { author: 'Rajesh Kumar (Family)', body: 'Thank you for the update — please make sure Dad takes his evening medication with food this time.', own: false, replies: [] },
    { author: 'Sister Sarah Ramesh (Caregiver)', body: 'Vitals checked at 9 AM: BP 128/82, temp normal. Patient in good spirits today.', own: false, replies: [{ author: 'Rajesh Kumar (Family)', body: 'Great to hear, thank you!' }] },
  ];

  function timeNow() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  function buildNoteElement(note) {
    const el = document.createElement('div');
    el.className = 'note-card';
    el.dataset.id = note.id;
    el.dataset.own = note.own ? 'true' : 'false';

    el.innerHTML = `
      <div class="note-card-header">
        <span class="note-card-author">${note.author}</span>
        <span class="note-card-time">${note.time}</span>
      </div>
      <div class="note-card-body" data-id="${note.id}">${note.body}</div>
      ${note.own ? '<p class="note-card-hint">Double-click your note to edit it.</p>' : ''}
      <button type="button" class="note-reply-btn" data-id="${note.id}">Reply</button>
      <form class="note-reply-form" data-id="${note.id}">
        <input type="text" placeholder="Write a reply..." aria-label="Reply text">
        <button type="submit" class="btn btn-submit btn-transition" style="padding: 0.5rem 0.9rem; font-size: 0.8rem;">Send</button>
      </form>
      <div class="note-replies" id="replies-${note.id}"></div>
    `;

    const repliesContainer = el.querySelector('.note-replies');
    (note.replies || []).forEach(r => {
      const replyEl = document.createElement('div');
      replyEl.className = 'note-reply-item';
      replyEl.innerHTML = `<span class="note-card-author">${r.author}:</span> <span>${r.body}</span>`;
      repliesContainer.appendChild(replyEl);
    });

    return el;
  }

  function addNote(author, body, own) {
    noteIdCounter++;
    const note = { id: 'note-' + noteIdCounter, author, body, time: timeNow(), own, replies: [] };
    notesLog.prepend(buildNoteElement(note));
  }

  // Seed initial notes (also rendered dynamically, through the same path)
  SEED_NOTES.forEach(n => {
    noteIdCounter++;
    n.id = 'note-' + noteIdCounter;
    n.time = timeNow();
    notesLog.appendChild(buildNoteElement(n));
  });

  // Event: submit/click Post → adds note to the log
  noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const author = authorInput.value.trim() || 'Anonymous Caregiver';
    const body = bodyInput.value.trim();
    if (!body) {
      bodyInput.focus();
      return;
    }
    addNote(author, body, true);
    bodyInput.value = '';
  });

  // ===========================================================================
  // Event delegation on the log container — notes (and their Reply buttons)
  // are added dynamically, so listeners are attached once on the parent.
  // ===========================================================================
  notesLog.addEventListener('click', (e) => {
    const replyBtn = e.target.closest('.note-reply-btn');
    if (replyBtn) {
      const form = notesLog.querySelector(`.note-reply-form[data-id="${replyBtn.dataset.id}"]`);
      form.classList.toggle('open');
      if (form.classList.contains('open')) form.querySelector('input').focus();
    }
  });

  notesLog.addEventListener('submit', (e) => {
    const replyForm = e.target.closest('.note-reply-form');
    if (!replyForm) return;
    e.preventDefault();
    const input = replyForm.querySelector('input');
    const text = input.value.trim();
    if (!text) return;

    const repliesContainer = document.getElementById(`replies-${replyForm.dataset.id}`);
    const replyEl = document.createElement('div');
    replyEl.className = 'note-reply-item';
    replyEl.innerHTML = `<span class="note-card-author">${authorInput.value.trim() || 'Anonymous'}:</span> <span></span>`;
    replyEl.querySelector('span:last-child').textContent = text;
    repliesContainer.appendChild(replyEl);

    input.value = '';
    replyForm.classList.remove('open');
  });

  // Event: dblclick on own note → inline edit
  notesLog.addEventListener('dblclick', (e) => {
    const bodyEl = e.target.closest('.note-card-body');
    if (!bodyEl) return;
    const card = bodyEl.closest('.note-card');
    if (card.dataset.own !== 'true' || bodyEl.classList.contains('editing')) return;

    const originalText = bodyEl.textContent;
    bodyEl.contentEditable = 'true';
    bodyEl.classList.add('editing');
    bodyEl.focus();

    // Select all text for convenience
    const range = document.createRange();
    range.selectNodeContents(bodyEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    function finishEditing(save) {
      bodyEl.contentEditable = 'false';
      bodyEl.classList.remove('editing');
      if (!save) bodyEl.textContent = originalText;
      bodyEl.removeEventListener('blur', onBlur);
      bodyEl.removeEventListener('keydown', onKeydown);
    }

    function onBlur() {
      finishEditing(true);
    }

    function onKeydown(ev) {
      if (ev.key === 'Enter' && !ev.shiftKey) {
        ev.preventDefault();
        bodyEl.blur();
      } else if (ev.key === 'Escape') {
        finishEditing(false);
      }
    }

    bodyEl.addEventListener('blur', onBlur);
    bodyEl.addEventListener('keydown', onKeydown);
  });
});
