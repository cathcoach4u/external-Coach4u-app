/* ═══════════════════════════════════════════════════════
   campaigns.js — Part 3: Campaign Tracker
   ═══════════════════════════════════════════════════════ */

let editingCampaignId = null;
let editingAbId = null;
let abViewOpen = false;

function initCampaigns() {
  renderCampaigns();

  document.getElementById('add-campaign-btn').addEventListener('click', openAddCampaign);
  document.getElementById('save-campaign-btn').addEventListener('click', saveCampaign);
  document.getElementById('camp-status-filter').addEventListener('change', renderCampaigns);
  document.getElementById('camp-ab-view-btn').addEventListener('click', toggleAbView);
  document.getElementById('add-ab-btn').addEventListener('click', openAddAb);
  document.getElementById('save-ab-btn').addEventListener('click', saveAb);
}
window.initCampaigns = initCampaigns;

async function renderCampaigns() {
  const status = document.getElementById('camp-status-filter').value;
  const qs = status ? `?status=${status}` : '';
  const [campaigns, summary] = await Promise.all([
    api('GET', '/campaigns' + qs),
    api('GET', '/campaigns-summary'),
  ]);
  GH.campaigns = campaigns;

  // Summary strip
  const strip = document.getElementById('campaigns-summary');
  strip.innerHTML = [
    { val: summary.total || 0,    label: 'Total Campaigns' },
    { val: summary.active || 0,   label: 'Active Now' },
    { val: fmt$(summary.total_budget), label: 'Total Budget' },
    { val: fmt$(summary.total_spent),  label: 'Spent to Date' },
    { val: fmtN(summary.total_leads),  label: 'Total Leads' },
    { val: fmt$(summary.total_revenue), label: 'Revenue Attributed' },
  ].map(({ val, label }) => `
    <div class="summary-chip">
      <div class="summary-chip-val">${val}</div>
      <div class="summary-chip-label">${label}</div>
    </div>`).join('');

  // Campaign cards
  const list = document.getElementById('campaigns-list');
  if (!campaigns.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📣</div>
      <div class="empty-state-text">No campaigns found. Create your first campaign.</div>
      <button class="btn btn-primary" onclick="openAddCampaign()">+ New Campaign</button></div>`;
    return;
  }
  list.innerHTML = campaigns.map(c => renderCampaignCard(c)).join('');

  // Bind toggle for each campaign card body
  list.querySelectorAll('.campaign-card-header').forEach(h => {
    h.addEventListener('click', e => {
      if (e.target.closest('.campaign-card-actions')) return;
      const body = h.nextElementSibling?.nextElementSibling;
      if (body && body.classList.contains('campaign-body')) {
        body.classList.toggle('open');
      }
    });
  });

  if (abViewOpen) renderAbTests();
}
window.renderCampaigns = renderCampaigns;

function renderCampaignCard(c) {
  const roi = c.budget_spent > 0 && c.actual_revenue > 0
    ? ((c.actual_revenue - c.budget_spent) / c.budget_spent * 100).toFixed(1)
    : null;
  const roiClass = roi != null ? (roi >= 0 ? 'positive' : 'negative') : '';

  function metricCell(label, actual, target, fmt = fmtN) {
    const hit = target > 0 && actual >= target;
    return `<div class="campaign-metric">
      <div class="campaign-metric-label">${label}</div>
      <div class="campaign-metric-val ${actual > 0 ? (hit ? 'metric-hit' : '') : ''}">${fmt(actual)}</div>
      <div class="campaign-metric-target">Target: ${fmt(target)}</div>
    </div>`;
  }

  return `
  <div class="campaign-card" id="campaign-${c.id}">
    <div class="campaign-card-header">
      ${campStatusBadge(c.status)}
      <span class="campaign-name">${c.name}</span>
      ${c.channel ? `<span class="campaign-channel-badge">${c.channel}</span>` : ''}
      ${c.priority_title ? `<span style="font-size:12px;color:var(--text-muted);">↑ ${c.priority_title}</span>` : ''}
      <span class="campaign-assignee">👤 ${c.assignee_name || 'Unassigned'}</span>
      <div class="campaign-card-actions">
        <button class="btn btn-outline btn-sm" onclick="editCampaign(${c.id})">Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteCampaign(${c.id},'${c.name.replace(/'/g,"\\'")}')">✕</button>
      </div>
    </div>
    <div class="campaign-metrics">
      ${metricCell('Leads', c.actual_leads, c.target_leads)}
      ${metricCell('Conversions', c.actual_conversions, c.target_conversions)}
      ${metricCell('Revenue', c.actual_revenue, c.target_revenue, fmt$)}
      ${metricCell('CTR', c.actual_ctr, c.target_ctr, fmtPct)}
      <div class="campaign-metric">
        <div class="campaign-metric-label">Budget Used</div>
        <div class="campaign-metric-val">${fmt$(c.budget_spent)}</div>
        <div class="campaign-metric-target">of ${fmt$(c.budget_allocated)}</div>
      </div>
      <div class="campaign-metric">
        <div class="campaign-metric-label">ROI</div>
        <div class="campaign-metric-val campaign-roi ${roiClass}">${roi != null ? (roi >= 0 ? '+' : '') + roi + '%' : '—'}</div>
        <div class="campaign-metric-target">${c.actual_revenue > 0 ? fmt$(c.actual_revenue) + ' revenue' : 'No revenue data'}</div>
      </div>
    </div>
    <div class="campaign-body">
      <div class="campaign-body-grid">
        <div>
          <div class="campaign-body-label">Objective</div>
          <div class="campaign-body-val">${c.objective || '—'}</div>
        </div>
        <div>
          <div class="campaign-body-label">Timeline</div>
          <div class="campaign-body-val">${fmtDate(c.start_date)} → ${fmtDate(c.end_date)}</div>
        </div>
        <div>
          <div class="campaign-body-label">Company Priority</div>
          <div class="campaign-body-val">${c.priority_title || '—'}</div>
        </div>
        <div>
          <div class="campaign-body-label">Q-Plan Priority</div>
          <div class="campaign-body-val">${c.plan_title || '—'}</div>
        </div>
      </div>
      ${c.insights ? `
        <div class="campaign-insights-box">
          <strong>💡 What's Working:</strong><br>${c.insights}
        </div>` : ''}
      ${c.notes ? `<div style="margin-top:10px;font-size:13px;color:var(--text-muted);font-style:italic;">📝 ${c.notes}</div>` : ''}
    </div>
  </div>`;
}

function openAddCampaign() {
  editingCampaignId = null;
  document.getElementById('campaign-modal-title').textContent = 'New Campaign';
  document.getElementById('campaign-id').value = '';
  ['campaign-name','campaign-objective','campaign-insights','campaign-notes'].forEach(id => document.getElementById(id).value = '');
  ['campaign-budget','campaign-spent','campaign-target-leads','campaign-actual-leads',
   'campaign-target-conv','campaign-actual-conv','campaign-target-rev','campaign-actual-rev',
   'campaign-target-ctr','campaign-actual-ctr'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('campaign-status').value  = 'planning';
  document.getElementById('campaign-channel').value = '';
  document.getElementById('campaign-start').value   = '';
  document.getElementById('campaign-end').value     = '';
  fillSelect('campaign-priority', GH.priorities, p => p.id, p => `${p.quarter} ${p.year}: ${p.title}`);
  fillSelect('campaign-qplan',    GH.plans,      p => p.id, p => `${p.quarter} ${p.year}: ${p.title}`);
  fillSelect('campaign-assignee', GH.team,       m => m.id, m => `${m.name} — ${m.role}`);
  showModal('campaign-modal');
}
window.openAddCampaign = openAddCampaign;

function editCampaign(id) {
  const c = GH.campaigns.find(x => x.id === id);
  if (!c) return;
  editingCampaignId = id;
  document.getElementById('campaign-modal-title').textContent = 'Edit Campaign';
  const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val ?? ''; };
  set('campaign-id',          id);
  set('campaign-name',        c.name);
  set('campaign-objective',   c.objective);
  set('campaign-status',      c.status);
  set('campaign-channel',     c.channel);
  set('campaign-start',       c.start_date);
  set('campaign-end',         c.end_date);
  set('campaign-budget',      c.budget_allocated);
  set('campaign-spent',       c.budget_spent);
  set('campaign-target-leads',c.target_leads);
  set('campaign-actual-leads',c.actual_leads);
  set('campaign-target-conv', c.target_conversions);
  set('campaign-actual-conv', c.actual_conversions);
  set('campaign-target-rev',  c.target_revenue);
  set('campaign-actual-rev',  c.actual_revenue);
  set('campaign-target-ctr',  c.target_ctr);
  set('campaign-actual-ctr',  c.actual_ctr);
  set('campaign-insights',    c.insights);
  set('campaign-notes',       c.notes);
  fillSelect('campaign-priority', GH.priorities, p => p.id, p => `${p.quarter} ${p.year}: ${p.title}`);
  fillSelect('campaign-qplan',    GH.plans,      p => p.id, p => `${p.quarter} ${p.year}: ${p.title}`);
  fillSelect('campaign-assignee', GH.team,       m => m.id, m => `${m.name} — ${m.role}`);
  set('campaign-priority', c.company_priority_id);
  set('campaign-qplan',    c.quarterly_plan_id);
  set('campaign-assignee', c.assigned_to);
  showModal('campaign-modal');
}
window.editCampaign = editCampaign;

async function saveCampaign() {
  const v = id => document.getElementById(id).value;
  const data = {
    name:                 v('campaign-name').trim(),
    objective:            v('campaign-objective').trim(),
    company_priority_id:  +v('campaign-priority') || null,
    quarterly_plan_id:    +v('campaign-qplan') || null,
    assigned_to:          +v('campaign-assignee') || null,
    start_date:           v('campaign-start'),
    end_date:             v('campaign-end'),
    budget_allocated:     +v('campaign-budget') || 0,
    budget_spent:         +v('campaign-spent') || 0,
    target_leads:         +v('campaign-target-leads') || 0,
    actual_leads:         +v('campaign-actual-leads') || 0,
    target_conversions:   +v('campaign-target-conv') || 0,
    actual_conversions:   +v('campaign-actual-conv') || 0,
    target_revenue:       +v('campaign-target-rev') || 0,
    actual_revenue:       +v('campaign-actual-rev') || 0,
    target_ctr:           +v('campaign-target-ctr') || 0,
    actual_ctr:           +v('campaign-actual-ctr') || 0,
    channel:              v('campaign-channel'),
    status:               v('campaign-status'),
    insights:             v('campaign-insights').trim(),
    notes:                v('campaign-notes').trim(),
  };
  if (!data.name) return showToast('Campaign name required', 'error');
  try {
    if (editingCampaignId) {
      await api('PUT', `/campaigns/${editingCampaignId}`, data);
    } else {
      await api('POST', '/campaigns', data);
    }
    GH.campaigns = await api('GET', '/campaigns');
    hideModal('campaign-modal');
    renderCampaigns();
    updateBanner();
    showToast('Campaign saved', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteCampaign(id, name) {
  confirmDelete(`Delete campaign "${name}"?`, async () => {
    await api('DELETE', `/campaigns/${id}`);
    GH.campaigns = await api('GET', '/campaigns');
    renderCampaigns();
    updateBanner();
    showToast('Campaign deleted');
  });
}
window.deleteCampaign = deleteCampaign;

// ── A/B Tests ─────────────────────────────────────────────────────────
function toggleAbView() {
  abViewOpen = !abViewOpen;
  const section = document.getElementById('ab-tests-section');
  const btn = document.getElementById('camp-ab-view-btn');
  if (abViewOpen) {
    section.style.display = '';
    btn.textContent = 'Hide A/B Tests';
    btn.className = 'btn btn-primary btn-sm';
    renderAbTests();
  } else {
    section.style.display = 'none';
    btn.textContent = 'A/B Tests';
    btn.className = 'btn btn-outline btn-sm';
  }
}

async function renderAbTests() {
  const tests = await api('GET', '/ab-tests');
  const list = document.getElementById('ab-tests-list');
  if (!tests.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔬</div>
      <div class="empty-state-text">No A/B tests recorded yet. Add your first test.</div></div>`;
    return;
  }
  list.innerHTML = tests.map(t => {
    const aWins = t.winner === 'A';
    const bWins = t.winner === 'B';
    const diff = t.result_a != null && t.result_b != null
      ? ((t.result_b - t.result_a) / Math.abs(t.result_a || 1) * 100).toFixed(0) : null;
    return `
    <div class="ab-test-card">
      <div class="ab-test-header">
        <span class="ab-test-name">${t.name}</span>
        ${t.campaign_name ? `<span style="font-size:12px;color:var(--text-muted);">Campaign: ${t.campaign_name}</span>` : ''}
        <span class="status-badge ${t.status === 'running' ? 's-at-risk' : 's-complete'}">${t.status === 'running' ? 'Running' : 'Completed'}</span>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="editAb(${t.id})">✎</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="deleteAb(${t.id},'${t.name.replace(/'/g,"\\'")}')">✕</button>
      </div>
      <div class="ab-test-body">
        <div class="ab-variant-box ${aWins ? 'winner' : ''}">
          <div class="ab-variant-label">Variant A ${aWins ? '🏆 Winner' : ''}</div>
          <div class="ab-variant-text">${t.variant_a || '—'}</div>
          ${t.result_a != null ? `<div class="ab-variant-result">${t.result_a}${t.metric?.includes('%') ? '%' : ''}</div>` : ''}
        </div>
        <div class="ab-variant-box ${bWins ? 'winner' : ''}">
          <div class="ab-variant-label">Variant B ${bWins ? '🏆 Winner' : ''} ${diff && bWins ? `<span class="ab-winner-chip">+${diff}%</span>` : ''}</div>
          <div class="ab-variant-text">${t.variant_b || '—'}</div>
          ${t.result_b != null ? `<div class="ab-variant-result">${t.result_b}${t.metric?.includes('%') ? '%' : ''}</div>` : ''}
        </div>
        ${t.insight ? `
        <div class="ab-insight-box">
          <strong>💡 Insight:</strong> ${t.insight}
        </div>` : '<div></div>'}
      </div>
      <div style="margin-top:8px;font-size:12px;color:var(--text-muted);">Metric: <strong>${t.metric || '—'}</strong></div>
    </div>`;
  }).join('');
}

