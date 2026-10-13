// --- Assisterly Caregiver Dashboard Interactivity Controller ---

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI features
  initThemeSwitcher();
  initLiveClock();
  initStatsCounters();
  initSliderCarousel();
  initNotificationPanel();
  initScrollToTop();
  initFormValidation();
  initScrollSpy();
  initDragAndDrop();
  initWebStorage();
});

// ==========================================
// 1. Live Date & Time Display (S.No 9)
// ==========================================
function initLiveClock() {
  const clockEl = document.getElementById('live-clock');
  if (!clockEl) return;

  function updateClock() {
    const now = new Date();
    // Clinical precision date and time formatting
    clockEl.textContent = now.toLocaleString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  updateClock();
  setInterval(updateClock, 1000);
}

// ==========================================
// 2. Theme Switcher Light & Dark Mode (S.No 10)
// ==========================================
function initThemeSwitcher() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;

  // Check saved user preference or system theme
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.body.classList.add('dark-theme');
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Rotation animation on click (S.No 26 Transform)
    themeToggleBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
      themeToggleBtn.style.transform = '';
    }, 300);
  });
}

// ==========================================
// 3. Dynamic Statistics Counters (S.No 5)
// ==========================================
function initStatsCounters() {
  const statsValues = [
    { id: 'stat-total-users', target: 148, format: (v) => v.toString() },
    { id: 'stat-active-caregivers', target: 64, format: (v) => v.toString() },
    { id: 'stat-revenue', target: 42500, format: (v) => '$' + v.toLocaleString('en-US') },
    { id: 'stat-transactions', target: 49, format: (v) => v.toString() + ' Ratings' },
    { id: 'stat-alerts', target: 1250, format: (v) => v.toLocaleString('en-US') },
    { id: 'stat-pending', target: 12, format: (v) => v.toString() }
  ];

  const section = document.getElementById('dashboard');
  if (!section) return;

  // Sync dynamic database metrics
  fetch('/api/health')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (data && data.caregivers_count) {
        const cgStat = statsValues.find(s => s.id === 'stat-active-caregivers');
        if (cgStat) cgStat.target = data.caregivers_count;
      }
    })
    .catch(() => {});

  let animated = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        animateStats();
      }
    });
  }, { threshold: 0.15 });

  observer.observe(section);

  function animateStats() {
    statsValues.forEach(stat => {
      const el = document.getElementById(stat.id);
      if (!el) return;

      const duration = 1800; // ms
      const startTime = performance.now();

      function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out quadratic function
        const currentVal = Math.floor(progress * (2 - progress) * stat.target);

        el.textContent = stat.format(currentVal);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = stat.format(stat.target);
        }
      }

      requestAnimationFrame(step);
    });
  }
}

// ==========================================
// 4. Automatic Image Slider / Carousel (S.No 8)
// ==========================================
function initSliderCarousel() {
  const sliderSection = document.querySelector('.slider-section');
  if (!sliderSection) return;

  const slides = sliderSection.querySelectorAll('.slide');
  const prevBtn = sliderSection.querySelector('.slider-arrow-left');
  const nextBtn = sliderSection.querySelector('.slider-arrow-right');
  const dotsContainer = sliderSection.querySelector('.slider-dots');

  if (slides.length === 0) return;

  let currentIndex = 0;
  let autoSlideTimer = null;

  // Create indicator dots
  dotsContainer.innerHTML = '';
  slides.forEach((_, idx) => {
    const dot = document.createElement('span');
    dot.className = `dot ${idx === 0 ? 'active' : ''}`;
    dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
    dot.addEventListener('click', () => goToSlide(idx));
    dotsContainer.appendChild(dot);
  });

  const dots = dotsContainer.querySelectorAll('.dot');

  function goToSlide(index) {
    slides[currentIndex].classList.remove('active');
    dots[currentIndex]?.classList.remove('active');

    currentIndex = (index + slides.length) % slides.length;

    slides[currentIndex].classList.add('active');
    dots[currentIndex]?.classList.add('active');
    resetTimer();
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  function startTimer() {
    autoSlideTimer = setInterval(nextSlide, 5000); // Rotate every 5 seconds
  }

  function resetTimer() {
    clearInterval(autoSlideTimer);
    startTimer();
  }

  prevBtn?.addEventListener('click', prevSlide);
  nextBtn?.addEventListener('click', nextSlide);

  // Pause auto-sliding on mouse hover
  sliderSection.addEventListener('mouseenter', () => clearInterval(autoSlideTimer));
  sliderSection.addEventListener('mouseleave', startTimer);

  startTimer();
}

// ==========================================
// 5. Notification Panel Center (S.No 11)
// ==========================================
function initNotificationPanel() {
  const bellBtn = document.getElementById('bell-btn');
  const notificationPanel = document.getElementById('notification-panel');
  const closeBtn = document.getElementById('close-notifications');
  const bellBadge = document.getElementById('bell-badge');

  if (!bellBtn || !notificationPanel) return;

  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationPanel.classList.toggle('active');
  });

  closeBtn?.addEventListener('click', () => {
    notificationPanel.classList.remove('active');
  });

  document.addEventListener('click', (e) => {
    if (!notificationPanel.contains(e.target) && !bellBtn.contains(e.target)) {
      notificationPanel.classList.remove('active');
    }
  });

  // Handle individual alert dismissals
  notificationPanel.addEventListener('click', (e) => {
    if (e.target.classList.contains('dismiss-notification')) {
      const item = e.target.closest('.notification-item');
      if (item) {
        item.style.transform = 'translateX(100%)';
        item.style.opacity = '0';
        setTimeout(() => {
          item.remove();
          updateBadge();
        }, 300);
      }
    }
  });

  function updateBadge() {
    if (bellBadge) {
      const items = notificationPanel.querySelectorAll('.notification-item.unread');
      bellBadge.textContent = items.length;
      if (items.length === 0) {
        bellBadge.style.display = 'none';
      }
    }
  }

  updateBadge();
}

