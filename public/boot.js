/*
 * Runs before first paint (external file: extension pages forbid inline scripts).
 * Applies the saved theme/accent so the page never flashes the wrong colours.
 */
(function () {
  try {
    var saved = JSON.parse(localStorage.getItem('momentum.boot') || '{}');
    var theme = saved.theme === 'light' || saved.theme === 'dark' ? saved.theme : 'system';
    if (theme === 'system') {
      theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-accent', saved.accent || 'indigo');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
