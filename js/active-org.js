/* Active organisation tracker.
   Stores the currently-selected business id + name in localStorage.
   Used across pages to scope Supabase queries by org_id, and to render
   the business name in the header on business-level pages.
   Exposes window.activeOrg with get / getName / set / clear / renderHeader methods.
*/
(function () {
  'use strict';
  const KEY_ID   = 'coach4u_active_org_id';
  const KEY_NAME = 'coach4u_active_org_name';

  function get() {
    try { return localStorage.getItem(KEY_ID) || null; } catch (_) { return null; }
  }
  function getName() {
    try { return localStorage.getItem(KEY_NAME) || null; } catch (_) { return null; }
  }
  function set(orgId, name) {
    try {
      if (orgId) {
        localStorage.setItem(KEY_ID, orgId);
        if (typeof name === 'string' && name.trim()) {
          localStorage.setItem(KEY_NAME, name.trim());
        }
      } else {
        localStorage.removeItem(KEY_ID);
        localStorage.removeItem(KEY_NAME);
      }
    } catch (_) {}
    renderHeader();
  }
  function clear() {
    try {
      localStorage.removeItem(KEY_ID);
      localStorage.removeItem(KEY_NAME);
    } catch (_) {}
    renderHeader();
  }
  function renderHeader() {
    const el = document.getElementById('activeBizName');
    if (!el) return;
    const name = getName();
    el.textContent = name ? ('🏢 ' + name) : '';
  }

  window.activeOrg = { get, getName, set, clear, renderHeader };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHeader);
  } else {
    renderHeader();
  }
})();
