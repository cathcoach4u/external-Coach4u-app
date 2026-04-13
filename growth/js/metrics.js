/* ═══════════════════════════════════════════════════════
   metrics.js — Part 5: Marketing Metrics Dashboard
   ═══════════════════════════════════════════════════════ */

let editingMetricsId = null;
let charts = {};

function initMetrics() {
  loadMetrics();

  document.getElementById('add-metrics-btn').addEventListener('click', openAddMetrics);
  document.getElementById('save-metrics-btn').addEventListener('click', saveMetrics);
  document.getElementById('export-csv-btn').addEventListener('click', exportCSV);
  document.getElementById('export-pdf-btn').addEventListener('click', exportPDF);
}
window.initMetrics = initMetrics;

async function loadMetrics() {
  const snapshots = await api('GET', '/metrics');
  renderKPIs(snapshots);
  renderCharts(snapshots);
  renderMetricsTable(snapshots);
}
window.loadMetrics = loadMetrics;

function renderKPIs(snapshots) {
  const latest = snapshots[snapshots.length - 1];
  const prev   = snapshots[snapshots.length - 2];
  if (!latest) { document.getElementById('kpi-strip').innerHTML = '<p class="text-muted">No metrics data yet. Add a snapshot to get started.</p>'; return; }

  function trend(cur, pre) {
    if (pre == null || cur == null) return '';
    const pct = ((cur - pre) / Math.abs(pre || 1) * 100).toFixed(1);
    return `<div class="kpi-trend ${cur >= pre ? 'up' : 'down'}">${cur >= pre ? '↑' : '↓'} ${Math.abs(pct)}% vs prev month</div>`;
  }

  const strip = document.getElementById('kpi-strip');
  strip.innerHTML = [
    { label: 'Website Visitors', val: fmtN(latest.website_visitors), sub: monthLabel(latest.snapshot_date), tr: trend(latest.website_visitors, prev?.website_visitors) },
    { label: 'MQLs',             val: fmtN(latest.mqls),             sub: 'Marketing Qualified Leads',      tr: trend(latest.mqls, prev?.mqls) },
    { label: 'SQLs',             val: fmtN(latest.sqls),             sub: 'Sales Qualified Leads',          tr: trend(latest.sqls, prev?.sqls) },
    { label: 'Conversion Rate',  val: fmtPct(latest.lead_conversion_rate), sub: 'Visitor → MQL',          tr: trend(latest.lead_conversion_rate, prev?.lead_conversion_rate) },
    { label: 'Revenue Attributed', val: fmt$(latest.total_revenue_attributed), sub: 'Marketing-sourced', tr: trend(latest.total_revenue_attributed, prev?.total_revenue_attributed) },
    { label: 'Total Ad Spend',   val: fmt$(latest.total_ad_spend),   sub: 'This period',                   tr: trend(latest.total_ad_spend, prev?.total_ad_spend) },
  ].map(({ label, val, sub, tr }) => `
    <div class="kpi-card">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${val}</div>
      <div class="kpi-sub">${sub}</div>
      ${tr}
    </div>`).join('');
}

