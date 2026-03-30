/* ─── People Panel ───────────────────────────────────────────────────────── */
const PeoplePanel = (() => {
  let allPeople  = [];
  let priorities = [];
  let deptGoals  = {};
  let currentProfileId = null;

  function init() {
    document.getElementById('people-search').addEventListener('input', filterList);
    document.getElementById('people-dept-filter').addEventListener('change', filterList);
    document.getElementById('btn-back-people').addEventListener('click', showList);
    document.getElementById('btn-save-strengths').addEventListener('click', saveStrengths);
    document.getElementById('btn-save-kpi').addEventListener('click', saveKpi);
    document.getElementById('btn-save-note').addEventListener('click', saveNote);
    document.getElementById('btn-save-file').addEventListener('click', saveFile);
    document.getElementById('btn-suggest-kpis').addEventListener('click', suggestKpis);
    showList();
  }

  async function showList() {
    currentProfileId = null;
    document.getElementById('people-list-view').style.display = '';
    document.getElementById('people-profile-view').style.display = 'none';
    document.getElementById('btn-back-people').style.display = 'none';
    document.getElementById('people-subtitle').textContent = 'Select a person to view their profile';

    const grid = document.getElementById('people-grid');
    grid.innerHTML = '<div class="loading"><span class="spinner"></span>Loading…</div>';
    try {
      allPeople = await API.get('/users');
      renderList(allPeople);
    } catch (err) {
      grid.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
    }
  }

  function renderList(people) {
    const grid = document.getElementById('people-grid');
    if (!people.length) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👤</div><h3>No people found</h3></div>';
      return;
    }

    // Group by department
    const byDept = {};
    for (const p of people) {
      const key = p.department_name || 'No Department';
      if (!byDept[key]) byDept[key] = [];
      byDept[key].push(p);
    }

    let html = '';
    for (const [dept, members] of Object.entries(byDept)) {
      html += `<div style="margin-bottom:24px">
        <h3 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:12px">${dept}</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">
          ${members.map(p => `
            <div class="card" style="padding:16px;cursor:pointer;transition:box-shadow 0.15s" onmouseenter="this.style.boxShadow='var(--shadow-md)'" onmouseleave="this.style.boxShadow=''" onclick="PeoplePanel.showProfile(${p.id})">
              <div class="person-card" style="margin-bottom:10px">
                <div class="person-avatar" style="background:${avatarColor(p.role)}">${initials(p.name)}</div>
                <div>
                  <div class="person-name">${p.name}</div>
                  <div class="person-title">${p.job_title||'—'}</div>
                </div>
              </div>
              <div style="display:flex;gap:4px;flex-wrap:wrap">
                <span class="badge badge-${p.role==='admin'?'purple':p.role==='manager'?'blue':'gray'}">${p.role}</span>
                ${p.manager_name ? `<span class="badge badge-gray" style="font-size:10px">Mgr: ${p.manager_name}</span>` : ''}
              </div>
            </div>`).join('')}
        </div>
      </div>`;
    }
    grid.innerHTML = html;
  }

  function filterList() {
    const q    = document.getElementById('people-search').value.toLowerCase();
    const dept = document.getElementById('people-dept-filter').value;
    const filtered = allPeople.filter(p =>
      (!q || p.name.toLowerCase().includes(q) || (p.job_title||'').toLowerCase().includes(q)) &&
      (!dept || String(p.department_id) === dept)
    );
    renderList(filtered);
  }

  async function showProfile(userId) {
    currentProfileId = userId;
    document.getElementById('people-list-view').style.display = 'none';
    document.getElementById('people-profile-view').style.display = '';
    document.getElementById('btn-back-people').style.display = '';

    const view = document.getElementById('people-profile-view');
    view.innerHTML = '<div class="loading"><span class="spinner"></span>Loading profile…</div>';

    try {
      const [user, kpis] = await Promise.all([
        API.get(`/users/${userId}`),
        API.get(`/kpis?user_id=${userId}`)
      ]);

      priorities = priorities.length ? priorities : await API.get('/priorities');
      const depts = window.allDepts || await API.get('/departments');
      if (user.department_id && !deptGoals[user.department_id]) {
        deptGoals[user.department_id] = await API.get(`/departments/${user.department_id}/goals`);
      }

      document.getElementById('people-subtitle').textContent = user.name;
      const role = window.currentUser?.role;
      const canEdit = role === 'admin' || (role === 'manager' && user.manager_id === window.currentUser.id) || role === 'admin';
      const isManager = role === 'manager' || role === 'admin';
      const isSelf    = userId === window.currentUser?.id;

      view.innerHTML = renderProfile(user, kpis, canEdit, isManager, isSelf);
      bindProfileTabs(userId, canEdit, isManager);
    } catch (err) {
      view.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
    }
  }

  function renderProfile(user, kpis, canEdit, isManager, isSelf) {
    const strengths = user.strengths || [];
    const greenCount  = kpis.filter(k => k.status === 'green').length;
    const yellowCount = kpis.filter(k => k.status === 'yellow').length;
    const redCount    = kpis.filter(k => k.status === 'red').length;

    return `
    <div style="display:grid;grid-template-columns:300px 1fr;gap:20px;align-items:start">

      <!-- LEFT SIDEBAR -->
      <div>
        <div class="card" style="padding:24px;text-align:center;margin-bottom:16px">
          <div class="person-avatar lg" style="margin:0 auto 12px;background:${avatarColor(user.role)}">${initials(user.name)}</div>
          <div style="font-size:20px;font-weight:800;color:var(--primary)">${user.name}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${user.job_title||'—'}</div>
          <div style="margin-top:8px">
            <span class="badge badge-${user.role==='admin'?'purple':user.role==='manager'?'blue':'gray'}">${user.role}</span>
          </div>
          ${user.department_name ? `<div style="font-size:12px;color:var(--text-muted);margin-top:8px">🏢 ${user.department_name}</div>` : ''}
          ${user.manager_name ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px">👤 Reports to ${user.manager_name}</div>` : ''}
        </div>

        <!-- KPI Summary -->
        <div class="card" style="padding:16px;margin-bottom:16px">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:12px">KPI Summary</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
            <div style="background:var(--green-bg);border-radius:6px;padding:8px">
              <div style="font-size:22px;font-weight:800;color:var(--green)">${greenCount}</div>
              <div style="font-size:10px;color:#065F46;font-weight:600">GREEN</div>
            </div>
            <div style="background:var(--yellow-bg);border-radius:6px;padding:8px">
              <div style="font-size:22px;font-weight:800;color:var(--warning)">${yellowCount}</div>
              <div style="font-size:10px;color:#92400E;font-weight:600">YELLOW</div>
            </div>
            <div style="background:var(--red-bg);border-radius:6px;padding:8px">
              <div style="font-size:22px;font-weight:800;color:var(--danger)">${redCount}</div>
              <div style="font-size:10px;color:#991B1B;font-weight:600">RED</div>
            </div>
          </div>
        </div>

        <!-- CliftonStrengths -->
        <div class="card" style="padding:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted)">CliftonStrengths</div>
            ${canEdit || isSelf ? `<button class="btn btn-secondary btn-sm" onclick="PeoplePanel.openStrengthsModal(${user.id})">Edit</button>` : ''}
          </div>
          ${strengths.length ? strengths.map(s => {
            const sd = CLIFTON_STRENGTHS.find(x => x.name === s.strength) || {};
            return `<div class="strength-card" style="margin-bottom:8px">
              <div class="strength-rank">${s.rank}</div>
              <div style="flex:1">
                <div style="font-size:13.5px;font-weight:700">${s.strength}</div>
                <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
                  ${sd.domain ? `<span class="strength-domain domain-${domainClass(sd.domain)}">${sd.domain}</span>` : ''}
                  <span style="font-size:11px;color:var(--text-muted)">${sd.description||''}</span>
                </div>
              </div>
            </div>`;
          }).join('') : `<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px">
            No strengths recorded yet<br>
            ${canEdit || isSelf ? `<button class="btn btn-accent btn-sm" style="margin-top:8px" onclick="PeoplePanel.openStrengthsModal(${user.id})">+ Add Strengths</button>` : ''}
          </div>`}
          ${strengths.length && canEdit ? `<div style="margin-top:8px">
            <button class="btn btn-secondary btn-sm" style="width:100%" onclick="PeoplePanel.suggestDevGoals(${user.id})">🤖 Suggest Development Goals</button>
          </div>` : ''}
          <div id="dev-goals-result" style="display:none;margin-top:10px"></div>
        </div>
      </div>

      <!-- MAIN CONTENT -->
      <div>
        <div class="sub-tabs" id="profile-tabs">
          <button class="sub-tab active" data-subtab="tab-kpis">KPIs</button>
          ${isManager ? '<button class="sub-tab" data-subtab="tab-notes">Notes 🔒</button>' : ''}
          ${isManager ? '<button class="sub-tab" data-subtab="tab-files">Files 🔒</button>' : ''}
        </div>

        <!-- KPIs Tab -->
        <div class="sub-panel active" id="tab-kpis">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div style="font-size:13px;color:var(--text-muted)">${kpis.length} KPI${kpis.length!==1?'s':''} tracked</div>
            ${canEdit ? `<button class="btn btn-primary btn-sm" onclick="PeoplePanel.openKpiModal(${user.id})">+ Add KPI</button>` : ''}
          </div>
          ${renderKpiList(kpis, user, canEdit, isSelf)}
          ${canEdit && kpis.length ? `<button class="btn btn-secondary btn-sm" style="margin-top:12px" onclick="PeoplePanel.suggestTopics(${user.id})">🤖 Suggest 1:1 Topics</button>
          <div id="topics-result" style="display:none;margin-top:10px"></div>` : ''}
        </div>

        <!-- Notes Tab (manager only) -->
        ${isManager ? `<div class="sub-panel" id="tab-notes">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div style="font-size:13px;color:var(--text-muted)">Private notes — visible to you only</div>
            <button class="btn btn-primary btn-sm" onclick="PeoplePanel.openNoteModal(${user.id})">+ Add Note</button>
          </div>
          <div id="notes-list-${user.id}"><div class="loading"><span class="spinner"></span>Loading…</div></div>
        </div>` : ''}

        <!-- Files Tab (manager only) -->
        ${isManager ? `<div class="sub-panel" id="tab-files">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div style="font-size:13px;color:var(--text-muted)">Document links — SharePoint, OneDrive, Google Drive, or file paths</div>
            <button class="btn btn-primary btn-sm" onclick="PeoplePanel.openFileModal(${user.id})">+ Add File</button>
          </div>
          <div id="files-list-${user.id}"><div class="loading"><span class="spinner"></span>Loading…</div></div>
        </div>` : ''}
      </div>
    </div>`;
  }

  function renderKpiList(kpis, user, canEdit, isSelf) {
    if (!kpis.length) return `<div class="empty-state"><div class="empty-state-icon">📊</div><h3>No KPIs yet</h3><p>${canEdit?'Add KPIs to track performance.':'Your manager will add KPIs for you.'}</p></div>`;
    return kpis.map(k => {
      const progress = calcProgress(k);
      return `<div class="card" style="padding:16px;margin-bottom:10px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              ${trafficLight(k.status)}
              <strong style="font-size:14px">${k.description}</strong>
            </div>
            ${k.goal_description ? `<div style="font-size:11.5px;color:var(--text-muted);margin-bottom:6px">Dept Goal: ${k.goal_description}</div>` : ''}
            <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
              <div style="font-size:13px"><span style="color:var(--text-muted)">Current:</span> <strong>${k.current_value||'—'}${k.unit?' '+k.unit:''}</strong></div>
              <div style="font-size:13px"><span style="color:var(--text-muted)">Target:</span> <strong>${k.target||'—'}${k.unit?' '+k.unit:''}</strong></div>
              ${k.target_type === 'percentage' || k.target_type === 'number' ? progressBar(progress) : ''}
            </div>
            ${k.notes ? `<div style="font-size:12px;color:var(--text-muted);margin-top:6px;font-style:italic">${k.notes}</div>` : ''}
          </div>
          ${canEdit || isSelf ? `<div style="display:flex;gap:4px;flex-shrink:0">
            <button class="btn btn-secondary btn-sm" onclick="PeoplePanel.editKpi(${k.id},${user.id})">Edit</button>
            ${canEdit ? `<button class="btn btn-danger btn-sm" onclick="PeoplePanel.deleteKpi(${k.id},${user.id})">✕</button>` : ''}
          </div>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  function calcProgress(k) {
    const cur = parseFloat(k.current_value);
    const tgt = parseFloat(k.target);
    if (isNaN(cur) || isNaN(tgt) || tgt === 0) return null;
    return Math.min(100, Math.round((cur / tgt) * 100));
  }

  function progressBar(pct) {
    if (pct === null) return '';
    const color = pct >= 100 ? 'var(--green)' : pct >= 75 ? 'var(--warning)' : 'var(--danger)';
    return `<div style="flex:1;min-width:100px">
      <div style="background:#F1F5F9;border-radius:4px;height:6px;overflow:hidden">
        <div style="width:${pct}%;background:${color};height:100%;border-radius:4px;transition:width 0.4s"></div>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${pct}% of target</div>
    </div>`;
  }

  function bindProfileTabs(userId, canEdit, isManager) {
    document.querySelectorAll('#profile-tabs .sub-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#profile-tabs .sub-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.sub-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.subtab).classList.add('active');

        if (btn.dataset.subtab === 'tab-notes' && isManager) loadNotes(userId);
        if (btn.dataset.subtab === 'tab-files' && isManager) loadFiles(userId);
      });
    });
  }

  async function loadNotes(userId) {
    const el = document.getElementById(`notes-list-${userId}`);
    if (!el) return;
    try {
      const notes = await API.get(`/notes?user_id=${userId}`);
      if (!notes.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><h3>No notes yet</h3><p>Add private notes about this person.</p></div>';
        return;
      }
      const tagColors = { performance:'blue', development:'green', win:'purple', concern:'red', feedback:'yellow' };
      el.innerHTML = notes.map(n => {
        const tags = JSON.parse(n.tags || '[]');
        return `<div class="note-entry">
          <div class="note-meta">
            <div style="display:flex;align-items:center;gap:8px">
              ${tags.map(t => `<span class="badge badge-${tagColors[t]||'gray'}">${t==='win'?'🎉 ':''} ${t}</span>`).join('')}
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="note-date">${fmtDate(n.created_at)}</span>
              <button class="btn btn-icon btn-sm" onclick="PeoplePanel.editNote(${n.id},${userId})">✏</button>
              <button class="btn btn-danger btn-sm" onclick="PeoplePanel.deleteNote(${n.id},${userId})">✕</button>
            </div>
          </div>
          <div class="note-content">${n.content}</div>
        </div>`;
      }).join('');
    } catch (err) { el.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`; }
  }

  async function loadFiles(userId) {
    const el = document.getElementById(`files-list-${userId}`);
    if (!el) return;
    try {
      const files = await API.get(`/files?user_id=${userId}`);
      if (!files.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📁</div><h3>No files yet</h3><p>Add links to performance reviews, certifications, and other documents.</p></div>';
        return;
      }
      const typeIcons = { performance_review:'📋', certification:'🎓', training:'📚', contract:'📄', other:'🔗' };
      el.innerHTML = `<div class="card"><div class="card-body">${files.map(f => `
        <div class="file-item">
          <div class="file-icon">${typeIcons[f.file_type]||'🔗'}</div>
          <div class="file-info">
            <a class="file-name" href="${f.link_path}" target="_blank" rel="noopener">${f.description||f.link_path}</a>
            <div class="file-meta">${f.file_type.replace('_',' ')} · Added ${fmtDate(f.date_added)} by ${f.added_by_name}</div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="PeoplePanel.deleteFile(${f.id},${userId})">✕</button>
        </div>`).join('')}
      </div></div>`;
    } catch (err) { el.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`; }
  }

  // ─── Strengths Modal ──────────────────────────────────────────────────────

  function openStrengthsModal(userId) {
    document.getElementById('strengths-user-id').value = userId;
    const user = allPeople.find(u => u.id === userId);
    const existing = user?.strengths || [];

    const container = document.getElementById('strengths-selects');
    container.innerHTML = [1,2,3,4,5].map(rank => {
      const current = existing.find(s => s.rank === rank)?.strength || '';
      return `<div class="form-group">
        <label>Strength #${rank}${rank===1?' (Dominant)':''}</label>
        <select id="strength-sel-${rank}">
          <option value="">— Select —</option>
          ${CLIFTON_STRENGTHS.map(s => `<option value="${s.name}" ${s.name===current?'selected':''}>${s.name} (${s.domain})</option>`).join('')}
        </select>
      </div>`;
    }).join('');
    showModal('modal-strengths');
  }

  async function saveStrengths() {
    const userId = document.getElementById('strengths-user-id').value;
    const strengths = [1,2,3,4,5].map(rank => ({
      strength: document.getElementById(`strength-sel-${rank}`).value,
      rank
    })).filter(s => s.strength);
    try {
      await API.put(`/users/${userId}/strengths`, { strengths });
      toast('Strengths updated');
      hideModal('modal-strengths');
      await showProfile(+userId);
    } catch (err) { toast(err.message, 'error'); }
  }

  // ─── KPI Modal ────────────────────────────────────────────────────────────

  function openKpiModal(userId, kpi = null) {
    document.getElementById('kpi-id').value           = kpi?.id || '';
    document.getElementById('kpi-user-id').value      = userId;
    document.getElementById('kpi-description').value  = kpi?.description || '';
    document.getElementById('kpi-target').value       = kpi?.target || '';
    document.getElementById('kpi-type').value         = kpi?.target_type || 'number';
    document.getElementById('kpi-unit').value         = kpi?.unit || '';
    document.getElementById('kpi-current').value      = kpi?.current_value || '';
    document.getElementById('kpi-status').value       = kpi?.status || 'green';
    document.getElementById('kpi-notes').value        = kpi?.notes || '';
    document.getElementById('modal-kpi-title').textContent = kpi ? 'Edit KPI' : 'Add KPI';
    document.getElementById('kpi-ai-suggestions').style.display = 'none';

    // Load department goals for this user's dept
    const user = allPeople.find(u => u.id === userId);
    const goals = user?.department_id ? (deptGoals[user.department_id] || []) : [];
    const sel = document.getElementById('kpi-goal-id');
    sel.innerHTML = '<option value="">— None —</option>' + goals.map(g => `<option value="${g.id}" ${kpi?.department_goal_id===g.id?'selected':''}>${g.description.slice(0,60)}</option>`).join('');

    showModal('modal-kpi');
  }

  async function editKpi(kpiId, userId) {
    try {
      const kpis = await API.get(`/kpis?user_id=${userId}`);
      const kpi  = kpis.find(k => k.id === kpiId);
      if (kpi) openKpiModal(userId, kpi);
    } catch (err) { toast(err.message, 'error'); }
  }

  async function saveKpi() {
    const id     = document.getElementById('kpi-id').value;
    const userId = document.getElementById('kpi-user-id').value;
    const body   = {
      user_id:           +userId,
      description:       document.getElementById('kpi-description').value.trim(),
      target:            document.getElementById('kpi-target').value.trim(),
      target_type:       document.getElementById('kpi-type').value,
      unit:              document.getElementById('kpi-unit').value.trim(),
      current_value:     document.getElementById('kpi-current').value.trim(),
      status:            document.getElementById('kpi-status').value,
      notes:             document.getElementById('kpi-notes').value.trim(),
      department_goal_id:document.getElementById('kpi-goal-id').value || null,
    };
    if (!body.description) return toast('Description required', 'error');
    try {
      if (id) await API.put(`/kpis/${id}`, body);
      else    await API.post('/kpis', body);
      toast(id ? 'KPI updated' : 'KPI added');
      hideModal('modal-kpi');
      await showProfile(+userId);
    } catch (err) { toast(err.message, 'error'); }
  }

  async function deleteKpi(kpiId, userId) {
    if (!confirm('Delete this KPI?')) return;
    try {
      await API.delete(`/kpis/${kpiId}`);
      toast('KPI deleted');
      await showProfile(userId);
    } catch (err) { toast(err.message, 'error'); }
  }

  // ─── Notes ────────────────────────────────────────────────────────────────

  function openNoteModal(userId, note = null) {
    document.getElementById('note-id').value      = note?.id || '';
    document.getElementById('note-user-id').value = userId;
    document.getElementById('note-content').value = note?.content || '';
    document.getElementById('modal-note-title').textContent = note ? 'Edit Note' : 'Add Note';
    const tags = JSON.parse(note?.tags || '[]');
    document.querySelectorAll('.note-tag-cb').forEach(cb => { cb.checked = tags.includes(cb.value); });
    showModal('modal-note');
  }

  async function editNote(noteId, userId) {
    try {
      const notes = await API.get(`/notes?user_id=${userId}`);
      const note  = notes.find(n => n.id === noteId);
      if (note) openNoteModal(userId, note);
    } catch (err) { toast(err.message, 'error'); }
  }

  async function saveNote() {
    const id     = document.getElementById('note-id').value;
    const userId = document.getElementById('note-user-id').value;
    const content = document.getElementById('note-content').value.trim();
    const tags    = Array.from(document.querySelectorAll('.note-tag-cb:checked')).map(cb => cb.value);
    if (!content) return toast('Note content required', 'error');
    try {
      if (id) await API.put(`/notes/${id}`, { content, tags });
      else    await API.post('/notes', { about_user_id: +userId, content, tags });
      toast(id ? 'Note updated' : 'Note added');
      hideModal('modal-note');
      loadNotes(+userId);
    } catch (err) { toast(err.message, 'error'); }
  }

  async function deleteNote(noteId, userId) {
    if (!confirm('Delete this note?')) return;
    try {
      await API.delete(`/notes/${noteId}`);
      toast('Note deleted');
      loadNotes(userId);
    } catch (err) { toast(err.message, 'error'); }
  }

  // ─── Files ────────────────────────────────────────────────────────────────

  function openFileModal(userId) {
    document.getElementById('file-user-id').value  = userId;
    document.getElementById('file-link').value     = '';
    document.getElementById('file-description').value = '';
    document.getElementById('file-type').value     = 'other';
    document.getElementById('file-date').value     = new Date().toISOString().slice(0,10);
    showModal('modal-file');
  }

  async function saveFile() {
    const userId = document.getElementById('file-user-id').value;
    const body   = {
      user_id:     +userId,
      link_path:   document.getElementById('file-link').value.trim(),
      description: document.getElementById('file-description').value.trim(),
      file_type:   document.getElementById('file-type').value,
      date_added:  document.getElementById('file-date').value,
    };
    if (!body.link_path) return toast('Link or file path required', 'error');
    try {
      await API.post('/files', body);
      toast('File added');
      hideModal('modal-file');
      loadFiles(+userId);
    } catch (err) { toast(err.message, 'error'); }
  }

  async function deleteFile(fileId, userId) {
    if (!confirm('Remove this file reference?')) return;
    try {
      await API.delete(`/files/${fileId}`);
      toast('File removed');
      loadFiles(userId);
    } catch (err) { toast(err.message, 'error'); }
  }

  // ─── AI Features ─────────────────────────────────────────────────────────

  async function suggestKpis() {
    const userId = document.getElementById('kpi-user-id').value;
    const el     = document.getElementById('kpi-ai-suggestions');
    el.innerHTML = '<div class="loading"><span class="spinner"></span>Generating suggestions…</div>';
    el.style.display = '';
    try {
      const priorities = await API.get('/priorities');
      const topP = priorities[0];
      const result = await API.post('/ai/suggest-kpis', {
        user_id: +userId,
        priority_description: topP?.original_description || 'Grow company performance',
        department_goal: ''
      });
      el.innerHTML = `<div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px">Click to add:</div>` +
        result.kpis.map(k => `<div class="ai-response-item" onclick="PeoplePanel.applyKpiSuggestion('${k.description}','${k.target}','${k.unit||''}','${k.target_type||'number'}')">
          <strong>${k.description}</strong> — Target: ${k.target} ${k.unit||''}
        </div>`).join('');
    } catch (err) { el.innerHTML = `<div style="color:var(--danger);font-size:13px">${err.message}</div>`; }
  }

  function applyKpiSuggestion(desc, target, unit, type) {
    document.getElementById('kpi-description').value = desc;
    document.getElementById('kpi-target').value      = target;
    document.getElementById('kpi-unit').value        = unit;
    document.getElementById('kpi-type').value        = type;
  }

  async function suggestTopics(userId) {
    const el = document.getElementById('topics-result');
    el.innerHTML = '<div class="loading"><span class="spinner"></span>Generating topics…</div>';
    el.style.display = '';
    try {
      const result = await API.post('/ai/suggest-topics', { staff_id: userId });
      el.innerHTML = `<div class="card"><div class="card-header">🤖 Suggested 1:1 Topics</div><div class="card-body">
        ${result.topics.map(t => `<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13.5px">• ${t}</div>`).join('')}
      </div></div>`;
    } catch (err) { el.innerHTML = `<div style="color:var(--danger);font-size:13px">${err.message}</div>`; }
  }

  async function suggestDevGoals(userId) {
    const el = document.getElementById('dev-goals-result');
    el.innerHTML = '<div class="loading"><span class="spinner"></span>Generating goals…</div>';
    el.style.display = '';
    try {
      const result = await API.post('/ai/suggest-development-goals', { user_id: userId });
      el.innerHTML = `<div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:6px">Suggested development goals:</div>` +
        result.goals.map(g => `<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px">🌱 ${g}</div>`).join('');
    } catch (err) { el.innerHTML = `<div style="color:var(--danger);font-size:13px">${err.message}</div>`; }
  }

  function avatarColor(role) {
    if (role === 'admin')   return '#5B21B6';
    if (role === 'manager') return '#1E40AF';
    return '#003366';
  }

  return {
    init, showList, showProfile,
    openStrengthsModal, saveStrengths,
    openKpiModal, editKpi, deleteKpi,
    openNoteModal, editNote, deleteNote, openFileModal, deleteFile,
    suggestKpis, applyKpiSuggestion, suggestTopics, suggestDevGoals
  };
})();
