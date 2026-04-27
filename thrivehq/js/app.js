// Main App Functions

// Brain Pulse section definitions
const PULSE_SECTIONS = {
  capacity: {
    name: 'Capacity',
    icon: 'C',
    description: 'The steadiness and resilience of your nervous system',
    details: 'How calm you feel, how quickly you recover, and how much energy you have.',
    focus: [
      'Notice when your tank is running low and refill before you crash.',
      'Use your regulation tools (breathing, movement, connection) early, not only in crisis.',
      'Honour the recovery you need — rest is part of the rhythm, not a reward.'
    ]
  },
  wellbeing: {
    name: 'Wellbeing',
    icon: 'W',
    description: 'What gives your life meaning and sustains you',
    details: 'Your sense of purpose, connection, security, health, and belonging.',
    focus: [
      'Protect one thing each week that gives your life meaning.',
      'Strengthen one relationship that supports you most.',
      'Attend to one pillar at a time (purpose, social, financial, physical, community).'
    ]
  },
  strengths: {
    name: 'Strengths',
    icon: 'S',
    description: 'How you talk to yourself and trust yourself',
    details: 'Your confidence in decisions, self-compassion, and ability to reframe setbacks.',
    focus: [
      'Catch the critical inner voice earlier and soften it.',
      'Name one thing you did well this week, even if it feels small.',
      'Accept how you are built rather than fighting it.'
    ]
  },
  execution: {
    name: 'Execution',
    icon: 'E',
    description: 'How you manage everyday brain tasks',
    details: 'Starting, finishing, pausing, prioritizing, and remembering.',
    focus: [
      'Start the one task you keep avoiding before the day\'s energy drops.',
      'Use a visible cue to bring you back when you drift off-track.',
      'Pair a hard task with a small anchor to make starting easier.'
    ]
  }
};

// Initialize Dashboard
async function initDashboard() {
  const sb = window.getSupabase();
  if (!sb) throw new Error('Supabase not initialized');

  const user = await window.getCurrentUser();
  if (!user) return;

  try {
    // Fetch user data
    const { data: userData, error: userError } = await sb
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    // Fetch latest brain pulse assessment
    const { data: assessments } = await sb
      .from('brain_pulse_assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('assessment_date', { ascending: false })
      .limit(1);

    const assessment = assessments && assessments.length > 0 ? assessments[0] : null;

    // Update membership info
    if (userData && userData.membership_end_date) {
      document.getElementById('expiryDate').textContent = formatDate(userData.membership_end_date);
    }

    // Render Brain Pulse cards
    renderPulseCards(assessment);

    // Show content
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    throw error;
  }
}

// Render Brain Pulse Cards
function renderPulseCards(assessment) {
  const grid = document.getElementById('pulseGrid');
  grid.innerHTML = '';

  const scores = {
    capacity: assessment?.capacity_score || 0,
    wellbeing: assessment?.wellbeing_score || 0,
    strengths: assessment?.strengths_score || 0,
    execution: assessment?.execution_score || 0
  };

  Object.entries(PULSE_SECTIONS).forEach(([key, section]) => {
    const score = scores[key];
    const card = document.createElement('div');
    card.className = 'pulse-card';
    card.onclick = () => window.location.href = `brain-pulse-detail.html?section=${key}`;

    card.innerHTML = `
      <div class="pulse-header">
        <div class="pulse-icon ${key}">${section.icon}</div>
        <div class="pulse-title">${section.name}</div>
      </div>
      <div class="pulse-score">${score}<span style="font-size: 16px;">/50</span></div>
      <div class="pulse-description">${section.description}</div>
    `;

    grid.appendChild(card);
  });
}

// Load Brain Pulse Detail
async function loadPulseDetail(section) {
  const sb = window.getSupabase();
  if (!sb) throw new Error('Supabase not initialized');

  const user = await window.getCurrentUser();
  if (!user) return;

  if (!PULSE_SECTIONS[section]) {
    throw new Error('Invalid section');
  }

  try {
    // Fetch latest assessment
    const { data: assessments } = await sb
      .from('brain_pulse_assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('assessment_date', { ascending: false })
      .limit(1);

    const assessment = assessments && assessments.length > 0 ? assessments[0] : null;
    const sectionData = PULSE_SECTIONS[section];
    const score = assessment ? assessment[section + '_score'] : 0;

    const card = document.getElementById('detailCard');
    card.innerHTML = `
      <div class="detail-icon ${section}">${sectionData.icon}</div>
      <h2 class="detail-title">${sectionData.name}</h2>
      <p class="detail-description">${sectionData.details}</p>
      <div class="pulse-score">${score}<span style="font-size: 16px;">/50</span></div>
      <div class="coaching-focus">
        <div class="coaching-focus-title">Coaching Focus</div>
        <ul>
          ${sectionData.focus.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    `;

    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
  } catch (error) {
    console.error('Error loading detail:', error);
    throw error;
  }
}

// Load Resources
async function loadResources() {
  const sb = window.getSupabase();
  if (!sb) throw new Error('Supabase not initialized');

  try {
    const { data: resources } = await sb
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    const list = document.getElementById('resourcesList');
    const empty = document.getElementById('emptyState');

    if (!resources || resources.length === 0) {
      empty.style.display = 'block';
    } else {
      list.innerHTML = resources.map(r => `
        <a href="${r.url}" target="_blank" class="resource-item">
          <div class="resource-title">${r.title}</div>
          <div class="resource-description">${r.description || 'ADHD resource'}</div>
          <div class="resource-link">View Resource →</div>
        </a>
      `).join('');
    }

    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
  } catch (error) {
    console.error('Error loading resources:', error);
    throw error;
  }
}

// Load Account
async function loadAccount() {
  const sb = window.getSupabase();
  if (!sb) throw new Error('Supabase not initialized');

  const user = await window.getCurrentUser();
  if (!user) return;

  try {
    const { data: userData } = await sb
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    document.getElementById('userEmail').textContent = user.email || '—';
    document.getElementById('userName').textContent = userData?.name || '—';
    document.getElementById('membershipStatus').textContent = userData?.membership_status || '—';
    document.getElementById('startDate').textContent = userData?.membership_start_date ? formatDate(userData.membership_start_date) : '—';
    document.getElementById('endDate').textContent = userData?.membership_end_date ? formatDate(userData.membership_end_date) : '—';

    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
  } catch (error) {
    console.error('Error loading account:', error);
    throw error;
  }
}

// Utility: Format Date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Make functions available globally
window.initDashboard = initDashboard;
window.loadPulseDetail = loadPulseDetail;
window.loadResources = loadResources;
window.loadAccount = loadAccount;
