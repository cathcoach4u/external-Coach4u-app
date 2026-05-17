/* Active organisation tracker.
   Stores the currently-selected business id in localStorage.
   Used across pages to scope Supabase queries by org_id.
   Exposes window.activeOrg with get / set / clear methods.
*/
(function () {
  'use strict';
  const KEY = 'coach4u_active_org_id';

  function get() {
    try { return localStorage.getItem(KEY) || null; } catch (_) { return null; }
  }
  function set(orgId) {
    try {
      if (orgId) localStorage.setItem(KEY, orgId);
      else localStorage.removeItem(KEY);
    } catch (_) {}
  }
  function clear() {
    try { localStorage.removeItem(KEY); } catch (_) {}
  }

  window.activeOrg = { get, set, clear };
})();