// ==========================================
// 6. Scroll to Top Floating Button (S.No 16)
// ==========================================
function initScrollToTop() {
  const scrollTopBtn = document.getElementById('scroll-top');
  if (!scrollTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// ==========================================
// 7. Input Form Validation Logic (S.No 13)
// ==========================================
function initFormValidation() {
  const form = document.getElementById('caregiver-form') || document.querySelector('form');
  const nameInput = document.getElementById('full-name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const dateInput = document.getElementById('booking-date');
  const timeInput = document.getElementById('preferred-time');
  const addressInput = document.getElementById('address');
  const errorBanner = document.getElementById('form-error-banner');

  if (!form) return;

  function showError(input, message) {
    if (!input) return;
    const group = input.closest('.form-group');
    if (group) {
      group.classList.remove('has-success');
      group.classList.add('has-error');
      let errorEl = group.querySelector('.error-message');
      if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'error-message';
        errorEl.style.color = '#C62828';
        errorEl.style.fontSize = '0.8rem';
        errorEl.style.marginTop = '0.25rem';
        errorEl.style.display = 'block';
        group.appendChild(errorEl);
      }
      errorEl.textContent = message;
    }
  }

  function showSuccess(input) {
    if (!input) return;
    const group = input.closest('.form-group');
    if (group) {
      group.classList.remove('has-error');
      group.classList.add('has-success');
      const errorEl = group.querySelector('.error-message');
      if (errorEl) {
        errorEl.textContent = '';
      }
    }
  }

  function validateName() {
    if (!nameInput) return true;
    const val = nameInput.value.trim();
    if (val.length < 3) {
      showError(nameInput, 'Full name must be at least 3 characters.');
      return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(val)) {
      showError(nameInput, 'Full name should only contain letters.');
      return false;
    }
    showSuccess(nameInput);
    return true;
  }

  function validateEmail() {
    if (!emailInput) return true;
    const val = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      showError(emailInput, 'Provide a valid email address (e.g. name@domain.com).');
      return false;
    }
    showSuccess(emailInput);
    return true;
  }

  function validatePhone() {
    if (!phoneInput) return true;
    const val = phoneInput.value.trim().replace(/\s/g, '');
    const phoneRegex = /^(?:\+91)?[6-9][0-9]{9}$/;
    if (!phoneRegex.test(val)) {
      showError(phoneInput, 'Provide a valid 10-digit Indian mobile number starting with 6-9.');
      return false;
    }
    showSuccess(phoneInput);
    return true;
  }

  function validateDate() {
    if (!dateInput) return true;
    const val = dateInput.value;
    if (!val) {
      showError(dateInput, 'Please select a service date.');
      return false;
    }
    showSuccess(dateInput);
    return true;
  }

  function validateAddress() {
    if (!addressInput) return true;
    const val = addressInput.value.trim();
    if (val.length < 10) {
      showError(addressInput, 'Address is too short (min 10 characters).');
      return false;
    }
    showSuccess(addressInput);
    return true;
  }

  // Real-time listener attachments
  nameInput?.addEventListener('input', validateName);
  emailInput?.addEventListener('input', validateEmail);
  phoneInput?.addEventListener('input', validatePhone);
  dateInput?.addEventListener('change', validateDate);
  addressInput?.addEventListener('input', validateAddress);

  const ageInput = document.getElementById('age');
  const guestCountInput = document.getElementById('guest-count');
  const seatingPreferenceInput = document.getElementById('seating-preference');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();
    const isDateValid = validateDate();
    const isAddressValid = validateAddress();

    if (isNameValid && isEmailValid && isPhoneValid && isDateValid && isAddressValid) {
      if (errorBanner) errorBanner.style.display = 'none';

      const submitBtn = document.getElementById('btn-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting to Database...';
      }

      // Collect registration details
      const registrationData = {
        fullName: nameInput ? nameInput.value.trim() : '',
        email: emailInput ? emailInput.value.trim() : '',
        phone: phoneInput ? phoneInput.value.trim() : '',
        bookingDate: dateInput ? dateInput.value : '',
        preferredTime: timeInput ? timeInput.value : '',
        age: ageInput && ageInput.value ? parseInt(ageInput.value, 10) : null,
        guestCount: guestCountInput && guestCountInput.value ? parseInt(guestCountInput.value, 10) : 1,
        seatingPreference: seatingPreferenceInput ? seatingPreferenceInput.value : 'in-home',
        address: addressInput ? addressInput.value.trim() : ''
      };

      try {
        const response = await fetch('/api/caregivers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registrationData)
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Server returned error ${response.status}`);
        }

        const createdRecord = await response.json();

        // Save authoritative registered record to localStorage and sessionStorage
        localStorage.setItem('registeredCaregiver', JSON.stringify(createdRecord));
        sessionStorage.setItem('lastFormSubmission', JSON.stringify({
          ...createdRecord,
          submittedAt: new Date().toLocaleString('en-IN')
        }));

        form.reset();
        document.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-success', 'has-error'));

        if (confirm(`🎉 Caregiver Registration Successfully Saved in Database (ID: ${createdRecord.id})!\n\nWould you like to open the Confirmation Summary page?`)) {
          window.location.href = `details.html?id=${createdRecord.id}`;
        }
      } catch (err) {
        console.error('Registration API error:', err);
        if (errorBanner) {
          errorBanner.style.display = 'block';
          errorBanner.textContent = `⚠️ Registration failed: ${err.message}`;
        } else {
          alert(`Registration failed: ${err.message}`);
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Registration';
        }
      }
    } else {
      if (errorBanner) {
        errorBanner.style.display = 'block';
        errorBanner.textContent = '⚠️ Please fix the highlighted errors above before submitting.';
      }
      const firstErr = document.querySelector('.form-group.has-error input, .form-group.has-error textarea');
      firstErr?.focus();
    }
  });
}

// ==========================================
// 8. Navigation Scroll Spy & Highlighting (S.No 2)
// ==========================================
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id], header');
  const navLinks = document.querySelectorAll('.nav-links a');

  if (sections.length === 0 || navLinks.length === 0) return;

  function spy() {
    let currentSectionId = 'home';
    const scrollPos = window.scrollY + 120; // sticky header offset

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (id && scrollPos >= top && scrollPos < top + height) {
        currentSectionId = id;
      }
    });

    if (window.scrollY < 100) {
      currentSectionId = 'home';
    }

    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', spy);
  spy();
}

// ==========================================
// 9. HTML5 Drag & Drop Caregiver Shift Scheduler
// ==========================================
function initDragAndDrop() {
  const draggables = document.querySelectorAll('.draggable-caregiver-card');
  const dropZones = document.querySelectorAll('.slot-drop-zone, #caregiver-drag-deck');

  if (draggables.length === 0 || dropZones.length === 0) return;

  draggables.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      card.style.opacity = '0.5';
      e.dataTransfer.setData('text/plain', card.id);
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      card.style.opacity = '1';
    });
  });

  dropZones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.style.background = 'rgba(198, 107, 61, 0.18)';
      zone.style.borderColor = 'var(--color-terracotta)';
    });

    zone.addEventListener('dragleave', () => {
      zone.style.background = '';
      zone.style.borderColor = '';
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.style.background = '';
      zone.style.borderColor = '';

      const cardId = e.dataTransfer.getData('text/plain');
      const card = document.getElementById(cardId);
      if (!card) return;

      const placeholder = zone.querySelector('.drop-placeholder-text');
      if (placeholder) placeholder.style.display = 'none';

      zone.appendChild(card);
    });
  });
}

// ==========================================
// 10. HTML5 Web Storage — localStorage & sessionStorage
//     (Assignment 1: S.No 8 Local Storage, S.No 9 Session Storage,
//      S.No 10 Retrieve Data, S.No 11 Clear Data)
// ==========================================
function initWebStorage() {

  // --- DOM References ---
  const lsSaveBtn = document.getElementById('ls-save-btn');
  const lsRetrieveBtn = document.getElementById('ls-retrieve-btn');
  const lsClearBtn = document.getElementById('ls-clear-btn');
  const lsOutput = document.getElementById('ls-output');
  const lsNameInput = document.getElementById('ls-user-name');
  const lsRoleSelect = document.getElementById('ls-user-role');
  const lsNotesInput = document.getElementById('ls-user-notes');

  const ssSaveBtn = document.getElementById('ss-save-btn');
  const ssRetrieveBtn = document.getElementById('ss-retrieve-btn');
  const ssClearBtn = document.getElementById('ss-clear-btn');
  const ssOutput = document.getElementById('ss-output');
  const ssNoteInput = document.getElementById('ss-session-note');
  const ssPrioritySelect = document.getElementById('ss-priority');
  const ssSessionTime = document.getElementById('ss-session-time');
  const ssSessionId = document.getElementById('ss-session-id');

  // If section is not present on this page, bail early
  if (!lsSaveBtn || !ssSaveBtn) return;

  // --- Session metadata on page load ---
  const sessionStartTime = new Date().toLocaleString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
  const sessionId = 'SID-' + Math.random().toString(36).substring(2, 10).toUpperCase();

  // Store session metadata in sessionStorage
  if (!sessionStorage.getItem('assisterly_session_start')) {
    sessionStorage.setItem('assisterly_session_start', sessionStartTime);
    sessionStorage.setItem('assisterly_session_id', sessionId);
  }

  // Display session info
  if (ssSessionTime) ssSessionTime.textContent = sessionStorage.getItem('assisterly_session_start');
  if (ssSessionId) ssSessionId.textContent = sessionStorage.getItem('assisterly_session_id');

  // --- Utility: show status message above output ---
  function showStatus(container, message, type) {
    // Remove existing status
    const existing = container.parentElement.querySelector('.storage-status');
    if (existing) existing.remove();

    const statusEl = document.createElement('div');
    statusEl.className = `storage-status storage-status-${type}`;
    statusEl.textContent = message;
    container.parentElement.insertBefore(statusEl, container);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      statusEl.style.opacity = '0';
      statusEl.style.transform = 'translateY(-8px)';
      statusEl.style.transition = 'all 0.3s ease';
      setTimeout(() => statusEl.remove(), 300);
    }, 3000);
  }

  // --- Utility: create a data card element ---
  function createDataCard(label, value, isSession) {
    const card = document.createElement('div');
    card.className = `storage-data-card${isSession ? ' session-card' : ''}`;
    card.innerHTML = `
      <div class="data-label">${label}</div>
      <div class="data-value">${value || '—'}</div>
    `;
    return card;
  }

  // ===========================
  // LOCAL STORAGE Operations
  // ===========================

  // S.No 8: Save user information permanently using localStorage
  lsSaveBtn.addEventListener('click', () => {
    const name = lsNameInput.value.trim();
    const role = lsRoleSelect.value;
    const notes = lsNotesInput.value.trim();

    if (!name) {
      showStatus(lsOutput, '⚠️ Please enter a user name before saving.', 'error');
      lsNameInput.focus();
      return;
    }

    const userData = {
      userName: name,
      carePreference: role,
      additionalNotes: notes,
      savedAt: new Date().toLocaleString('en-IN')
    };

    localStorage.setItem('assisterly_user_profile', JSON.stringify(userData));
    showStatus(lsOutput, '✅ Data saved to localStorage successfully!', 'success');

    // Subtle button pulse animation
    lsSaveBtn.style.transform = 'scale(0.95)';
    setTimeout(() => { lsSaveBtn.style.transform = ''; }, 200);
  });

  // S.No 10: Retrieve and display stored data on button click
  lsRetrieveBtn.addEventListener('click', () => {
    const raw = localStorage.getItem('assisterly_user_profile');
    const regRaw = localStorage.getItem('registeredCaregiver');

    lsOutput.innerHTML = ''; // Clear previous

    if (!raw && !regRaw) {
      lsOutput.innerHTML = '<p class="storage-empty-state">📭 No localStorage data found. Save some data first.</p>';
      showStatus(lsOutput, 'ℹ️ localStorage is empty.', 'info');
      return;
    }

    if (raw) {
      const data = JSON.parse(raw);
      lsOutput.appendChild(createDataCard('User Name', data.userName, false));
      lsOutput.appendChild(createDataCard('Care Preference', data.carePreference, false));
      lsOutput.appendChild(createDataCard('Additional Notes', data.additionalNotes || 'None', false));
      lsOutput.appendChild(createDataCard('Saved At', data.savedAt, false));
    }

    if (regRaw) {
      const reg = JSON.parse(regRaw);
      lsOutput.appendChild(createDataCard('Registered Name (Form)', reg.fullName, false));
      lsOutput.appendChild(createDataCard('Registered Email (Form)', reg.email, false));
      lsOutput.appendChild(createDataCard('Registered Phone (Form)', reg.phone, false));
    }

    showStatus(lsOutput, '✅ localStorage data retrieved successfully!', 'success');
  });

  // S.No 11: Clear stored data with confirmation
  lsClearBtn.addEventListener('click', () => {
    if (!confirm('Are you sure you want to clear ALL localStorage data? This action cannot be undone.')) return;

    localStorage.removeItem('assisterly_user_profile');
    localStorage.removeItem('registeredCaregiver');

    // Clear inputs
    lsNameInput.value = '';
    lsRoleSelect.selectedIndex = 0;
    lsNotesInput.value = '';

    // Reset output
    lsOutput.innerHTML = '<p class="storage-output-placeholder">No data retrieved yet. Click <strong>Retrieve Data</strong> to display stored information.</p>';
    showStatus(lsOutput, '🗑️ All localStorage data has been cleared.', 'info');
  });

  // ===========================
  // SESSION STORAGE Operations
  // ===========================

  // S.No 9: Save temporary user information using sessionStorage
  ssSaveBtn.addEventListener('click', () => {
    const note = ssNoteInput.value.trim();
    const priority = ssPrioritySelect.value;

    if (!note) {
      showStatus(ssOutput, '⚠️ Please enter a session note before saving.', 'error');
      ssNoteInput.focus();
      return;
    }

    const sessionData = {
      sessionNote: note,
      priority: priority,
      savedAt: new Date().toLocaleString('en-IN')
    };

    sessionStorage.setItem('assisterly_session_data', JSON.stringify(sessionData));
    showStatus(ssOutput, '✅ Data saved to sessionStorage successfully!', 'success');

    ssSaveBtn.style.transform = 'scale(0.95)';
    setTimeout(() => { ssSaveBtn.style.transform = ''; }, 200);
  });

  // S.No 10: Retrieve session data on button click
  ssRetrieveBtn.addEventListener('click', () => {
    const raw = sessionStorage.getItem('assisterly_session_data');
    const formRaw = sessionStorage.getItem('lastFormSubmission');
    const sessStart = sessionStorage.getItem('assisterly_session_start');
    const sessId = sessionStorage.getItem('assisterly_session_id');

    ssOutput.innerHTML = ''; // Clear previous

    if (!raw && !formRaw) {
      ssOutput.innerHTML = '<p class="storage-empty-state">📭 No sessionStorage data found. Save some session data first.</p>';
      showStatus(ssOutput, 'ℹ️ sessionStorage is empty (or tab was reopened).', 'info');
      return;
    }

    // Always show session metadata
    if (sessStart) ssOutput.appendChild(createDataCard('Session Started', sessStart, true));
    if (sessId) ssOutput.appendChild(createDataCard('Tab Session ID', sessId, true));

    if (raw) {
      const data = JSON.parse(raw);
      ssOutput.appendChild(createDataCard('Session Note', data.sessionNote, true));
      ssOutput.appendChild(createDataCard('Priority Level', data.priority, true));
      ssOutput.appendChild(createDataCard('Saved At', data.savedAt, true));
    }

    if (formRaw) {
      const form = JSON.parse(formRaw);
      ssOutput.appendChild(createDataCard('Last Form Submission Name', form.fullName, true));
      ssOutput.appendChild(createDataCard('Submitted At', form.submittedAt, true));
    }

    showStatus(ssOutput, '✅ sessionStorage data retrieved successfully!', 'success');
  });

  // S.No 11: Clear session data
  ssClearBtn.addEventListener('click', () => {
    if (!confirm('Clear all sessionStorage data for this tab? The data will be lost.')) return;

    sessionStorage.removeItem('assisterly_session_data');
    sessionStorage.removeItem('lastFormSubmission');
    // Keep session metadata (start time, ID) as they represent the active session

    ssNoteInput.value = '';
    ssPrioritySelect.selectedIndex = 0;

    ssOutput.innerHTML = '<p class="storage-output-placeholder">No session data retrieved yet. Click <strong>Retrieve Session</strong> to view.</p>';
    showStatus(ssOutput, '🗑️ Session data has been cleared.', 'info');
  });
}

