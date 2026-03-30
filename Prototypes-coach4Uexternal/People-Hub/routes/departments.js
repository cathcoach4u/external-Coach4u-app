const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/departments
router.get('/', requireAuth, (req, res) => {
  try {
    const depts = db.prepare(`
      SELECT d.*, u.name AS manager_name,
             COUNT(DISTINCT m.id) AS staff_count
      FROM departments d
      LEFT JOIN users u ON d.manager_id=u.id
      LEFT JOIN users m ON m.department_id=d.id
      GROUP BY d.id ORDER BY d.name
    `).all();
    res.json(depts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/departments/:id/goals
router.get('/:id/goals', requireAuth, (req, res) => {
  try {
    const goals = db.prepare(`
      SELECT g.*, p.original_description AS priority_description, p.quarter
      FROM department_goals g
      LEFT JOIN priorities p ON g.priority_id=p.id
      WHERE g.department_id=? ORDER BY g.sort_order, g.created_at
    `).all(req.params.id);
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/departments/:id/goals
router.post('/:id/goals', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Access denied' });
    const { description, priority_id, status } = req.body;
    if (!description) return res.status(400).json({ error: 'description required' });
    const result = db.prepare(`
      INSERT INTO department_goals (department_id, priority_id, description, status)
      VALUES (?,?,?,?)
    `).run(req.params.id, priority_id||null, description, status||'on_track');
    const goal = db.prepare('SELECT * FROM department_goals WHERE id=?').get(result.lastInsertRowid);
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/departments/goals/:id
router.put('/goals/:id', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Access denied' });
    const { description, priority_id, status } = req.body;
    db.prepare('UPDATE department_goals SET description=?,priority_id=?,status=? WHERE id=?')
      .run(description, priority_id||null, status||'on_track', req.params.id);
    const goal = db.prepare('SELECT * FROM department_goals WHERE id=?').get(req.params.id);
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/departments/goals/:id
router.delete('/goals/:id', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Access denied' });
    db.prepare('DELETE FROM department_goals WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/departments  — admin only
router.post('/', requireAuth, requireAdmin, (req, res) => {
  try {
    const { name, description, manager_id } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const result = db.prepare('INSERT INTO departments (name,description,manager_id) VALUES (?,?,?)')
      .run(name, description||null, manager_id||null);
    res.status(201).json(db.prepare('SELECT * FROM departments WHERE id=?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/departments/:id  — admin only
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const { name, description, manager_id } = req.body;
    db.prepare('UPDATE departments SET name=?,description=?,manager_id=? WHERE id=?')
      .run(name, description||null, manager_id||null, req.params.id);
    res.json(db.prepare('SELECT * FROM departments WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
