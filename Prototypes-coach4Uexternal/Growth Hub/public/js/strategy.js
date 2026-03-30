/* ═══════════════════════════════════════════════════════
   strategy.js — Part 1: Marketing Strategy
   ═══════════════════════════════════════════════════════ */

let editingPriorityId   = null;
let editingObjectiveId  = null;
let editingAnnualGoalId = null;

function initStrategy() {
  renderPriorities();
  renderObjectives();
  renderBrandPositioning();
  renderAnnualGoals();

  document.getElementById('add-priority-btn').addEventListener('click', openAddPriority);
  document.getElementById('import-priorities-btn').addEventListener('click', () => showModal('import-modal'));
  document.getElementById('add-objective-btn').addEventListener('click', openAddObjective);
  document.getElementById('edit-brand-btn').addEventListener('click', openBrandModal);
  document.getElementById('add-annual-goal-btn').addEventListener('click', openAddAnnualGoal);

  document.getElementById('save-priority-btn').addEventListener('click', savePriority);
  document.getElementById('save-objective-btn').addEventListener('click', saveObjective);
  document.getElementById('save-brand-btn').addEventListener('click', saveBrandPositioning);
  document.getElementById('save-annual-goal-btn').addEventListener('click', saveAnnualGoal);

  document.getElementById('preview-import-btn').addEventListener('click', previewImport);
  document.getElementById('confirm-import-btn').addEventListener('click', confirmImport);

  // Live preview for brand modal
  ['bp-for-who','bp-who-need','bp-product','bp-is-a','bp-that','bp-unlike','bp-differentiator','bp-tagline']
    .forEach(id => document.getElementById(id)?.addEventListener('input', updateBrandPreview));
}
window.initStrategy = initStrategy;

// ── Priorities ────────────────────────────────────────────────────────
function renderPriorities() {
  const list = document.getElementById('priorities-list');
  if (!GH.priorities.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🎯</div><div class="empty-state-text">No company priorities yet. Add one or import from The Strategic Hub.</div></div>`;
    return;
  }
  list.innerHTML = GH.priorities.map((p, i) => `
    <div class="priority-item">
      <span class="priority-number">${i + 1}</span>
      <div class="priority-info">
        <div class="priority-title">${p.title}</div>
        <div class="priority-meta">${p.quarter} ${p.year} · Owner: ${p.owner || '—'} · ${statusBadge(p.status)}</div>
      </div>
      <div class="priority-actions">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="editPriority(${p.id})" title="Edit">✎</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="deletePriority(${p.id},'${p.title.replace(/'/g,"\\'")}')">✕</button>
      </div>
    </div>`).join('');
}

function openAddPriority() {
  editingPriorityId = null;
  document.getElementById('priority-modal-title').textContent = 'Add Company Priority';
  document.getElementById('priority-id').value = '';
  document.getElementById('priority-title').value = '';
  document.getElementById('priority-desc').value = '';
  document.getElementById('priority-quarter').value = 'Q1';
  document.getElementById('priority-year').value = '2026';
  document.getElementById('priority-owner').value = '';
  document.getElementById('priority-status').value = 'on-track';
  showModal('priority-modal');
}
window.openAddPriority = openAddPriority;

function editPriority(id) {
  const p = GH.priorities.find(x => x.id === id);
  if (!p) return;
  editingPriorityId = id;
  document.getElementById('priority-modal-title').textContent = 'Edit Company Priority';
  document.getElementById('priority-id').value    = id;
  document.getElementById('priority-title').value = p.title;
  document.getElementById('priority-desc').value  = p.description || '';
  document.getElementById('priority-quarter').value = p.quarter || 'Q1';
  document.getElementById('priority-year').value  = p.year || 2026;
  document.getElementById('priority-owner').value = p.owner || '';
  document.getElementById('priority-status').value = p.status || 'on-track';
  showModal('priority-modal');
}
window.editPriority = editPriority;

async function savePriority() {
  const data = {
    title:       document.getElementById('priority-title').value.trim(),
    description: document.getElementById('priority-desc').value.trim(),
    quarter:     document.getElementById('priority-quarter').value,
    year:        +document.getElementById('priority-year').value,
    owner:       document.getElementById('priority-owner').value.trim(),
    status:      document.getElementById('priority-status').value,
  };
  if (!data.title) return showToast('Title is required', 'error');
  try {
    if (editingPriorityId) {
      await api('PUT', `/company-priorities/${editingPriorityId}`, data);
    } else {
      await api('POST', '/company-priorities', data);
    }
    hideModal('priority-modal');
    GH.priorities = await api('GET', '/company-priorities');
    renderPriorities();
    renderObjectives(); // refresh linked dropdowns
    showToast('Priority saved', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

async function deletePriority(id, name) {
  confirmDelete(`Delete priority "${name}"? This may affect linked objectives.`, async () => {
    await api('DELETE', `/company-priorities/${id}`);
    GH.priorities = await api('GET', '/company-priorities');
    renderPriorities();
    showToast('Priority deleted');
    updateBanner();
  });
}
window.deletePriority = deletePriority;

// ── Import ────────────────────────────────────────────────────────────
function previewImport() {
  const raw = document.getElementById('import-json').value.trim();
  const preview = document.getElementById('import-preview');
  try {
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) throw new Error('Expected a JSON array');
    preview.innerHTML = `<strong>${items.length} priorities found:</strong><br>` +
      items.map((p, i) => `<div class="import-preview-item">${i+1}. ${p.title || p.rock_title || p.name || '(no title)'} — ${p.owner || p.assigned_to || ''}</div>`).join('');
  } catch (e) {
    preview.innerHTML = `<span style="color:var(--danger)">Invalid JSON: ${e.message}</span>`;
  }
}

async function confirmImport() {
  const raw = document.getElementById('import-json').value.trim();
  const quarter = document.getElementById('import-quarter').value;
  const year = +document.getElementById('import-year').value;
  try {
    const priorities = JSON.parse(raw);
    await api('POST', '/company-priorities/import', { priorities, quarter, year });
    GH.priorities = await api('GET', '/company-priorities');
    renderPriorities();
    hideModal('import-modal');
    document.getElementById('import-json').value = '';
    document.getElementById('import-preview').innerHTML = '';
    showToast(`Imported ${priorities.length} priorities`, 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

// ── Marketing Objectives ──────────────────────────────────────────────
function renderObjectives() {
  const list = document.getElementById('objectives-list');
  if (!GH.objectives.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">Add marketing objectives that translate company priorities into marketing goals.</div></div>`;
    return;
  }
  list.innerHTML = GH.objectives.map(o => {
    const pct = o.target_value > 0 ? Math.min(100, Math.round(o.current_value / o.target_value * 100)) : 0;
    return `
    <div class="objective-item">
      <div class="objective-info">
        <div class="objective-title">${o.title}</div>
        <div class="objective-link">↑ ${o.priority_title || 'No company priority linked'}</div>
      </div>
      <div class="objective-progress">
        <div class="progress-label">${fmtN(o.current_value)} / ${fmtN(o.target_value)} ${o.target_unit || ''} (${pct}%)</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
      <div style="margin-left:12px;">${statusBadge(o.status)}</div>
      <div class="priority-actions" style="opacity:1;">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="editObjective(${o.id})">✎</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="deleteObjective(${o.id},'${o.title.replace(/'/g,"\\'")}')">✕</button>
      </div>
    </div>`;
  }).join('');
}

