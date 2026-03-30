const express = require('express');
const router = express.Router();
const db = require('../database/db');

function getLast13Weeks() {
  const weeks = [];
  const today = new Date();
  const day = today.getDay();
  const diff = (day === 0) ? 6 : day - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  for (let i = 12; i >= 0; i--) {
    const d = new Date(monday);
    d.setDate(monday.getDate() - i * 7);
    weeks.push(d.toISOString().slice(0, 10));
  }
  return weeks;
}

// GET /api/scorecard?business_id=1
router.get('/scorecard', (req, res) => {
  try {
    const business_id = parseInt(req.query.business_id) || 1;
    const metrics = db.prepare(
      'SELECT * FROM scorecard_metrics WHERE active = 1 AND business_id = ? ORDER BY sort_order'
    ).all(business_id);

    const weeks = getLast13Weeks();
    const weekSet = weeks.map(w => `'${w}'`).join(',');

    const result = metrics.map(metric => {
      const entries = db.prepare(
        `SELECT * FROM scorecard_entries WHERE metric_id = ? AND week_date IN (${weekSet}) ORDER BY week_date`
      ).all(metric.id);

      const entryMap = {};
      for (const e of entries) entryMap[e.week_date] = e;

      const weeklyData = weeks.map(week => entryMap[week] || {
        metric_id: metric.id,
        week_date: week,
        value: null,
        on_track: null,
        notes: null,
      });

      return { ...metric, weeks, entries: weeklyData };
    });

    res.json({ metrics: result, weeks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch scorecard' });
  }
});

// POST /api/scorecard/metrics
router.post('/scorecard/metrics', (req, res) => {
  try {
    const { name, owner, goal, measurement_type, sort_order, business_id: bodyBizId } = req.body;
    const business_id = parseInt(bodyBizId) || 1;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = db.prepare(
      'INSERT INTO scorecard_metrics (name, owner, goal, measurement_type, sort_order, business_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, owner || null, goal || null, measurement_type || 'number', sort_order || 0, business_id);
    const metric = db.prepare('SELECT * FROM scorecard_metrics WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(metric);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create metric' });
  }
});

// PUT /api/scorecard/metrics/:id
router.put('/scorecard/metrics/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, owner, goal, measurement_type, sort_order, active } = req.body;
    db.prepare(
      'UPDATE scorecard_metrics SET name = ?, owner = ?, goal = ?, measurement_type = ?, sort_order = ?, active = ? WHERE id = ?'
    ).run(name, owner || null, goal || null, measurement_type || 'number', sort_order || 0, active !== undefined ? active : 1, id);
    const metric = db.prepare('SELECT * FROM scorecard_metrics WHERE id = ?').get(id);
    if (!metric) return res.status(404).json({ error: 'Metric not found' });
    res.json(metric);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update metric' });
  }
});

// DELETE /api/scorecard/metrics/:id
router.delete('/scorecard/metrics/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE scorecard_metrics SET active = 0 WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete metric' });
  }
});

// POST /api/scorecard/entries — upsert
router.post('/scorecard/entries', (req, res) => {
  try {
    const { metric_id, week_date, value, on_track, notes } = req.body;
    if (!metric_id || !week_date) {
      return res.status(400).json({ error: 'metric_id and week_date are required' });
    }
    db.prepare(
      `INSERT INTO scorecard_entries (metric_id, week_date, value, on_track, notes)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(metric_id, week_date) DO UPDATE SET value = excluded.value, on_track = excluded.on_track, notes = excluded.notes`
    ).run(metric_id, week_date, value !== undefined ? value : null, on_track !== undefined ? on_track : null, notes || null);
    const entry = db.prepare(
      'SELECT * FROM scorecard_entries WHERE metric_id = ? AND week_date = ?'
    ).get(metric_id, week_date);
    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upsert entry' });
  }
});

// PUT /api/scorecard/entries/:id
router.put('/scorecard/entries/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { value, on_track, notes } = req.body;
    db.prepare(
      'UPDATE scorecard_entries SET value = ?, on_track = ?, notes = ? WHERE id = ?'
    ).run(value !== undefined ? value : null, on_track !== undefined ? on_track : null, notes || null, id);
    const entry = db.prepare('SELECT * FROM scorecard_entries WHERE id = ?').get(id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

module.exports = router;
