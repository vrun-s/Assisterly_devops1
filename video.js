// ===========================================================================
// Assisterly — Care Guide Video Player (Assignment 1, Feature 2)
// Events demonstrated: click (play/pause, guide select, seek on progress bar),
// change (volume slider), timeupdate (progress bar fill + time label).
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
  // Video Player
  // ===========================================================================
  const video = document.getElementById('care-video');
  const playBtn = document.getElementById('video-play-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const progressContainer = document.getElementById('video-progress-container');
  const progressFill = document.getElementById('video-progress-fill');
  const timeLabel = document.getElementById('video-time-label');
  const volumeSlider = document.getElementById('video-volume');
  const guideButtons = document.querySelectorAll('#video-guide-list button');
  const titleDisplay = document.getElementById('video-title-display');
  const descDisplay = document.getElementById('video-desc-display');

  function formatTime(seconds) {
    if (!isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // Event: click Play/Pause → toggles playback
  playBtn.addEventListener('click', () => {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  });

  video.addEventListener('play', () => {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
  });

  video.addEventListener('pause', () => {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
  });

  // Event: change on volume slider → adjusts volume
  volumeSlider.addEventListener('change', () => {
    video.volume = parseFloat(volumeSlider.value);
  });
  // Live feedback while dragging too
  volumeSlider.addEventListener('input', () => {
    video.volume = parseFloat(volumeSlider.value);
  });

  // Event: timeupdate → updates progress bar
  video.addEventListener('timeupdate', () => {
    const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    progressFill.style.width = pct + '%';
    timeLabel.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  });

  video.addEventListener('loadedmetadata', () => {
    timeLabel.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  });

  // Bonus event: click on progress bar → seek
  progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (video.duration) {
      video.currentTime = ratio * video.duration;
    }
  });

  // Event: click a guide button → swap active video/title/description
  guideButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      guideButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      titleDisplay.textContent = btn.dataset.title;
      descDisplay.textContent = btn.dataset.desc;
      video.pause();
      video.currentTime = 0;
    });
  });
});
