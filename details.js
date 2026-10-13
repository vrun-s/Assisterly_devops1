// ===========================================================================
// Assisterly — Caregiver Profile & Confirmation Details (Backend Connected)
// Fetches verified details from Flask API: GET /api/caregivers/:id
// ===========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initThemeSwitcher();
  loadCaregiverDetails();
  initPrintButton();
});

function initThemeSwitcher() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;

  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.body.classList.add('dark-theme');
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    themeToggleBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
      themeToggleBtn.style.transform = '';
    }, 300);
  });
}

async function loadCaregiverDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  let caregiverId = urlParams.get('id');

  // Fallback to locally saved registration data if no query param
  let localData = null;
  const rawLocal = localStorage.getItem('registeredCaregiver');
  if (rawLocal) {
    try {
      localData = JSON.parse(rawLocal);
      if (!caregiverId && localData.id) {
        caregiverId = localData.id;
      }
    } catch (e) {
      console.warn('Failed to parse local registration cache', e);
    }
  }

  // If we have an ID, fetch authoritative data from Flask API
  if (caregiverId) {
    try {
      const res = await fetch(`/api/caregivers/${caregiverId}`);
      if (res.ok) {
        const caregiver = await res.json();
        renderCaregiver(caregiver);
        return;
      }
    } catch (err) {
      console.warn('Could not fetch caregiver by ID from server:', err);
    }
  }

  // If local data exists, render it
  if (localData) {
    renderCaregiver(localData);
    return;
  }

  // Otherwise, fetch the most recent caregiver from the backend
  try {
    const res = await fetch('/api/caregivers');
    if (res.ok) {
      const all = await res.json();
      if (all.length > 0) {
        renderCaregiver(all[0]);
        return;
      }
    }
  } catch (err) {
    console.error('Failed to load caregiver data:', err);
  }

  alert('No registration data found. Redirecting to home...');
  window.location.href = 'index.html';
}

function renderCaregiver(caregiver) {
  const nameEl = document.getElementById('disp-name');
  const emailEl = document.getElementById('disp-email');
  const phoneEl = document.getElementById('disp-phone');
  const ageEl = document.getElementById('disp-age');
  const dobEl = document.getElementById('disp-dob');
  const timeEl = document.getElementById('disp-time');
  const genderEl = document.getElementById('disp-gender');
  const addressEl = document.getElementById('disp-address');

  if (nameEl) nameEl.textContent = caregiver.fullName || caregiver.name || 'N/A';
  if (emailEl) emailEl.textContent = caregiver.email || 'N/A';
  if (phoneEl) phoneEl.textContent = caregiver.phone || 'N/A';
  if (ageEl) ageEl.textContent = caregiver.age ? `${caregiver.age} Years` : 'N/A';
  if (dobEl) dobEl.textContent = caregiver.dob || caregiver.booking_date || caregiver.bookingDate || 'N/A';
  if (timeEl) timeEl.textContent = caregiver.preferredTime || caregiver.preferred_time || 'Standard Shift';
  if (genderEl) {
    const g = caregiver.gender || 'Not Specified';
    genderEl.textContent = g.charAt(0).toUpperCase() + g.slice(1);
  }
  if (addressEl) addressEl.textContent = caregiver.address || 'N/A';

  // Handle Skills
  const skillsContainer = document.getElementById('disp-skills');
  if (skillsContainer) {
    let skills = caregiver.skills_list;
    if (!skills && typeof caregiver.skills === 'string') {
      skills = caregiver.skills.split(',').filter(Boolean);
    } else if (!skills && Array.isArray(caregiver.skills)) {
      skills = caregiver.skills;
    }

    if (skills && skills.length > 0) {
      skillsContainer.innerHTML = '';
      const list = document.createElement('ul');
      list.style.listStyle = 'none';
      list.style.display = 'flex';
      list.style.flexWrap = 'wrap';
      list.style.gap = '0.5rem';
      list.style.paddingTop = '0.25rem';

      skills.forEach(skill => {
        const item = document.createElement('li');
        item.style.backgroundColor = 'var(--color-sand)';
        item.style.color = 'var(--color-pine)';
        item.style.padding = '0.25rem 0.75rem';
        item.style.borderRadius = '20px';
        item.style.fontSize = '0.85rem';
        item.style.fontWeight = '600';
        item.textContent = formatSkillName(skill.trim());
        list.appendChild(item);
      });
      skillsContainer.appendChild(list);
    } else {
      skillsContainer.textContent = 'None declared.';
    }
  }

  // Handle Notes
  const notesContainer = document.getElementById('disp-notes');
  if (notesContainer) {
    const notesText = caregiver.notes || caregiver.additionalNotes || caregiver.bio;
    if (notesText && notesText.trim()) {
      notesContainer.textContent = notesText;
    } else {
      notesContainer.textContent = 'No additional comments or requirements notes provided.';
      notesContainer.style.color = 'var(--color-sage)';
    }
  }
}

function formatSkillName(skill) {
  const map = {
    'nursing': 'Nursing Care',
    'elderly': 'Elderly Support',
    'firstaid': 'First Aid & CPR',
    'cooking': 'Meal Preparation',
    'housekeeping': 'Housekeeping'
  };
  return map[skill.toLowerCase()] || skill;
}

function initPrintButton() {
  const printBtn = document.getElementById('btn-print');
  printBtn?.addEventListener('click', () => {
    window.print();
  });
}
