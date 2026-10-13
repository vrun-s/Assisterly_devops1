// ===========================================================================
// Assisterly — Caregiver Certification Quiz (Assignment 1, Feature 4)
// Events demonstrated: change (record radio answer), click (Start begins
// timer; Submit scores + locks form), setInterval (countdown auto-submit).
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
  // Quiz
  // ===========================================================================
  const QUIZ_DURATION = 60; // seconds
  const startBtn = document.getElementById('quiz-start-btn');
  const timerLabel = document.getElementById('quiz-timer');
  const fieldset = document.getElementById('quiz-fieldset');
  const form = document.getElementById('quiz-form');
  const questions = document.querySelectorAll('.quiz-question');
  const resultBanner = document.getElementById('quiz-result-banner');
  const resultTitle = document.getElementById('quiz-result-title');
  const resultDetail = document.getElementById('quiz-result-detail');

  const answers = {};
  let timerInterval = null;
  let timeRemaining = QUIZ_DURATION;
  let quizLocked = false;

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  // Event: change on radio options → records answer
  form.addEventListener('change', (e) => {
    if (e.target.type === 'radio') {
      answers[e.target.name] = e.target.value;
    }
  });

  // Event: click Start Quiz → begins timer, unlocks form
  startBtn.addEventListener('click', () => {
    if (quizLocked) return;
    startBtn.disabled = true;
    fieldset.disabled = false;
    resultBanner.classList.remove('visible');

    // Reset any previous attempt's state
    form.reset();
    Object.keys(answers).forEach(key => delete answers[key]);
    questions.forEach(q => {
      q.classList.remove('locked');
      q.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('correct-answer', 'wrong-answer'));
    });

    timeRemaining = QUIZ_DURATION;
    timerLabel.textContent = formatTime(timeRemaining);
    timerLabel.classList.remove('warning');

    // setInterval timer → auto-submits on timeout
    timerInterval = setInterval(() => {
      timeRemaining--;
      timerLabel.textContent = formatTime(timeRemaining);
      if (timeRemaining <= 10) timerLabel.classList.add('warning');
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        scoreAndLock(true);
      }
    }, 1000);
  });

  function scoreAndLock(timedOut) {
    if (quizLocked) return;
    quizLocked = true;
    clearInterval(timerInterval);
    fieldset.disabled = true;

    let correctCount = 0;
    questions.forEach(q => {
      const correctValue = q.dataset.correct;
      const chosenInput = q.querySelector(`input[type="radio"]:checked`);
      q.classList.add('locked');
      q.querySelectorAll('.quiz-option').forEach(opt => {
        const input = opt.querySelector('input');
        if (input.value === correctValue) opt.classList.add('correct-answer');
        if (chosenInput && input.value === chosenInput.value && input.value !== correctValue) {
          opt.classList.add('wrong-answer');
        }
      });
      if (chosenInput && chosenInput.value === correctValue) correctCount++;
    });

    const total = questions.length;
    const passed = correctCount / total >= 0.75;

    resultBanner.classList.add('visible');
    resultBanner.classList.toggle('fail', !passed);
    resultTitle.textContent = passed ? 'Certification Passed' : 'Certification Not Passed';
    resultDetail.textContent = `${timedOut ? 'Time expired. ' : ''}You scored ${correctCount} / ${total}. ` +
      (passed ? 'Your profile is now eligible to go live in the directory.' : 'You need at least 75% to pass — you may retake the quiz.');

    startBtn.disabled = false;
    startBtn.textContent = 'Retake Quiz';
    quizLocked = false;
    timerLabel.textContent = '--:--';
    timerLabel.classList.remove('warning');
  }

  // Event: click Submit Quiz → scores + locks form
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    scoreAndLock(false);
  });
});
