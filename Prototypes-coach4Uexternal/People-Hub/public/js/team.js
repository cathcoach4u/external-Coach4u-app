/* ─── Team Structure Panel ───────────────────────────────────────────────── */
const TeamPanel = (() => {
  let priorities = [];
  let deptGoals  = {};
  let kpisByUser = {};
  let allUsers   = [];
  let loaded     = false;

  function init() {
    document.getElementById('btn-sync-priorities').addEventListener('click', syncPriorities);
    document.getElementById('btn-add-priority').addEventListener('click', () => openPriorityModal());
    document.getElementById('btn-save-priority').addEventListener('click', savePriority);
    document.getElementById('btn-save-goal').addEventListener('click', saveGoal);
    load();
  }

  async function load() {
    if (loaded) return;
    loaded = true;
    await refresh();
  }

  async function refresh() {
    const el = document.getElementById('team-content');
    el.innerHTML = '<div class="loading"><span class="spinner"></span>Loading…</div>';
    try {
      [priorities, allUsers] = await Promise.all([
        API.get('/priorities'),
        API.get('/users')
      ]);

      // Load goals for each department
      const depts = window.allDepts || await API.get('/departments');
      window.allDepts = depts;

      const goalPromises = depts.map(d => API.get(`/departments/${d.id}/goals`).then(g => ({ deptId: d.id, goals: g })));
      const goalResults = await Promise.all(goalPromises);
      deptGoals = {};
      for (const { deptId, goals } of goalResults) deptGoals[deptId] = goals;

      render(depts);
    } catch (err) {
      el.innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
    }
  }

  function render(depts) {
    const el = document.getElementById('team-content');
    const role = window.currentUser?.role;
    const canEdit = role === 'manager' || role === 'admin';

    if (!priorities.length && !depts.some(d => (deptGoals[d.id]||[]).length)) {
      el.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">🎯</div>
        <h3>No priorities yet</h3>
        <p>Sync from the Strategic Hub or add priorities manually to get started.</p>
      </div>`;
      return;
    }

    // Group priorities by quarter
    const byQuarter = {};
    for (const p of priorities) {
      if (!byQuarter[p.quarter]) byQuarter[p.quarter] = [];
      byQuarter[p.quarter].push(p);
    }

    let html = '';

    for (const [quarter, qPriorities] of Object.entries(byQuarter)) {
      html += `<div style="margin-bottom:32px">
        <h2 style="font-size:16px;font-weight:700;color:var(--primary);margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid var(--border)">${quarter} — Company Priorities</h2>`;

      for (const p of qPriorities) {
        const displayDesc = p.amended_description || p.original_description;
        const statusIcon = { on_track: '🟢', at_risk: '🟡', off_track: '🔴', complete: '✅' }[p.status] || '⚪';

        html += `<div class="hierarchy-item hierarchy-level-0" style="margin-bottom:16px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span style="font-size:13px">${statusIcon}</span>
                <strong style="font-size:14px">${displayDesc}</strong>
                ${p.is_synced ? '<span class="badge badge-blue" style="font-size:10px">Strategic Hub</span>' : ''}
                ${p.amended_description ? '<span class="badge badge-yellow" style="font-size:10px">Amended</span>' : ''}
              </div>
              ${p.amended_description ? `<div style="font-size:12px;color:var(--text-muted);margin-left:21px">Original: ${p.original_description}</div>` : ''}
              ${p.owner ? `<div style="font-size:12px;color:var(--text-muted);margin-left:21px;margin-top:2px">Owner: ${p.owner}</div>` : ''}
            </div>
            ${canEdit ? `<div style="display:flex;gap:4px;flex-shrink:0">
              <button class="btn btn-secondary btn-sm" onclick="TeamPanel.editPriority(${p.id})">Edit</button>
            </div>` : ''}
          </div>

          <!-- Department Goals linked to this priority -->
          ${depts.map(dept => {
            const goals = (deptGoals[dept.id] || []).filter(g => g.priority_id === p.id);
            if (!goals.length) return '';
            return `<div style="margin-top:12px">
              <div class="hierarchy-connector">Department — ${dept.name}</div>
              ${goals.map(g => renderGoal(g, dept, canEdit)).join('')}
            </div>`;
          }).join('')}
        </div>`;
      }
      html += '</div>';
    }

    // Show goals not linked to any priority
    const unlinkedSections = depts.map(dept => {
      const goals = (deptGoals[dept.id] || []).filter(g => !g.priority_id);
      if (!goals.length) return '';
      return `<div style="margin-bottom:24px">
        <h3 style="font-size:14px;font-weight:700;color:var(--text-muted);margin-bottom:12px">${dept.name} — Unlinked Goals</h3>
        ${goals.map(g => renderGoal(g, dept, canEdit)).join('')}
      </div>`;
    }).join('');

    if (unlinkedSections.replace(/<[^>]*>/g,'').trim()) {
      html += `<div style="margin-bottom:32px"><h2 style="font-size:16px;font-weight:700;color:var(--primary);margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid var(--border)">Department Goals (Not Yet Linked)</h2>${unlinkedSections}</div>`;
    }

    // Add goal buttons per dept
    if (canEdit) {
      html += `<div style="margin-bottom:32px">
        <h2 style="font-size:16px;font-weight:700;color:var(--primary);margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid var(--border)">Add Department Goals</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${depts.map(d => `<button class="btn btn-secondary btn-sm" onclick="TeamPanel.openGoalModal(${d.id},'${d.name}')">+ Goal for ${d.name}</button>`).join('')}
        </div>
      </div>`;
    }

    el.innerHTML = html;
  }

  function renderGoal(g, dept, canEdit) {
    const statusIcon = { on_track:'🟢', at_risk:'🟡', off_track:'🔴', complete:'✅' }[g.status] || '⚪';
    // Find staff with KPIs linked to this goal
    const linkedKpis = []; // we don't have individual KPIs loaded here — shown in People panel
    return `<div class="hierarchy-item hierarchy-level-1">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:12px">${statusIcon}</span>
            <span style="font-size:13.5px;font-weight:600">${g.description}</span>
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Department: ${dept.name}</div>
        </div>
        ${canEdit ? `<div style="display:flex;gap:4px;flex-shrink:0">
          <button class="btn btn-secondary btn-sm" onclick="TeamPanel.editGoal(${g.id},${dept.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="TeamPanel.deleteGoal(${g.id})">✕</button>
        </div>` : ''}
      </div>
      <!-- Staff with KPIs for this goal -->
      ${renderStaffKpisForGoal(g.id, dept.id)}
    </div>`;
  }

  function renderStaffKpisForGoal(goalId, deptId) {
    const deptUsers = allUsers.filter(u => u.department_id === deptId && u.role === 'staff');
    if (!deptUsers.length) return '';
    // We don't have KPIs pre-loaded; show staff names as a hint
    const names = deptUsers.map(u => u.name).join(', ');
    return `<div style="margin-top:8px;margin-left:8px;font-size:12px;color:var(--text-muted)">
      Team: ${names} — <a href="#" onclick="App.switchPanel('people');return false" style="font-size:12px">View individual KPIs →</a>
    </div>`;
  }

  async function syncPriorities() {
    const btn = document.getElementById('btn-sync-priorities');
    btn.disabled = true;
    btn.textContent = '⟳ Syncing…';
    try {
      const result = await API.post('/priorities/sync', {});
      toast(`Synced: ${result.added} new, ${result.updated} updated`);
      loaded = false;
      await refresh();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '⟳ Sync from Strategic Hub';
    }
  }

  function openPriorityModal(priority = null) {
    document.getElementById('priority-id').value            = priority?.id || '';
    document.getElementById('priority-quarter').value       = priority?.quarter || '';
    document.getElementById('priority-description').value   = priority?.original_description || '';
    document.getElementById('priority-owner').value         = priority?.owner || '';
    document.getElementById('priority-status').value        = priority?.status || 'on_track';
    document.getElementById('priority-amended').value       = priority?.amended_description || '';
    document.getElementById('modal-priority-title').textContent = priority ? 'Edit Priority' : 'Add Priority';

    const isSynced = !!priority?.is_synced;
    document.getElementById('priority-amend-note').style.display  = isSynced ? '' : 'none';
    document.getElementById('priority-amend-group').style.display = isSynced ? '' : 'none';
    document.getElementById('priority-description').readOnly = isSynced;

    // Pre-fill quarter
    if (!priority) {
      const now = new Date();
      const q   = Math.ceil((now.getMonth() + 1) / 3);
      document.getElementById('priority-quarter').value = `Q${q} ${now.getFullYear()}`;
    }

    showModal('modal-priority');
  }

  async function savePriority() {
    const id   = document.getElementById('priority-id').value;
    const body = {
      quarter:              document.getElementById('priority-quarter').value.trim(),
      description:          document.getElementById('priority-description').value.trim(),
      owner:                document.getElementById('priority-owner').value.trim(),
      status:               document.getElementById('priority-status').value,
      amended_description:  document.getElementById('priority-amended').value.trim() || null,
    };
    if (!body.quarter || !body.description) return toast('Quarter and description required', 'error');
    try {
      if (id) await API.put(`/priorities/${id}`, body);
      else    await API.post('/priorities', body);
      toast(id ? 'Priority updated' : 'Priority added');
      hideModal('modal-priority');
      loaded = false;
      await refresh();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function editPriority(id) {
    const p = priorities.find(x => x.id === id);
    if (p) openPriorityModal(p);
  }

  function openGoalModal(deptId, deptName, goal = null) {
    document.getElementById('goal-id').value          = goal?.id || '';
    document.getElementById('goal-dept-id').value     = deptId;
    document.getElementById('goal-description').value = goal?.description || '';
    document.getElementById('goal-status').value      = goal?.status || 'on_track';
    document.getElementById('modal-goal-title').textContent = goal ? `Edit Goal — ${deptName}` : `Add Goal — ${deptName}`;

    const sel = document.getElementById('goal-priority-id');
    sel.innerHTML = '<option value="">— Not linked —</option>' +
      priorities.map(p => `<option value="${p.id}">${p.quarter}: ${(p.amended_description||p.original_description).slice(0,60)}</option>`).join('');
    sel.value = goal?.priority_id || '';

    showModal('modal-goal');
  }

  async function editGoal(goalId, deptId) {
    const goals = deptGoals[deptId] || [];
    const goal  = goals.find(g => g.id === goalId);
    const dept  = (window.allDepts||[]).find(d => d.id === deptId);
    if (goal && dept) openGoalModal(deptId, dept.name, goal);
  }

  async function saveGoal() {
    const id     = document.getElementById('goal-id').value;
    const deptId = document.getElementById('goal-dept-id').value;
    const body   = {
      description: document.getElementById('goal-description').value.trim(),
      priority_id: document.getElementById('goal-priority-id').value || null,
      status:      document.getElementById('goal-status').value,
    };
    if (!body.description) return toast('Description required', 'error');
    try {
      if (id) await API.put(`/departments/goals/${id}`, body);
      else    await API.post(`/departments/${deptId}/goals`, body);
      toast(id ? 'Goal updated' : 'Goal added');
      hideModal('modal-goal');
      loaded = false;
      await refresh();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function deleteGoal(id) {
    if (!confirm('Delete this goal?')) return;
    try {
      await API.delete(`/departments/goals/${id}`);
      toast('Goal deleted');
      loaded = false;
      await refresh();
    } catch (err) { toast(err.message, 'error'); }
  }

  return { init, load, refresh, editPriority, openGoalModal, editGoal, deleteGoal };
})();
