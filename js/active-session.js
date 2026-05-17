/* Active Planning Session — floating "Resume" pill.
   When a planning session is in progress, write to localStorage `coach4u_active_planning_session`.
   This script runs on every main page and renders a fixed pill linking back to the workspace.
   Auto-clears + hides itself when the underlying session is marked completed.
*/
(function () {
  'use strict';
  const KEY = 'coach4u_active_planning_session';
  const STYLE_ID = 'activeSessionStyle';
  const PILL_ID = 'activeSessionPill';

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; }
  }
  function write(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) {}
  }
  function clearKey() {
    try { localStorage.removeItem(KEY); } catch (_) {}
  }

  // Confirm the session referenced by the pill is still in progress.
  // Since v0.5.101 the source-of-truth for planning sessions is Supabase (not localStorage),
  // we trust the pill data itself. The workspace pages call window.activeSession.clear()
  // explicitly when a session is completed or its timer is stopped, which removes the key.
  function isStillActive(data) {
    return !!(data && data.id && data.type);
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .active-session-pill {
        position: fixed;
        bottom: calc(70px + env(safe-area-inset-bottom));
        left: 50%;
        transform: translateX(-50%);
        z-index: 200;
        background: #0D9488;
        color: white !important;
        padding: 9px 16px;
        border-radius: 999px;
        font-family: inherit;
        font-size: 0.8rem;
        font-weight: 700;
        text-decoration: none !important;
        box-shadow: 0 4px 14px rgba(13,148,136,0.45);
        display: flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
        max-width: calc(100vw - 32px);
        animation: aspIn 0.25s ease-out;
      }
      .active-session-pill:hover {
        box-shadow: 0 4px 18px rgba(13,148,136,0.6);
        transform: translateX(-50%) translateY(-1px);
      }
      .active-session-pill .pill-icon { font-size: 0.95rem; line-height: 1; }
      .active-session-pill .pill-arrow { font-size: 0.85rem; opacity: 0.9; }
      @keyframes aspIn {
        from { opacity: 0; transform: translateX(-50%) translateY(8px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  function render() {
    // Always remove the existing pill before re-rendering
    const existing = document.getElementById(PILL_ID);
    if (existing) existing.remove();

    const data = read();
    if (!data || !data.id || !data.type) return;

    // If the underlying session is gone or completed, clean up and bail
    if (!isStillActive(data)) {
      clearKey();
      return;
    }

    // Don't render the pill if we're already on the matching session's workspace
    const path = window.location.pathname;
    if (data.type === 'annual' && path.endsWith('run-annual-session.html')) return;
    if (data.type === 'quarterly' && path.endsWith('run-quarterly-session.html')) return;

    const url = (data.type === 'annual' ? 'run-annual-session.html' : 'run-quarterly-session.html') + '?id=' + data.id;
    const icon = data.type === 'annual' ? '📅' : '🎯';
    const label = data.label || (data.type === 'annual' ? 'Annual Session' : 'Quarterly Session');

    const path2 = window.location.pathname;
    // Compute relative href for pages inside a subfolder (e.g. learn/)
    const href = path2.includes('/learn/') ? '../' + url : url;

    const a = document.createElement('a');
    a.id = PILL_ID;
    a.className = 'active-session-pill';
    a.href = href;
    a.innerHTML =
      '<span class="pill-icon">' + icon + '</span>' +
      '<span class="pill-label">Resume ' + label + '</span>' +
      '<span class="pill-arrow">→</span>';
    document.body.appendChild(a);
  }

  function init() {
    injectStyle();
    render();
  }

  // Render once the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Listen for cross-tab changes
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) render();
  });

  // Public API used by run-annual-session.html and run-quarterly-session.html
  window.activeSession = {
    set(type, id, label) {
      write({ type, id, label: label || '', started_at: new Date().toISOString() });
      render();
    },
    clear() {
      clearKey();
      render();
    }
  };
})();
