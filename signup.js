// ===========================================================================
// Assisterly — Sign Up Form (Assignment 1, Feature 3)
// Events demonstrated: submit (preventDefault + validate + confirmation),
// blur (inline validation on Email/Password), input (live confirm-password
// match check).
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
  // Sign Up Form
  // ===========================================================================
  const form = document.getElementById('signup-form');
  const nameInput = document.getElementById('su-name');
  const emailInput = document.getElementById('su-email');
  const careTypeInput = document.getElementById('su-care-type');
  const passwordInput = document.getElementById('su-password');
  const confirmInput = document.getElementById('su-confirm-password');
  const confirmHint = document.getElementById('confirm-match-hint');
  const successBanner = document.getElementById('signup-success-banner');
  const successName = document.getElementById('signup-success-name');

  function setError(input, message) {
    const group = input.closest('.form-group');
    group.classList.toggle('has-error', !!message);
    group.classList.toggle('has-success', !message);
    const errorEl = group.querySelector('.error-message');
    if (errorEl) errorEl.textContent = message || '';
  }

  function validateName() {
    const val = nameInput.value.trim();
    if (val.length < 3) {
      setError(nameInput, 'Full name must be at least 3 characters.');
      return false;
    }
    setError(nameInput, '');
    return true;
  }

  function validateEmail() {
    const val = emailInput.value.trim();
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(val)) {
      setError(emailInput, 'Enter a valid email address.');
      return false;
    }
    setError(emailInput, '');
    return true;
  }

  function validateCareType() {
    if (!careTypeInput.value) {
      setError(careTypeInput, 'Please select a care type.');
      return false;
    }
    setError(careTypeInput, '');
    return true;
  }

  function validatePassword() {
    const val = passwordInput.value;
    if (val.length < 8 || !/\d/.test(val)) {
      setError(passwordInput, 'Password needs 8+ characters and at least one number.');
      return false;
    }
    setError(passwordInput, '');
    return true;
  }

  function checkConfirmMatch() {
    if (!confirmInput.value) {
      confirmHint.textContent = '';
      confirmHint.className = 'confirm-match-hint';
      return false;
    }
    const matches = confirmInput.value === passwordInput.value;
    confirmHint.textContent = matches ? 'Passwords match.' : 'Passwords do not match.';
    confirmHint.className = 'confirm-match-hint ' + (matches ? 'match' : 'mismatch');
    setError(confirmInput, matches ? '' : '');
    return matches;
  }

  // Event: blur on Email/Password → inline validation errors
  emailInput.addEventListener('blur', validateEmail);
  passwordInput.addEventListener('blur', validatePassword);
  nameInput.addEventListener('blur', validateName);
  careTypeInput.addEventListener('blur', validateCareType);

  // Event: input on Confirm Password → live match check
  confirmInput.addEventListener('input', checkConfirmMatch);
  passwordInput.addEventListener('input', () => {
    if (confirmInput.value) checkConfirmMatch();
  });

  // Event: submit → preventDefault, validate, show confirmation
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const validName = validateName();
    const validEmail = validateEmail();
    const validCareType = validateCareType();
    const validPassword = validatePassword();
    const validConfirm = checkConfirmMatch();

    if (!validConfirm) {
      setError(confirmInput, 'Please make sure both passwords match.');
    }

    if (validName && validEmail && validCareType && validPassword && validConfirm) {
      const accountData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        specialty: careTypeInput.value,
        phone: '9876543200',
        bio: `Assisterly member enrolled for ${careTypeInput.value}.`
      };

      // Persist to backend database
      fetch('/api/caregivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData)
      }).catch(err => console.warn('Account persistence warning:', err));

      successName.textContent = nameInput.value.trim().split(' ')[0];
      successBanner.classList.add('visible');
      successBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      form.reset();
      confirmHint.textContent = '';
      confirmHint.className = 'confirm-match-hint';
      form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-success', 'has-error'));
    } else {
      successBanner.classList.remove('visible');
    }
  });
});
