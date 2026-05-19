/* Active organisation + active subscription tracker.
   Stores the currently-selected business id+name AND the currently-selected
   account/subscription id+name in localStorage.

   - org   = a single business (organisation in Supabase)
   - sub   = an account / subscription (a client account; one owner may have many)

   Used across pages to scope queries and render the header pills.
   Exposes window.activeOrg with get / getName / set / clear / renderHeader methods,
   plus getSubscription / getSubscriptionName / setSubscription.

   v0.5.139: also injects a business-switcher dropdown into the navy header pill
   when the user has 2+ businesses in the active subscription. Picking a different
   business sets the active org and reloads the page — so the user stays on the
   same screen (Issues / Goals / Scorecard / etc.) but viewing a different biz.
*/
(function () {
  'use strict';
  const KEY_ID        = 'coach4u_active_org_id';
  const KEY_NAME      = 'coach4u_active_org_name';
  const KEY_SUB_ID    = 'coach4u_active_subscription_id';
  const KEY_SUB_NAME  = 'coach4u_active_subscription_name';

  // Cache the list of businesses in the active subscription so we don't have to
  // hit Supabase on every page load. Refreshed on account-switch (cleared by
  // index.html's switcher) and whenever it's older than 5 minutes.
  const KEY_BIZ_LIST  = 'coach4u_biz_list_cache';
  const BIZ_LIST_TTL_MS = 5 * 60 * 1000;

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
      // Invalidate the business-list cache — different account, different biz list
      localStorage.removeItem(KEY_BIZ_LIST);
    } catch (_) {}
  }
  function clear() {
    try {
      localStorage.removeItem(KEY_ID);
      localStorage.removeItem(KEY_NAME);
      localStorage.removeItem(KEY_SUB_ID);
      localStorage.removeItem(KEY_SUB_NAME);
      localStorage.removeItem(KEY_BIZ_LIST);
    } catch (_) {}
    renderHeader();
  }
  function renderHeader() {
    const el = document.getElementById('activeBizName');
    if (!el || el.tagName === 'SELECT') return;  // switcher already rendered
    const name = getName();
    el.textContent = name ? ('🏢 ' + name) : '';
  }

  function readBizListCache() {
    const raw = safe(() => localStorage.getItem(KEY_BIZ_LIST));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.timestamp || !Array.isArray(parsed.orgs)) return null;
      if (Date.now() - parsed.timestamp > BIZ_LIST_TTL_MS) return null;
      if (parsed.subId !== getSubscription()) return null;
      return parsed.orgs;
    } catch (_) { return null; }
  }
  function writeBizListCache(orgs) {
    try {
      localStorage.setItem(KEY_BIZ_LIST, JSON.stringify({
        timestamp: Date.now(),
        subId: getSubscription(),
        orgs
      }));
    } catch (_) {}
  }

  async function fetchBizList() {
    const subId = getSubscription();
    if (!subId) return [];
    // Lazy-load the Supabase client — most pages have their own already, but
    // active-org.js needs to be self-contained to avoid coupling.
    const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    const sb = mod.createClient(
      'https://eekefsuaefgpqmjdyniy.supabase.co',
      'sb_publishable_pcXHwQVMpvEojb4K3afEMw_RMvgZM-Y'
    );
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return [];
    const { data } = await sb
      .from('team_members')
      .select('organisation_id, organisations!inner(id, name, subscription_id)')
      .eq('user_id', user.id).eq('status', 'active')
      .eq('organisations.subscription_id', subId);
    const orgs = (data || [])
      .map(r => ({ id: r.organisations.id, name: r.organisations.name }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    writeBizListCache(orgs);
    return orgs;
  }

  async function renderBizSwitcher() {
    const pill = document.getElementById('activeBizName');
    if (!pill) return;
    if (!getSubscription()) return;  // No active account — nothing to switch between
    if (pill.tagName === 'SELECT') return;  // Already rendered

    let orgs = readBizListCache();
    if (!orgs) {
      try { orgs = await fetchBizList(); }
      catch (_) { return; }  // network error etc. — leave the pill as-is
    }
    if (!orgs || orgs.length < 2) return;  // Single-biz account — no dropdown needed

    // If the page later overwrites the pill (account-scope sessions show
    // "🏛️ [Account]"), our select gets replaced — that's desired.
    const pill2 = document.getElementById('activeBizName');
    if (!pill2 || pill2.tagName === 'SELECT') return;
    if (pill2.dataset && pill2.dataset.overridden === '1') return;

    const currentId = get();
    const sel = document.createElement('select');
    sel.id = 'activeBizName';
    sel.className = pill2.className + ' biz-switcher';
    sel.title = 'Switch to a different business — same screen, different business';
    sel.innerHTML = orgs.map(o => {
      const selected = o.id === currentId ? ' selected' : '';
      return '<option value="' + o.id + '"' + selected + '>\u{1F3E2} ' +
        String(o.name || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') +
        '</option>';
    }).join('');
    sel.addEventListener('change', () => {
      const newId = sel.value;
      const picked = orgs.find(o => o.id === newId);
      if (!picked) return;
      set(picked.id, picked.name);
      window.location.reload();
    });
    pill2.replaceWith(sel);
  }

  window.activeOrg = {
    get, getName, set, clear, renderHeader,
    getSubscription, getSubscriptionName, setSubscription,
    renderBizSwitcher  // exposed so pages can call after their own pill overrides
  };

  function boot() {
    renderHeader();
    // Don't await — the switcher fills in shortly after page paint
    renderBizSwitcher();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
