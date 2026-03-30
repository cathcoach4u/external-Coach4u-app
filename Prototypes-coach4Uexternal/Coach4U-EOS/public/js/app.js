/* ═══════════════════════════════════════════════════════════════════════
   Strategic Hub — app.js  (Vanilla JS SPA)
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

// ─── API Helper ────────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch('/api' + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

const get  = (path) => api('GET', path);
const post = (path, body) => api('POST', path, body);
const put  = (path, body) => api('PUT', path, body);
const del  = (path) => api('DELETE', path);

// ─── Business State ─────────────────────────────────────────────────────────

let _businesses       = [];
let currentBusinessId = 1;
let currentBusiness   = null;

// Append business_id to a GET path
function bq(path) {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}business_id=${currentBusinessId}`;
}

async function initBusinesses() {
  try {
    _businesses = await get('/businesses');
    currentBusiness = _businesses.find(b => b.type === 'holding') || _businesses[0];
    currentBusinessId = currentBusiness ? currentBusiness.id : 1;
    renderBusinessSwitcher();
  } catch(e) {
    console.error('Failed to load businesses:', e);
  }
}

async function switchBusiness(bizId) {
  currentBusinessId = bizId;
  currentBusiness   = _businesses.find(b => b.id === bizId) || null;
  document.getElementById('biz-dropdown').classList.add('hidden');
  renderBusinessSwitcher();
  // Reload the currently active panel with the new business context
  loadPanel(activePanel);
}

function renderBusinessSwitcher() {
  const dot    = document.getElementById('biz-dot');
  const nameEl = document.getElementById('biz-name-display');
  if (!currentBusiness) return;
  const isHolding = currentBusiness.type === 'holding';
  dot.style.cssText = isHolding
    ? `background:transparent;color:${currentBusiness.color};font-size:14px;`
    : `background:${currentBusiness.color};color:#fff;font-size:0;`;
  dot.textContent = isHolding ? '◉' : '';
  nameEl.textContent = currentBusiness.name;

  const list = document.getElementById('biz-dropdown-list');
  list.innerHTML = _businesses.map(b => `
    <div class="biz-dropdown-item${b.id === currentBusinessId ? ' active' : ''}" data-biz-id="${b.id}">
      <span class="biz-dot-sm" style="background:${b.type === 'holding' ? 'transparent' : b.color};color:${b.type === 'holding' ? b.color : '#fff'};">${b.type === 'holding' ? '◉' : ''}</span>
      <span class="biz-item-name">${escHtml(b.name)}</span>
      ${b.type === 'holding' ? '<span class="biz-type-tag">Group</span>' : ''}
    </div>
  `).join('');
  list.querySelectorAll('.biz-dropdown-item').forEach(item => {
    item.addEventListener('click', () => switchBusiness(parseInt(item.dataset.bizId)));
  });
}

document.getElementById('biz-switcher-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('biz-dropdown').classList.toggle('hidden');
});
document.addEventListener('click', (e) => {
  const sw = document.getElementById('biz-switcher');
  if (sw && !sw.contains(e.target)) document.getElementById('biz-dropdown').classList.add('hidden');
});

// ─── Business Management Modal ───────────────────────────────────────────────

const BIZ_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'];

function openBizManageModal() {
  renderBizManageList();
  document.getElementById('biz-manage-modal').classList.remove('hidden');
}
function closeBizManageModal() {
  document.getElementById('biz-manage-modal').classList.add('hidden');
}

function renderBizManageList() {
  const container = document.getElementById('biz-manage-list');
  container.innerHTML = _businesses.map(b => `
    <div class="biz-manage-row">
      <span class="biz-dot-sm" style="background:${b.type === 'holding' ? 'transparent' : b.color};color:${b.type === 'holding' ? b.color : '#fff'};">${b.type === 'holding' ? '◉' : ''}</span>
      <span class="biz-manage-name">${escHtml(b.name)}</span>
      ${b.type === 'holding' ? '<span class="biz-type-tag">Group</span>' : ''}
      ${b.type !== 'holding' ? `<button class="btn btn-sm btn-ghost" style="margin-left:auto;" data-edit-biz="${b.id}">Edit</button>` : '<span style="margin-left:auto;font-size:12px;color:var(--text-light);">Cannot delete</span>'}
    </div>
  `).join('');
  container.querySelectorAll('[data-edit-biz]').forEach(btn => {
    btn.addEventListener('click', () => {
      const biz = _businesses.find(b => b.id === parseInt(btn.dataset.editBiz));
      if (biz) openBizEditModal(biz);
    });
  });
}

function openBizEditModal(biz) {
  const isNew = !biz;
  document.getElementById('biz-edit-modal-title').textContent = isNew ? 'Add Sub-Business' : 'Edit Business';
  document.getElementById('biz-edit-id').value   = isNew ? '' : biz.id;
  document.getElementById('biz-edit-name').value  = isNew ? '' : biz.name;
  document.getElementById('biz-edit-color').value = isNew ? '#3b82f6' : biz.color;
  document.getElementById('biz-edit-delete').classList.toggle('hidden', isNew);
  renderColorSwatches(isNew ? '#3b82f6' : biz.color);
  document.getElementById('biz-manage-modal').classList.add('hidden');
  document.getElementById('biz-edit-modal').classList.remove('hidden');
}

function renderColorSwatches(selected) {
  const container = document.getElementById('biz-color-swatches');
  container.innerHTML = BIZ_COLORS.map(c => `
    <div class="color-swatch${c === selected ? ' selected' : ''}" style="background:${c}" data-color="${c}" title="${c}"></div>
  `).join('');
  container.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      document.getElementById('biz-edit-color').value = sw.dataset.color;
    });
  });
}

document.getElementById('biz-manage-btn').addEventListener('click', openBizManageModal);
document.getElementById('biz-manage-modal-close').addEventListener('click', closeBizManageModal);
document.getElementById('biz-manage-modal-close2').addEventListener('click', closeBizManageModal);
document.getElementById('biz-add-new-btn').addEventListener('click', () => openBizEditModal(null));
document.getElementById('biz-edit-modal-close').addEventListener('click', () => {
  document.getElementById('biz-edit-modal').classList.add('hidden');
  openBizManageModal();
});
document.getElementById('biz-edit-cancel').addEventListener('click', () => {
  document.getElementById('biz-edit-modal').classList.add('hidden');
  openBizManageModal();
});

document.getElementById('biz-edit-save').addEventListener('click', async () => {
  const id    = document.getElementById('biz-edit-id').value;
  const name  = document.getElementById('biz-edit-name').value.trim();
  const color = document.getElementById('biz-edit-color').value;
  if (!name) { showToast('Business name is required', 'error'); return; }
  try {
    if (id) {
      const updated = await put(`/businesses/${id}`, { name, color });
      _businesses = _businesses.map(b => b.id === parseInt(id) ? updated : b);
      showToast('Business updated', 'success');
    } else {
      const created = await post('/businesses', { name, color, type: 'sub' });
      _businesses.push(created);
      showToast('Business added', 'success');
    }
    renderBusinessSwitcher();
    document.getElementById('biz-edit-modal').classList.add('hidden');
    openBizManageModal();
  } catch(e) { showToast('Save failed: ' + e.message, 'error'); }
});

document.getElementById('biz-edit-delete').addEventListener('click', async () => {
  const id = document.getElementById('biz-edit-id').value;
  if (!id || !confirm('Delete this business and all its data references?')) return;
  try {
    await del(`/businesses/${id}`);
    _businesses = _businesses.filter(b => b.id !== parseInt(id));
    if (currentBusinessId === parseInt(id)) {
      await switchBusiness(_businesses.find(b => b.type === 'holding')?.id || _businesses[0]?.id);
    } else {
      renderBusinessSwitcher();
    }
    showToast('Business deleted', 'success');
    document.getElementById('biz-edit-modal').classList.add('hidden');
    openBizManageModal();
  } catch(e) { showToast('Delete failed: ' + e.message, 'error'); }
});

// ─── Toast ─────────────────────────────────────────────────────────────────────

let toastTimer = null;
function showToast(msg, type = 'default') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type !== 'default' ? ' toast-' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast hidden'; }, 2800);
}

// ─── Hub Navigation ─────────────────────────────────────────────────────────────

let activePanel = 'vto';
let activeHub   = 'strategic';

// Hub → panel mapping. First panel in each array is the default.
const HUB_PANELS = {
  strategic:  ['vto'],
  operations: ['rocks', 'scorecard', 'l10', 'issues'],
  team:       ['accountability', 'alignment'],
  growth:     ['growth'],
};

// Sub-tab labels for hubs with multiple panels
const SUB_TAB_LABELS = {
  rocks:          'Goals',
  scorecard:      'Metrics',
  l10:            'Meeting',
  issues:         'Issues',
  accountability: 'Org Chart',
  alignment:      'Team Members',
};

function switchHub(hub, subPanel) {
  activeHub = hub;
  const panels = HUB_PANELS[hub];
  const targetPanel = subPanel && panels.includes(subPanel) ? subPanel : panels[0];

  // Update hub tabs
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.hub === hub));

  // Show/hide sub-nav
  const subNav = document.getElementById('sub-nav');
  const subNavTabs = document.getElementById('sub-nav-tabs');
  if (panels.length > 1) {
    subNav.classList.remove('hidden');
    subNavTabs.innerHTML = panels.map(p =>
      `<button class="sub-tab${p === targetPanel ? ' active' : ''}" data-panel="${p}">${SUB_TAB_LABELS[p] || p}</button>`
    ).join('');
    subNavTabs.querySelectorAll('.sub-tab').forEach(btn => {
      btn.addEventListener('click', () => switchSubPanel(btn.dataset.panel));
    });
  } else {
    subNav.classList.add('hidden');
  }

  showPanel(targetPanel);
  loadPanel(targetPanel);
}

function switchSubPanel(panel) {
  document.querySelectorAll('.sub-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === panel));
  showPanel(panel);
  loadPanel(panel);
}

function showPanel(panel) {
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  const el = document.getElementById(panel + '-panel');
  if (el) el.classList.remove('hidden');
  activePanel = panel;
}

function loadPanel(panel) {
  if (panel === 'vto')            loadVTO();
  if (panel === 'accountability') loadAccountability();
  if (panel === 'rocks')          loadRocks();
  if (panel === 'scorecard')      loadScorecard();
  if (panel === 'l10')            loadMeetings();
  if (panel === 'issues')         loadIssues();
  if (panel === 'alignment')      loadAlignment();
}

// Keep switchTab for backwards compat (e.g. go-to-vto-link)
function switchTab(panel) {
  // Find which hub owns this panel
  for (const [hub, panels] of Object.entries(HUB_PANELS)) {
    if (panels.includes(panel)) {
      switchHub(hub, panel);
      return;
    }
  }
}

document.getElementById('main-nav').addEventListener('click', (e) => {
  const tab = e.target.closest('.nav-tab');
  if (!tab) return;
  switchHub(tab.dataset.hub);
});

// ─── Vision Banner ─────────────────────────────────────────────────────────────

const BANNER_KEY = 'strategic_hub_banner_open';

function setBannerState(open) {
  const banner = document.getElementById('vision-banner');
  const collapsed = document.getElementById('vision-banner-collapsed');
  if (open) {
    banner.style.display = '';
    collapsed.style.display = 'none';
    localStorage.setItem(BANNER_KEY, '1');
  } else {
    banner.style.display = 'none';
    collapsed.style.display = '';
    localStorage.setItem(BANNER_KEY, '0');
  }
}

document.getElementById('vision-collapse-btn').addEventListener('click', () => setBannerState(false));
document.getElementById('vision-expand-btn').addEventListener('click', () => setBannerState(true));

// Restore banner state
setBannerState(localStorage.getItem(BANNER_KEY) !== '0');

async function populateBanner(vtoData) {
  // Core values
  const cvs = vtoData.core_values || {};
  const valuesEl = document.getElementById('banner-values');
  const pills = Object.values(cvs).map(v => `<span class="vision-value-pill">${escHtml(v.value || '')}</span>`);
  valuesEl.innerHTML = pills.join('') || '—';

  // 10-year
  const ten = vtoData.ten_year;
  document.getElementById('banner-10yr').textContent = ten && ten.target ? ten.target.value : '—';

  // 1-year
  const oy = vtoData.one_year || {};
  document.getElementById('banner-revenue').textContent = oy.revenue ? oy.revenue.value : '—';
  document.getElementById('banner-profit').textContent  = oy.profit  ? oy.profit.value  : '—';
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatWeek(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function formatValue(val, type) {
  if (val === null || val === undefined) return '';
  if (type === 'currency') return '$' + Number(val).toLocaleString();
  if (type === 'percentage') return val + '%';
  return String(val);
}

function statusBadge(status) {
  const map = {
    on_track:       ['badge-on-track',   '✓ On Track'],
    off_track:      ['badge-off-track',  '✕ Off Track'],
    done:           ['badge-done',       '● Done'],
    not_started:    ['badge-not-started','○ Not Started'],
    open:           ['badge-open',       'Open'],
    ids_in_progress:['badge-ids',        'In IDS'],
    resolved:       ['badge-resolved',   '✓ Resolved'],
  };
  const [cls, label] = map[status] || ['badge-open', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function priorityBadge(priority) {
  const map = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
  return `<span class="badge ${map[priority] || 'badge-medium'}">${priority || 'medium'}</span>`;
}

function rockIcon(status) {
  const map = {
    on_track:    ['rock-icon-on-track',    '✓'],
    off_track:   ['rock-icon-off-track',   '✕'],
    done:        ['rock-icon-done',        '◉'],
    not_started: ['rock-icon-not-started', '○'],
  };
  const [cls, icon] = map[status] || ['rock-icon-not-started', '○'];
  return `<div class="rock-item-icon ${cls}">${icon}</div>`;
}

// ─── VTO Panel ────────────────────────────────────────────────────────────────

let _vtoData = {};

async function loadVTO() {
  try {
    const data = await get(bq('/vto'));
    _vtoData = data;
    populateBanner(data);

    if (currentBusiness && currentBusiness.type === 'holding') {
      const rollup = await get('/businesses/rollup');
      renderGroupOverview(data, rollup);
    } else {
      document.getElementById('group-overview-content').classList.add('hidden');
      document.getElementById('vto-form-content').classList.remove('hidden');
      renderVTOForm(data);
    }
  } catch (e) { showToast('Failed to load VTO: ' + e.message, 'error'); }
}

function renderGroupOverview(vtoData, rollupData) {
  document.getElementById('vto-form-content').classList.add('hidden');
  const container = document.getElementById('group-overview-content');
  container.classList.remove('hidden');

  // Group-level strategic data
  const cv = vtoData.core_values || {};
  const valuesPills = Object.values(cv)
    .map(v => v.value).filter(Boolean)
    .map(v => `<span class="go-value-pill">${escHtml(v)}</span>`).join('');

  const tenYear = vtoData.ten_year?.target?.value || '';
  const corePurpose = vtoData.core_focus?.purpose?.value || '';
  const coreNiche = vtoData.core_focus?.niche?.value || '';
  const oneYearRev = vtoData.one_year?.revenue?.value || '';
  const oneYearProfit = vtoData.one_year?.profit?.value || '';
  const threeYearRev = vtoData.three_year?.revenue?.value || '';

  // Entity quick-nav strip
  const entityNav = rollupData.map(biz =>
    `<button class="go-entity-btn" data-biz-id="${biz.id}" style="--ent-color:${biz.color}">
      <span class="go-entity-dot" style="background:${biz.color}"></span>
      ${escHtml(biz.name)}
    </button>`
  ).join('');

  // Sub-business cards
  const cardsHtml = rollupData.length === 0
    ? `<div class="go-empty-state">
        <p>No sub-businesses configured yet.</p>
        <button class="btn btn-primary" onclick="openBizManageModal()">+ Add Sub-Business</button>
      </div>`
    : rollupData.map(biz => {
      const rocksPercent = biz.rocks.total > 0
        ? Math.round((biz.rocks.on_track / biz.rocks.total) * 100) : 0;
      const scPercent = biz.scorecard.total > 0
        ? Math.round((biz.scorecard.on_track / biz.scorecard.total) * 100) : 0;
      const overallHealth = (rocksPercent >= 70 && scPercent >= 70) ? 'healthy'
        : (rocksPercent >= 40 && scPercent >= 40) ? 'caution' : 'at-risk';

      return `
        <div class="go-biz-card" data-biz-id="${biz.id}">
          <div class="go-biz-card-header" style="background:${biz.color}">
            <span class="go-biz-name">${escHtml(biz.name)}</span>
            <span class="go-health-dot go-health-${overallHealth}" title="${overallHealth}"></span>
          </div>
          <div class="go-biz-card-body">
            ${biz.vto_summary?.purpose ? `<p class="go-biz-purpose">${escHtml(biz.vto_summary.purpose)}</p>` : ''}
            <div class="go-biz-stats">
              <div class="go-stat">
                <span class="go-stat-label">Goals</span>
                <span class="go-stat-value">${biz.rocks.on_track}/${biz.rocks.total}</span>
                <div class="go-progress-bar"><div class="go-progress-fill" style="width:${rocksPercent}%;background:${rocksPercent >= 70 ? 'var(--success)' : rocksPercent >= 40 ? 'var(--warning)' : 'var(--danger)'}"></div></div>
              </div>
              <div class="go-stat">
                <span class="go-stat-label">Metrics</span>
                <span class="go-stat-value">${biz.scorecard.on_track}/${biz.scorecard.total}</span>
                <div class="go-progress-bar"><div class="go-progress-fill" style="width:${scPercent}%;background:${scPercent >= 70 ? 'var(--success)' : scPercent >= 40 ? 'var(--warning)' : 'var(--danger)'}"></div></div>
              </div>
              <div class="go-stat">
                <span class="go-stat-label">Issues</span>
                <span class="go-stat-value ${biz.issues.open > 0 ? 'go-issues-count' : ''}">${biz.issues.open} open</span>
              </div>
            </div>
            ${biz.vto_summary?.one_year_revenue ? `
            <div class="go-biz-targets">
              <span>1Y Revenue: <strong>${escHtml(biz.vto_summary.one_year_revenue)}</strong></span>
              ${biz.vto_summary.one_year_profit ? `<span>1Y Profit: <strong>${escHtml(biz.vto_summary.one_year_profit)}</strong></span>` : ''}
            </div>` : ''}
          </div>
          <div class="go-biz-card-footer">
            <span class="go-drill-link">View Details &#8594;</span>
          </div>
        </div>
      `;
    }).join('');

  container.innerHTML = `
    <div class="go-header">
      <div class="go-header-text">
        <h1 class="go-title">Group Overview</h1>
        <p class="go-subtitle">Big picture view across all business entities</p>
      </div>
      ${rollupData.length > 0 ? `<div class="go-entity-nav">${entityNav}</div>` : ''}
    </div>

    <div class="go-strategic-section">
      <div class="go-strat-card go-strat-highlight">
        <div class="go-strat-label">10-Year Target</div>
        <div class="go-strat-text go-strat-big">${escHtml(tenYear) || '<span class="go-placeholder">Not set yet</span>'}</div>
      </div>
      <div class="go-strat-card">
        <div class="go-strat-label">Core Values</div>
        <div class="go-strat-values">${valuesPills || '<span class="go-placeholder">Not set yet</span>'}</div>
      </div>
      <div class="go-strat-card">
        <div class="go-strat-label">Core Focus</div>
        <div class="go-strat-text">${escHtml(corePurpose) || '<span class="go-placeholder">Not set yet</span>'}</div>
        ${coreNiche ? `<div class="go-strat-sub">Niche: ${escHtml(coreNiche)}</div>` : ''}
      </div>
      <div class="go-strat-card">
        <div class="go-strat-label">Financial Targets</div>
        <div class="go-strat-nums">
          ${threeYearRev ? `<div><span class="go-num-label">3Y Revenue</span><strong>${escHtml(threeYearRev)}</strong></div>` : ''}
          ${oneYearRev ? `<div><span class="go-num-label">1Y Revenue</span><strong>${escHtml(oneYearRev)}</strong></div>` : ''}
          ${oneYearProfit ? `<div><span class="go-num-label">1Y Profit</span><strong>${escHtml(oneYearProfit)}</strong></div>` : ''}
          ${!threeYearRev && !oneYearRev && !oneYearProfit ? '<span class="go-placeholder">Not set yet</span>' : ''}
        </div>
      </div>
    </div>

    <div class="go-biz-section">
      <h2 class="go-section-heading">Business Entities</h2>
      <p class="go-section-sub">Each entity feeds into the group's big picture goals above</p>
      <div class="go-biz-grid">${cardsHtml}</div>
    </div>
  `;

  // Attach click handlers
  container.querySelectorAll('.go-biz-card').forEach(card => {
    card.addEventListener('click', () => switchBusiness(parseInt(card.dataset.bizId)));
  });
  container.querySelectorAll('.go-entity-btn').forEach(btn => {
    btn.addEventListener('click', () => switchBusiness(parseInt(btn.dataset.bizId)));
  });
}

function renderVTOForm(data) {
  // Core values — dynamic inputs
  const cvContainer = document.getElementById('vto-core-values');
  cvContainer.innerHTML = '';
  const cv = data.core_values || {};
  for (let i = 1; i <= 6; i++) {
    const key = 'value_' + i;
    const val = cv[key] ? cv[key].value : '';
    const row = document.createElement('div');
    row.className = 'vto-value-row';
    row.innerHTML = `
      <span class="vto-value-num">${i}.</span>
      <input type="text" class="field-input vto-field" data-section="core_values" data-key="${key}" value="${escHtml(val)}" placeholder="Core value ${i}..." />
    `;
    cvContainer.appendChild(row);
  }

  // Populate all other vto-field elements
  document.querySelectorAll('.vto-field').forEach(el => {
    const section = el.dataset.section;
    const key = el.dataset.key;
    if (!section || !key) return;
    const sectionData = data[section] || {};
    const fieldData = sectionData[key];
    if (fieldData) {
      if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
        el.value = fieldData.value || '';
      }
    }
  });

  // Attach save-on-blur
  document.querySelectorAll('.vto-field').forEach(el => {
    el.addEventListener('blur', saveVTOField);
  });
}

async function saveVTOField(e) {
  const el = e.target;
  const section = el.dataset.section;
  const key = el.dataset.key;
  const value = el.value;
  try {
    await put(`/vto/${section}/${key}`, { value, business_id: currentBusinessId });
    if (!_vtoData[section]) _vtoData[section] = {};
    if (!_vtoData[section][key]) _vtoData[section][key] = {};
    _vtoData[section][key].value = value;
    populateBanner(_vtoData);
    showToast('Saved', 'success');
  } catch (e) { showToast('Save failed: ' + e.message, 'error'); }
}

// ─── Accountability Panel ─────────────────────────────────────────────────────

let _seats = [];

async function loadAccountability() {
  try {
    _seats = await get('/seats');
    renderOrgChart(_seats);
  } catch (e) { showToast('Failed to load seats: ' + e.message, 'error'); }
}

function renderOrgChart(seats) {
  const container = document.getElementById('org-chart');
  container.innerHTML = '';

  // Build tree
  const topLevel = seats.filter(s => !s.parent_id);
  const tree = document.createElement('div');
  tree.className = 'org-tree';

  // Top level row
  const topRow = document.createElement('div');
  topRow.className = 'org-row';
  topLevel.forEach(seat => {
    const wrap = buildSeatGroup(seat, seats);
    topRow.appendChild(wrap);
  });
  tree.appendChild(topRow);
  container.appendChild(tree);
}

function buildSeatGroup(seat, allSeats) {
  const children = allSeats.filter(s => s.parent_id === seat.id);
  const group = document.createElement('div');
  group.className = 'org-group';

  const cardEl = document.createElement('div');
  cardEl.innerHTML = renderSeatCard(seat);
  group.appendChild(cardEl.firstChild);

  if (children.length > 0) {
    const line = document.createElement('div');
    line.className = 'org-parent-line';
    group.appendChild(line);

    const childRow = document.createElement('div');
    childRow.className = 'org-children-row';
    children.forEach(child => {
      const childWrap = document.createElement('div');
      childWrap.className = 'org-child-wrap';
      const childLine = document.createElement('div');
      childLine.className = 'org-child-line';
      childWrap.appendChild(childLine);
      const childCardEl = document.createElement('div');
      childCardEl.innerHTML = renderSeatCard(child);
      childWrap.appendChild(childCardEl.firstChild);
      childRow.appendChild(childWrap);
    });
    group.appendChild(childRow);
  }
  return group;
}

function renderSeatCard(seat) {
  let responsibilities = [];
  try { responsibilities = JSON.parse(seat.responsibilities || '[]'); } catch(_) {}
  const respItems = responsibilities.map(r => `<li>${escHtml(r)}</li>`).join('');
  return `
    <div class="seat-card" data-seat-id="${seat.id}">
      <div class="seat-card-header">
        <div class="seat-card-title">${escHtml(seat.title)}</div>
        <div class="seat-card-person">${escHtml(seat.person || 'Unassigned')}</div>
      </div>
      <div class="seat-card-body">
        <ul class="seat-card-responsibilities">${respItems}</ul>
      </div>
    </div>
  `;
}

document.getElementById('org-chart').addEventListener('click', (e) => {
  const card = e.target.closest('.seat-card');
  if (!card) return;
  const seatId = parseInt(card.dataset.seatId);
  const seat = _seats.find(s => s.id === seatId);
  if (seat) openSeatModal(seat);
});

document.getElementById('add-seat-btn').addEventListener('click', () => openSeatModal(null));

function openSeatModal(seat) {
  const modal = document.getElementById('seat-modal');
  const isNew = !seat;
  document.getElementById('seat-modal-title').textContent = isNew ? 'Add Seat' : 'Edit Seat';
  document.getElementById('seat-id').value = isNew ? '' : seat.id;
  document.getElementById('seat-title').value = isNew ? '' : (seat.title || '');
  document.getElementById('seat-person').value = isNew ? '' : (seat.person || '');

  let responsibilities = [];
  if (!isNew) { try { responsibilities = JSON.parse(seat.responsibilities || '[]'); } catch(_) {} }
  document.getElementById('seat-responsibilities').value = responsibilities.join('\n');

  // Parent select
  const parentSel = document.getElementById('seat-parent');
  parentSel.innerHTML = '<option value="">None (Top Level)</option>';
  _seats.forEach(s => {
    if (isNew || s.id !== seat.id) {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.title + (s.person ? ' (' + s.person + ')' : '');
      if (!isNew && seat.parent_id === s.id) opt.selected = true;
      parentSel.appendChild(opt);
    }
  });

  document.getElementById('seat-modal-delete').classList.toggle('hidden', isNew);
  modal.classList.remove('hidden');
}

function closeSeatModal() {
  document.getElementById('seat-modal').classList.add('hidden');
}

document.getElementById('seat-modal-close').addEventListener('click', closeSeatModal);
document.getElementById('seat-modal-cancel').addEventListener('click', closeSeatModal);

document.getElementById('ai-suggest-btn').addEventListener('click', async () => {
  const titleEl = document.getElementById('seat-title');
  const seatTitle = titleEl.value.trim();
  if (!seatTitle) {
    showToast('Enter a Seat Title first', 'error');
    titleEl.focus();
    return;
  }
  const btn = document.getElementById('ai-suggest-btn');
  const textarea = document.getElementById('seat-responsibilities');
  btn.disabled = true;
  btn.textContent = '✨ Generating…';
  try {
    const data = await post('/ai/suggest-responsibilities', { seatTitle });
    textarea.value = data.responsibilities.join('\n');
    showToast('Responsibilities generated — edit as needed', 'success');
  } catch(e) {
    showToast('AI suggestion failed: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '✨ Generate Responsibilities';
  }
});

document.getElementById('seat-modal-save').addEventListener('click', async () => {
  const id = document.getElementById('seat-id').value;
  const title = document.getElementById('seat-title').value.trim();
  const person = document.getElementById('seat-person').value.trim();
  const parentId = document.getElementById('seat-parent').value || null;
  const respRaw = document.getElementById('seat-responsibilities').value;
  const responsibilities = respRaw.split('\n').map(l => l.trim()).filter(Boolean);

  if (!title) { showToast('Seat title is required', 'error'); return; }

  try {
    if (id) {
      await put(`/seats/${id}`, { title, person, parent_id: parentId ? parseInt(parentId) : null, responsibilities, sort_order: 0 });
      showToast('Seat updated', 'success');
    } else {
      await post('/seats', { title, person, parent_id: parentId ? parseInt(parentId) : null, responsibilities, sort_order: 0 });
      showToast('Seat created', 'success');
    }
    closeSeatModal();
    await loadAccountability();
  } catch(e) { showToast('Save failed: ' + e.message, 'error'); }
});

document.getElementById('seat-modal-delete').addEventListener('click', async () => {
  const id = document.getElementById('seat-id').value;
  if (!id) return;
  if (!confirm('Delete this seat?')) return;
  try {
    await del(`/seats/${id}`);
    showToast('Seat deleted', 'success');
    closeSeatModal();
    await loadAccountability();
  } catch(e) { showToast('Delete failed: ' + e.message, 'error'); }
});

// ─── Rocks Panel ──────────────────────────────────────────────────────────────

let _rocks = [];

async function loadRocks() {
  const quarter = document.getElementById('quarter-select').value;
  try {
    _rocks = await get('/rocks?quarter=' + encodeURIComponent(quarter));
    renderRocksBoard(_rocks);
  } catch(e) { showToast('Failed to load rocks: ' + e.message, 'error'); }
}

document.getElementById('quarter-select').addEventListener('change', loadRocks);

function renderRocksBoard(rocks) {
  const board = document.getElementById('rocks-board');
  board.innerHTML = '';

  if (!rocks.length) {
    board.innerHTML = '<div class="empty-state"><div class="empty-state-icon">◈</div><p>No priorities for this quarter. Add your first priority!</p></div>';
    updateRocksProgress([]);
    return;
  }

  updateRocksProgress(rocks);

  // Company rocks group
  const companyRocks = rocks.filter(r => r.company_rock);
  if (companyRocks.length) {
    board.appendChild(renderRocksGroup('Company Rocks', companyRocks, true));
  }

  // Group by owner
  const individualRocks = rocks.filter(r => !r.company_rock);
  const owners = [...new Set(individualRocks.map(r => r.owner || 'Unassigned'))];
  owners.forEach(owner => {
    const ownerRocks = individualRocks.filter(r => (r.owner || 'Unassigned') === owner);
    board.appendChild(renderRocksGroup(owner, ownerRocks, false));
  });
}

function renderRocksGroup(label, rocks, isCompany) {
  const group = document.createElement('div');
  group.className = 'rocks-group';

  const header = document.createElement('div');
  header.className = 'rocks-group-header';
  header.innerHTML = `
    ${isCompany ? '<span style="color:var(--accent);">◉</span>' : ''}
    ${escHtml(label)}
    <span class="rocks-group-count">${rocks.length}</span>
  `;
  group.appendChild(header);

  const list = document.createElement('div');
  list.className = 'rock-list';
  rocks.forEach(rock => {
    const item = document.createElement('div');
    item.className = 'rock-item';
    item.dataset.rockId = rock.id;
    item.innerHTML = `
      ${rockIcon(rock.status)}
      <div class="rock-item-body">
        <div class="rock-item-desc">${escHtml(rock.description)}</div>
        <div class="rock-item-meta">${escHtml(rock.owner || '—')} · ${statusBadge(rock.status)}</div>
      </div>
      ${rock.company_rock ? '<span class="rock-company-tag">Company</span>' : ''}
    `;
    item.addEventListener('click', () => openRockModal(_rocks.find(r => r.id === rock.id)));
    list.appendChild(item);
  });
  group.appendChild(list);
  return group;
}

function updateRocksProgress(rocks) {
  const done = rocks.filter(r => r.status === 'done').length;
  const total = rocks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  document.getElementById('rocks-progress-text').textContent = `${done} of ${total} goals complete`;
  document.getElementById('rocks-progress-pct').textContent = `${pct}%`;
  document.getElementById('rocks-progress-fill').style.width = pct + '%';
}

document.getElementById('add-rock-btn').addEventListener('click', () => openRockModal(null));

function openRockModal(rock) {
  const isNew = !rock;
  document.getElementById('rock-modal-title').textContent = isNew ? 'Add Goal' : 'Edit Goal';
  document.getElementById('rock-id').value = isNew ? '' : rock.id;
  document.getElementById('rock-description').value = isNew ? '' : (rock.description || '');
  document.getElementById('rock-owner').value = isNew ? '' : (rock.owner || '');
  document.getElementById('rock-status').value = isNew ? 'on_track' : (rock.status || 'on_track');
  document.getElementById('rock-company').checked = isNew ? false : !!rock.company_rock;

  // Set quarter select to current selected quarter
  const currentQuarter = document.getElementById('quarter-select').value;
  const quarterSel = document.getElementById('rock-quarter');
  quarterSel.value = isNew ? currentQuarter : (rock.quarter || currentQuarter);

  document.getElementById('rock-modal-delete').classList.toggle('hidden', isNew);
  document.getElementById('rock-modal').classList.remove('hidden');
}

function closeRockModal() { document.getElementById('rock-modal').classList.add('hidden'); }
document.getElementById('rock-modal-close').addEventListener('click', closeRockModal);
document.getElementById('rock-modal-cancel').addEventListener('click', closeRockModal);

document.getElementById('rock-modal-save').addEventListener('click', async () => {
  const id = document.getElementById('rock-id').value;
  const description = document.getElementById('rock-description').value.trim();
  const owner = document.getElementById('rock-owner').value.trim();
  const status = document.getElementById('rock-status').value;
  const quarter = document.getElementById('rock-quarter').value;
  const company_rock = document.getElementById('rock-company').checked ? 1 : 0;

  if (!description) { showToast('Priority description is required', 'error'); return; }

  try {
    if (id) {
      await put(`/rocks/${id}`, { description, owner, status, quarter, company_rock, seat_id: null });
      showToast('Priority updated', 'success');
    } else {
      await post('/rocks', { description, owner, status, quarter, company_rock, seat_id: null });
      showToast('Priority created', 'success');
    }
    closeRockModal();
    await loadRocks();
  } catch(e) { showToast('Save failed: ' + e.message, 'error'); }
});

document.getElementById('rock-modal-delete').addEventListener('click', async () => {
  const id = document.getElementById('rock-id').value;
  if (!id) return;
  if (!confirm('Delete this rock?')) return;
  try {
    await del(`/rocks/${id}`);
    showToast('Priority deleted', 'success');
    closeRockModal();
    await loadRocks();
  } catch(e) { showToast('Delete failed: ' + e.message, 'error'); }
});

// ─── Scorecard Panel ──────────────────────────────────────────────────────────

let _scorecard = { metrics: [], weeks: [] };
let _activeCellMeta = null;

async function loadScorecard() {
  try {
    _scorecard = await get('/scorecard');
    renderScorecardTable(_scorecard);
  } catch(e) { showToast('Failed to load scorecard: ' + e.message, 'error'); }
}

function renderScorecardTable({ metrics, weeks }) {
  const headerRow = document.getElementById('scorecard-header-row');
  const tbody = document.getElementById('scorecard-body');

  // Header
  headerRow.innerHTML = `
    <th class="col-metric">Metric</th>
    <th class="col-owner">Owner</th>
    <th class="col-goal">Goal</th>
    ${weeks.map(w => `<th>${formatWeek(w)}</th>`).join('')}
  `;

  // Body
  tbody.innerHTML = '';
  if (!metrics.length) {
    tbody.innerHTML = `<tr><td colspan="${weeks.length + 3}" class="text-center text-muted" style="padding:40px;">No metrics yet. Add your first metric.</td></tr>`;
    return;
  }

  metrics.forEach(metric => {
    const tr = document.createElement('tr');
    const goalNum = parseFloat(metric.goal);

    // Format goal display
    let goalDisplay = metric.goal;
    if (metric.measurement_type === 'currency') goalDisplay = '$' + Number(metric.goal).toLocaleString();
    else if (metric.measurement_type === 'percentage') goalDisplay = metric.goal + '%';

    tr.innerHTML = `
      <td class="cell-metric">
        ${escHtml(metric.name)}
        <span class="cell-metric-sub">${escHtml(metric.measurement_type)}</span>
      </td>
      <td class="cell-owner">${escHtml(metric.owner || '—')}</td>
      <td class="cell-goal">${escHtml(goalDisplay)}</td>
      ${metric.entries.map((entry, i) => {
        let cls = 'cell-empty';
        let display = '—';
        if (entry.value !== null && entry.value !== undefined) {
          cls = entry.on_track === 1 ? 'cell-green' : 'cell-red';
          display = formatValue(entry.value, metric.measurement_type);
        }
        return `<td>
          <div class="scorecard-cell ${cls}"
               data-metric-id="${metric.id}"
               data-week="${weeks[i]}"
               data-entry-id="${entry.id || ''}"
               data-goal="${goalNum}"
               data-type="${metric.measurement_type}"
               data-value="${entry.value !== null ? entry.value : ''}"
               tabindex="0"
               title="${weeks[i]}">${display}</div>
        </td>`;
      }).join('')}
    `;
    tbody.appendChild(tr);
  });

  // Click / keydown on cells
  tbody.querySelectorAll('.scorecard-cell').forEach(cell => {
    cell.addEventListener('click', (e) => openCellPopover(cell, e));
    cell.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCellPopover(cell, e); }});
  });
}

function openCellPopover(cell, event) {
  const popover = document.getElementById('cell-popover');
  const input = document.getElementById('cell-popover-input');

  _activeCellMeta = {
    metricId:  parseInt(cell.dataset.metricId),
    week:      cell.dataset.week,
    entryId:   cell.dataset.entryId || null,
    goal:      parseFloat(cell.dataset.goal),
    type:      cell.dataset.type,
    cell,
  };

  input.value = cell.dataset.value || '';
  input.placeholder = 'Enter value';

  // Position the popover near the cell
  const rect = cell.getBoundingClientRect();
  const pRect = { width: 180, height: 56 };
  let top  = rect.bottom + 6 + window.scrollY;
  let left = rect.left + window.scrollX;
  if (left + pRect.width > window.innerWidth - 10) left = window.innerWidth - pRect.width - 10;
  popover.style.top  = top + 'px';
  popover.style.left = left + 'px';
  popover.classList.remove('hidden');
  input.focus();
  input.select();
}

function closeCellPopover() {
  document.getElementById('cell-popover').classList.add('hidden');
  _activeCellMeta = null;
}

document.getElementById('cell-popover-cancel').addEventListener('click', closeCellPopover);

document.getElementById('cell-popover-save').addEventListener('click', async () => {
  if (!_activeCellMeta) return;
  const { metricId, week, goal, type, cell } = _activeCellMeta;
  const rawVal = document.getElementById('cell-popover-input').value.trim();
  if (rawVal === '') {
    // Clear the entry (send null)
    try {
      await post('/scorecard/entries', { metric_id: metricId, week_date: week, value: null, on_track: null });
      cell.dataset.value = '';
      cell.className = 'scorecard-cell cell-empty';
      cell.textContent = '—';
      showToast('Cleared', 'success');
      closeCellPopover();
    } catch(e) { showToast('Save failed: ' + e.message, 'error'); }
    return;
  }
  const value = parseFloat(rawVal);
  if (isNaN(value)) { showToast('Please enter a valid number', 'error'); return; }
  const on_track = value >= goal ? 1 : 0;
  try {
    await post('/scorecard/entries', { metric_id: metricId, week_date: week, value, on_track });
    cell.dataset.value = value;
    cell.className = 'scorecard-cell ' + (on_track ? 'cell-green' : 'cell-red');
    cell.textContent = formatValue(value, type);
    showToast('Saved', 'success');
    closeCellPopover();
  } catch(e) { showToast('Save failed: ' + e.message, 'error'); }
});

document.getElementById('cell-popover-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('cell-popover-save').click();
  if (e.key === 'Escape') closeCellPopover();
});

// Close popover when clicking outside
document.addEventListener('click', (e) => {
  const popover = document.getElementById('cell-popover');
  if (!popover.classList.contains('hidden') &&
      !popover.contains(e.target) &&
      !e.target.classList.contains('scorecard-cell')) {
    closeCellPopover();
  }
});

// Add Metric Modal
document.getElementById('add-metric-btn').addEventListener('click', () => {
  document.getElementById('metric-id').value = '';
  document.getElementById('metric-name').value = '';
  document.getElementById('metric-owner').value = '';
  document.getElementById('metric-goal').value = '';
  document.getElementById('metric-type').value = 'number';
  document.getElementById('metric-modal').classList.remove('hidden');
});

document.getElementById('metric-modal-close').addEventListener('click', () => document.getElementById('metric-modal').classList.add('hidden'));
document.getElementById('metric-modal-cancel').addEventListener('click', () => document.getElementById('metric-modal').classList.add('hidden'));

document.getElementById('metric-modal-save').addEventListener('click', async () => {
  const name = document.getElementById('metric-name').value.trim();
  const owner = document.getElementById('metric-owner').value.trim();
  const goal = document.getElementById('metric-goal').value.trim();
  const measurement_type = document.getElementById('metric-type').value;
  if (!name) { showToast('Metric name is required', 'error'); return; }
  try {
    await post('/scorecard/metrics', { name, owner, goal, measurement_type, sort_order: 0 });
    showToast('Metric added', 'success');
    document.getElementById('metric-modal').classList.add('hidden');
    await loadScorecard();
  } catch(e) { showToast('Save failed: ' + e.message, 'error'); }
});

// ─── L10 Meetings Panel ───────────────────────────────────────────────────────

let _meetings = [];
let _currentMeeting = null;
let _sectionTimers = {};
let _sectionIntervals = {};
let _meetingStartTime = null;
let _meetingInterval = null;

async function loadMeetings() {
  try {
    _meetings = await get('/meetings');
    renderMeetingsList(_meetings);
    if (_meetings.length > 0 && !_currentMeeting) {
      await loadMeetingDetail(_meetings[0].id);
    }
  } catch(e) { showToast('Failed to load meetings: ' + e.message, 'error'); }
}

function renderMeetingsList(meetings) {
  const list = document.getElementById('meetings-list');
  list.className = 'meetings-list';
  if (!meetings.length) {
    list.innerHTML = '<div style="padding:20px 16px;color:var(--text-muted);font-size:13px;">No meetings yet. Create your first Weekly Meeting!</div>';
    return;
  }
  list.innerHTML = meetings.map(m => `
    <div class="meeting-list-item ${_currentMeeting && _currentMeeting.id === m.id ? 'active' : ''}" data-meeting-id="${m.id}">
      <div class="meeting-list-date">${formatDate(m.meeting_date)}</div>
      <div class="meeting-list-meta">
        ${m.quarter ? escHtml(m.quarter) + ' · ' : ''}
        ${statusBadge(m.status)}
        ${m.rating ? ' · <strong>' + m.rating + '/10</strong>' : ''}
      </div>
    </div>
  `).join('');
  list.querySelectorAll('.meeting-list-item').forEach(item => {
    item.addEventListener('click', () => loadMeetingDetail(parseInt(item.dataset.meetingId)));
  });
}

async function loadMeetingDetail(id) {
  try {
    const meeting = await get('/meetings/' + id);
    _currentMeeting = meeting;
    renderMeetingsList(_meetings);
    renderMeetingDetail(meeting);
  } catch(e) { showToast('Failed to load meeting: ' + e.message, 'error'); }
}

function renderMeetingDetail(meeting) {
  document.getElementById('meeting-detail-empty').style.display = 'none';
  const detail = document.getElementById('meeting-detail-content');
  detail.style.display = '';

  // Load rocks and scorecard data for meeting context
  const currentQuarter = meeting.quarter || document.getElementById('quarter-select').value;

  // Stop any previous meeting timer
  if (_meetingInterval) { clearInterval(_meetingInterval); _meetingInterval = null; }
  _meetingStartTime = null;

  detail.innerHTML = `
    <div class="meeting-detail-header">
      <div class="meeting-detail-title">Weekly Meeting — ${formatDate(meeting.meeting_date)}</div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <select class="meeting-status-select" id="meeting-status-sel">
          <option value="scheduled" ${meeting.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
          <option value="in_progress" ${meeting.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
          <option value="completed" ${meeting.status === 'completed' ? 'selected' : ''}>Completed</option>
        </select>
        ${meeting.quarter ? `<span class="badge badge-open">${escHtml(meeting.quarter)}</span>` : ''}
        <button class="btn btn-sm" id="meeting-timer-btn" style="background:#f0f4f8;border:1px solid var(--border);color:var(--primary);font-weight:600;min-width:120px;">▶ Start Meeting</button>
        <span id="meeting-elapsed" style="font-size:13px;font-weight:700;color:var(--primary);display:none;font-variant-numeric:tabular-nums;"></span>
      </div>
    </div>
    <div class="agenda-accordion" id="agenda-accordion">
      ${renderAgendaSection(1, 'Segue', '5 min', renderSegueContent(meeting))}
      ${renderAgendaSection(2, 'Scorecard Review', '5 min', renderScorecardReviewContent())}
      ${renderAgendaSection(3, 'Rock Review', '5 min', renderRockReviewContent(currentQuarter))}
      ${renderAgendaSection(4, 'Customer & Employee Headlines', '5 min', renderHeadlinesContent(meeting))}
      ${renderAgendaSection(5, 'To-Do List Review', '5 min', renderTodosContent(meeting))}
      ${renderAgendaSection(6, 'IDS — Identify, Discuss, Solve', '60 min', renderIDSContent(meeting))}
      ${renderAgendaSection(7, 'Conclude', '5 min', renderConcludeContent(meeting))}
    </div>
  `;

  // Status change
  detail.querySelector('#meeting-status-sel').addEventListener('change', async (e) => {
    try {
      await put('/meetings/' + meeting.id, { ...meeting, status: e.target.value });
      _currentMeeting.status = e.target.value;
      renderMeetingsList(_meetings.map(m => m.id === meeting.id ? { ...m, status: e.target.value } : m));
      showToast('Status updated', 'success');
    } catch(err) { showToast('Update failed: ' + err.message, 'error'); }
  });

  // Meeting elapsed timer
  const timerBtn = detail.querySelector('#meeting-timer-btn');
  const elapsedEl = detail.querySelector('#meeting-elapsed');
  if (timerBtn) {
    timerBtn.addEventListener('click', async () => {
      if (!_meetingStartTime) {
        _meetingStartTime = Date.now();
        elapsedEl.style.display = '';
        timerBtn.textContent = '⏹ End Meeting';
        timerBtn.style.background = '#fff0f0';
        timerBtn.style.color = 'var(--danger)';
        _meetingInterval = setInterval(() => {
          const sec = Math.floor((Date.now() - _meetingStartTime) / 1000);
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = sec % 60;
          elapsedEl.textContent = (h ? h + ':' : '') + String(m).padStart(h ? 2 : 1, '0') + ':' + String(s).padStart(2, '0');
        }, 1000);
        try {
          await put('/meetings/' + meeting.id, { ...meeting, status: 'in_progress' });
          _currentMeeting.status = 'in_progress';
          detail.querySelector('#meeting-status-sel').value = 'in_progress';
          renderMeetingsList(_meetings.map(m => m.id === meeting.id ? { ...m, status: 'in_progress' } : m));
        } catch(err) {}
      } else {
        clearInterval(_meetingInterval); _meetingInterval = null; _meetingStartTime = null;
        timerBtn.textContent = '▶ Start Meeting';
        timerBtn.style.background = '#f0f4f8';
        timerBtn.style.color = 'var(--primary)';
        elapsedEl.style.display = 'none';
        Object.keys(_sectionIntervals).forEach(k => stopSectionTimer(parseInt(k)));
        try {
          await put('/meetings/' + meeting.id, { ...meeting, status: 'completed' });
          _currentMeeting.status = 'completed';
          detail.querySelector('#meeting-status-sel').value = 'completed';
          renderMeetingsList(_meetings.map(m => m.id === meeting.id ? { ...m, status: 'completed' } : m));
        } catch(err) {}
      }
    });
  }

  // Accordion toggles
  detail.querySelectorAll('.agenda-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling;
      const isOpen = content.classList.contains('open');
      btn.classList.toggle('open', !isOpen);
      content.classList.toggle('open', !isOpen);
      // Timer
      const secNum = parseInt(btn.dataset.secnum);
      if (!isOpen) startSectionTimer(secNum);
      else stopSectionTimer(secNum);
    });
  });

  // Open first section by default
  const firstToggle = detail.querySelector('.agenda-toggle');
  if (firstToggle) { firstToggle.click(); }

  // Wire up scorecard and rocks async
  loadScorecardReviewInMeeting(meeting.quarter);
  loadRockReviewInMeeting(currentQuarter);
  wireHeadlineForm(meeting);
  wireTodoForm(meeting);
  wireIDSSection(meeting);
  wireRatingButtons(meeting);
  wireMeetingNotes(meeting);
}

function renderAgendaSection(num, title, time, contentHtml) {
  return `
    <div class="agenda-section">
      <button class="agenda-toggle" data-secnum="${num}">
        <div class="agenda-num">${num}</div>
        <div class="agenda-title">${title}</div>
        <span class="agenda-time">${time}</span>
        <span class="agenda-arrow">▼</span>
      </button>
      <div class="agenda-content">
        <div class="section-timer" id="timer-${num}">
          <div class="timer-dot"></div>
          <span id="timer-display-${num}">0:00</span>
          <span style="color:var(--text-light);margin:0 4px;">|</span>
          <span style="font-size:11px;">${time} target</span>
        </div>
        ${contentHtml}
      </div>
    </div>
  `;
}

function startSectionTimer(num) {
  stopSectionTimer(num);
  if (!_sectionTimers[num]) _sectionTimers[num] = Date.now();
  const dot = document.querySelector(`#timer-${num} .timer-dot`);
  if (dot) dot.classList.add('running');
  _sectionIntervals[num] = setInterval(() => {
    const elapsed = Math.floor((Date.now() - _sectionTimers[num]) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    const display = document.getElementById(`timer-display-${num}`);
    if (display) display.textContent = `${m}:${s.toString().padStart(2, '0')}`;
  }, 1000);
}

function stopSectionTimer(num) {
  if (_sectionIntervals[num]) { clearInterval(_sectionIntervals[num]); delete _sectionIntervals[num]; }
  const dot = document.querySelector(`#timer-${num} .timer-dot`);
  if (dot) dot.classList.remove('running');
}

function renderSegueContent(meeting) {
  const headlines = meeting.headlines ? meeting.headlines.filter(h => h.type === 'good_news') : [];
  return `
    <p style="font-size:13.5px;color:var(--text-muted);margin-bottom:12px;">Share a personal or professional good news. Sets the positive tone for the meeting.</p>
    <div id="segue-headlines">
      ${headlines.length ? `<ul class="headline-list">${headlines.map(h => `
        <li class="headline-item">
          <span class="badge badge-good-news">Good News</span>
          <span>${escHtml(h.description)}</span>
          <button class="headline-delete" data-headline-id="${h.id}">✕</button>
        </li>`).join('')}</ul>` : '<p class="text-muted" style="font-size:13px;margin-bottom:10px;">No good news shared yet.</p>'}
    </div>
    <div class="add-headline-form" id="segue-add-form">
      <input type="text" class="field-input" id="segue-headline-input" placeholder="Share good news..." />
      <button class="btn btn-primary btn-sm" id="segue-headline-btn">Add</button>
    </div>
  `;
}

function renderScorecardReviewContent() {
  return `<div id="meeting-scorecard-summary"><p class="text-muted" style="font-size:13px;">Loading scorecard...</p></div>`;
}

function renderRockReviewContent(quarter) {
  return `<div id="meeting-rocks-summary"><p class="text-muted" style="font-size:13px;">Loading rocks...</p></div>`;
}

function renderHeadlinesContent(meeting) {
  const headlines = meeting.headlines ? meeting.headlines.filter(h => h.type !== 'good_news') : [];
  return `
    <p style="font-size:13.5px;color:var(--text-muted);margin-bottom:12px;">Share customer or employee news/updates from the past week.</p>
    <div id="meeting-headlines-list">
      ${renderHeadlinesList(headlines)}
    </div>
    <div class="add-headline-form" id="headline-add-form">
      <select class="field-select" id="headline-type" style="width:140px;">
        <option value="customer">Customer</option>
        <option value="employee">Employee</option>
      </select>
      <input type="text" class="field-input" id="headline-input" placeholder="Headline..." />
      <button class="btn btn-primary btn-sm" id="headline-add-btn">Add</button>
    </div>
  `;
}

function renderHeadlinesList(headlines) {
  if (!headlines.length) return '<p class="text-muted" style="font-size:13px;margin-bottom:10px;">No headlines yet.</p>';
  return `<ul class="headline-list">${headlines.map(h => `
    <li class="headline-item">
      <span class="badge ${h.type === 'customer' ? 'badge-customer' : 'badge-employee'}">${escHtml(h.type)}</span>
      <span>${escHtml(h.description)}</span>
      <button class="headline-delete" data-headline-id="${h.id}">✕</button>
    </li>`).join('')}</ul>`;
}

function renderTodosContent(meeting) {
  const todos = meeting.todos || [];
  const done = todos.filter(t => t.status === 'done').length;
  return `
    <p style="font-size:13.5px;color:var(--text-muted);margin-bottom:12px;">Review last week's to-dos. ${todos.length ? `<strong>${done}/${todos.length}</strong> complete.` : 'Add action items with owners and due dates.'}</p>
    <div id="meeting-todos-list">
      ${renderTodosList(todos)}
    </div>
    <div class="add-todo-form" id="todo-add-form">
      <input type="text" class="field-input" id="todo-input" placeholder="New to-do..." />
      <input type="text" class="field-input" id="todo-owner-input" placeholder="Owner" style="max-width:120px;" />
      <input type="date" class="field-input" id="todo-due-input" style="max-width:145px;" />
      <button class="btn btn-primary btn-sm" id="todo-add-btn">Add</button>
    </div>
  `;
}

function renderTodosList(todos) {
  if (!todos.length) return '<p class="text-muted" style="font-size:13px;margin-bottom:10px;">No to-dos yet. Add action items here.</p>';
  return `<ul class="todo-list">${todos.map(t => `
    <li class="todo-item" data-todo-id="${t.id}">
      <input type="checkbox" class="todo-check" ${t.status === 'done' ? 'checked' : ''} data-todo-id="${t.id}" />
      <span class="todo-desc ${t.status === 'done' ? 'done' : ''}">${escHtml(t.description)}</span>
      ${t.owner ? `<span class="todo-owner-badge">${escHtml(t.owner)}</span>` : ''}
      ${t.due_date ? `<span class="todo-due">${formatDate(t.due_date)}</span>` : ''}
      <button class="todo-delete" data-todo-id="${t.id}" title="Delete to-do">✕</button>
    </li>`).join('')}</ul>`;
}

function renderIDSContent(meeting) {
  const issues = meeting.issues || [];
  return `
    <p style="font-size:13.5px;color:var(--text-muted);margin-bottom:12px;">Identify, Discuss, Solve. Pull open issues from your Issues list into this meeting to work through them together.</p>
    <div id="meeting-ids-linked">
      ${renderIDSLinkedIssues(issues)}
    </div>
    <div style="margin-top:12px;">
      <button class="btn btn-sm" id="ids-pull-btn" style="background:#f0f4f8;border:1px solid var(--border);color:var(--primary);font-weight:600;">+ Pull Issue from List</button>
    </div>
    <div id="ids-issues-picker" style="display:none;margin-top:10px;border:1px solid var(--border);border-radius:var(--radius);padding:12px;background:#f8f9fa;max-height:260px;overflow-y:auto;">
      <div id="ids-issues-picker-list"><p class="text-muted" style="font-size:13px;">Loading issues...</p></div>
    </div>
  `;
}

function renderIDSLinkedIssues(issues) {
  if (!issues.length) return '<p class="text-muted" style="font-size:13px;margin-bottom:8px;">No issues linked to this meeting yet.</p>';
  return `<div style="display:flex;flex-direction:column;gap:6px;">${issues.map(i => `
    <div class="ids-linked-item" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:6px;background:#fff;border:1px solid var(--border);">
      ${priorityBadge(i.priority)}
      <span style="flex:1;font-size:13.5px;">${escHtml(i.description)}</span>
      ${i.owner ? `<span style="font-size:12px;color:var(--text-muted);">${escHtml(i.owner)}</span>` : ''}
      <select class="ids-status-select" data-issue-id="${i.id}" style="font-size:12px;padding:3px 6px;border:1px solid var(--border);border-radius:4px;background:#fff;cursor:pointer;">
        <option value="open" ${i.status === 'open' ? 'selected' : ''}>Open</option>
        <option value="ids_in_progress" ${i.status === 'ids_in_progress' ? 'selected' : ''}>In IDS</option>
        <option value="resolved" ${i.status === 'resolved' ? 'selected' : ''}>Resolved ✓</option>
      </select>
      <button class="ids-unlink-btn" data-issue-id="${i.id}" style="background:none;border:none;color:var(--text-light);cursor:pointer;font-size:14px;padding:2px 4px;line-height:1;" title="Return to Issues list">✕</button>
    </div>`).join('')}</div>`;
}

function renderConcludeContent(meeting) {
  return `
    <div class="meeting-rating">
      <span class="rating-label">Rate this meeting (1–10):</span>
      <div class="rating-stars" id="rating-stars">
        ${[1,2,3,4,5,6,7,8,9,10].map(n => `
          <button class="rating-btn ${meeting.rating === n ? 'selected' : ''}" data-rating="${n}">${n}</button>
        `).join('')}
      </div>
      <span id="rating-display" style="font-size:15px;font-weight:700;color:var(--primary);">${meeting.rating ? meeting.rating + '/10' : ''}</span>
    </div>
    <div class="meeting-notes-area mt-16">
      <label class="field-label">Cascading Messages / Next Steps</label>
      <textarea class="field-input" id="meeting-notes-input" rows="4" placeholder="What needs to be communicated to the team? Any next steps?">${escHtml(meeting.notes || '')}</textarea>
    </div>
  `;
}

async function loadScorecardReviewInMeeting(quarter) {
  const el = document.getElementById('meeting-scorecard-summary');
  if (!el) return;
  try {
    const data = await get('/scorecard');
    if (!data.metrics.length) {
      el.innerHTML = '<p class="text-muted" style="font-size:13px;">No scorecard metrics found.</p>';
      return;
    }
    const lastWeekIdx = data.weeks.length - 1;
    const rows = data.metrics.map(m => {
      const last = m.entries[lastWeekIdx];
      const val = last && last.value !== null ? formatValue(last.value, m.measurement_type) : '—';
      const status = last && last.on_track === 1 ? 'cell-green' : (last && last.on_track === 0 ? 'cell-red' : 'cell-empty');
      return `<tr>
        <td style="padding:8px 12px;font-weight:600;">${escHtml(m.name)}</td>
        <td style="padding:8px 12px;color:var(--text-muted);">${escHtml(m.owner || '—')}</td>
        <td style="padding:8px 12px;color:var(--text-muted);">${escHtml(m.goal || '—')}</td>
        <td style="padding:8px 12px;"><div class="scorecard-cell ${status}" style="cursor:default;">${val}</div></td>
      </tr>`;
    }).join('');
    el.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="background:#f0f4f8;">
        <th style="padding:8px 12px;text-align:left;color:var(--primary);">Metric</th>
        <th style="padding:8px 12px;text-align:left;color:var(--primary);">Owner</th>
        <th style="padding:8px 12px;text-align:left;color:var(--primary);">Goal</th>
        <th style="padding:8px 12px;text-align:left;color:var(--primary);">Last Week</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  } catch(e) {
    el.innerHTML = '<p class="text-muted" style="font-size:13px;">Could not load scorecard.</p>';
  }
}

async function loadRockReviewInMeeting(quarter) {
  const el = document.getElementById('meeting-rocks-summary');
  if (!el) return;
  try {
    const rocks = await get('/rocks?quarter=' + encodeURIComponent(quarter || 'Q2 2026'));
    if (!rocks.length) {
      el.innerHTML = `<p class="text-muted" style="font-size:13px;">No priorities for ${escHtml(quarter || '')}.</p>`;
      return;
    }
    el.innerHTML = `<div style="display:flex;flex-direction:column;gap:7px;">${rocks.map(r => `
      <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f0f0f0;">
        ${rockIcon(r.status)}
        <span style="flex:1;font-size:13.5px;font-weight:600;">${escHtml(r.description)}</span>
        <span style="font-size:12px;color:var(--text-muted);">${escHtml(r.owner || '—')}</span>
        ${statusBadge(r.status)}
      </div>`).join('')}</div>`;
  } catch(e) {
    el.innerHTML = '<p class="text-muted" style="font-size:13px;">Could not load rocks.</p>';
  }
}

function wireHeadlineForm(meeting) {
  const detail = document.getElementById('meeting-detail-content');

  // Segue good news
  const segueBtn = detail.querySelector('#segue-headline-btn');
  if (segueBtn) {
    segueBtn.addEventListener('click', async () => {
      const input = detail.querySelector('#segue-headline-input');
      const text = input.value.trim();
      if (!text) return;
      try {
        const h = await post('/meetings/' + meeting.id + '/headlines', { type: 'good_news', description: text });
        input.value = '';
        if (!_currentMeeting.headlines) _currentMeeting.headlines = [];
        _currentMeeting.headlines.push(h);
        refreshSegueHeadlines(_currentMeeting.headlines.filter(x => x.type === 'good_news'));
        showToast('Added', 'success');
      } catch(e) { showToast('Failed: ' + e.message, 'error'); }
    });
  }

  // Headlines section
  const headlineBtn = detail.querySelector('#headline-add-btn');
  if (headlineBtn) {
    headlineBtn.addEventListener('click', async () => {
      const input = detail.querySelector('#headline-input');
      const typeSel = detail.querySelector('#headline-type');
      const text = input.value.trim();
      if (!text) return;
      try {
        const h = await post('/meetings/' + meeting.id + '/headlines', { type: typeSel.value, description: text });
        input.value = '';
        if (!_currentMeeting.headlines) _currentMeeting.headlines = [];
        _currentMeeting.headlines.push(h);
        const listEl = detail.querySelector('#meeting-headlines-list');
        if (listEl) listEl.innerHTML = renderHeadlinesList(_currentMeeting.headlines.filter(x => x.type !== 'good_news'));
        wireHeadlineDeletes(meeting);
        showToast('Added', 'success');
      } catch(e) { showToast('Failed: ' + e.message, 'error'); }
    });
  }

  wireHeadlineDeletes(meeting);
}

function refreshSegueHeadlines(headlines) {
  const el = document.getElementById('segue-headlines');
  if (!el) return;
  el.innerHTML = headlines.length ? `<ul class="headline-list">${headlines.map(h => `
    <li class="headline-item">
      <span class="badge badge-good-news">Good News</span>
      <span>${escHtml(h.description)}</span>
      <button class="headline-delete" data-headline-id="${h.id}">✕</button>
    </li>`).join('')}</ul>` : '<p class="text-muted" style="font-size:13px;margin-bottom:10px;">No good news shared yet.</p>';
  wireHeadlineDeletes(_currentMeeting);
}

function wireHeadlineDeletes(meeting) {
  document.querySelectorAll('.headline-delete').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
  document.querySelectorAll('.headline-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.headlineId);
      try {
        await del('/meetings/headlines/' + id);
        _currentMeeting.headlines = (_currentMeeting.headlines || []).filter(h => h.id !== id);
        const goodNews = _currentMeeting.headlines.filter(h => h.type === 'good_news');
        const others = _currentMeeting.headlines.filter(h => h.type !== 'good_news');
        refreshSegueHeadlines(goodNews);
        const listEl = document.querySelector('#meeting-headlines-list');
        if (listEl) listEl.innerHTML = renderHeadlinesList(others);
        wireHeadlineDeletes(meeting);
        showToast('Removed', 'success');
      } catch(e) { showToast('Delete failed: ' + e.message, 'error'); }
    });
  });
}

function wireTodoForm(meeting) {
  const detail = document.getElementById('meeting-detail-content');
  const addBtn = detail.querySelector('#todo-add-btn');
  if (!addBtn) return;
  addBtn.addEventListener('click', async () => {
    const input = detail.querySelector('#todo-input');
    const ownerInput = detail.querySelector('#todo-owner-input');
    const dueInput = detail.querySelector('#todo-due-input');
    const text = input.value.trim();
    if (!text) return;
    try {
      const todo = await post('/meetings/' + meeting.id + '/todos', {
        description: text,
        owner: ownerInput.value.trim() || null,
        due_date: dueInput.value || null
      });
      input.value = '';
      ownerInput.value = '';
      dueInput.value = '';
      if (!_currentMeeting.todos) _currentMeeting.todos = [];
      _currentMeeting.todos.push(todo);
      const listEl = detail.querySelector('#meeting-todos-list');
      if (listEl) listEl.innerHTML = renderTodosList(_currentMeeting.todos);
      wireTodoChecks(meeting);
      wireTodoDeletes(meeting);
      showToast('To-do added', 'success');
    } catch(e) { showToast('Failed: ' + e.message, 'error'); }
  });
  wireTodoChecks(meeting);
  wireTodoDeletes(meeting);
}

function wireTodoChecks(meeting) {
  document.querySelectorAll('.todo-check').forEach(chk => {
    chk.replaceWith(chk.cloneNode(true));
  });
  document.querySelectorAll('.todo-check').forEach(chk => {
    chk.addEventListener('change', async () => {
      const id = parseInt(chk.dataset.todoId);
      const status = chk.checked ? 'done' : 'pending';
      try {
        await put('/meetings/todos/' + id, {
          description: chk.closest('.todo-item').querySelector('.todo-desc').textContent,
          status
        });
        const descEl = chk.closest('.todo-item').querySelector('.todo-desc');
        if (descEl) descEl.classList.toggle('done', chk.checked);
        const todoInMeeting = (_currentMeeting.todos || []).find(t => t.id === id);
        if (todoInMeeting) todoInMeeting.status = status;
        showToast(chk.checked ? 'Marked done' : 'Marked pending', 'success');
      } catch(e) { showToast('Update failed: ' + e.message, 'error'); chk.checked = !chk.checked; }
    });
  });
}

function wireTodoDeletes(meeting) {
  document.querySelectorAll('.todo-delete').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
  document.querySelectorAll('.todo-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.todoId);
      try {
        await del('/meetings/todos/' + id);
        _currentMeeting.todos = (_currentMeeting.todos || []).filter(t => t.id !== id);
        const listEl = document.querySelector('#meeting-todos-list');
        if (listEl) listEl.innerHTML = renderTodosList(_currentMeeting.todos);
        wireTodoChecks(meeting);
        wireTodoDeletes(meeting);
        showToast('To-do deleted', 'success');
      } catch(e) { showToast('Delete failed: ' + e.message, 'error'); }
    });
  });
}

function wireIDSSection(meeting) {
  wireIDSStatusChanges(meeting);
  wireIDSUnlinks(meeting);

  const pullBtn = document.getElementById('ids-pull-btn');
  if (!pullBtn) return;
  const picker = document.getElementById('ids-issues-picker');

  pullBtn.addEventListener('click', async () => {
    if (picker.style.display === 'none') {
      picker.style.display = '';
      const listEl = document.getElementById('ids-issues-picker-list');
      listEl.innerHTML = '<p class="text-muted" style="font-size:13px;">Loading...</p>';
      try {
        const allIssues = await get('/issues?status=open');
        const linkedIds = new Set((_currentMeeting.issues || []).map(i => i.id));
        const available = allIssues.filter(i => !linkedIds.has(i.id));
        if (!available.length) {
          listEl.innerHTML = '<p class="text-muted" style="font-size:13px;">No open issues to link.</p>';
        } else {
          listEl.innerHTML = `<div style="display:flex;flex-direction:column;gap:4px;">${available.map(i => `
            <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #eee;">
              ${priorityBadge(i.priority)}
              <span style="flex:1;font-size:13px;">${escHtml(i.description)}</span>
              <span style="font-size:12px;color:var(--text-muted);margin-right:4px;">${escHtml(i.owner || '')}</span>
              <button class="btn btn-primary btn-sm ids-link-btn" data-issue-id="${i.id}">Link</button>
            </div>`).join('')}</div>`;
          listEl.querySelectorAll('.ids-link-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
              const issueId = parseInt(btn.dataset.issueId);
              const issue = available.find(i => i.id === issueId);
              if (!issue) return;
              try {
                await put('/issues/' + issueId, { ...issue, meeting_id: meeting.id, status: 'ids_in_progress' });
                issue.meeting_id = meeting.id;
                issue.status = 'ids_in_progress';
                if (!_currentMeeting.issues) _currentMeeting.issues = [];
                _currentMeeting.issues.push(issue);
                const linkedEl = document.getElementById('meeting-ids-linked');
                if (linkedEl) linkedEl.innerHTML = renderIDSLinkedIssues(_currentMeeting.issues);
                wireIDSStatusChanges(meeting);
                wireIDSUnlinks(meeting);
                btn.closest('div[style]').remove();
                showToast('Issue linked to meeting', 'success');
              } catch(e) { showToast('Failed: ' + e.message, 'error'); }
            });
          });
        }
      } catch(e) {
        listEl.innerHTML = '<p class="text-muted" style="font-size:13px;">Could not load issues.</p>';
      }
    } else {
      picker.style.display = 'none';
    }
  });
}

function wireIDSStatusChanges(meeting) {
  document.querySelectorAll('.ids-status-select').forEach(sel => {
    sel.replaceWith(sel.cloneNode(true));
  });
  document.querySelectorAll('.ids-status-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const issueId = parseInt(sel.dataset.issueId);
      const issue = (_currentMeeting.issues || []).find(i => i.id === issueId);
      if (!issue) return;
      try {
        await put('/issues/' + issueId, { ...issue, status: sel.value });
        issue.status = sel.value;
        showToast('Status updated', 'success');
      } catch(e) { showToast('Update failed', 'error'); sel.value = issue.status; }
    });
  });
}

function wireIDSUnlinks(meeting) {
  document.querySelectorAll('.ids-unlink-btn').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
  document.querySelectorAll('.ids-unlink-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const issueId = parseInt(btn.dataset.issueId);
      const issue = (_currentMeeting.issues || []).find(i => i.id === issueId);
      if (!issue) return;
      try {
        await put('/issues/' + issueId, { ...issue, meeting_id: null, status: 'open' });
        _currentMeeting.issues = (_currentMeeting.issues || []).filter(i => i.id !== issueId);
        const linkedEl = document.getElementById('meeting-ids-linked');
        if (linkedEl) linkedEl.innerHTML = renderIDSLinkedIssues(_currentMeeting.issues);
        wireIDSStatusChanges(meeting);
        wireIDSUnlinks(meeting);
        showToast('Issue returned to Issues list', 'success');
      } catch(e) { showToast('Unlink failed', 'error'); }
    });
  });
}

function wireRatingButtons(meeting) {
  const starsEl = document.getElementById('rating-stars');
  if (!starsEl) return;
  starsEl.querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const rating = parseFloat(btn.dataset.rating);
      try {
        await put('/meetings/' + meeting.id, { ...meeting, rating });
        _currentMeeting.rating = rating;
        starsEl.querySelectorAll('.rating-btn').forEach(b => b.classList.toggle('selected', parseFloat(b.dataset.rating) === rating));
        const disp = document.getElementById('rating-display');
        if (disp) disp.textContent = rating + '/10';
        _meetings = _meetings.map(m => m.id === meeting.id ? { ...m, rating } : m);
        renderMeetingsList(_meetings);
        showToast('Rating saved: ' + rating + '/10', 'success');
      } catch(e) { showToast('Save failed: ' + e.message, 'error'); }
    });
  });
}

function wireMeetingNotes(meeting) {
  const notesEl = document.getElementById('meeting-notes-input');
  if (!notesEl) return;
  let saveDebounce;
  notesEl.addEventListener('input', () => {
    clearTimeout(saveDebounce);
    saveDebounce = setTimeout(async () => {
      try {
        await put('/meetings/' + meeting.id, { ...meeting, notes: notesEl.value });
        _currentMeeting.notes = notesEl.value;
        showToast('Notes saved', 'success');
      } catch(e) {}
    }, 1200);
  });
}

// New Meeting Modal
document.getElementById('new-meeting-btn').addEventListener('click', () => {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('meeting-date').value = today;
  document.getElementById('meeting-modal').classList.remove('hidden');
});

document.getElementById('meeting-modal-close').addEventListener('click', () => document.getElementById('meeting-modal').classList.add('hidden'));
document.getElementById('meeting-modal-cancel').addEventListener('click', () => document.getElementById('meeting-modal').classList.add('hidden'));

document.getElementById('meeting-modal-save').addEventListener('click', async () => {
  const dateVal = document.getElementById('meeting-date').value;
  const quarter = document.getElementById('meeting-quarter').value;
  if (!dateVal) { showToast('Meeting date is required', 'error'); return; }
  try {
    const meeting = await post('/meetings', { meeting_date: dateVal, quarter, status: 'scheduled' });
    showToast('Meeting created', 'success');
    document.getElementById('meeting-modal').classList.add('hidden');
    _meetings.unshift(meeting);
    renderMeetingsList(_meetings);
    await loadMeetingDetail(meeting.id);
  } catch(e) { showToast('Failed: ' + e.message, 'error'); }
});

// ─── Issues Panel ─────────────────────────────────────────────────────────────

let _issues = [];

async function loadIssues() {
  const ownerFilter = document.getElementById('issues-owner-filter').value;
  try {
    let url = '/issues';
    if (ownerFilter) url += '?owner=' + encodeURIComponent(ownerFilter);
    _issues = await get(url);
    renderIssuesBoard(_issues);
  } catch(e) { showToast('Failed to load issues: ' + e.message, 'error'); }
}

document.getElementById('issues-owner-filter').addEventListener('change', loadIssues);

function renderIssuesBoard(issues) {
  const open     = issues.filter(i => i.status === 'open');
  const inIds    = issues.filter(i => i.status === 'ids_in_progress');
  const resolved = issues.filter(i => i.status === 'resolved');

  document.getElementById('count-open').textContent     = open.length;
  document.getElementById('count-ids').textContent      = inIds.length;
  document.getElementById('count-resolved').textContent = resolved.length;

  renderIssueCards('cards-open', open);
  renderIssueCards('cards-ids', inIds);
  renderIssueCards('cards-resolved', resolved);
}

function renderIssueCards(containerId, issues) {
  const container = document.getElementById(containerId);
  if (!issues.length) {
    container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-light);font-size:13px;">No issues</div>';
    return;
  }
  container.innerHTML = issues.map(issue => `
    <div class="issue-card priority-${issue.priority}" data-issue-id="${issue.id}">
      <div class="issue-card-desc">${escHtml(issue.description)}</div>
      <div class="issue-card-meta">
        ${priorityBadge(issue.priority)}
        ${issue.owner ? `<span class="issue-card-owner">${escHtml(issue.owner)}</span>` : ''}
        ${issue.solution ? `<span class="badge badge-resolved" style="font-size:10px;">Solved</span>` : ''}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.issue-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.issueId);
      const issue = _issues.find(i => i.id === id);
      if (issue) openIssueModal(issue);
    });
  });
}

document.getElementById('add-issue-btn').addEventListener('click', () => openIssueModal(null));

function openIssueModal(issue) {
  const isNew = !issue;
  document.getElementById('issue-modal-title').textContent = isNew ? 'Add Issue' : 'Edit Issue';
  document.getElementById('issue-id').value = isNew ? '' : issue.id;
  document.getElementById('issue-description').value = isNew ? '' : (issue.description || '');
  document.getElementById('issue-owner').value = isNew ? '' : (issue.owner || '');
  document.getElementById('issue-priority').value = isNew ? 'medium' : (issue.priority || 'medium');
  document.getElementById('issue-status').value = isNew ? 'open' : (issue.status || 'open');
  document.getElementById('issue-solution').value = isNew ? '' : (issue.solution || '');

  const statusSel = document.getElementById('issue-status');
  const solutionGroup = document.getElementById('issue-solution-group');
  solutionGroup.style.display = statusSel.value === 'resolved' ? '' : 'none';

  statusSel.addEventListener('change', () => {
    solutionGroup.style.display = statusSel.value === 'resolved' ? '' : 'none';
  });

  document.getElementById('issue-modal-delete').classList.toggle('hidden', isNew);
  document.getElementById('issue-modal').classList.remove('hidden');
}

function closeIssueModal() { document.getElementById('issue-modal').classList.add('hidden'); }
document.getElementById('issue-modal-close').addEventListener('click', closeIssueModal);
document.getElementById('issue-modal-cancel').addEventListener('click', closeIssueModal);

document.getElementById('issue-modal-save').addEventListener('click', async () => {
  const id = document.getElementById('issue-id').value;
  const description = document.getElementById('issue-description').value.trim();
  const owner = document.getElementById('issue-owner').value.trim();
  const priority = document.getElementById('issue-priority').value;
  const status = document.getElementById('issue-status').value;
  const solution = document.getElementById('issue-solution').value.trim();

  if (!description) { showToast('Issue description is required', 'error'); return; }
  if (status === 'resolved' && !solution) { showToast('A solution is required to resolve an issue', 'error'); return; }

  try {
    if (id) {
      await put(`/issues/${id}`, { description, owner, priority, status, solution });
      showToast('Issue updated', 'success');
    } else {
      await post('/issues', { description, owner, priority, status, solution });
      showToast('Issue created', 'success');
    }
    closeIssueModal();
    await loadIssues();
  } catch(e) { showToast('Save failed: ' + e.message, 'error'); }
});

document.getElementById('issue-modal-delete').addEventListener('click', async () => {
  const id = document.getElementById('issue-id').value;
  if (!id) return;
  if (!confirm('Delete this issue?')) return;
  try {
    await del(`/issues/${id}`);
    showToast('Issue deleted', 'success');
    closeIssueModal();
    await loadIssues();
  } catch(e) { showToast('Delete failed: ' + e.message, 'error'); }
});

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.add('hidden');
      closeCellPopover();
    }
  });
});

// Escape key closes modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
    closeCellPopover();
  }
});

// ─── Team Alignment ────────────────────────────────────────────────────────────

let _alignment = { members: [], core_values: [], values_ratings: [], gwc_ratings: [], seats: [] };

const RATING_CYCLE = ['none','plus','plus_minus','minus'];
const RATING_HTML  = { none: '·', plus: '✓', plus_minus: '±', minus: '✗' };
const RATING_CLASS = { none: 'rating-none', plus: 'rating-plus', plus_minus: 'rating-pm', minus: 'rating-minus' };

async function loadAlignment() {
  try {
    _alignment = await get('/alignment');
    renderAlignment();
  } catch(e) { showToast('Failed to load alignment: ' + e.message, 'error'); }
}

function getRating(memberId, valueKey) {
  const r = _alignment.values_ratings.find(r => r.member_id === memberId && r.value_key === valueKey);
  return r ? r.rating : 'none';
}

function getGWC(memberId) {
  return _alignment.gwc_ratings.find(r => r.member_id === memberId)
    || { get_it: 'none', want_it: 'none', capacity: 'none' };
}

function isRightPerson(memberId) {
  const cv = _alignment.core_values;
  if (!cv.length) return null;
  const ratings = cv.map(v => getRating(memberId, v.key));
  if (ratings.some(r => r === 'none')) return null; // incomplete
  return ratings.every(r => r === 'plus') ? true : false;
}

function isRightSeat(memberId) {
  const g = getGWC(memberId);
  const vals = [g.get_it, g.want_it, g.capacity];
  if (vals.some(v => v === 'none')) return null; // incomplete
  return vals.every(v => v === 'plus') ? true : false;
}

function resultBadge(allPlus, incomplete) {
  if (incomplete) return `<span class="result-badge result-na">— Not rated</span>`;
  if (allPlus)    return `<span class="result-badge result-yes">✓ Yes</span>`;
  // Check if any minus vs all plus_minus
  return `<span class="result-badge result-no">✗ No</span>`;
}

function renderAlignment() {
  const { members, core_values } = _alignment;

  // Show/hide no-values warning
  const noVals = document.getElementById('alignment-no-values');
  noVals.classList.toggle('hidden', core_values.length > 0);

  renderValuesTable(members, core_values);
  renderGWCTable(members);
  renderSummaryGrid(members);
}

// ── Section 1: Values table ───────────────────────────────────────────────────
function renderValuesTable(members, core_values) {
  const headerRow = document.getElementById('values-header-row');
  headerRow.innerHTML = '<th class="col-name">Team Member</th>'
    + core_values.map(v => `<th title="${escHtml(v.label || '')}">${escHtml(v.label || v.key)}</th>`).join('')
    + '<th class="col-result">Right Person?</th>';

  const tbody = document.getElementById('values-body');
  if (!members.length) {
    tbody.innerHTML = '<tr><td colspan="99" style="padding:20px;text-align:center;color:var(--text-muted)">No team members added yet.</td></tr>';
    return;
  }
  tbody.innerHTML = members.map(m => {
    const seat = _alignment.seats.find(s => s.id === m.seat_id);
    const rp   = isRightPerson(m.id);
    const incomplete = rp === null;
    const allPlus = rp === true;
    const cells = core_values.map(v => {
      const rating = getRating(m.id, v.key);
      return `<td><div class="rating-cell ${RATING_CLASS[rating]}"
        data-type="value" data-member="${m.id}" data-key="${v.key}" data-rating="${rating}"
        title="Click to change rating">${RATING_HTML[rating]}</div></td>`;
    }).join('');
    return `<tr>
      <td class="td-name">
        <span class="edit-member-link" data-id="${m.id}" style="cursor:pointer">${escHtml(m.name)}</span>
        ${seat ? `<span class="td-seat-tag">${escHtml(seat.title)}</span>` : ''}
      </td>
      ${cells}
      <td style="padding:8px 14px">${resultBadge(allPlus, incomplete)}</td>
    </tr>`;
  }).join('');

  // Click handlers for value cells
  tbody.querySelectorAll('.rating-cell[data-type="value"]').forEach(cell => {
    cell.addEventListener('click', () => cycleValueRating(cell));
  });
  tbody.querySelectorAll('.edit-member-link').forEach(el => {
    el.addEventListener('click', () => openMemberModal(_alignment.members.find(m => m.id === parseInt(el.dataset.id))));
  });
}

async function cycleValueRating(cell) {
  const memberId = parseInt(cell.dataset.member);
  const key      = cell.dataset.key;
  const current  = cell.dataset.rating;
  const idx      = RATING_CYCLE.indexOf(current);
  const next     = RATING_CYCLE[(idx + 1) % RATING_CYCLE.length];

  // Optimistic update
  cell.dataset.rating = next;
  cell.className = `rating-cell ${RATING_CLASS[next]}`;
  cell.textContent = RATING_HTML[next];

  // Update local state
  const existing = _alignment.values_ratings.find(r => r.member_id === memberId && r.value_key === key);
  if (existing) { existing.rating = next; }
  else { _alignment.values_ratings.push({ member_id: memberId, value_key: key, rating: next }); }

  // Refresh result badge + summary without full re-render
  refreshResultCells();

  try {
    await put(`/alignment/values/${memberId}/${key}`, { rating: next });
  } catch(e) { showToast('Save failed', 'error'); }
}

// ── Section 2: GWC table ──────────────────────────────────────────────────────
function renderGWCTable(members) {
  const tbody = document.getElementById('gwc-body');
  if (!members.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="padding:20px;text-align:center;color:var(--text-muted)">No team members added yet.</td></tr>';
    return;
  }
  tbody.innerHTML = members.map(m => {
    const gwc      = getGWC(m.id);
    const seat     = _alignment.seats.find(s => s.id === m.seat_id);
    const rs       = isRightSeat(m.id);
    const incomplete = rs === null;
    const fields   = ['get_it','want_it','capacity'];
    const cells    = fields.map(f => {
      const rating = gwc[f] || 'none';
      return `<td><div class="rating-cell ${RATING_CLASS[rating]}"
        data-type="gwc" data-member="${m.id}" data-field="${f}" data-rating="${rating}"
        title="Click to change">${RATING_HTML[rating]}</div></td>`;
    }).join('');
    return `<tr>
      <td class="td-name">
        ${escHtml(m.name)}
        ${seat ? `<span class="td-seat-tag">${escHtml(seat.title)}</span>` : ''}
      </td>
      ${cells}
      <td style="padding:8px 14px" class="gwc-result-cell" data-member="${m.id}">${resultBadge(rs===true, incomplete)}</td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.rating-cell[data-type="gwc"]').forEach(cell => {
    cell.addEventListener('click', () => cycleGWCRating(cell));
  });
}

async function cycleGWCRating(cell) {
  const memberId = parseInt(cell.dataset.member);
  const field    = cell.dataset.field;
  const current  = cell.dataset.rating;
  const next     = RATING_CYCLE[(RATING_CYCLE.indexOf(current) + 1) % RATING_CYCLE.length];

  cell.dataset.rating = next;
  cell.className = `rating-cell ${RATING_CLASS[next]}`;
  cell.textContent = RATING_HTML[next];

  let existing = _alignment.gwc_ratings.find(r => r.member_id === memberId);
  if (existing) { existing[field] = next; }
  else { existing = { member_id: memberId, get_it:'none', want_it:'none', capacity:'none' }; existing[field]=next; _alignment.gwc_ratings.push(existing); }

  refreshResultCells();

  try {
    await put(`/alignment/gwc/${memberId}`, { [field]: next });
  } catch(e) { showToast('Save failed', 'error'); }
}

// ── Refresh result badges + summary without full table re-render ──────────────
function refreshResultCells() {
  // Values result column
  document.querySelectorAll('#values-body tr').forEach((row, i) => {
    const m   = _alignment.members[i];
    if (!m) return;
    const rp  = isRightPerson(m.id);
    const td  = row.querySelector('td:last-child');
    if (td) td.innerHTML = resultBadge(rp===true, rp===null);
  });
  // GWC result column
  document.querySelectorAll('.gwc-result-cell').forEach(td => {
    const mid = parseInt(td.dataset.member);
    const rs  = isRightSeat(mid);
    td.innerHTML = resultBadge(rs===true, rs===null);
  });
  // Summary
  renderSummaryGrid(_alignment.members);
}

// ── Section 3: Summary ────────────────────────────────────────────────────────
function renderSummaryGrid(members) {
  const grid = document.getElementById('summary-grid');
  if (!members.length) {
    grid.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:4px">No team members yet.</p>';
    return;
  }
  grid.innerHTML = members.map(m => {
    const rp   = isRightPerson(m.id);
    const rs   = isRightSeat(m.id);
    const seat = _alignment.seats.find(s => s.id === m.seat_id);

    let colorClass, statusText, advice;
    if (rp === null && rs === null) {
      colorClass = 'sc-grey'; statusText = 'Not yet assessed';
      advice = 'Complete both sections above';
    } else if (rp === true && rs === true) {
      colorClass = 'sc-green'; statusText = '✓ Right Person, Right Seat';
      advice = 'Keep, develop & grow';
    } else if (rp === true && rs === false) {
      colorClass = 'sc-yellow'; statusText = '⚠ Right Person, Wrong Seat';
      advice = 'Find them the right seat';
    } else if (rp === false && rs === true) {
      colorClass = 'sc-yellow'; statusText = '⚠ Wrong Person, Right Seat';
      advice = 'Culture/values conversation needed';
    } else if (rp === false && rs === false) {
      colorClass = 'sc-red'; statusText = '✗ Wrong Person, Wrong Seat';
      advice = 'Immediate action required';
    } else {
      colorClass = 'sc-grey'; statusText = 'Partially assessed';
      advice = 'Complete all ratings above';
    }

    const rpTag = rp === true ? '✓ Right Person' : rp === false ? '✗ Values gap' : '· Person TBD';
    const rsTag = rs === true ? '✓ Right Seat'   : rs === false ? '✗ GWC gap'    : '· Seat TBD';

    return `<div class="summary-card ${colorClass}">
      <div class="summary-card-name">${escHtml(m.name)}</div>
      ${seat ? `<div class="summary-card-seat">${escHtml(seat.title)}</div>` : ''}
      <div class="summary-card-status">${statusText}</div>
      <div class="summary-card-tags">
        <span class="summary-tag">${rpTag}</span>
        <span class="summary-tag">${rsTag}</span>
      </div>
      <div style="font-size:11px;opacity:0.75;margin-top:4px">${advice}</div>
    </div>`;
  }).join('');
}

// ── Member modal ──────────────────────────────────────────────────────────────
function openMemberModal(member) {
  const isNew = !member;
  document.getElementById('member-modal-title').textContent = isNew ? 'Add Team Member' : 'Edit Team Member';
  document.getElementById('member-id').value   = isNew ? '' : member.id;
  document.getElementById('member-name').value = isNew ? '' : (member.name || '');

  const seatSel = document.getElementById('member-seat');
  seatSel.innerHTML = '<option value="">No seat assigned</option>';
  _alignment.seats.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.title;
    if (!isNew && member.seat_id === s.id) opt.selected = true;
    seatSel.appendChild(opt);
  });

  document.getElementById('member-modal-delete').classList.toggle('hidden', isNew);
  document.getElementById('member-modal').classList.remove('hidden');
}

function closeMemberModal() {
  document.getElementById('member-modal').classList.add('hidden');
}

document.getElementById('add-member-btn').addEventListener('click', () => openMemberModal(null));
document.getElementById('member-modal-close').addEventListener('click', closeMemberModal);
document.getElementById('member-modal-cancel').addEventListener('click', closeMemberModal);

document.getElementById('member-modal-save').addEventListener('click', async () => {
  const id     = document.getElementById('member-id').value;
  const name   = document.getElementById('member-name').value.trim();
  const seatId = document.getElementById('member-seat').value || null;
  if (!name) { showToast('Name is required', 'error'); return; }
  try {
    if (id) {
      await put(`/alignment/members/${id}`, { name, seat_id: seatId ? parseInt(seatId) : null });
      showToast('Updated', 'success');
    } else {
      await post('/alignment/members', { name, seat_id: seatId ? parseInt(seatId) : null });
      showToast('Team member added', 'success');
    }
    closeMemberModal();
    await loadAlignment();
  } catch(e) { showToast('Save failed: ' + e.message, 'error'); }
});

document.getElementById('member-modal-delete').addEventListener('click', async () => {
  const id = document.getElementById('member-id').value;
  if (!id || !confirm('Remove this team member?')) return;
  try {
    await del(`/alignment/members/${id}`);
    showToast('Removed', 'success');
    closeMemberModal();
    await loadAlignment();
  } catch(e) { showToast('Delete failed: ' + e.message, 'error'); }
});

document.getElementById('go-to-vto-link').addEventListener('click', (e) => {
  e.preventDefault();
  switchTab('vto');
  loadVTO();
});

// ─── AI Strategy Coach ─────────────────────────────────────────────────────────

const aiCoachMessages = []; // {role, content}

function openAICoach() {
  const sidebar = document.getElementById('ai-coach-sidebar');
  sidebar.classList.remove('hidden');
  if (aiCoachMessages.length === 0) {
    appendAIMessage('assistant', "Hi! I'm your AI Strategy Coach. I'm here to help you build out your Vision & Strategy — from core values to your 10-year target.\n\nLet's start simple: **what industry is your business in, and what do you do?**", false);
  }
  setTimeout(() => document.getElementById('ai-coach-input').focus(), 100);
}

function closeAICoach() {
  document.getElementById('ai-coach-sidebar').classList.add('hidden');
}

function appendAIMessage(role, content, trackHistory = true) {
  const messages = document.getElementById('ai-coach-messages');
  const div = document.createElement('div');
  div.className = `ai-msg ai-msg-${role}`;
  const html = escHtml(content)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  div.innerHTML = html;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  if (trackHistory) aiCoachMessages.push({ role, content });
  return div;
}

async function sendAICoachMessage() {
  const input = document.getElementById('ai-coach-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.disabled = true;
  document.getElementById('ai-coach-send').disabled = true;

  appendAIMessage('user', text);

  // Placeholder for streaming response
  const messages = document.getElementById('ai-coach-messages');
  const placeholder = document.createElement('div');
  placeholder.className = 'ai-msg ai-msg-assistant ai-msg-streaming';
  placeholder.innerHTML = '<span class="ai-typing-dot"></span><span class="ai-typing-dot"></span><span class="ai-typing-dot"></span>';
  messages.appendChild(placeholder);
  messages.scrollTop = messages.scrollHeight;

  try {
    const res = await fetch('/api/ai/strategy-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: aiCoachMessages })
    });

    if (!res.ok) throw new Error(await res.text());

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    placeholder.innerHTML = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') break;
        try {
          const { text } = JSON.parse(payload);
          if (text) {
            fullText += text;
            const html = escHtml(fullText)
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/\n/g, '<br>');
            placeholder.innerHTML = html;
            messages.scrollTop = messages.scrollHeight;
          }
        } catch(_) {}
      }
    }

    placeholder.classList.remove('ai-msg-streaming');
    if (fullText) aiCoachMessages.push({ role: 'assistant', content: fullText });
  } catch(err) {
    placeholder.innerHTML = `<em style="color:var(--danger)">Error: ${escHtml(err.message)}</em>`;
  } finally {
    input.disabled = false;
    document.getElementById('ai-coach-send').disabled = false;
    input.focus();
  }
}

document.getElementById('ai-coach-fab').addEventListener('click', openAICoach);
document.getElementById('ai-coach-close').addEventListener('click', closeAICoach);

document.getElementById('ai-coach-send').addEventListener('click', sendAICoachMessage);

document.getElementById('ai-coach-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendAICoachMessage();
  }
});

// ─── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  await initBusinesses();
  switchHub('strategic');
}

init().catch(console.error);