function openAddAb() {
  editingAbId = null;
  document.getElementById('ab-modal-title').textContent = 'Add A/B Test';
  document.getElementById('ab-id').value = '';
  ['ab-name','ab-variant-a','ab-variant-b','ab-metric','ab-result-a','ab-result-b','ab-insight'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ab-winner').value = '';
  document.getElementById('ab-status').value = 'running';
  fillSelect('ab-campaign', GH.campaigns, c => c.id, c => c.name);
  showModal('ab-modal');
}
window.openAddAb = openAddAb;

async function editAb(id) {
  const tests = await api('GET', '/ab-tests');
  const t = tests.find(x => x.id === id);
  if (!t) return;
  editingAbId = id;
  document.getElementById('ab-modal-title').textContent = 'Edit A/B Test';
  fillSelect('ab-campaign', GH.campaigns, c => c.id, c => c.name);
  const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val ?? ''; };
  set('ab-name',      t.name);
  set('ab-campaign',  t.campaign_id);
  set('ab-status',    t.status);
  set('ab-variant-a', t.variant_a);
  set('ab-variant-b', t.variant_b);
  set('ab-metric',    t.metric);
  set('ab-result-a',  t.result_a);
  set('ab-result-b',  t.result_b);
  set('ab-winner',    t.winner);
  set('ab-insight',   t.insight);
  showModal('ab-modal');
}
window.editAb = editAb;

async function saveAb() {
  const v = id => document.getElementById(id).value;
  const data = {
    name:        v('ab-name').trim(),
    campaign_id: +v('ab-campaign') || null,
    status:      v('ab-status'),
    variant_a:   v('ab-variant-a').trim(),
    variant_b:   v('ab-variant-b').trim(),
    metric:      v('ab-metric').trim(),
    result_a:    v('ab-result-a') !== '' ? +v('ab-result-a') : null,
    result_b:    v('ab-result-b') !== '' ? +v('ab-result-b') : null,
    winner:      v('ab-winner'),
    insight:     v('ab-insight').trim(),
  };
  if (!data.name) return showToast('Test name required', 'error');
  try {
    if (editingAbId) {
      await api('PUT', `/ab-tests/${editingAbId}`, data);
    } else {
      await api('POST', '/ab-tests', data);
    }
    hideModal('ab-modal');
    renderAbTests();
    showToast('A/B test saved', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteAb(id, name) {
  confirmDelete(`Delete test "${name}"?`, async () => {
    await api('DELETE', `/ab-tests/${id}`);
    renderAbTests();
    showToast('Test deleted');
  });
}
window.deleteAb = deleteAb;
