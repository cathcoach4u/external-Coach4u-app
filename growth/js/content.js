/* ═══════════════════════════════════════════════════════
   content.js — Part 4: Content Calendar
   ═══════════════════════════════════════════════════════ */

let editingContentId = null;
let calView = 'month';
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-indexed
let draggedContentId = null;

function initContent() {
  renderCalendar();

  document.getElementById('add-content-btn').addEventListener('click', openAddContent);
  document.getElementById('save-content-btn').addEventListener('click', saveContent);
  document.getElementById('cal-prev').addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); });
  document.getElementById('cal-next').addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); });
  document.getElementById('content-view-month').addEventListener('click', () => switchView('month'));
  document.getElementById('content-view-list').addEventListener('click',  () => switchView('list'));

  // Filters
  ['content-campaign-filter','content-type-filter','content-assignee-filter','content-status-filter']
    .forEach(id => document.getElementById(id)?.addEventListener('change', renderCalendar));

  // Populate filter dropdowns
  fillSelect('content-campaign-filter', GH.campaigns, c => c.id, c => c.name);
  fillSelect('content-assignee-filter', GH.team,      m => m.id, m => m.name);
}
window.initContent = initContent;

function switchView(v) {
  calView = v;
  document.getElementById('content-calendar-view').style.display = v === 'month' ? '' : 'none';
  document.getElementById('content-list-view').style.display     = v === 'list'  ? '' : 'none';
  document.getElementById('calendar-nav').style.display          = v === 'month' ? '' : 'none';
  document.getElementById('content-view-month').className = 'btn btn-sm ' + (v === 'month' ? 'btn-primary' : 'btn-outline');
  document.getElementById('content-view-list').className  = 'btn btn-sm ' + (v === 'list'  ? 'btn-primary' : 'btn-outline');
  renderCalendar();
}

async function renderCalendar() {
  const campaignId = document.getElementById('content-campaign-filter')?.value || '';
  const type       = document.getElementById('content-type-filter')?.value || '';
  const assignee   = document.getElementById('content-assignee-filter')?.value || '';
  const status     = document.getElementById('content-status-filter')?.value || '';

  let qs = '?';
  if (campaignId) qs += `campaign_id=${campaignId}&`;
  if (type)       qs += `type=${type}&`;
  if (assignee)   qs += `assignee=${assignee}&`;
  if (status)     qs += `status=${status}&`;

  const items = await api('GET', '/content' + qs);

  // Month label
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calendar-month-label').textContent = `${monthNames[calMonth]} ${calYear}`;

  if (calView === 'list') {
    renderListView(items);
  } else {
    renderMonthView(items);
  }
}

function renderMonthView(items) {
  const container = document.getElementById('content-calendar-view');
  const today = new Date();
  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay  = new Date(calYear, calMonth + 1, 0);
  // Day of week for first day (0=Sun, make Mon-first)
  let startDow = firstDay.getDay(); // 0=Sun
  // Map to Monday-first (Mon=0)
  startDow = (startDow + 6) % 7;

  // Index items by date
  const byDate = {};
  items.forEach(item => {
    if (item.scheduled_date) {
      const d = item.scheduled_date.slice(0, 10);
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(item);
    }
  });

  const dows = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  let html = `<div class="calendar-grid-wrap">
    <div class="calendar-dow-row">${dows.map(d => `<div class="calendar-dow">${d}</div>`).join('')}</div>
    <div class="calendar-grid">`;

  // Fill leading empty cells
  for (let i = 0; i < startDow; i++) {
    html += `<div class="calendar-cell other-month"></div>`;
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
    const dayItems = byDate[dateStr] || [];

    html += `<div class="calendar-cell ${isToday ? 'today' : ''}"
      data-date="${dateStr}"
      ondragover="event.preventDefault();this.classList.add('drag-over')"
      ondragleave="this.classList.remove('drag-over')"
      ondrop="onCalendarDrop(event,'${dateStr}')">
      <div class="calendar-date ${isToday ? 'today-num' : ''}">${day}</div>
      <div class="calendar-items">
        ${dayItems.map(item => `
          <div class="content-chip chip-${item.content_type}"
            draggable="true"
            data-id="${item.id}"
            ondragstart="onChipDragStart(event,${item.id})"
            ondragend="onChipDragEnd(event)"
            onclick="editContentItem(${item.id})"
            title="${item.title}${item.assignee_name ? ' · ' + item.assignee_name : ''}">
            ${typeIcon(item.content_type)} ${item.title}
          </div>`).join('')}
      </div>
    </div>`;
  }

  // Trailing empty cells to complete last row
  const totalCells = startDow + lastDay.getDate();
  const trailing = totalCells % 7 !== 0 ? 7 - (totalCells % 7) : 0;
  for (let i = 0; i < trailing; i++) {
    html += `<div class="calendar-cell other-month"></div>`;
  }

  html += `</div></div>`;
  container.innerHTML = html;

  // Unscheduled strip
  const unscheduled = items.filter(i => !i.scheduled_date);
  if (unscheduled.length) {
    container.innerHTML += `
      <div class="card mt-12">
        <div class="card-header"><span class="card-icon">📋</span> Unscheduled (${unscheduled.length} items)</div>
        <div class="card-body" style="display:flex;flex-wrap:wrap;gap:6px;">
          ${unscheduled.map(item => `
            <div class="content-chip chip-${item.content_type}" onclick="editContentItem(${item.id})" style="cursor:pointer;">
              ${typeIcon(item.content_type)} ${item.title}
              ${contentStatusBadge(item.status)}
            </div>`).join('')}
        </div>
      </div>`;
  }
}

