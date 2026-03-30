const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/personas', (req, res) => {
  res.json(db.prepare('SELECT * FROM personas ORDER BY id').all());
});

router.post('/personas', (req, res) => {
  const f = req.body;
  if (!f.name) return res.status(400).json({ error: 'name required' });
  const r = db.prepare(`
    INSERT INTO personas (name, role, age_range, company_size, industry, goals, pain_points, channels, messaging, quote, photo_emoji, conversion_rate)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      f.name, f.role||'', f.age_range||'', f.company_size||'', f.industry||'',
      f.goals||'', f.pain_points||'', f.channels||'', f.messaging||'',
      f.quote||'', f.photo_emoji||'👤', f.conversion_rate||0);
  res.json(db.prepare('SELECT * FROM personas WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/personas/:id', (req, res) => {
  const f = req.body;
  db.prepare(`UPDATE personas SET name=?, role=?, age_range=?, company_size=?, industry=?, goals=?, pain_points=?, channels=?, messaging=?, quote=?, photo_emoji=?, conversion_rate=? WHERE id=?`)
    .run(f.name, f.role, f.age_range, f.company_size, f.industry, f.goals, f.pain_points, f.channels, f.messaging, f.quote, f.photo_emoji||'👤', f.conversion_rate||0, req.params.id);
  res.json(db.prepare('SELECT * FROM personas WHERE id = ?').get(req.params.id));
});

router.delete('/personas/:id', (req, res) => {
  db.prepare('DELETE FROM personas WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
