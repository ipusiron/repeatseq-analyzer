'use strict';

// Apply the saved theme before the stylesheet and the first paint.
(() => {
  let theme = 'light';
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch {
    // Storage may be blocked, including under file://.
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