function renderListView(items) {
  const container = document.getElementById('content-list-view');
  if (!items.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">No content items match your filters.</div></div>`;
    return;
  }
  container.innerHTML = `
    <table class="content-list-table">
      <thead>
        <tr>
          <th>Title</th><th>Type</th><th>Platform</th><th>Campaign</th>
          <th>Assigned To</th><th>Status</th><th>Scheduled</th><th></th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
        <tr>
          <td><strong>${item.title}</strong></td>
          <td>${typeIcon(item.content_type)} ${item.content_type}</td>
          <td>${item.platform || '—'}</td>
          <td>${item.campaign_name || '—'}</td>
          <td>${item.assignee_name || '—'}</td>
          <td>${contentStatusBadge(item.status)}</td>
          <td class="nowrap">${fmtDate(item.scheduled_date)}</td>
          <td>
            <button class="btn btn-ghost btn-sm btn-icon" onclick="editContentItem(${item.id})">✎</button>
            <button class="btn btn-ghost btn-sm btn-icon" onclick="deleteContent(${item.id},'${item.title.replace(/'/g,"\\'")}')">✕</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function typeIcon(type) {
  const icons = { blog: '📝', social: '📱', email: '📧', video: '🎥', webinar: '🎙', ad: '📣' };
  return icons[type] || '📄';
}
window.typeIcon = typeIcon;

// ── Drag and Drop ─────────────────────────────────────────────────────
function onChipDragStart(event, id) {
  draggedContentId = id;
  event.target.classList.add('dragging');
  event.dataTransfer.effectAllowed = 'move';
}
window.onChipDragStart = onChipDragStart;

function onChipDragEnd(event) {
  event.target.classList.remove('dragging');
  document.querySelectorAll('.calendar-cell').forEach(c => c.classList.remove('drag-over'));
}
window.onChipDragEnd = onChipDragEnd;

async function onCalendarDrop(event, dateStr) {
  event.preventDefault();
  event.target.closest('.calendar-cell')?.classList.remove('drag-over');
  if (!draggedContentId) return;
  try {
    await api('PATCH', `/content/${draggedContentId}/reschedule`, { scheduled_date: dateStr });
    draggedContentId = null;
    renderCalendar();
    showToast('Content rescheduled', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}
window.onCalendarDrop = onCalendarDrop;

// ── Add / Edit Content ────────────────────────────────────────────────
function openAddContent() {
  editingContentId = null;
  document.getElementById('content-modal-title').textContent = 'Add Content';
  document.getElementById('content-id').value = '';
  ['content-title','content-platform','content-scheduled','content-published','content-tags','content-notes']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('content-type').value         = 'blog';
  document.getElementById('content-status-modal').value = 'ideation';
  fillSelect('content-campaign', GH.campaigns, c => c.id, c => c.name);
  fillSelect('content-assignee', GH.team,      m => m.id, m => `${m.name} — ${m.role}`);
  showModal('content-modal');
}
window.openAddContent = openAddContent;

async function editContentItem(id) {
  const items = await api('GET', `/content?`);
  let item = items.find(x => x.id === id);
  if (!item) return;
  editingContentId = id;
  document.getElementById('content-modal-title').textContent = 'Edit Content';
  fillSelect('content-campaign', GH.campaigns, c => c.id, c => c.name);
  fillSelect('content-assignee', GH.team,      m => m.id, m => `${m.name} — ${m.role}`);
  const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val ?? ''; };
  set('content-title',         item.title);
  set('content-type',          item.content_type);
  set('content-platform',      item.platform);
  set('content-status-modal',  item.status);
  set('content-campaign',      item.campaign_id);
  set('content-assignee',      item.assigned_to);
  set('content-scheduled',     item.scheduled_date);
  set('content-published',     item.published_date);
  set('content-tags',          item.tags);
  set('content-notes',         item.notes);
  showModal('content-modal');
}
window.editContentItem = editContentItem;

async function saveContent() {
  const v = id => document.getElementById(id).value;
  const data = {
    title:        v('content-title').trim(),
    content_type: v('content-type'),
    platform:     v('content-platform'),
    status:       v('content-status-modal'),
    campaign_id:  +v('content-campaign') || null,
    assigned_to:  +v('content-assignee') || null,
    scheduled_date: v('content-scheduled') || null,
    published_date: v('content-published') || null,
    tags:         v('content-tags').trim(),
    notes:        v('content-notes').trim(),
  };
  if (!data.title) return showToast('Title required', 'error');
  try {
    if (editingContentId) {
      await api('PUT', `/content/${editingContentId}`, data);
    } else {
      await api('POST', '/content', data);
    }
    hideModal('content-modal');
    renderCalendar();
    showToast('Content saved', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteContent(id, name) {
  confirmDelete(`Delete "${name}"?`, async () => {
    await api('DELETE', `/content/${id}`);
    renderCalendar();
    showToast('Deleted');
  });
}
window.deleteContent = deleteContent;
