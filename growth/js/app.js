/* ═══════════════════════════════════════════════════════════════
   app.js — Core utilities, navigation, shared state
   ═══════════════════════════════════════════════════════════════ */

// ── Shared State ─────────────────────────────────────────────────────
window.GH = {
  team: [],
  priorities: [],
  objectives: [],
  campaigns: [],
  plans: [],
  personas: [],
};

// ── API Helper ───────────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  try {
    const r = await fetch('/api' + path, opts);
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: r.statusText }));
      throw new Error(err.error || r.statusText);
    }
    return r.json();
  } catch (err) {
    console.warn('API call failed, using demo data:', path, err);
    // Return demo data when API is not available
    return getDemoData(path);
  }
}

function getDemoData(path) {
  // Demo/fallback data for common API endpoints
  const demos = {
    '/team': [],
    '/campaigns': [],
    '/metrics': [],
    '/quarterly-plans': [],
    '/campaigns-summary': { active: 0 },
    '/personas': [],
  };
  return demos[path] || {};
}

window.api = api;

// ── Toast ─────────────────────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = 'toast'; }, 3200);
}
window.showToast = showToast;

// ── Confirm Dialog ────────────────────────────────────────────────────
function confirmDelete(message, callback) {
  document.getElementById('confirm-message').textContent = message || 'Delete this item?';
  showModal('confirm-modal');
  const btn = document.getElementById('confirm-yes-btn');
  const handler = () => {
    hideModal('confirm-modal');
    callback();
    btn.removeEventListener('click', handler);
  };
  btn.addEventListener('click', handler);
}
window.confirmDelete = confirmDelete;

// ── Modal helpers ─────────────────────────────────────────────────────
function showModal(id) { document.getElementById(id).style.display = 'flex'; }
function hideModal(id) { document.getElementById(id).style.display = 'none'; }
window.showModal = showModal;
window.hideModal = hideModal;

document.addEventListener('click', e => {
  const closeBtn = e.target.closest('[data-close]');
  if (closeBtn) hideModal(closeBtn.dataset.close);
  // Close on backdrop click
  if (e.target.classList.contains('modal-overlay')) hideModal(e.target.id);
});

// ── Navigation ────────────────────────────────────────────────────────
const panels = document.querySelectorAll('.panel');
const tabs   = document.querySelectorAll('.nav-tab');

function activatePanel(name) {
  panels.forEach(p => p.classList.remove('active'));
  tabs.forEach(t => t.classList.remove('active'));
  const panel = document.getElementById(name + '-panel');
  const tab   = document.querySelector(`[data-panel="${name}"]`);
  if (panel) panel.classList.add('active');
  if (tab)   tab.classList.add('active');
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => activatePanel(tab.dataset.panel));
});

// ── Mission Banner ────────────────────────────────────────────────────
document.getElementById('mission-collapse-btn').addEventListener('click', () => {
  document.getElementById('mission-banner').style.display = 'none';
  document.getElementById('mission-banner-collapsed').style.display = '';
});
document.getElementById('mission-expand-btn').addEventListener('click', () => {
  document.getElementById('mission-banner').style.display = '';
  document.getElementById('mission-banner-collapsed').style.display = 'none';
});

async function updateBanner() {
  try {
    const [summary, metrics] = await Promise.all([
      api('GET', '/campaigns-summary'),
      api('GET', '/metrics/latest'),
    ]);
    document.getElementById('banner-campaigns').textContent = summary.active ?? '—';
    document.getElementById('banner-mqls').textContent = metrics.mqls != null ? metrics.mqls : '—';
    document.getElementById('banner-revenue').textContent = metrics.total_revenue_attributed != null
      ? '$' + Number(metrics.total_revenue_attributed).toLocaleString() : '—';
    const budgetPct = summary.total_budget > 0
      ? Math.round(summary.total_spent / summary.total_budget * 100) : 0;
    document.getElementById('banner-budget').textContent = budgetPct + '%';
  } catch {}
}
window.updateBanner = updateBanner;

// ── Shared data loaders ───────────────────────────────────────────────
async function loadSharedData() {
  const [team, priorities, objectives, campaigns, plans, personas] = await Promise.all([
    api('GET', '/team'),
    api('GET', '/company-priorities'),
    api('GET', '/marketing-objectives'),
    api('GET', '/campaigns'),
    api('GET', '/quarterly-plans'),
    api('GET', '/personas'),
  ]);
  GH.team      = team;
  GH.priorities = priorities;
  GH.objectives = objectives;
  GH.campaigns  = campaigns;
  GH.plans      = plans;
  GH.personas   = personas;
}
window.loadSharedData = loadSharedData;

