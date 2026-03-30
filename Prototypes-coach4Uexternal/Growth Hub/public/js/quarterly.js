/* ═══════════════════════════════════════════════════════
   quarterly.js — Part 2: Quarterly Marketing Plan
   ═══════════════════════════════════════════════════════ */

let editingQPlanId = null;

function initQuarterly() {
  renderQPlans();

  document.getElementById('add-qplan-btn').addEventListener('click', openAddQPlan);
  document.getElementById('save-qplan-btn').addEventListener('click', saveQPlan);
  document.getElementById('qplan-quarter-filter').addEventListener('change', renderQPlans);
  document.getElementById('qplan-year-filter').addEventListener('change', renderQPlans);
}
window.initQuarterly = initQuarterly;

async function renderQPlans() {
  const quarter = document.getElementById('qplan-quarter-filter').value;
  const year    = document.getElementById('qplan-year-filter').value;
  const plans   = await api('GET', `/quarterly-plans?quarter=${quarter}&year=${year}`);
  GH.plans = plans;
  const container = document.getElementById('qplan-list');

  if (!plans.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div>
      <div class="empty-state-text">No marketing priorities for ${quarter} ${year}. Add your first one.</div>
      <button class="btn btn-primary" onclick="openAddQPlan()">+ Add Priority</button></div>`;
    return;
  }

  // Budget totals
  const totalBudget = plans.reduce((s, p) => s + (p.budget_allocated || 0), 0);
  const totalSpent  = plans.reduce((s, p) => s + (p.budget_spent || 0), 0);

  container.innerHTML = '';

  // Summary strip at top
  const strip = document.createElement('div');
  strip.className = 'summary-strip';
  strip.style.marginBottom = '20px';
  strip.innerHTML = [
    { val: plans.length, label: 'Marketing Priorities' },
    { val: fmt$(totalBudget), label: 'Total Budget' },
    { val: fmt$(totalSpent), label: 'Total Spent' },
    { val: totalBudget > 0 ? Math.round(totalSpent/totalBudget*100)+'%' : '—', label: 'Budget Used' },
    { val: plans.filter(p => p.rag_status === 'green').length, label: 'On Track (Green)' },
    { val: plans.filter(p => p.rag_status !== 'green').length, label: 'Need Attention' },
  ].map(({ val, label }) => `
    <div class="summary-chip">
      <div class="summary-chip-val">${val}</div>
      <div class="summary-chip-label">${label}</div>
    </div>`).join('');
  container.appendChild(strip);

  // Each plan card
  for (const plan of plans) {
    const campaigns = await api('GET', `/quarterly-plans/${plan.id}/campaigns`);
    const budgetPct = plan.budget_allocated > 0 ? Math.min(100, Math.round(plan.budget_spent / plan.budget_allocated * 100)) : 0;
    const metricPct = plan.target_value > 0 ? Math.round((plan.actual_value || 0) / plan.target_value * 100) : null;

    const card = document.createElement('div');
    card.className = 'qplan-card';
    card.innerHTML = `
      <div class="qplan-header">
        <div class="qplan-rag ${plan.rag_status || 'green'}" title="RAG Status: ${plan.rag_status}"></div>
        <div>
          <div class="qplan-title">${plan.title}</div>
          <div class="qplan-meta">${plan.quarter} ${plan.year}</div>
        </div>
        <div class="qplan-actions">
          <button class="btn btn-outline btn-sm" onclick="editQPlan(${plan.id})">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="deleteQPlan(${plan.id},'${plan.title.replace(/'/g,"\\'")}')">✕</button>
        </div>
      </div>

      <div class="qplan-body">
        <!-- Cascade: Company Priority → Marketing Objective → Campaigns -->
        <div class="qplan-cascade">
          ${plan.priority_title ? `
          <div class="cascade-row">
            <div class="cascade-box cascade-company">
              <div class="cascade-label">🏛 Company Priority</div>
              <div class="cascade-text">${plan.priority_title}</div>
              ${plan.priority_owner ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Owner: ${plan.priority_owner}</div>` : ''}
            </div>
          </div>
          <div style="display:flex;align-items:center;padding-left:20px;margin:2px 0;">
            <div style="width:2px;height:20px;background:var(--border);margin-right:16px;"></div>
            <span style="font-size:14px;color:var(--text-muted);">↓</span>
          </div>` : ''}

          ${plan.objective_title ? `
          <div class="cascade-row">
            <div class="cascade-box cascade-objective">
              <div class="cascade-label">🎯 Marketing Objective</div>
              <div class="cascade-text">${plan.objective_title}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;padding-left:20px;margin:2px 0;">
            <div style="width:2px;height:20px;background:var(--border);margin-right:16px;"></div>
            <span style="font-size:14px;color:var(--text-muted);">↓</span>
          </div>` : ''}

          <div style="margin-bottom:4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">📣 Campaigns</div>
          <div class="cascade-campaigns">
            ${campaigns.length
              ? campaigns.map(c => `
                <div class="cascade-camp-chip" onclick="document.querySelector('[data-panel=campaigns]').click()">
                  ${campStatusBadge(c.status)} ${c.name}
                  ${c.assignee_name ? `<span style="font-size:10px;color:var(--text-muted);"> · ${c.assignee_name}</span>` : ''}
                </div>`).join('')
              : '<span style="font-size:13px;color:var(--text-muted);">No campaigns linked yet</span>'
            }
          </div>
        </div>

        <!-- Metrics row -->
        <div class="qplan-metrics-row">
          <div class="qplan-metric-box">
            <div class="qplan-metric-val">${fmt$(plan.budget_allocated)}</div>
            <div class="qplan-metric-label">Budget Allocated</div>
            <div class="qplan-budget-bar">
              <div style="font-size:11px;color:var(--text-muted);">${fmt$(plan.budget_spent)} spent (${budgetPct}%)</div>
              <div class="qplan-budget-track"><div class="qplan-budget-fill" style="width:${budgetPct}%;${budgetPct>90?'background:var(--danger)':''}"></div></div>
            </div>
          </div>
          <div class="qplan-metric-box">
            <div class="qplan-metric-val">${plan.success_metric || '—'}</div>
            <div class="qplan-metric-label">Success Metric</div>
          </div>
          <div class="qplan-metric-box">
            <div class="qplan-metric-val">${fmtN(plan.actual_value) || '0'}</div>
            <div class="qplan-metric-label">Actual vs ${fmtN(plan.target_value)} target</div>
            ${metricPct != null ? `<div class="goal-pct ${metricPct >= 100 ? 'ahead' : 'behind'}">${metricPct}% of target</div>` : ''}
          </div>
          <div class="qplan-metric-box">
            <div class="qplan-metric-val">${campaigns.length}</div>
            <div class="qplan-metric-label">Campaigns Linked</div>
          </div>
        </div>

        ${plan.notes ? `<div style="margin-top:12px;font-size:13px;color:var(--text-muted);font-style:italic;">📝 ${plan.notes}</div>` : ''}
      </div>`;
    container.appendChild(card);
  }
}
window.renderQPlans = renderQPlans;