function openAddObjective() {
  editingObjectiveId = null;
  document.getElementById('objective-modal-title').textContent = 'Add Marketing Objective';
  document.getElementById('objective-id').value    = '';
  document.getElementById('objective-title').value  = '';
  document.getElementById('objective-desc').value   = '';
  document.getElementById('objective-target').value = '';
  document.getElementById('objective-unit').value   = '';
  document.getElementById('objective-current').value = '0';
  document.getElementById('objective-status').value = 'on-track';
  fillSelect('objective-priority', GH.priorities, p => p.id, p => `${p.quarter} ${p.year}: ${p.title}`);
  showModal('objective-modal');
}
window.openAddObjective = openAddObjective;

function editObjective(id) {
  const o = GH.objectives.find(x => x.id === id);
  if (!o) return;
  editingObjectiveId = id;
  document.getElementById('objective-modal-title').textContent = 'Edit Marketing Objective';
  fillSelect('objective-priority', GH.priorities, p => p.id, p => `${p.quarter} ${p.year}: ${p.title}`);
  document.getElementById('objective-priority').value = o.company_priority_id || '';
  document.getElementById('objective-title').value   = o.title;
  document.getElementById('objective-desc').value    = o.description || '';
  document.getElementById('objective-target').value  = o.target_value || '';
  document.getElementById('objective-unit').value    = o.target_unit || '';
  document.getElementById('objective-current').value = o.current_value || 0;
  document.getElementById('objective-status').value  = o.status || 'on-track';
  showModal('objective-modal');
}
window.editObjective = editObjective;

