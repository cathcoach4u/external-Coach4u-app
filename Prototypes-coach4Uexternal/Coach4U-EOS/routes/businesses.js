const express = require('express');
const router = express.Router();
const db = require('../database/db');

const SUB_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'];

// GET /api/businesses
router.get('/businesses', (req, res) => {
  try {
    const businesses = db.prepare('SELECT * FROM businesses ORDER BY type DESC, id').all();
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/businesses
router.post('/businesses', (req, res) => {
  try {
    const { name, type, color } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    // Auto-assign a color if none given
    const existing = db.prepare("SELECT color FROM businesses WHERE type = 'sub'").all();
    const usedColors = existing.map(b => b.color);
    const autoColor = SUB_COLORS.find(c => !usedColors.includes(c)) || SUB_COLORS[0];
    const result = db.prepare(
      'INSERT INTO businesses (name, type, color) VALUES (?, ?, ?)'
    ).run(name.trim(), type || 'sub', color || autoColor);
    const biz = db.prepare('SELECT * FROM businesses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(biz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/businesses/:id
router.put('/businesses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    db.prepare('UPDATE businesses SET name = ?, color = ? WHERE id = ?').run(name, color, id);
    const biz = db.prepare('SELECT * FROM businesses WHERE id = ?').get(id);
    if (!biz) return res.status(404).json({ error: 'Business not found' });
    res.json(biz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/businesses/:id
router.delete('/businesses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const biz = db.prepare('SELECT * FROM businesses WHERE id = ?').get(id);
    if (!biz) return res.status(404).json({ error: 'Business not found' });
    if (biz.type === 'holding') return res.status(400).json({ error: 'Cannot delete the holding company' });
    db.prepare('DELETE FROM businesses WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/businesses/rollup — health summary of all sub-businesses
router.get('/businesses/rollup', (req, res) => {
  try {
    const businesses = db.prepare("SELECT * FROM businesses WHERE type = 'sub' ORDER BY id").all();

    const summary = businesses.map(biz => {
      const rocks = db.prepare('SELECT status FROM rocks WHERE business_id = ?').all(biz.id);
      const rocksTotal    = rocks.length;
      const rocksOnTrack  = rocks.filter(r => r.status === 'on_track' || r.status === 'done').length;
      const rocksOffTrack = rocks.filter(r => r.status === 'off_track').length;
      const rocksDone     = rocks.filter(r => r.status === 'done').length;

      const openIssues = db.prepare(
        "SELECT COUNT(*) as count FROM issues WHERE business_id = ? AND status = 'open'"
      ).get(biz.id);

      const metrics = db.prepare(
        'SELECT id FROM scorecard_metrics WHERE business_id = ? AND active = 1'
      ).all(biz.id);
      let metricsOnTrack = 0;
      metrics.forEach(m => {
        const entry = db.prepare(
          'SELECT on_track FROM scorecard_entries WHERE metric_id = ? ORDER BY week_date DESC LIMIT 1'
        ).get(m.id);
        if (entry && entry.on_track === 1) metricsOnTrack++;
      });

      // VTO summary for this sub-business
      const vtoRows = db.prepare(
        'SELECT section, key, value FROM vto WHERE business_id = ?'
      ).all(biz.id);
      const vtoMap = {};
      for (const r of vtoRows) {
        if (!vtoMap[r.section]) vtoMap[r.section] = {};
        vtoMap[r.section][r.key] = r.value;
      }

      return {
        id: biz.id,
        name: biz.name,
        color: biz.color,
        rocks: { total: rocksTotal, on_track: rocksOnTrack, off_track: rocksOffTrack, done: rocksDone },
        issues: { open: openIssues.count },
        scorecard: { total: metrics.length, on_track: metricsOnTrack },
        vto_summary: {
          purpose: (vtoMap.core_focus || {}).purpose || '',
          one_year_revenue: (vtoMap.one_year || {}).revenue || '',
          one_year_profit: (vtoMap.one_year || {}).profit || '',
          one_year_goals: (vtoMap.one_year || {}).goals || '',
        },
      };
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
