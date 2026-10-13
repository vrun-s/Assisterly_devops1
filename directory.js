// ===========================================================================
// Assisterly — Caregiver Directory (Backend Connected)
// Connects to Flask REST API: GET /api/caregivers, POST /api/caregivers/:id/book
// Preserves hover bios, star favorites, search & filter interactions.
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

  const grid = document.getElementById('directory-grid');
  const searchInput = document.getElementById('search-caregivers');
  const specialtyFilter = document.getElementById('filter-specialty');
  const availabilityFilter = document.getElementById('filter-availability');
  const resultsCount = document.getElementById('results-count');
  const bookingCount = document.getElementById('booking-count');

  let caregivers = [];
  let bookedIds = new Set();
  let favoriteIds = new Set(JSON.parse(localStorage.getItem('assisterly_favorites') || '[]'));

  // Load existing bookings from backend
  async function loadExistingBookings() {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const bookings = await res.json();
        bookings.forEach(b => bookedIds.add(b.caregiver_id));
        if (bookingCount) bookingCount.textContent = bookedIds.size;
      }
    } catch (err) {
      console.warn('Could not load existing bookings from server:', err);
    }
  }

  // Load caregivers from Flask backend
  async function loadCaregivers() {
    if (!grid) return;
    grid.innerHTML = '<p class="directory-loading" style="grid-column: 1/-1; text-align: center; color: var(--color-sage); padding: 2rem;">Loading verified caregivers from database...</p>';

    try {
      const res = await fetch('/api/caregivers');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      caregivers = await res.json();
      renderCards();
      applyFilters();
    } catch (err) {
      console.error('Failed to fetch caregivers from API:', err);
      grid.innerHTML = `
        <div class="directory-error" style="grid-column: 1/-1; text-align: center; padding: 2rem; background: var(--bg-linen); border-radius: 8px;">
          <p style="color: var(--color-terracotta); font-weight: 600;">Unable to connect to the caregiver database.</p>
          <button id="retry-btn" class="btn btn-submit" style="margin-top: 1rem;">Retry Connection</button>
        </div>
      `;
      document.getElementById('retry-btn')?.addEventListener('click', loadCaregivers);
    }
  }

  function renderCards() {
    if (!caregivers || caregivers.length === 0) {
      grid.innerHTML = '<p class="directory-empty-state">No caregiver records found in the database.</p>';
      if (resultsCount) resultsCount.textContent = '0';
      return;
    }

    grid.innerHTML = caregivers.map(cg => {
      const isBooked = bookedIds.has(cg.id);
      const isFav = favoriteIds.has(cg.id);
      const rating = Number(cg.rating || 4.9).toFixed(2);
      const rate = Number(cg.rate || 40);

      return `
        <div class="directory-card hover-lift"
             data-id="${cg.id}"
             data-name="${(cg.name || '').toLowerCase()}"
             data-specialty="${cg.specialty || ''}"
             data-availability="${cg.availability || ''}">
          <button class="directory-fav-btn${isFav ? ' is-favorite' : ''}"
                  data-id="${cg.id}"
                  aria-label="Toggle favorite"
                  data-tooltip="Add to Favorites">${isFav ? '&#9733;' : '&#9734;'}</button>
          <div class="directory-avatar" style="background: ${cg.color || 'var(--color-pine)'};">${cg.initials || 'CG'}</div>
          <div class="directory-body">
            <h3>${cg.name}</h3>
            <span class="directory-specialty">${cg.specialty}</span>
            <div class="directory-meta">
              <span>${cg.availability}</span>
              <span class="rate">$${rate}/hr</span>
            </div>
            <div class="directory-meta">
              <span>&#9733; ${rating} Rating</span>
            </div>
            <div class="directory-actions">
              <button class="btn btn-submit btn-transition book-now-btn${isBooked ? ' is-booked' : ''}"
                      data-id="${cg.id}"
                      ${isBooked ? 'disabled' : ''}>${isBooked ? 'Booked ✓' : 'Book Now'}</button>
            </div>
          </div>
          <div class="directory-bio-overlay">
            <h4>${cg.name}</h4>
            <p>${cg.bio || 'Verified Assisterly care specialist.'}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  // Event: click on Book Now (persists to backend SQLite)
  if (grid) {
    grid.addEventListener('click', async (e) => {
      const bookBtn = e.target.closest('.book-now-btn');
      if (bookBtn) {
        const id = bookBtn.dataset.id;
        if (bookedIds.has(id)) return;

        bookBtn.disabled = true;
        bookBtn.textContent = 'Booking...';

        try {
          const res = await fetch(`/api/caregivers/${id}/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingDate: new Date().toISOString().split('T')[0] })
          });

          if (!res.ok) throw new Error('Booking failed on server');

          bookedIds.add(id);
          bookBtn.textContent = 'Booked ✓';
          bookBtn.classList.add('is-booked');
          if (bookingCount) bookingCount.textContent = bookedIds.size;
        } catch (err) {
          console.error('Error booking caregiver:', err);
          alert('Could not complete booking on the server. Please try again.');
          bookBtn.disabled = false;
          bookBtn.textContent = 'Book Now';
        }
        return;
      }

      // Event: click on favorite star
      const favBtn = e.target.closest('.directory-fav-btn');
      if (favBtn) {
        const id = favBtn.dataset.id;
        if (favoriteIds.has(id)) {
          favoriteIds.delete(id);
          favBtn.classList.remove('is-favorite');
          favBtn.innerHTML = '&#9734;';
        } else {
          favoriteIds.add(id);
          favBtn.classList.add('is-favorite');
          favBtn.innerHTML = '&#9733;';
        }
        localStorage.setItem('assisterly_favorites', JSON.stringify([...favoriteIds]));
      }
    });

    // Event: mouseover/mouseout on card → shows/hides bio overlay
    grid.addEventListener('mouseover', (e) => {
      const card = e.target.closest('.directory-card');
      if (card) card.classList.add('show-bio');
    });
    grid.addEventListener('mouseout', (e) => {
      const card = e.target.closest('.directory-card');
      if (!card) return;
      if (!card.contains(e.relatedTarget)) {
        card.classList.remove('show-bio');
      }
    });
  }

  // Filtering
  function applyFilters() {
    if (!grid) return;
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const specialty = specialtyFilter ? specialtyFilter.value : '';
    const availability = availabilityFilter ? availabilityFilter.value : '';

    let visibleCount = 0;
    grid.querySelectorAll('.directory-card').forEach(card => {
      const matchesQuery = !query ||
        card.dataset.name.includes(query) ||
        card.dataset.specialty.toLowerCase().includes(query);
      const matchesSpecialty = !specialty || card.dataset.specialty === specialty;
      const matchesAvailability = !availability || card.dataset.availability === availability;

      const visible = matchesQuery && matchesSpecialty && matchesAvailability;
      card.hidden = !visible;
      if (visible) visibleCount++;
    });

    if (resultsCount) resultsCount.textContent = visibleCount;

    let emptyState = grid.querySelector('.directory-empty-state');
    if (visibleCount === 0 && caregivers.length > 0) {
      if (!emptyState) {
        emptyState = document.createElement('p');
        emptyState.className = 'directory-empty-state';
        emptyState.textContent = 'No caregivers match your search. Try adjusting the filters.';
        grid.appendChild(emptyState);
      }
    } else if (emptyState) {
      emptyState.remove();
    }
  }

  searchInput?.addEventListener('input', applyFilters);
  specialtyFilter?.addEventListener('change', applyFilters);
  availabilityFilter?.addEventListener('change', applyFilters);
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFilters();
      searchInput.blur();
    }
  });

  // Initial load
  loadExistingBookings();
  loadCaregivers();
});