function renderCharts(snapshots) {
  const labels = snapshots.map(s => monthLabel(s.snapshot_date));
  const accent  = '#00B894';
  const blue    = '#0066CC';
  const purple  = '#6C5CE7';
  const orange  = '#F39C12';

  const chartCfg = (type, data, opts = {}) => ({
    type,
    data,
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10 } } },
      scales: type === 'bar' || type === 'line' ? {
        x: { grid: { color: '#EEF1F5' }, ticks: { font: { size: 11 } } },
        y: { grid: { color: '#EEF1F5' }, ticks: { font: { size: 11 } }, beginAtZero: true }
      } : undefined,
      ...opts,
    }
  });

  // Destroy existing charts before redrawing
  Object.values(charts).forEach(c => c.destroy());
  charts = {};

  // Traffic trend
  charts.traffic = new Chart(document.getElementById('chart-traffic'), chartCfg('line', {
    labels,
    datasets: [{
      label: 'Website Visitors', data: snapshots.map(s => s.website_visitors),
      borderColor: blue, backgroundColor: blue + '20', fill: true, tension: 0.4, pointRadius: 4,
    }]
  }));

  // Leads trend
  charts.leads = new Chart(document.getElementById('chart-leads'), chartCfg('line', {
    labels,
    datasets: [
      { label: 'MQLs', data: snapshots.map(s => s.mqls), borderColor: accent, backgroundColor: accent + '20', fill: true, tension: 0.4, pointRadius: 4 },
      { label: 'SQLs', data: snapshots.map(s => s.sqls), borderColor: purple, backgroundColor: purple + '20', fill: true, tension: 0.4, pointRadius: 4 },
    ]
  }));

  // Leads by channel (last month stacked bar)
  const last = snapshots[snapshots.length - 1] || {};
  charts.channels = new Chart(document.getElementById('chart-channels'), chartCfg('doughnut', {
    labels: ['Organic', 'Paid', 'Social', 'Email'],
    datasets: [{
      data: [last.organic_leads || 0, last.paid_leads || 0, last.social_leads || 0, last.email_leads || 0],
      backgroundColor: [accent, blue, purple, orange],
      borderWidth: 2, borderColor: '#fff',
    }]
  }, { plugins: { legend: { position: 'right' } } }));

  // Cost per lead by channel
  charts.cpl = new Chart(document.getElementById('chart-cpl'), chartCfg('bar', {
    labels: ['Organic', 'Paid', 'Social', 'Email'],
    datasets: [{
      label: 'Cost Per Lead ($)',
      data: [last.cost_per_lead_organic || 0, last.cost_per_lead_paid || 0, last.cost_per_lead_social || 0, last.cost_per_lead_email || 0],
      backgroundColor: [accent + 'CC', blue + 'CC', purple + 'CC', orange + 'CC'],
      borderRadius: 6,
    }]
  }));
}

function renderMetricsTable(snapshots) {
  const tbody = document.getElementById('metrics-tbody');
  if (!snapshots.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted" style="padding:30px;">No data yet</td></tr>';
    return;
  }
  tbody.innerHTML = [...snapshots].reverse().map(s => {
    const roi = s.total_ad_spend > 0 && s.total_revenue_attributed > 0
      ? ((s.total_revenue_attributed - s.total_ad_spend) / s.total_ad_spend * 100).toFixed(0) + '%'
      : '—';
    return `<tr>
      <td><strong>${monthLabel(s.snapshot_date)}</strong></td>
      <td>${fmtN(s.website_visitors)}</td>
      <td><strong>${fmtN(s.mqls)}</strong></td>
      <td>${fmtN(s.sqls)}</td>
      <td>${fmtPct(s.lead_conversion_rate)}</td>
      <td>${fmt$(s.total_ad_spend)}</td>
      <td><strong>${fmt$(s.total_revenue_attributed)}</strong></td>
      <td class="${parseFloat(roi) >= 0 ? 'text-accent' : ''}">${roi}</td>
      <td>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="editMetric(${s.id})">✎</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="deleteMetric(${s.id})">✕</button>
      </td>
    </tr>`;
  }).join('');
}

// ── Add/Edit Snapshot ─────────────────────────────────────────────────
function openAddMetrics() {
  editingMetricsId = null;
  document.getElementById('metrics-modal-title').textContent = 'Add Monthly Metrics';
  document.getElementById('metrics-id').value = '';
  document.getElementById('metrics-date').value = '';
  document.getElementById('metrics-period').value = 'month';
  ['m-visitors','m-sessions','m-time','m-mqls','m-sqls','m-conv',
   'm-organic','m-paid','m-social','m-email',
   'm-cpl-organic','m-cpl-paid','m-cpl-social','m-cpl-email',
   'm-spend','m-revenue'].forEach(id => document.getElementById(id).value = '');
  showModal('metrics-modal');
}
window.openAddMetrics = openAddMetrics;

