/* Active organisation + active subscription tracker.
   Stores the currently-selected business id+name AND the currently-selected
   account/subscription id+name in localStorage.

   - org   = a single business (organisation in Supabase)
   - sub   = an account / subscription (a client account; one owner may have many)

   Used across pages to scope queries and render the header pills.
   Exposes window.activeOrg with get / getName / set / clear / renderHeader methods,
   plus getSubscription / getSubscriptionName / setSubscription.
*/
(function () {
  'use strict';
  const KEY_ID        = 'coach4u_active_org_id';
  const KEY_NAME      = 'coach4u_active_org_name';
  const KEY_SUB_ID    = 'coach4u_active_subscription_id';
  const KEY_SUB_NAME  = 'coach4u_active_subscription_name';

  function safe(fn) { try { return fn(); } catch (_) { return null; } }

  function get()                 { return safe(() => localStorage.getItem(KEY_ID))     || null; }
  function getName()             { return safe(() => localStorage.getItem(KEY_NAME))   || null; }
  function getSubscription()     { return safe(() => localStorage.getItem(KEY_SUB_ID)) || null; }
  function getSubscriptionName() { return safe(() => localStorage.getItem(KEY_SUB_NAME)) || null; }

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
  function setSubscription(subId, name) {
    try {
      if (subId) {
        localStorage.setItem(KEY_SUB_ID, subId);
        if (typeof name === 'string' && name.trim()) {
          localStorage.setItem(KEY_SUB_NAME, name.trim());
        } else if (name === null) {
          localStorage.removeItem(KEY_SUB_NAME);
        }
      } else {
        localStorage.removeItem(KEY_SUB_ID);
        localStorage.removeItem(KEY_SUB_NAME);
      }
    } catch (_) {}
  }
  function clear() {
    try {
      localStorage.removeItem(KEY_ID);
      localStorage.removeItem(KEY_NAME);
      localStorage.removeItem(KEY_SUB_ID);
      localStorage.removeItem(KEY_SUB_NAME);
    } catch (_) {}
    renderHeader();
  }
  function renderHeader() {
    const el = document.getElementById('activeBizName');
    if (!el) return;
    const name = getName();
    el.textContent = name ? ('🏢 ' + name) : '';
  }

  window.activeOrg = {
    get, getName, set, clear, renderHeader,
    getSubscription, getSubscriptionName, setSubscription
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHeader);
  } else {
    renderHeader();
  }
})();
