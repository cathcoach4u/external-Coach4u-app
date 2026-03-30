/* ─── API helper ─────────────────────────────────────────────────────────── */
const API = (() => {
  function getToken() { return localStorage.getItem('ph_token'); }
  function getUser()  { return JSON.parse(localStorage.getItem('ph_user') || 'null'); }

  function logout() {
    localStorage.removeItem('ph_token');
    localStorage.removeItem('ph_user');
    window.location.href = '/login.html';
  }

  async function request(method, path, body) {
    const token = getToken();
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch('/api' + path, opts);
    if (res.status === 401) { logout(); return null; }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  }

  return {
    getToken, getUser, logout,
    get:    (path)        => request('GET',    path),
    post:   (path, body)  => request('POST',   path, body),
    put:    (path, body)  => request('PUT',    path, body),
    delete: (path)        => request('DELETE', path)
  };
})();

/* ─── Shared utilities ───────────────────────────────────────────────────── */

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusBadge(status) {
  const map = {
    on_track: ['green',  'On Track'],
    at_risk:  ['yellow', 'At Risk'],
    off_track:['red',    'Off Track'],
    complete: ['blue',   'Complete'],
    scheduled:['gray',   'Scheduled'],
    completed:['green',  'Completed'],
    pending:  ['yellow', 'Pending'],
    in_progress:['blue', 'In Progress'],
  };
  const [cls, label] = map[status] || ['gray', status];
  return `<span class="badge badge-${cls}">${label}</span>`;
}

function trafficLight(status) {
  return `<span class="traffic-light"><span class="traffic-dot ${status}"></span><span class="status-${status}">${status.charAt(0).toUpperCase()+status.slice(1)}</span></span>`;
}

function toast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function showModal(id) { document.getElementById(id).classList.remove('hidden'); }
function hideModal(id) { document.getElementById(id).classList.add('hidden'); }

function domainClass(domain) {
  if (!domain) return '';
  const m = { 'Executing': 'executing', 'Influencing': 'influencing', 'Relationship Building': 'relationship', 'Strategic Thinking': 'strategic' };
  return m[domain] || '';
}

// Close modals on backdrop click or ✕
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) hideModal(e.target.id);
  const close = e.target.closest('[data-close]');
  if (close) hideModal(close.dataset.close);
});

/* ─── CliftonStrengths data ──────────────────────────────────────────────── */
const CLIFTON_STRENGTHS = [
  { name: 'Achiever',         domain: 'Executing',             description: 'Strong drive and great stamina; loves hard work and being productive' },
  { name: 'Activator',        domain: 'Influencing',           description: 'Turns thoughts into action; impatient with inactivity, loves getting started' },
  { name: 'Adaptability',     domain: 'Relationship Building', description: 'Lives in the moment; flexible and adjusts quickly to changing circumstances' },
  { name: 'Analytical',       domain: 'Strategic Thinking',    description: 'Searches for reasons and causes; thinks about factors affecting situations' },
  { name: 'Arranger',         domain: 'Executing',             description: 'Organises and orchestrates; enjoys managing complex situations with many variables' },
  { name: 'Belief',           domain: 'Executing',             description: 'Has enduring core values; family, altruism, and spirituality give life meaning beyond work' },
  { name: 'Command',          domain: 'Influencing',           description: 'Takes charge; has presence and is comfortable imposing views on others' },
  { name: 'Communication',    domain: 'Influencing',           description: 'Finds ways to put thoughts into words; great conversationalist and presenter' },
  { name: 'Competition',      domain: 'Influencing',           description: 'Measures progress against others; strives to win and dislikes losing' },
  { name: 'Connectedness',    domain: 'Relationship Building', description: 'Believes things happen for a reason; sees links between all things and bridges divides' },
  { name: 'Consistency',      domain: 'Executing',             description: 'Aware of the need to treat people the same; believes in clear rules' },
  { name: 'Context',          domain: 'Strategic Thinking',    description: 'Enjoys thinking about the past; understands the present by researching history' },
  { name: 'Deliberative',     domain: 'Executing',             description: 'Careful and serious decision-maker; identifies and reduces risks before acting' },
  { name: 'Developer',        domain: 'Relationship Building', description: 'Recognises and cultivates potential in others; finds satisfaction in helping others grow' },
  { name: 'Discipline',       domain: 'Executing',             description: 'Enjoys routine and structure; needs a world that is ordered, planned, and predictable' },
  { name: 'Empathy',          domain: 'Relationship Building', description: 'Senses feelings of others; can see the world through their perspective' },
  { name: 'Focus',            domain: 'Executing',             description: 'Takes a direction and follows through; sets goals and prioritises ruthlessly' },
  { name: 'Futuristic',       domain: 'Strategic Thinking',    description: 'Inspired by the future; inspires others with visions of what might be' },
  { name: 'Harmony',          domain: 'Relationship Building', description: 'Looks for consensus; avoids conflict and seeks areas of agreement' },
  { name: 'Ideation',         domain: 'Strategic Thinking',    description: 'Fascinated by ideas; finds connections between seemingly disparate phenomena' },
  { name: 'Includer',         domain: 'Relationship Building', description: 'Accepts others; shows awareness of those who feel left out and makes effort to include them' },
  { name: 'Individualization', domain: 'Relationship Building', description: 'Intrigued by unique qualities; knows how to bring out the best in each person' },
  { name: 'Input',            domain: 'Strategic Thinking',    description: 'Craves to know more; likes to collect information, ideas, and relationships' },
  { name: 'Intellection',     domain: 'Strategic Thinking',    description: 'Characterised by intellectual activity; introspective and appreciates deep thinking' },
  { name: 'Learner',          domain: 'Strategic Thinking',    description: 'Loves to learn; drawn to the process of learning more than the outcome' },
  { name: 'Maximizer',        domain: 'Influencing',           description: 'Focuses on strengths to stimulate excellence; transforms good into great' },
  { name: 'Positivity',       domain: 'Relationship Building', description: 'Has contagious enthusiasm; upbeat and gets others excited about what they do' },
  { name: 'Relator',          domain: 'Relationship Building', description: 'Enjoys close relationships; works hard with friends to achieve goals' },
  { name: 'Responsibility',   domain: 'Executing',             description: 'Takes psychological ownership of commitments; committed to honesty and loyalty' },
  { name: 'Restorative',      domain: 'Executing',             description: 'Good at dealing with problems; adept at figuring out what\'s wrong and resolving it' },
  { name: 'Self-Assurance',   domain: 'Influencing',           description: 'Feels confident in managing own life; inner compass that gives confidence in decisions' },
  { name: 'Significance',     domain: 'Influencing',           description: 'Wants to make a big impact; independent and prioritises work that will be recognised' },
  { name: 'Strategic',        domain: 'Strategic Thinking',    description: 'Creates alternative ways to proceed; quickly spots patterns and finds the best route forward' },
  { name: 'Woo',              domain: 'Influencing',           description: 'Loves the challenge of meeting new people; breaks the ice and wins people over with ease' },
];
