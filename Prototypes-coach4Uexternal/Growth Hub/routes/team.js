const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/team', (req, res) => {
  res.json(db.prepare('SELECT * FROM team_members ORDER BY name').all());
});

router.post('/team', (req, res) => {
  const { name, role, email } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const r = db.prepare('INSERT INTO team_members (name, role, email) VALUES (?, ?, ?)').run(name, role || '', email || '');
  res.json(db.prepare('SELECT * FROM team_members WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/team/:id', (req, res) => {
  const { name, role, email } = req.body;
  db.prepare('UPDATE team_members SET name=?, role=?, email=? WHERE id=?').run(name, role, email, req.params.id);
  res.json(db.prepare('SELECT * FROM team_members WHERE id = ?').get(req.params.id));
});

router.delete('/team/:id', (req, res) => {
  db.prepare('DELETE FROM team_members WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