async function editMetric(id) {
  const snapshots = await api('GET', '/metrics');
  const s = snapshots.find(x => x.id === id);
  if (!s) return;
  editingMetricsId = id;
  document.getElementById('metrics-modal-title').textContent = 'Edit Metrics';
  const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val ?? ''; };
  set('metrics-date',    s.snapshot_date);
  set('metrics-period',  s.period);
  set('m-visitors',      s.website_visitors);
  set('m-sessions',      s.website_sessions);
  set('m-time',          s.avg_time_on_site);
  set('m-mqls',          s.mqls);
  set('m-sqls',          s.sqls);
  set('m-conv',          s.lead_conversion_rate);
  set('m-organic',       s.organic_leads);
  set('m-paid',          s.paid_leads);
  set('m-social',        s.social_leads);
  set('m-email',         s.email_leads);
  set('m-cpl-organic',   s.cost_per_lead_organic);
  set('m-cpl-paid',      s.cost_per_lead_paid);
  set('m-cpl-social',    s.cost_per_lead_social);
  set('m-cpl-email',     s.cost_per_lead_email);
  set('m-spend',         s.total_ad_spend);
  set('m-revenue',       s.total_revenue_attributed);
  showModal('metrics-modal');
}
window.editMetric = editMetric;

async function saveMetrics() {
  const v = id => document.getElementById(id).value;
  const data = {
    snapshot_date:         v('metrics-date'),
    period:                v('metrics-period'),
    website_visitors:      +v('m-visitors') || 0,
    website_sessions:      +v('m-sessions') || 0,
    avg_time_on_site:      +v('m-time') || 0,
    mqls:                  +v('m-mqls') || 0,
    sqls:                  +v('m-sqls') || 0,
    lead_conversion_rate:  +v('m-conv') || 0,
    organic_leads:         +v('m-organic') || 0,
    paid_leads:            +v('m-paid') || 0,
    social_leads:          +v('m-social') || 0,
    email_leads:           +v('m-email') || 0,
    cost_per_lead_organic: +v('m-cpl-organic') || 0,
    cost_per_lead_paid:    +v('m-cpl-paid') || 0,
    cost_per_lead_social:  +v('m-cpl-social') || 0,
    cost_per_lead_email:   +v('m-cpl-email') || 0,
    total_ad_spend:        +v('m-spend') || 0,
    total_revenue_attributed: +v('m-revenue') || 0,
  };
  if (!data.snapshot_date) return showToast('Date is required', 'error');
  try {
    if (editingMetricsId) {
      await api('PUT', `/metrics/${editingMetricsId}`, data);
    } else {
      await api('POST', '/metrics', data);
    }
    hideModal('metrics-modal');
    loadMetrics();
    updateBanner();
    showToast('Metrics saved', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteMetric(id) {
  confirmDelete('Delete this metrics snapshot?', async () => {
    await api('DELETE', `/metrics/${id}`);
    loadMetrics();
    showToast('Deleted');
  });
}
window.deleteMetric = deleteMetric;

// ── Export ────────────────────────────────────────────────────────────
async function exportCSV() {
  const snapshots = await api('GET', '/metrics');
  const headers = ['Month','Visitors','Sessions','Avg Time','MQLs','SQLs','Conv Rate','Organic Leads','Paid Leads','Social Leads','Email Leads','CPL Organic','CPL Paid','CPL Social','CPL Email','Ad Spend','Revenue'];
  const rows = snapshots.map(s => [
    monthLabel(s.snapshot_date), s.website_visitors, s.website_sessions, s.avg_time_on_site,
    s.mqls, s.sqls, s.lead_conversion_rate, s.organic_leads, s.paid_leads, s.social_leads, s.email_leads,
    s.cost_per_lead_organic, s.cost_per_lead_paid, s.cost_per_lead_social, s.cost_per_lead_email,
    s.total_ad_spend, s.total_revenue_attributed
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `growth-hub-metrics-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  showToast('CSV exported', 'success');
}

function exportPDF() {
  window.print();
}