async function saveObjective() {
  const data = {
    company_priority_id: +document.getElementById('objective-priority').value || null,
    title:        document.getElementById('objective-title').value.trim(),
    description:  document.getElementById('objective-desc').value.trim(),
    target_value: +document.getElementById('objective-target').value || 0,
    target_unit:  document.getElementById('objective-unit').value.trim(),
    current_value: +document.getElementById('objective-current').value || 0,
    quarter: 'Q1', year: 2026,
    status:  document.getElementById('objective-status').value,
  };
  if (!data.title) return showToast('Title is required', 'error');
  try {
    if (editingObjectiveId) {
      await api('PUT', `/marketing-objectives/${editingObjectiveId}`, data);
    } else {
      await api('POST', '/marketing-objectives', data);
    }
    GH.objectives = await api('GET', '/marketing-objectives');
    renderObjectives();
    hideModal('objective-modal');
    showToast('Objective saved', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteObjective(id, name) {
  confirmDelete(`Delete objective "${name}"?`, async () => {
    await api('DELETE', `/marketing-objectives/${id}`);
    GH.objectives = await api('GET', '/marketing-objectives');
    renderObjectives();
    showToast('Objective deleted');
  });
}
window.deleteObjective = deleteObjective;

// ── Brand Positioning ────────────────────────────────────────────────
async function renderBrandPositioning() {
  try {
    const b = await api('GET', '/brand-positioning');
    const view = document.getElementById('brand-statement-view');
    if (!b || !b.our_product) {
      view.innerHTML = '<p class="text-muted">No brand positioning defined yet. Click Edit to add yours.</p>';
      return;
    }
    view.innerHTML = `
      <p><strong>For</strong> ${b.for_who || '…'}, <strong>who need</strong> ${b.who_need || '…'},</p>
      <p><strong>${b.our_product || 'our product'}</strong> is a <strong>${b.is_a || '…'}</strong></p>
      <p><strong>that</strong> ${b.that || '…'}.</p>
      <p><strong>Unlike</strong> ${b.unlike || '…'},</p>
      <p>our product <strong>${b.our_differentiator || '…'}</strong>.</p>
      ${b.tagline ? `<div class="brand-tagline">"${b.tagline}"</div>` : ''}`;
  } catch {}
}

async function openBrandModal() {
  try {
    const b = await api('GET', '/brand-positioning');
    document.getElementById('bp-for-who').value        = b.for_who || '';
    document.getElementById('bp-who-need').value       = b.who_need || '';
    document.getElementById('bp-product').value        = b.our_product || '';
    document.getElementById('bp-is-a').value           = b.is_a || '';
    document.getElementById('bp-that').value           = b.that || '';
    document.getElementById('bp-unlike').value         = b.unlike || '';
    document.getElementById('bp-differentiator').value = b.our_differentiator || '';
    document.getElementById('bp-tagline').value        = b.tagline || '';
    updateBrandPreview();
  } catch {}
  showModal('brand-modal');
}
window.openBrandModal = openBrandModal;

function updateBrandPreview() {
  const g = id => document.getElementById(id)?.value || '…';
  document.getElementById('brand-preview').innerHTML =
    `For <strong>${g('bp-for-who')}</strong>, who need <strong>${g('bp-who-need')}</strong>,<br>
     <strong>${g('bp-product')}</strong> is a <strong>${g('bp-is-a')}</strong><br>
     that ${g('bp-that')}.<br>
     Unlike ${g('bp-unlike')},<br>
     our product ${g('bp-differentiator')}.
     ${g('bp-tagline') !== '…' ? `<br><em>"${g('bp-tagline')}"</em>` : ''}`;
}

async function saveBrandPositioning() {
  const data = {
    for_who:          document.getElementById('bp-for-who').value.trim(),
    who_need:         document.getElementById('bp-who-need').value.trim(),
    our_product:      document.getElementById('bp-product').value.trim(),
    is_a:             document.getElementById('bp-is-a').value.trim(),
    that:             document.getElementById('bp-that').value.trim(),
    unlike:           document.getElementById('bp-unlike').value.trim(),
    our_differentiator: document.getElementById('bp-differentiator').value.trim(),
    tagline:          document.getElementById('bp-tagline').value.trim(),
  };
  try {
    await api('PUT', '/brand-positioning', data);
    hideModal('brand-modal');
    renderBrandPositioning();
    showToast('Brand positioning saved', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

// ── Annual Goals ─────────────────────────────────────────────────────
async function renderAnnualGoals() {
  const goals = await api('GET', '/annual-goals');
  const list = document.getElementById('annual-goals-list');
  if (!goals.length) {
    list.innerHTML = '<p class="text-muted">No annual goals defined yet.</p>';
    return;
  }
  list.innerHTML = `
    <table class="annual-goals-table">
      <thead>
        <tr><th>Goal</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Unit</th><th></th></tr>
      </thead>
      <tbody>
        ${goals.map(g => `
        <tr>
          <td><strong>${g.goal_title}</strong>${g.goal_description ? `<br><span style="font-size:11px;color:var(--text-muted)">${g.goal_description}</span>` : ''}</td>
          ${['q1','q2','q3','q4'].map(q => {
            const target = g[`${q}_target`];
            const actual = g[`${q}_actual`];
            const pct = target > 0 && actual != null ? Math.round(actual/target*100) : null;
            const cls = pct != null ? (pct >= 100 ? 'ahead' : 'behind') : '';
            return `<td class="text-right">
              ${actual != null ? `<span class="goal-cell-actual">${fmtN(actual)}</span><br>` : ''}
              <span class="goal-cell-target">${fmtN(target)}</span>
              ${pct != null ? `<br><span class="goal-pct ${cls}">${pct}%</span>` : ''}
            </td>`;
          }).join('')}
          <td>${g.unit}</td>
          <td>
            <button class="btn btn-ghost btn-sm btn-icon" onclick="editAnnualGoal(${g.id})">✎</button>
            <button class="btn btn-ghost btn-sm btn-icon" onclick="deleteAnnualGoal(${g.id},'${g.goal_title.replace(/'/g,"\\'")}')">✕</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function openAddAnnualGoal() {
  editingAnnualGoalId = null;
  document.getElementById('annual-goal-modal-title').textContent = 'Add Annual Goal';
  document.getElementById('annual-goal-id').value = '';
  ['ag-title','ag-desc','ag-unit','ag-q1t','ag-q2t','ag-q3t','ag-q4t','ag-q1a','ag-q2a','ag-q3a','ag-q4a'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ag-year').value = '2026';
  showModal('annual-goal-modal');
}
window.openAddAnnualGoal = openAddAnnualGoal;

async function editAnnualGoal(id) {
  const goals = await api('GET', '/annual-goals');
  const g = goals.find(x => x.id === id);
  if (!g) return;
  editingAnnualGoalId = id;
  document.getElementById('annual-goal-modal-title').textContent = 'Edit Annual Goal';
  document.getElementById('ag-title').value = g.goal_title || '';
  document.getElementById('ag-desc').value  = g.goal_description || '';
  document.getElementById('ag-unit').value  = g.unit || '';
  document.getElementById('ag-year').value  = g.year || 2026;
  document.getElementById('ag-q1t').value   = g.q1_target ?? '';
  document.getElementById('ag-q2t').value   = g.q2_target ?? '';
  document.getElementById('ag-q3t').value   = g.q3_target ?? '';
  document.getElementById('ag-q4t').value   = g.q4_target ?? '';
  document.getElementById('ag-q1a').value   = g.q1_actual ?? '';
  document.getElementById('ag-q2a').value   = g.q2_actual ?? '';
  document.getElementById('ag-q3a').value   = g.q3_actual ?? '';
  document.getElementById('ag-q4a').value   = g.q4_actual ?? '';
  showModal('annual-goal-modal');
}
window.editAnnualGoal = editAnnualGoal;

async function saveAnnualGoal() {
  const v = id => document.getElementById(id).value;
  const data = {
    year:             +v('ag-year'),
    goal_title:       v('ag-title').trim(),
    goal_description: v('ag-desc').trim(),
    unit:             v('ag-unit').trim(),
    q1_target: +v('ag-q1t') || null, q2_target: +v('ag-q2t') || null,
    q3_target: +v('ag-q3t') || null, q4_target: +v('ag-q4t') || null,
    q1_actual: v('ag-q1a') !== '' ? +v('ag-q1a') : null,
    q2_actual: v('ag-q2a') !== '' ? +v('ag-q2a') : null,
    q3_actual: v('ag-q3a') !== '' ? +v('ag-q3a') : null,
    q4_actual: v('ag-q4a') !== '' ? +v('ag-q4a') : null,
  };
  if (!data.goal_title) return showToast('Title required', 'error');
  try {
    if (editingAnnualGoalId) {
      await api('PUT', `/annual-goals/${editingAnnualGoalId}`, data);
    } else {
      await api('POST', '/annual-goals', data);
    }
    hideModal('annual-goal-modal');
    renderAnnualGoals();
    showToast('Goal saved', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteAnnualGoal(id, name) {
  confirmDelete(`Delete goal "${name}"?`, async () => {
    await api('DELETE', `/annual-goals/${id}`);
    renderAnnualGoals();
    showToast('Goal deleted');
  });
}
window.deleteAnnualGoal = deleteAnnualGoal;