// ── Formatting helpers ────────────────────────────────────────────────
function fmt$(n) {
  if (n == null || n === '') return '—';
  return '$' + Number(n).toLocaleString();
}
function fmtN(n) {
  if (n == null || n === '') return '—';
  return Number(n).toLocaleString();
}
function fmtPct(n) {
  if (n == null || n === '') return '—';
  return Number(n).toFixed(1) + '%';
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function monthLabel(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}
window.fmt$ = fmt$;
window.fmtN = fmtN;
window.fmtPct = fmtPct;
window.fmtDate = fmtDate;
window.monthLabel = monthLabel;

// ── Status helpers ────────────────────────────────────────────────────
const STATUS_CLASS = { 'on-track': 's-on-track', 'at-risk': 's-at-risk', 'off-track': 's-off-track', 'complete': 's-complete' };
const STATUS_LABEL = { 'on-track': 'On Track', 'at-risk': 'At Risk', 'off-track': 'Off Track', 'complete': 'Complete' };

function statusBadge(s) {
  return `<span class="status-badge ${STATUS_CLASS[s] || ''}">${STATUS_LABEL[s] || s}</span>`;
}
window.statusBadge = statusBadge;

function campStatusBadge(s) {
  const cls = { planning: 'camp-planning', active: 'camp-active', paused: 'camp-paused', completed: 'camp-completed' };
  const lbl = { planning: 'Planning', active: 'Active', paused: 'Paused', completed: 'Completed' };
  return `<span class="campaign-status-badge ${cls[s] || ''}">${lbl[s] || s}</span>`;
}
window.campStatusBadge = campStatusBadge;

function contentStatusBadge(s) {
  const cls = { ideation: 'cs-ideation', draft: 'cs-draft', review: 'cs-review', scheduled: 'cs-scheduled', published: 'cs-published' };
  const lbl = { ideation: 'Ideation', draft: 'Draft', review: 'Review', scheduled: 'Scheduled', published: 'Published' };
  return `<span class="content-status-badge ${cls[s] || ''}">${lbl[s] || s}</span>`;
}
window.contentStatusBadge = contentStatusBadge;

// ── Fill dropdowns ────────────────────────────────────────────────────
function fillSelect(id, items, valueFn, labelFn, placeholder = '— none —') {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<option value="">${placeholder}</option>`;
  items.forEach(i => {
    const o = document.createElement('option');
    o.value = valueFn(i);
    o.textContent = labelFn(i);
    el.appendChild(o);
  });
}
window.fillSelect = fillSelect;

// ── Team management link ──────────────────────────────────────────────
async function openTeamModal() {
  const list = document.getElementById('team-list-modal');
  GH.team = await api('GET', '/team');
  list.innerHTML = GH.team.map(m => `
    <div class="team-list-item">
      <span class="team-list-name">${m.name}</span>
      <span class="team-list-role">${m.role}</span>
      <button class="btn btn-ghost btn-sm" onclick="deleteTeamMember(${m.id},'${m.name.replace(/'/g,"\\'")}')">✕</button>
    </div>`).join('');
  showModal('team-modal');
}
window.openTeamModal = openTeamModal;

async function deleteTeamMember(id, name) {
  if (!confirm(`Remove ${name} from the team?`)) return;
  await api('DELETE', `/team/${id}`);
  openTeamModal();
  showToast('Team member removed');
}
window.deleteTeamMember = deleteTeamMember;

document.getElementById('add-team-member-btn').addEventListener('click', async () => {
  const name  = document.getElementById('new-team-name').value.trim();
  const role  = document.getElementById('new-team-role').value.trim();
  const email = document.getElementById('new-team-email').value.trim();
  if (!name) return showToast('Name is required', 'error');
  await api('POST', '/team', { name, role, email });
  document.getElementById('new-team-name').value  = '';
  document.getElementById('new-team-role').value  = '';
  document.getElementById('new-team-email').value = '';
  GH.team = await api('GET', '/team');
  openTeamModal();
  showToast('Team member added', 'success');
});

// ── Init ─────────────────────────────────────────────────────────────
async function init() {
  await loadSharedData();
  updateBanner();
  // Trigger each module's init
  if (window.initStrategy)      initStrategy();
  if (window.initQuarterly)     initQuarterly();
  if (window.initCampaigns)     initCampaigns();
  if (window.initContent)       initContent();
  if (window.initMetrics)       initMetrics();
  if (window.initPersonas)      initPersonas();
  if (window.initAI)            initAI();
  if (window.initIntegrations)  initIntegrations();
}
document.addEventListener('DOMContentLoaded', init);
