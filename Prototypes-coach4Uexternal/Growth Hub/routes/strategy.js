const express = require('express');
const router = express.Router();
const db = require('../database/db');

// ── Company Priorities ──────────────────────────────────────────────────────

router.get('/company-priorities', (req, res) => {
  res.json(db.prepare('SELECT * FROM company_priorities ORDER BY id').all());
});

router.post('/company-priorities', (req, res) => {
  const { title, description, quarter, year, owner, due_date, status } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const r = db.prepare(`
    INSERT INTO company_priorities (title, description, quarter, year, owner, due_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(title, description||'', quarter||'Q1', year||2026, owner||'', due_date||'', status||'on-track');
  res.json(db.prepare('SELECT * FROM company_priorities WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/company-priorities/:id', (req, res) => {
  const { title, description, quarter, year, owner, due_date, status } = req.body;
  db.prepare(`UPDATE company_priorities SET title=?, description=?, quarter=?, year=?, owner=?, due_date=?, status=? WHERE id=?`)
    .run(title, description, quarter, year, owner, due_date, status, req.params.id);
  res.json(db.prepare('SELECT * FROM company_priorities WHERE id = ?').get(req.params.id));
});

router.delete('/company-priorities/:id', (req, res) => {
  db.prepare('DELETE FROM company_priorities WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Bulk import from JSON paste
router.post('/company-priorities/import', (req, res) => {
  const { priorities, quarter, year } = req.body;
  if (!Array.isArray(priorities)) return res.status(400).json({ error: 'priorities must be an array' });
  const ins = db.prepare(`
    INSERT INTO company_priorities (title, description, quarter, year, owner, status, source)
    VALUES (?, ?, ?, ?, ?, ?, 'imported')`);
  const insertMany = db.transaction(items => items.forEach(p =>
    ins.run(p.title || p.rock_title || p.name || 'Unnamed', p.description || p.details || '', quarter || p.quarter || 'Q1', year || p.year || 2026, p.owner || p.assigned_to || '', p.status || 'on-track')
  ));
  insertMany(priorities);
  res.json({ ok: true, count: priorities.length });
});

// ── Marketing Objectives ────────────────────────────────────────────────────

router.get('/marketing-objectives', (req, res) => {
  res.json(db.prepare(`
    SELECT mo.*, cp.title as priority_title
    FROM marketing_objectives mo
    LEFT JOIN company_priorities cp ON cp.id = mo.company_priority_id
    ORDER BY mo.id`).all());
});

router.post('/marketing-objectives', (req, res) => {
  const { company_priority_id, title, description, target_value, target_unit, quarter, year, status } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const r = db.prepare(`
    INSERT INTO marketing_objectives (company_priority_id, title, description, target_value, target_unit, quarter, year, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(company_priority_id||null, title, description||'', target_value||0, target_unit||'', quarter||'Q1', year||2026, status||'on-track');
  res.json(db.prepare('SELECT * FROM marketing_objectives WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/marketing-objectives/:id', (req, res) => {
  const { company_priority_id, title, description, target_value, target_unit, quarter, year, current_value, status } = req.body;
  db.prepare(`UPDATE marketing_objectives SET company_priority_id=?, title=?, description=?, target_value=?, target_unit=?, quarter=?, year=?, current_value=?, status=? WHERE id=?`)
    .run(company_priority_id||null, title, description, target_value, target_unit, quarter, year, current_value||0, status, req.params.id);
  res.json(db.prepare('SELECT * FROM marketing_objectives WHERE id = ?').get(req.params.id));
});

router.delete('/marketing-objectives/:id', (req, res) => {
  db.prepare('DELETE FROM marketing_objectives WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── Brand Positioning ───────────────────────────────────────────────────────

router.get('/brand-positioning', (req, res) => {
  res.json(db.prepare('SELECT * FROM brand_positioning ORDER BY id LIMIT 1').get() || {});
});

router.put('/brand-positioning', (req, res) => {
  const existing = db.prepare('SELECT id FROM brand_positioning LIMIT 1').get();
  const { for_who, who_need, our_product, is_a, that, unlike, our_differentiator, tagline } = req.body;
  if (existing) {
    db.prepare(`UPDATE brand_positioning SET for_who=?, who_need=?, our_product=?, is_a=?, that=?, unlike=?, our_differentiator=?, tagline=?, updated_at=datetime('now') WHERE id=?`)
      .run(for_who, who_need, our_product, is_a, that, unlike, our_differentiator, tagline, existing.id);
  } else {
    db.prepare(`INSERT INTO brand_positioning (for_who, who_need, our_product, is_a, that, unlike, our_differentiator, tagline) VALUES (?,?,?,?,?,?,?,?)`)
      .run(for_who, who_need, our_product, is_a, that, unlike, our_differentiator, tagline);
  }
  res.json(db.prepare('SELECT * FROM brand_positioning LIMIT 1').get());
});

// ── Annual Goals ────────────────────────────────────────────────────────────

router.get('/annual-goals', (req, res) => {
  const year = req.query.year || 2026;
  res.json(db.prepare('SELECT * FROM annual_goals WHERE year = ? ORDER BY id').all(year));
});

router.post('/annual-goals', (req, res) => {
  const { year, goal_title, goal_description, q1_target, q2_target, q3_target, q4_target, unit } = req.body;
  const r = db.prepare(`INSERT INTO annual_goals (year, goal_title, goal_description, q1_target, q2_target, q3_target, q4_target, unit) VALUES (?,?,?,?,?,?,?,?)`)
    .run(year||2026, goal_title, goal_description||'', q1_target||0, q2_target||0, q3_target||0, q4_target||0, unit||'');
  res.json(db.prepare('SELECT * FROM annual_goals WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/annual-goals/:id', (req, res) => {
  const { goal_title, goal_description, q1_target, q2_target, q3_target, q4_target, q1_actual, q2_actual, q3_actual, q4_actual, unit } = req.body;
  db.prepare(`UPDATE annual_goals SET goal_title=?, goal_description=?, q1_target=?, q2_target=?, q3_target=?, q4_target=?, q1_actual=?, q2_actual=?, q3_actual=?, q4_actual=?, unit=? WHERE id=?`)
    .run(goal_title, goal_description, q1_target, q2_target, q3_target, q4_target, q1_actual, q2_actual, q3_actual, q4_actual, unit, req.params.id);
  res.json(db.prepare('SELECT * FROM annual_goals WHERE id = ?').get(req.params.id));
});

router.delete('/annual-goals/:id', (req, res) => {
  db.prepare('DELETE FROM annual_goals WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
