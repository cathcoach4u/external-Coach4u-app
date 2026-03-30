/* ─── App bootstrap ──────────────────────────────────────────────────────── */

const App = (() => {
  let currentUser = null;
  let allDepts = [];
  let allUsers = [];

  async function init() {
    const token = API.getToken();
    if (!token) { window.location.href = '/login.html'; return; }

    try {
      currentUser = await API.get('/auth/me');
      if (!currentUser) return;
    } catch {
      API.logout(); return;
    }

    // Store on window for other modules
    window.currentUser = currentUser;

    // Header
    document.getElementById('user-avatar').textContent = initials(currentUser.name);
    document.getElementById('user-name').textContent   = currentUser.name;
    document.getElementById('user-role').textContent   = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    document.getElementById('btn-logout').addEventListener('click', API.logout);

    // Role-based UI
    applyRoleUI();

    // Load shared data
    await loadSharedData();

    // Nav tabs
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
    });

    // Sub-tabs (admin)
    document.querySelectorAll('.sub-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.sub-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.subtab).classList.add('active');
        if (btn.dataset.subtab === 'admin-users') AdminPanel.loadUsers();
        if (btn.dataset.subtab === 'admin-depts') AdminPanel.loadDepts();
      });
    });

    // Init all panels
    TeamPanel.init();
    PeoplePanel.init();
    StrengthsPanel.init();
    MeetingsPanel.init();
    DashboardPanel.init();
    if (currentUser.role === 'admin') AdminPanel.init();
  }

  function applyRoleUI() {
    const role = currentUser.role;

    // Show/hide manager-only elements
    document.querySelectorAll('.manager-only').forEach(el => {
      el.style.display = (role === 'manager' || role === 'admin') ? '' : 'none';
    });
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = role === 'admin' ? '' : 'none';
    });

    // Admin tab
    if (role === 'admin') {
      document.querySelector('[data-panel="admin"]').style.display = '';
    }

    // Manager private notes in meeting modal
    const pGroup = document.getElementById('meeting-private-group');
    if (pGroup) pGroup.style.display = (role === 'manager' || role === 'admin') ? '' : 'none';
  }

  async function loadSharedData() {
    try {
      [allDepts, allUsers] = await Promise.all([
        API.get('/departments'),
        API.get('/users')
      ]);
      window.allDepts = allDepts;
      window.allUsers = allUsers;

      // Populate department filters
      document.querySelectorAll('.dept-filter-select, #people-dept-filter, #strengths-dept-filter, #ai-dept-select').forEach(sel => {
        const cur = sel.value;
        const base = sel.id === 'ai-dept-select' ? '<option value="">Whole organisation</option>' : '<option value="">All departments</option>';
        sel.innerHTML = base + allDepts.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        sel.value = cur;
      });
    } catch (err) {
      console.error('loadSharedData', err);
    }
  }

  function switchPanel(name) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === name));
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === name + '-panel'));

    // Lazy load panels on first visit
    switch (name) {
      case 'team':      TeamPanel.load();      break;
      case 'people':    PeoplePanel.showList(); break;
      case 'strengths': StrengthsPanel.load(); break;
      case 'meetings':  MeetingsPanel.load();  break;
      case 'dashboard': DashboardPanel.load(); break;
      case 'admin':     AdminPanel.load();     break;
    }
  }

  return { init, switchPanel };
})();

