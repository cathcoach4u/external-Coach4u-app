const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/kpis?user_id=X  or  ?department_id=X  or  all (admin)
router.get('/', requireAuth, (req, res) => {
  try {
    const { user_id, department_id } = req.query;

    let rows;
    if (user_id) {
      const uid = parseInt(user_id);
      // Staff can only see their own
      if (req.user.role === 'staff' && req.user.id !== uid) return res.status(403).json({ error: 'Access denied' });
      rows = db.prepare(`
        SELECT k.*, u.name AS user_name, u.job_title,
               g.description AS goal_description, d.name AS department_name
        FROM kpis k
        JOIN users u ON k.user_id=u.id
        LEFT JOIN department_goals g ON k.department_goal_id=g.id
        LEFT JOIN departments d ON u.department_id=d.id
        WHERE k.user_id=? ORDER BY k.sort_order, k.created_at
      `).all(uid);
    } else if (department_id) {
      if (req.user.role === 'staff') return res.status(403).json({ error: 'Access denied' });
      rows = db.prepare(`
        SELECT k.*, u.name AS user_name, u.job_title,
               g.description AS goal_description, d.name AS department_name
        FROM kpis k
        JOIN users u ON k.user_id=u.id
        LEFT JOIN department_goals g ON k.department_goal_id=g.id
        LEFT JOIN departments d ON u.department_id=d.id
        WHERE u.department_id=? ORDER BY u.name, k.sort_order
      `).all(department_id);
    } else if (req.user.role === 'admin') {
      rows = db.prepare(`
        SELECT k.*, u.name AS user_name, u.job_title,
               g.description AS goal_description, d.name AS department_name
        FROM kpis k
        JOIN users u ON k.user_id=u.id
        LEFT JOIN department_goals g ON k.department_goal_id=g.id
        LEFT JOIN departments d ON u.department_id=d.id
        ORDER BY d.name, u.name, k.sort_order
      `).all();
    } else if (req.user.role === 'manager') {
      // Manager sees their team
      rows = db.prepare(`
        SELECT k.*, u.name AS user_name, u.job_title,
               g.description AS goal_description, d.name AS department_name
        FROM kpis k
        JOIN users u ON k.user_id=u.id
        LEFT JOIN department_goals g ON k.department_goal_id=g.id
        LEFT JOIN departments d ON u.department_id=d.id
        WHERE u.manager_id=? ORDER BY u.name, k.sort_order
      `).all(req.user.id);
    } else {
      rows = db.prepare(`
        SELECT k.*, u.name AS user_name, u.job_title,
               g.description AS goal_description, d.name AS department_name
        FROM kpis k
        JOIN users u ON k.user_id=u.id
        LEFT JOIN department_goals g ON k.department_goal_id=g.id
        LEFT JOIN departments d ON u.department_id=d.id
        WHERE k.user_id=? ORDER BY k.sort_order
      `).all(req.user.id);
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kpis
router.post('/', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Managers add KPIs for staff' });
    const { user_id, department_goal_id, description, target, target_type, unit, current_value, status, notes } = req.body;
    if (!user_id || !description) return res.status(400).json({ error: 'user_id and description required' });
    const result = db.prepare(`
      INSERT INTO kpis (user_id,department_goal_id,description,target,target_type,unit,current_value,status,notes)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(user_id, department_goal_id||null, description, target||null, target_type||'number', unit||null, current_value||null, status||'green', notes||null);
    res.status(201).json(db.prepare('SELECT * FROM kpis WHERE id=?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/kpis/:id
router.put('/:id', requireAuth, (req, res) => {
  try {
    const kpi = db.prepare('SELECT * FROM kpis WHERE id=?').get(req.params.id);
    if (!kpi) return res.status(404).json({ error: 'KPI not found' });

    // Staff can update their own current_value only
    if (req.user.role === 'staff') {
      if (kpi.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
      db.prepare('UPDATE kpis SET current_value=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
        .run(req.body.current_value, req.body.status||kpi.status, kpi.id);
    } else {
      const { department_goal_id, description, target, target_type, unit, current_value, status, notes } = req.body;
      db.prepare(`
        UPDATE kpis SET department_goal_id=?,description=?,target=?,target_type=?,unit=?,
        current_value=?,status=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?
      `).run(department_goal_id||null, description||kpi.description, target||kpi.target,
             target_type||kpi.target_type, unit||kpi.unit, current_value||kpi.current_value,
             status||kpi.status, notes||kpi.notes, kpi.id);
    }
    res.json(db.prepare('SELECT * FROM kpis WHERE id=?').get(kpi.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/kpis/:id
router.delete('/:id', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Access denied' });
    const result = db.prepare('DELETE FROM kpis WHERE id=?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'KPI not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
