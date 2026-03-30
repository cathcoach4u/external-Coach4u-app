const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'growth_hub.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT,
    email TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS company_priorities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    quarter TEXT,
    year INTEGER,
    owner TEXT,
    due_date TEXT,
    status TEXT DEFAULT 'on-track',
    source TEXT DEFAULT 'manual',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS marketing_objectives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_priority_id INTEGER REFERENCES company_priorities(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_value REAL,
    target_unit TEXT,
    quarter TEXT,
    year INTEGER,
    current_value REAL DEFAULT 0,
    status TEXT DEFAULT 'on-track',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS brand_positioning (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    for_who TEXT,
    who_need TEXT,
    our_product TEXT,
    is_a TEXT,
    that TEXT,
    unlike TEXT,
    our_differentiator TEXT,
    tagline TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS annual_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    goal_title TEXT NOT NULL,
    goal_description TEXT,
    q1_target REAL,
    q2_target REAL,
    q3_target REAL,
    q4_target REAL,
    q1_actual REAL,
    q2_actual REAL,
    q3_actual REAL,
    q4_actual REAL,
    unit TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quarterly_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quarter TEXT NOT NULL,
    year INTEGER NOT NULL,
    title TEXT NOT NULL,
    company_priority_id INTEGER REFERENCES company_priorities(id) ON DELETE SET NULL,
    marketing_objective_id INTEGER REFERENCES marketing_objectives(id) ON DELETE SET NULL,
    budget_allocated REAL DEFAULT 0,
    budget_spent REAL DEFAULT 0,
    success_metric TEXT,
    target_value REAL,
    actual_value REAL,
    rag_status TEXT DEFAULT 'green',
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    objective TEXT,
    company_priority_id INTEGER REFERENCES company_priorities(id) ON DELETE SET NULL,
    quarterly_plan_id INTEGER REFERENCES quarterly_plans(id) ON DELETE SET NULL,
    start_date TEXT,
    end_date TEXT,
    budget_allocated REAL DEFAULT 0,
    budget_spent REAL DEFAULT 0,
    target_leads INTEGER DEFAULT 0,
    actual_leads INTEGER DEFAULT 0,
    target_conversions INTEGER DEFAULT 0,
    actual_conversions INTEGER DEFAULT 0,
    target_revenue REAL DEFAULT 0,
    actual_revenue REAL DEFAULT 0,
    target_ctr REAL DEFAULT 0,
    actual_ctr REAL DEFAULT 0,
    channel TEXT,
    status TEXT DEFAULT 'planning',
    assigned_to INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
    insights TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ab_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    variant_a TEXT,
    variant_b TEXT,
    metric TEXT,
    result_a REAL,
    result_b REAL,
    winner TEXT,
    insight TEXT,
    status TEXT DEFAULT 'running',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS content_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content_type TEXT DEFAULT 'blog',
    platform TEXT,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    assigned_to INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'ideation',
    scheduled_date TEXT,
    published_date TEXT,
    tags TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS metrics_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_date TEXT NOT NULL,
    period TEXT DEFAULT 'month',
    website_visitors INTEGER DEFAULT 0,
    website_sessions INTEGER DEFAULT 0,
    avg_time_on_site REAL DEFAULT 0,
    mqls INTEGER DEFAULT 0,
    sqls INTEGER DEFAULT 0,
    lead_conversion_rate REAL DEFAULT 0,
    organic_leads INTEGER DEFAULT 0,
    paid_leads INTEGER DEFAULT 0,
    social_leads INTEGER DEFAULT 0,
    email_leads INTEGER DEFAULT 0,
    cost_per_lead_organic REAL DEFAULT 0,
    cost_per_lead_paid REAL DEFAULT 0,
    cost_per_lead_social REAL DEFAULT 0,
    cost_per_lead_email REAL DEFAULT 0,
    total_ad_spend REAL DEFAULT 0,
    total_revenue_attributed REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS personas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT,
    age_range TEXT,
    company_size TEXT,
    industry TEXT,
    goals TEXT,
    pain_points TEXT,
    channels TEXT,
    messaging TEXT,
    quote TEXT,
    photo_emoji TEXT DEFAULT '👤',
    conversion_rate REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ── Seed data (only if tables empty) ─────────────────────────────────────────

function isEmpty(table) {
  return db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c === 0;
}

if (isEmpty('team_members')) {
  const ins = db.prepare(`INSERT INTO team_members (name, role, email) VALUES (?, ?, ?)`);
  [
    ['Lisa Park',      'Marketing Director',      'lisa@company.com'],
    ['Sarah Johnson',  'Content Manager',         'sarah@company.com'],
    ['Tom Chen',       'Paid Media Specialist',   'tom@company.com'],
    ['Emma Williams',  'Email Marketing',         'emma@company.com'],
    ['Jake Rivera',    'SEO & Analytics',         'jake@company.com'],
  ].forEach(r => ins.run(...r));
}

if (isEmpty('company_priorities')) {
  const ins = db.prepare(`
    INSERT INTO company_priorities (title, description, quarter, year, owner, status)
    VALUES (?, ?, ?, ?, ?, ?)`);
  [
    ['Achieve 25% Revenue Growth',          'Grow total revenue from $4M to $5M ARR through new customer acquisition and upsell', 'Q1', 2026, 'CEO',                'on-track'],
    ['Enter the SMB Market Segment',        'Launch dedicated SMB offering and acquire first 50 SMB customers', 'Q1', 2026, 'VP Sales',           'on-track'],
    ['Improve Customer Retention to 90%',   'Reduce churn from 14% to 10% through proactive customer success programs', 'Q1', 2026, 'VP Customer Success', 'at-risk'],
    ['Launch Product Version 2.0',          'Complete and launch the redesigned product platform with AI features', 'Q1', 2026, 'CTO',               'on-track'],
  ].forEach(r => ins.run(...r));
}

if (isEmpty('marketing_objectives')) {
  const ins = db.prepare(`
    INSERT INTO marketing_objectives (company_priority_id, title, description, target_value, target_unit, quarter, year, current_value, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  [
    [1, 'Generate 400 Marketing Qualified Leads (MQLs) in Q1',    'Drive top-of-funnel volume through paid, organic, and social channels',       400, 'MQLs',            'Q1', 2026, 246, 'on-track'],
    [2, 'Reach 80,000 SMB decision-makers with targeted messaging','LinkedIn + paid campaigns specifically targeting SMB segment',                80000, 'impressions',    'Q1', 2026, 48000, 'on-track'],
    [3, 'Reduce churn through customer nurture — lift retention 5%','Email re-engagement + success story content targeting existing customers',     5, '% retention lift', 'Q1', 2026, 1.8,  'at-risk'],
    [4, 'Build 500-person product waitlist before launch day',     'Create anticipation through teaser content, webinars, and early access CTAs', 500, 'sign-ups',         'Q1', 2026, 127, 'on-track'],
  ].forEach(r => ins.run(...r));
}

if (isEmpty('brand_positioning')) {
  db.prepare(`
    INSERT INTO brand_positioning (for_who, who_need, our_product, is_a, that, unlike, our_differentiator, tagline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    'B2B companies with 20–500 employees',
    'A predictable, scalable way to generate qualified pipeline',
    '[Your Company]',
    'Growth intelligence platform',
    'Connects every marketing activity directly to revenue outcomes',
    'Generic marketing tools that track activities but not results',
    'Gives marketing teams the clarity and accountability to drive measurable business growth',
    'Marketing that moves the number.'
  );
}

if (isEmpty('annual_goals')) {
  const ins = db.prepare(`
    INSERT INTO annual_goals (year, goal_title, goal_description, q1_target, q2_target, q3_target, q4_target, q1_actual, q2_actual, unit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  [
    [2026, 'Total MQLs Generated',     'Marketing qualified leads across all channels',    400,   450, 500, 550,  246,  null, 'MQLs'],
    [2026, 'Website Visitors',         'Monthly unique website visitors',               10000, 12000, 14000, 16000, 9200, null, 'visitors/mo'],
    [2026, 'Marketing-Attributed Revenue', 'Revenue from marketing-sourced deals',       120000, 150000, 180000, 200000, 94000, null, '$'],
    [2026, 'Cost Per Lead',            'Blended cost per MQL across all channels',          90,    80,   75,  70,  106,  null, '$'],
  ].forEach(r => ins.run(...r));
}

if (isEmpty('quarterly_plans')) {
  const ins = db.prepare(`
    INSERT INTO quarterly_plans (quarter, year, title, company_priority_id, marketing_objective_id, budget_allocated, budget_spent, success_metric, target_value, actual_value, rag_status, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  [
    ['Q1', 2026, 'Lead Generation Acceleration', 1, 1, 18000, 11200, 'MQLs generated',          400, 246, 'green',  1],
    ['Q1', 2026, 'SMB Market Penetration',       2, 2, 12000,  6800, 'SMB prospects reached',  80000, 48000, 'yellow', 2],
    ['Q1', 2026, 'Customer Retention Campaign',  3, 3,  6000,  2400, 'Retention lift %',          5,  1.8, 'red',    3],
    ['Q1', 2026, 'Product Launch Build-up',      4, 4,  8000,  3100, 'Waitlist sign-ups',        500, 127, 'green',  4],
  ].forEach(r => ins.run(...r));
}

if (isEmpty('campaigns')) {
  const ins = db.prepare(`
    INSERT INTO campaigns (name, objective, company_priority_id, quarterly_plan_id, start_date, end_date, budget_allocated, budget_spent, target_leads, actual_leads, target_conversions, actual_conversions, target_revenue, actual_revenue, target_ctr, actual_ctr, channel, status, assigned_to, insights)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  [
    ['Q1 Lead Gen Blitz',          'Drive top-of-funnel leads through Google & LinkedIn paid search', 1, 1, '2026-01-06', '2026-03-31', 12000, 7800,  200, 156, 40, 28,  80000, 58000, 3.5, 2.8, 'Paid Search',  'active',    3, 'Specific benefit-led headlines outperform generic CTAs. "Get your free audit" converts 42% better than "Learn more".'],
    ['SMB Decision-Maker Series',  'LinkedIn thought-leadership targeting SMB founders and ops leaders', 2, 2, '2026-01-13', '2026-03-31',  8000, 4200,  150,  68, 20, 11,      0,     0, 0.8, 0.72, 'LinkedIn',    'active',    2, 'Carousel posts drive 3x more engagement than single-image. Pain-point headlines outperform achievement headlines.'],
    ['Customer Success Stories',   'Email + content campaign to re-engage and retain existing customers', 3, 3, '2026-02-01', '2026-03-31',  3000, 1400,   50,  38,  0,  0,      0,     0,   0,    0, 'Email',       'active',    4, 'Video testimonials have 2x the click-through of text-only case studies.'],
    ['Product V2 Waitlist',        'Build anticipation for product launch through teaser content and early access', 4, 4, '2026-02-15', '2026-04-30',  5000, 1800,  500, 127,  0,  0,      0,     0,   0,    0, 'Multi-channel','planning',  5, null],
    ['SEO Content Initiative',     'Build organic search presence through long-form keyword-targeted content', 1, 1, '2025-10-01', '2026-01-31',  2500, 2500,   80,  94,  12, 15,  18000, 22000, 0,    0, 'Organic',     'completed', 5, 'Long-form guides (2000+ words) rank significantly faster than short posts. Technical SEO fixes drove 38% traffic increase.'],
  ].forEach(r => ins.run(...r));
}

if (isEmpty('ab_tests')) {
  const ins = db.prepare(`
    INSERT INTO ab_tests (campaign_id, name, variant_a, variant_b, metric, result_a, result_b, winner, insight, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  [
    [1, 'Landing Page Headline Test',    '"Double Your Leads This Quarter"',         '"The Proven System for B2B Lead Generation"', 'Conversion Rate (%)', 2.3, 3.8, 'B', 'Specificity wins — "proven system" framing outperformed generic "double" claim by 65%. Update all ad copy accordingly.', 'completed'],
    [1, 'CTA Button Colour Test',        'Blue (#0066CC)',                            'Orange (#FF6B35)',                            'Click-Through Rate (%)', 4.1, 5.6, 'B', 'High-contrast orange CTA button drives 37% more clicks. Apply to all landing pages.', 'completed'],
    [2, 'LinkedIn Ad Format Test',       'Single image ad',                           'Carousel ad (3 slides)',                      'CTR (%)',             0.48, 0.72, 'B', 'Carousel format drives 50% higher CTR for SMB audience. Scroll-stopping creative matters more than copy length.', 'completed'],
    [3, 'Subject Line Tone Test',        '"Your Q1 renewal is coming up"',           '"How [Company] can save 10 hours this month"', 'Email Open Rate (%)', 18.4, 26.1, 'B', 'Value-led subject lines significantly outperform reminder-style. Lead with the benefit, not the ask.', 'running'],
  ].forEach(r => ins.run(...r));
}

if (isEmpty('content_items')) {
  const ins = db.prepare(`
    INSERT INTO content_items (title, content_type, platform, campaign_id, assigned_to, status, scheduled_date, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const items = [
    ['5 Proven Ways to Accelerate B2B Lead Generation',          'blog',    'Website',   1, 2, 'published',  '2026-02-05', 'lead-gen,seo'],
    ['Q1 Marketing Benchmark Report [Gated]',                    'email',   'HubSpot',   1, 4, 'published',  '2026-01-20', 'email,lead-gen'],
    ['3 LinkedIn Targeting Mistakes Costing You Leads',          'social',  'LinkedIn',  2, 2, 'published',  '2026-02-12', 'linkedin,smb'],
    ['Product V2 Sneak Peek — Coming Soon',                      'video',   'YouTube',   4, 2, 'draft',      '2026-03-10', 'product-launch,video'],
    ['Customer Spotlight: How Acme Corp 3x\'d Their Pipeline',   'blog',    'Website',   3, 2, 'review',     '2026-02-28', 'case-study,retention'],
    ['Weekly Growth Newsletter #8',                              'email',   'Mailchimp', 1, 4, 'scheduled',  '2026-03-04', 'newsletter'],
    ['Behind the Scenes: Our Product Team at Work',              'social',  'Instagram', 4, 2, 'ideation',   null,         'product-launch,culture'],
    ['SMB Growth Secrets Webinar — Register Now',                'webinar', 'Zoom',      2, 2, 'scheduled',  '2026-03-18', 'webinar,smb'],
    ['Google Ads Quality Score: The Definitive Guide',           'blog',    'Website',   1, 5, 'draft',      '2026-03-12', 'paid-search,seo'],
    ['Early Access: Join the Product V2 Waitlist',               'ad',      'LinkedIn',  4, 3, 'review',     '2026-03-01', 'paid,product-launch'],
    ['Retention Email Series — Part 1: Quick Wins',              'email',   'HubSpot',   3, 4, 'scheduled',  '2026-03-05', 'email,retention'],
    ['Retention Email Series — Part 2: Success Blueprint',       'email',   'HubSpot',   3, 4, 'scheduled',  '2026-03-12', 'email,retention'],
    ['How SMBs Can Compete with Enterprise Marketing Budgets',   'blog',    'Website',   2, 2, 'ideation',   null,         'smb,content'],
    ['Q1 Recap: What\'s Working in B2B Marketing',              'social',  'LinkedIn',  1, 2, 'ideation',   null,         'thought-leadership'],
    ['Product V2 Feature Reveal — AI-Powered Insights',         'video',   'YouTube',   4, 2, 'ideation',   null,         'product-launch,video'],
  ];
  items.forEach(r => ins.run(...r));
}

if (isEmpty('metrics_snapshots')) {
  const ins = db.prepare(`
    INSERT INTO metrics_snapshots (snapshot_date, period, website_visitors, website_sessions, avg_time_on_site, mqls, sqls, lead_conversion_rate, organic_leads, paid_leads, social_leads, email_leads, cost_per_lead_organic, cost_per_lead_paid, cost_per_lead_social, cost_per_lead_email, total_ad_spend, total_revenue_attributed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  [
    ['2025-10-01', 'month', 6800,  9200,  2.8, 78,  22, 1.15, 30, 28, 14,  6, 38, 210, 105, 28,  5880, 28000],
    ['2025-11-01', 'month', 7200,  9900,  2.9, 88,  29, 1.22, 34, 32, 16,  6, 35, 200,  98, 26,  6400, 33000],
    ['2025-12-01', 'month', 7600, 10800,  3.0, 96,  33, 1.26, 38, 35, 17,  6, 32, 192,  95, 25,  6720, 38000],
    ['2026-01-01', 'month', 8500, 12400,  3.2, 112, 38, 1.32, 45, 42, 18,  7, 28, 185,  95, 22,  7770, 42000],
    ['2026-02-01', 'month', 9200, 13800,  3.5, 134, 45, 1.46, 52, 48, 22, 12, 25, 175,  88, 18,  8400, 52000],
  ].forEach(r => ins.run(...r));
}

if (isEmpty('personas')) {
  const ins = db.prepare(`
    INSERT INTO personas (name, role, age_range, company_size, industry, goals, pain_points, channels, messaging, quote, photo_emoji, conversion_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  [
    [
      'Alex — The Growth-Focused CEO',
      'CEO / Founder',
      '40–55',
      '50–500 employees',
      'B2B Technology, Professional Services',
      'Scale revenue to next milestone\nBuild a defensible market position\nBuild a team that executes without constant oversight',
      'Pipeline is unpredictable — too dependent on referrals\nCan\'t see what marketing is actually doing\nHired a marketing team but unsure if they\'re working on the right things',
      'LinkedIn\nIndustry podcasts & conferences\nPeer CEO groups (EO, YPO)',
      'Lead with ROI and competitive advantage\nUse data and case studies\n"Proven" and "predictable" are powerful words\nAvoid jargon — speak in revenue and growth terms',
      '"I need marketing that moves the revenue number — not just fills the pipeline with leads that go nowhere."',
      '🎯',
      12.5
    ],
    [
      'Sam — The Stretched Marketing Manager',
      'Marketing Manager / Head of Marketing',
      '28–40',
      '20–200 employees',
      'Any B2B sector',
      'Prove marketing\'s impact to the leadership team\nBuild scalable, repeatable processes\nDo more with a lean team and limited budget',
      'No time — running campaigns AND reporting AND strategy\nAttribution is hard — leadership doesn\'t see the value\nTools don\'t talk to each other, so data is siloed',
      'LinkedIn\nMarketing newsletters (Marketing Brew, Demand Gen Report)\nSlack communities (#marketing-ops)\nTwitter/X',
      'Efficiency and time-saving over features\n"Easy to implement" matters more than "powerful"\nShow how it reduces reporting workload\nHighlight other marketing teams using it successfully',
      '"I need something that helps me show leadership what marketing is worth — without spending 10 hours a week building reports."',
      '⚡',
      8.2
    ],
    [
      'Jordan — The Budget-Conscious CFO',
      'CFO / Finance Director',
      '38–52',
      '100–1,000 employees',
      'Any B2B sector',
      'Control and forecast marketing spend accurately\nImprove financial visibility across all departments\nSupport growth without unnecessary waste',
      'Marketing requests budget without clear ROI justification\nUnpredictable spend makes forecasting difficult\nHard to tie marketing activities to revenue outcomes',
      'Financial publications (CFO Magazine, Wall Street Journal)\nLinkedIn\nIndustry benchmarking reports',
      'Lead with clear ROI calculations and payback periods\nUse financial language (CAC, LTV, payback period)\nEmphasise predictability and accountability\n"We can show exactly what every dollar produces"',
      '"Show me the numbers. What\'s the return on every marketing dollar, and how quickly will we see it?"',
      '📊',
      6.8
    ],
  ].forEach(r => ins.run(...r));
}

module.exports = db;
