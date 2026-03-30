const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic();

// POST /api/ai/suggest-responsibilities
router.post('/ai/suggest-responsibilities', async (req, res) => {
  const { seatTitle } = req.body;
  if (!seatTitle || !seatTitle.trim()) {
    return res.status(400).json({ error: 'seatTitle is required' });
  }

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Generate 5 key accountability statements for a "${seatTitle.trim()}" role in a small business using EOS methodology. Make them specific, actionable, and appropriate for an Accountability Chart. Return only the 5 responsibilities, one per line, with no numbering, bullets, or extra formatting.`
      }]
    });

    const text = response.content.find(b => b.type === 'text')?.text || '';
    const responsibilities = text
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .slice(0, 5);

    res.json({ responsibilities });
  } catch (err) {
    console.error('AI suggest error:', err.message);
    res.status(500).json({ error: 'AI suggestion failed: ' + err.message });
  }
});

// POST /api/ai/strategy-chat  — streaming SSE
router.post('/ai/strategy-chat', async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const systemPrompt = `You are an expert business strategy coach helping a company owner build their Vision & Strategy document — a one-page strategic plan covering core values, core focus, 10-year target, marketing strategy, 3-year picture, and 1-year plan.

Your coaching style:
- Conversational and encouraging — you ask one focused question at a time
- Help them discover their own answers through thoughtful questions
- When they give you material to work with, help them refine it into crisp, strategic language they can copy directly into their plan
- Keep responses short (3-6 sentences max) unless you're drafting actual strategy text for them
- Use **bold** sparingly to highlight key phrases or questions
- Guide them progressively: start with industry/context, then core values, core focus, big vision, then work toward concrete goals

You have deep expertise in EOS (Entrepreneurial Operating System), OKRs, and business strategy frameworks. When suggesting language, make it specific and actionable — avoid generic platitudes.`;

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    stream.on('finalMessage', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    stream.on('error', (err) => {
      if (err?.constructor?.name === 'APIUserAbortError') return; // client disconnected
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      }
    });

    req.on('close', () => {
      try { stream.abort(); } catch(_) {}
    });
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
