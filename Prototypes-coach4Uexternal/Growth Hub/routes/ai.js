const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../database/db');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function ask(system, user) {
  const msg = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: user }],
    system,
  });
  return msg.content[0].text;
}

// ── Campaign Ideas ──────────────────────────────────────────────────────────
router.post('/ai/campaign-ideas', async (req, res) => {
  try {
    const { priority, objective, audience, budget } = req.body;
    const system = `You are an expert B2B marketing strategist. Generate actionable, creative campaign ideas that connect directly to business priorities. Be specific and practical. Format your response with numbered ideas, each with: Campaign Name, Core Concept (1 sentence), Key Tactics (3 bullet points), Expected Outcome.`;
    const prompt = `Company Priority: ${priority || 'Grow revenue by 25%'}
Marketing Objective: ${objective || 'Generate 400 MQLs this quarter'}
Target Audience: ${audience || 'B2B decision-makers'}
Budget Range: ${budget || '$10,000–$20,000'}

Generate 5 specific, creative campaign ideas that would achieve this objective. Make them realistic and actionable for a B2B company.`;
    const text = await ask(system, prompt);
    res.json({ result: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Content Calendar Generator ──────────────────────────────────────────────
router.post('/ai/content-calendar', async (req, res) => {
  try {
    const { campaign_name, campaign_objective, persona, weeks } = req.body;
    const system = `You are a content marketing expert who creates strategic, audience-focused content calendars. Each piece of content should serve the campaign objective and speak directly to the target persona's pain points and goals.`;
    const prompt = `Campaign: ${campaign_name || 'Q1 Lead Generation Campaign'}
Objective: ${campaign_objective || 'Generate qualified leads'}
Target Persona: ${persona || 'B2B Marketing Manager'}
Duration: ${weeks || 4} weeks

Create a content calendar with specific content pieces for each week. For each piece include:
- Content type (blog, social, email, video, webinar, ad)
- Platform
- Title/Topic
- Key message (1 sentence)
- Call to action

Format as a week-by-week plan.`;
    const text = await ask(system, prompt);
    res.json({ result: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Content Topic Suggester ─────────────────────────────────────────────────
router.post('/ai/content-topics', async (req, res) => {
  try {
    const { persona_name, pain_points, channels, goal } = req.body;
    const system = `You are a content strategist specialising in B2B thought leadership. Generate content topics that genuinely help the target audience solve their problems, positioning the brand as a trusted advisor rather than a vendor.`;
    const prompt = `Target Persona: ${persona_name || 'Marketing Manager'}
Pain Points: ${pain_points || 'Proving ROI, limited budget, attribution challenges'}
Channels: ${channels || 'LinkedIn, Email, Blog'}
Goal: ${goal || 'Build awareness and generate inbound leads'}

Suggest 10 specific, compelling content topics. For each include:
- Title (ready to publish)
- Format (blog, video, infographic, etc.)
- Best platform
- Why it resonates with this persona (1 sentence)`;
    const text = await ask(system, prompt);
    res.json({ result: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Campaign Performance Analyser ───────────────────────────────────────────
router.post('/ai/analyze-campaign', async (req, res) => {
  try {
    const { campaign_id } = req.body;
    let campaign;
    if (campaign_id) {
      campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaign_id);
    }
    const campaignData = campaign
      ? `Campaign: ${campaign.name}
Objective: ${campaign.objective}
Channel: ${campaign.channel}
Budget: $${campaign.budget_allocated} allocated, $${campaign.budget_spent} spent
Leads: ${campaign.actual_leads} actual vs ${campaign.target_leads} target
Conversions: ${campaign.actual_conversions} actual vs ${campaign.target_conversions} target
Revenue: $${campaign.actual_revenue} actual vs $${campaign.target_revenue} target
CTR: ${campaign.actual_ctr}% actual vs ${campaign.target_ctr}% target
Status: ${campaign.status}`
      : req.body.campaign_data || 'No campaign data provided';

    const system = `You are a data-driven marketing analyst. Analyse campaign performance objectively — identify what's working, what isn't, and give specific, actionable optimisation recommendations. Be direct and concrete, not generic.`;
    const prompt = `Analyse this campaign performance and provide insights:

${campaignData}

Provide:
1. Performance Summary (2-3 sentences: what the numbers tell us)
2. What's Working (2-3 specific positives)
3. What Needs Improvement (2-3 specific issues)
4. Recommended Optimisations (3-5 concrete next actions, prioritised)
5. Forecast (if improvements are made, what could performance look like?)`;
    const text = await ask(system, prompt);
    res.json({ result: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Persona Generator ───────────────────────────────────────────────────────
router.post('/ai/generate-persona', async (req, res) => {
  try {
    const { description, company_type, product } = req.body;
    const system = `You are a market research expert who creates detailed, realistic B2B buyer personas based on real market dynamics. Personas should be specific and actionable — marketing teams should be able to read them and immediately know how to speak to this person.`;
    const prompt = `Create a detailed B2B buyer persona for:
Description: ${description || 'A decision-maker at a mid-sized B2B company'}
Company Type: ${company_type || 'B2B SaaS or Professional Services'}
Product/Service Being Sold: ${product || 'Marketing software platform'}

Format the persona as:
- Persona Name & Job Title
- Age Range & Background
- Company Size & Industry
- Top 3 Goals (professional)
- Top 3 Pain Points
- Where They Get Information (channels & content)
- What Messaging Resonates
- What Puts Them Off
- A realistic quote they might say about their biggest challenge
- Conversion likelihood descriptor (high/medium/low and why)`;
    const text = await ask(system, prompt);
    res.json({ result: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Free Chat ───────────────────────────────────────────────────────────────
router.post('/ai/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    // Build context from live data
    const priorities = db.prepare('SELECT title FROM company_priorities LIMIT 4').all().map(p => p.title).join(', ');
    const campaigns  = db.prepare("SELECT name, status FROM campaigns WHERE status='active' LIMIT 3").all().map(c => `${c.name} (${c.status})`).join(', ');
    const latest     = db.prepare('SELECT * FROM metrics_snapshots ORDER BY snapshot_date DESC LIMIT 1').get();
    const metricsCtx = latest ? `Latest metrics: ${latest.mqls} MQLs, ${latest.website_visitors} website visitors, $${latest.total_revenue_attributed} revenue attributed` : '';

    const system = `You are the AI Growth Assistant for The Growth Hub — a marketing execution system. You help marketing teams connect their activities to business priorities and drive measurable growth.

Current company priorities: ${priorities || 'Not set yet'}
Active campaigns: ${campaigns || 'None'}
${metricsCtx}
${context || ''}

Be specific, practical, and data-aware. When the user asks for ideas or advice, ground your answers in their actual priorities and campaigns where possible.`;
    const text = await ask(system, message);
    res.json({ result: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