function openAddQPlan() {
  editingQPlanId = null;
  document.getElementById('qplan-modal-title').textContent = 'Add Marketing Priority';
  document.getElementById('qplan-id').value     = '';
  document.getElementById('qplan-title').value  = '';
  document.getElementById('qplan-quarter-modal').value = document.getElementById('qplan-quarter-filter').value;
  document.getElementById('qplan-year').value   = document.getElementById('qplan-year-filter').value;
  document.getElementById('qplan-rag').value    = 'green';
  document.getElementById('qplan-budget').value = '';
  document.getElementById('qplan-spent').value  = '';
  document.getElementById('qplan-metric').value = '';
  document.getElementById('qplan-target').value = '';
  document.getElementById('qplan-actual').value = '';
  document.getElementById('qplan-notes').value  = '';
  fillSelect('qplan-priority',  GH.priorities,  p => p.id, p => `${p.quarter} ${p.year}: ${p.title}`);
  fillSelect('qplan-objective', GH.objectives,  o => o.id, o => o.title);
  showModal('qplan-modal');
}
window.openAddQPlan = openAddQPlan;

async function editQPlan(id) {
  const plan = GH.plans.find(p => p.id === id) || await api('GET', `/quarterly-plans`).then(r => r.find(p => p.id === id));
  if (!plan) return;
  editingQPlanId = id;
  document.getElementById('qplan-modal-title').textContent = 'Edit Marketing Priority';
  document.getElementById('qplan-id').value     = id;
  document.getElementById('qplan-title').value  = plan.title;
  document.getElementById('qplan-quarter-modal').value = plan.quarter || 'Q1';
  document.getElementById('qplan-year').value   = plan.year || 2026;
  document.getElementById('qplan-rag').value    = plan.rag_status || 'green';
  document.getElementById('qplan-budget').value = plan.budget_allocated || '';
  document.getElementById('qplan-spent').value  = plan.budget_spent || '';
  document.getElementById('qplan-metric').value = plan.success_metric || '';
  document.getElementById('qplan-target').value = plan.target_value || '';
  document.getElementById('qplan-actual').value = plan.actual_value || '';
  document.getElementById('qplan-notes').value  = plan.notes || '';
  fillSelect('qplan-priority',  GH.priorities,  p => p.id, p => `${p.quarter} ${p.year}: ${p.title}`);
  fillSelect('qplan-objective', GH.objectives,  o => o.id, o => o.title);
  document.getElementById('qplan-priority').value  = plan.company_priority_id || '';
  document.getElementById('qplan-objective').value = plan.marketing_objective_id || '';
  showModal('qplan-modal');
}
window.editQPlan = editQPlan;

async function saveQPlan() {
  const v = id => document.getElementById(id).value;
  const data = {
    title:                   v('qplan-title').trim(),
    quarter:                 v('qplan-quarter-modal'),
    year:                    +v('qplan-year'),
    rag_status:              v('qplan-rag'),
    company_priority_id:     +v('qplan-priority') || null,
    marketing_objective_id:  +v('qplan-objective') || null,
    budget_allocated:        +v('qplan-budget') || 0,
    budget_spent:            +v('qplan-spent') || 0,
    success_metric:          v('qplan-metric').trim(),
    target_value:            +v('qplan-target') || 0,
    actual_value:            +v('qplan-actual') || 0,
    notes:                   v('qplan-notes').trim(),
  };
  if (!data.title) return showToast('Title required', 'error');
  try {
    if (editingQPlanId) {
      await api('PUT', `/quarterly-plans/${editingQPlanId}`, data);
    } else {
      await api('POST', '/quarterly-plans', data);
    }
    GH.plans = await api('GET', '/quarterly-plans');
    hideModal('qplan-modal');
    renderQPlans();
    showToast('Marketing priority saved', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteQPlan(id, name) {
  confirmDelete(`Delete "${name}"?`, async () => {
    await api('DELETE', `/quarterly-plans/${id}`);
    GH.plans = await api('GET', '/quarterly-plans');
    renderQPlans();
    showToast('Deleted');
  });
}
window.deleteQPlan = deleteQPlan;
