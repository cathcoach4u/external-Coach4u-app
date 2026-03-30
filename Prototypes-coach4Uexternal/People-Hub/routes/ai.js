const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

const client = new Anthropic();

// POST /api/ai/suggest-topics  — suggest 1:1 discussion topics based on KPI status
router.post('/suggest-topics', requireAuth, async (req, res) => {
  const { staff_id, one_on_one_id } = req.body;
  try {
    const staff = db.prepare('SELECT * FROM users WHERE id=?').get(staff_id);
    const kpis = db.prepare('SELECT * FROM kpis WHERE user_id=?').all(staff_id);
    const pendingItems = one_on_one_id
      ? db.prepare("SELECT * FROM action_items WHERE one_on_one_id=? AND status!='complete'").all(one_on_one_id)
      : [];

    const kpiSummary = kpis.map(k =>
      `- ${k.description}: current=${k.current_value}${k.unit||''}, target=${k.target}${k.unit||''}, status=${k.status}`
    ).join('\n');
    const actionSummary = pendingItems.map(a => `- ${a.description} (${a.status})`).join('\n');

    const prompt = `You are a people development coach helping a manager prepare for a 1:1 meeting with ${staff.name} (${staff.job_title}).

Current KPIs:
${kpiSummary || 'No KPIs set'}

Pending action items:
${actionSummary || 'None'}

Suggest 5 specific, thoughtful discussion topics for this 1:1 meeting. Focus on KPI progress, blockers, development, and wellbeing. Return only the 5 topics, one per line, no numbering or bullets.`;

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content.find(b => b.type === 'text')?.text || '';
    const topics = text.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 5);
    res.json({ topics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/suggest-kpis  — suggest KPIs for a person based on their role and linked priority
router.post('/suggest-kpis', requireAuth, async (req, res) => {
  const { user_id, priority_description, department_goal } = req.body;
  try {
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(user_id);
    const prompt = `You are a performance management expert. Suggest 4 measurable KPIs for a ${user.job_title} that would support the following company priority:

Company Priority: "${priority_description}"
Department Goal: "${department_goal||'Not specified'}"

Make each KPI specific, measurable, and realistic for this role. Return each KPI on its own line in this format:
[Description] | [Target] | [Unit] | [Type: number/percentage/currency]

No numbering, bullets, or extra explanation.`;

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content.find(b => b.type === 'text')?.text || '';
    const kpis = text.split('\n').map(line => {
      const parts = line.split('|').map(p => p.trim());
      return { description: parts[0], target: parts[1], unit: parts[2], target_type: (parts[3]||'number').toLowerCase() };
    }).filter(k => k.description);
    res.json({ kpis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/suggest-development-goals  — based on CliftonStrengths
router.post('/suggest-development-goals', requireAuth, async (req, res) => {
  const { user_id } = req.body;
  try {
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(user_id);
    const strengths = db.prepare('SELECT strength, rank FROM clifton_strengths WHERE user_id=? ORDER BY rank').all(user_id);
    const strengthList = strengths.map(s => s.strength).join(', ');

    const prompt = `You are a strengths-based development coach using the CliftonStrengths framework.

Person: ${user.name}
Role: ${user.job_title}
Top 5 CliftonStrengths: ${strengthList || 'Not yet assessed'}

Suggest 3 development goals that leverage this person's natural strengths to grow in their role. Each goal should be specific and actionable. Return one goal per line, no numbering or bullets.`;

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content.find(b => b.type === 'text')?.text || '';
    const goals = text.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3);
    res.json({ goals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/draft-action-items  — from meeting notes
router.post('/draft-action-items', requireAuth, async (req, res) => {
  const { meeting_notes, manager_name, staff_name } = req.body;
  try {
    const prompt = `You are a meeting assistant. Extract clear, specific action items from these 1:1 meeting notes between ${manager_name||'the manager'} and ${staff_name||'the staff member'}.

Meeting Notes:
${meeting_notes}

Return up to 5 action items, one per line, in this format:
[Action description] | [Who: Manager or ${staff_name||'Staff'}] | [Suggested timeframe]

No numbering, bullets, or extra explanation.`;

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content.find(b => b.type === 'text')?.text || '';
    const items = text.split('\n').map(line => {
      const parts = line.split('|').map(p => p.trim());
      return { description: parts[0], owner: parts[1], timeframe: parts[2] };
    }).filter(i => i.description);
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/analyze-strengths  — team strengths gap analysis
router.post('/analyze-strengths', requireAuth, async (req, res) => {
  const { department_id } = req.body;
  try {
    let users;
    if (department_id) {
      users = db.prepare('SELECT id, name, job_title FROM users WHERE department_id=?').all(department_id);
    } else {
      users = db.prepare('SELECT id, name, job_title FROM users WHERE role=?').all('staff');
    }

    const dept = department_id ? db.prepare('SELECT name FROM departments WHERE id=?').get(department_id) : null;
    const allStrengths = db.prepare('SELECT user_id, strength FROM clifton_strengths').all();

    const strengthCounts = {};
    const domains = { Executing: 0, Influencing: 0, 'Relationship Building': 0, 'Strategic Thinking': 0 };
    const domainMap = {
      Achiever: 'Executing', Arranger: 'Executing', Belief: 'Executing', Consistency: 'Executing',
      Deliberative: 'Executing', Discipline: 'Executing', Focus: 'Executing', Responsibility: 'Executing', Restorative: 'Executing',
      Activator: 'Influencing', Command: 'Influencing', Communication: 'Influencing', Competition: 'Influencing',
      Maximizer: 'Influencing', 'Self-Assurance': 'Influencing', Significance: 'Influencing', Woo: 'Influencing',
      Adaptability: 'Relationship Building', Connectedness: 'Relationship Building', Developer: 'Relationship Building',
      Empathy: 'Relationship Building', Harmony: 'Relationship Building', Includer: 'Relationship Building',
      Individualization: 'Relationship Building', Positivity: 'Relationship Building', Relator: 'Relationship Building',
      Analytical: 'Strategic Thinking', Context: 'Strategic Thinking', Futuristic: 'Strategic Thinking',
      Ideation: 'Strategic Thinking', Input: 'Strategic Thinking', Intellection: 'Strategic Thinking',
      Learner: 'Strategic Thinking', Strategic: 'Strategic Thinking'
    };

    for (const s of allStrengths) {
      strengthCounts[s.strength] = (strengthCounts[s.strength] || 0) + 1;
      const domain = domainMap[s.strength];
      if (domain) domains[domain]++;
    }

    const teamList = users.map(u => {
      const strengths = allStrengths.filter(s => s.user_id === u.id).map(s => s.strength);
      return `${u.name} (${u.job_title}): ${strengths.join(', ') || 'Not assessed'}`;
    }).join('\n');

    const prompt = `You are a CliftonStrengths team coach. Analyse the following team's strengths profile and provide insights.

Team: ${dept ? dept.name : 'Full organisation'}
Team Members:
${teamList}

Domain counts — Executing: ${domains.Executing}, Influencing: ${domains.Influencing}, Relationship Building: ${domains['Relationship Building']}, Strategic Thinking: ${domains['Strategic Thinking']}

Provide:
1. The team's key strength themes (what they're naturally good at)
2. Potential blind spots or gaps by domain
3. Two specific recommendations for how to leverage these strengths as a team

Keep it practical and under 200 words.`;

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    });

    const analysis = response.content.find(b => b.type === 'text')?.text || '';
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