/* ─── Admin Panel ────────────────────────────────────────────────────────── */
const AdminPanel = (() => {
  function init() { load(); }
  function load()  { loadUsers(); }

  async function loadUsers() {
    const el = document.getElementById('admin-users-table');
    el.innerHTML = '<div class="loading"><span class="spinner"></span>Loading…</div>';
    try {
      const users = await API.get('/users');
      if (!users.length) { el.innerHTML = '<div class="empty-state"><p>No users found.</p></div>'; return; }
      el.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Manager</th><th></th></tr></thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><div class="person-card">
                  <div class="person-avatar sm">${initials(u.name)}</div>
                  <div><div class="person-name">${u.name}</div><div class="person-title">${u.job_title||'—'}</div></div>
                </div></td>
                <td>${u.email}</td>
                <td><span class="badge badge-${u.role==='admin'?'purple':u.role==='manager'?'blue':'gray'}">${u.role}</span></td>
                <td>${u.department_name||'—'}</td>
                <td>${u.manager_name||'—'}</td>
                <td style="text-align:right;white-space:nowrap">
                  <button class="btn btn-secondary btn-sm" onclick="AdminPanel.editUser(${u.id})">Edit</button>
                  ${u.id !== window.currentUser.id ? `<button class="btn btn-danger btn-sm" onclick="AdminPanel.deleteUser(${u.id},'${u.name}')">Delete</button>` : ''}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>`;
    } catch (err) { el.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`; }
  }

  async function loadDepts() {
    const el = document.getElementById('admin-depts-table');
    el.innerHTML = '<div class="loading"><span class="spinner"></span>Loading…</div>';
    try {
      const depts = await API.get('/departments');
      el.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Department</th><th>Manager</th><th>Staff Count</th></tr></thead>
          <tbody>
            ${depts.map(d => `<tr>
              <td><strong>${d.name}</strong>${d.description?`<br><span style="font-size:12px;color:var(--text-muted)">${d.description}</span>`:''}</td>
              <td>${d.manager_name||'—'}</td>
              <td>${d.staff_count}</td>
            </tr>`).join('')}
          </tbody>
        </table>`;
    } catch (err) { el.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`; }
  }

  function openAddUser() {
    document.getElementById('edit-user-id').value = '';
    document.getElementById('modal-user-title').textContent = 'Add User';
    document.getElementById('user-name-field').value = '';
    document.getElementById('user-email-field').value = '';
    document.getElementById('user-title-field').value = '';
    document.getElementById('user-role-field').value = 'staff';
    document.getElementById('user-pw-hint').textContent = 'Required for new users';
    document.getElementById('user-pw-label').textContent = 'Password';

    const deptSel = document.getElementById('user-dept-field');
    const mgrSel  = document.getElementById('user-manager-field');
    deptSel.innerHTML = '<option value="">— None —</option>' + (window.allDepts||[]).map(d=>`<option value="${d.id}">${d.name}</option>`).join('');
    mgrSel.innerHTML  = '<option value="">— None —</option>' + (window.allUsers||[]).filter(u=>u.role!=='staff').map(u=>`<option value="${u.id}">${u.name}</option>`).join('');
    showModal('modal-user');
  }

  async function editUser(id) {
    const user = (window.allUsers||[]).find(u=>u.id===id) || await API.get(`/users/${id}`);
    document.getElementById('edit-user-id').value    = user.id;
    document.getElementById('modal-user-title').textContent = 'Edit User';
    document.getElementById('user-name-field').value  = user.name;
    document.getElementById('user-email-field').value = user.email;
    document.getElementById('user-title-field').value = user.job_title||'';
    document.getElementById('user-role-field').value  = user.role;
    document.getElementById('user-pw-field').value    = '';
    document.getElementById('user-pw-hint').textContent = 'Leave blank to keep existing password';
    document.getElementById('user-pw-label').textContent = 'New Password (optional)';

    const deptSel = document.getElementById('user-dept-field');
    const mgrSel  = document.getElementById('user-manager-field');
    deptSel.innerHTML = '<option value="">— None —</option>' + (window.allDepts||[]).map(d=>`<option value="${d.id}">${d.name}</option>`).join('');
    mgrSel.innerHTML  = '<option value="">— None —</option>' + (window.allUsers||[]).filter(u=>u.role!=='staff'&&u.id!==id).map(u=>`<option value="${u.id}">${u.name}</option>`).join('');
    deptSel.value = user.department_id||'';
    mgrSel.value  = user.manager_id||'';
    showModal('modal-user');
  }

  async function deleteUser(id, name) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await API.delete(`/users/${id}`);
      toast(`${name} deleted`);
      loadUsers();
    } catch (err) { toast(err.message, 'error'); }
  }

  document.getElementById('btn-add-user-admin').addEventListener('click', openAddUser);
  document.getElementById('btn-add-user').addEventListener('click', openAddUser);
  document.getElementById('btn-add-dept').addEventListener('click', () => toast('Department management coming soon', 'error'));

  document.getElementById('btn-save-user').addEventListener('click', async () => {
    const id       = document.getElementById('edit-user-id').value;
    const name     = document.getElementById('user-name-field').value.trim();
    const email    = document.getElementById('user-email-field').value.trim();
    const job_title= document.getElementById('user-title-field').value.trim();
    const role     = document.getElementById('user-role-field').value;
    const dept_id  = document.getElementById('user-dept-field').value || null;
    const mgr_id   = document.getElementById('user-manager-field').value || null;
    const password = document.getElementById('user-pw-field').value;

    if (!name || !email) return toast('Name and email are required', 'error');
    if (!id && !password) return toast('Password required for new users', 'error');

    try {
      const body = { name, email, role, job_title, department_id: dept_id ? +dept_id : null, manager_id: mgr_id ? +mgr_id : null };
      if (password) body.password = password;
      if (id) {
        await API.put(`/users/${id}`, body);
        toast('User updated');
      } else {
        await API.post('/users', body);
        toast('User added');
      }
      hideModal('modal-user');
      loadUsers();
      const [d, u] = await Promise.all([API.get('/departments'), API.get('/users')]);
      window.allDepts = d; window.allUsers = u;
    } catch (err) { toast(err.message, 'error'); }
  });

  return { init, load, loadUsers, loadDepts, editUser, deleteUser };
})();

// Bootstrap
window.addEventListener('DOMContentLoaded', App.init);
