const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/quarterly-plans', (req, res) => {
  const { quarter, year } = req.query;
  let q = `
    SELECT qp.*,
           cp.title as priority_title,
           cp.owner as priority_owner,
           mo.title as objective_title
    FROM quarterly_plans qp
    LEFT JOIN company_priorities cp ON cp.id = qp.company_priority_id
    LEFT JOIN marketing_objectives mo ON mo.id = qp.marketing_objective_id`;
  const params = [];
  const where = [];
  if (quarter) { where.push('qp.quarter = ?'); params.push(quarter); }
  if (year)    { where.push('qp.year = ?');    params.push(year); }
  if (where.length) q += ' WHERE ' + where.join(' AND ');
  q += ' ORDER BY qp.sort_order, qp.id';
  res.json(db.prepare(q).all(...params));
});

// Get campaigns for a quarterly plan (for hierarchy view)
router.get('/quarterly-plans/:id/campaigns', (req, res) => {
  res.json(db.prepare(`
    SELECT c.*, tm.name as assignee_name
    FROM campaigns c
    LEFT JOIN team_members tm ON tm.id = c.assigned_to
    WHERE c.quarterly_plan_id = ?
    ORDER BY c.id`).all(req.params.id));
});

router.post('/quarterly-plans', (req, res) => {
  const { quarter, year, title, company_priority_id, marketing_objective_id, budget_allocated, success_metric, target_value, rag_status, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order),0) as m FROM quarterly_plans WHERE quarter=? AND year=?').get(quarter||'Q1', year||2026).m;
  const r = db.prepare(`
    INSERT INTO quarterly_plans (quarter, year, title, company_priority_id, marketing_objective_id, budget_allocated, success_metric, target_value, rag_status, notes, sort_order)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(quarter||'Q1', year||2026, title, company_priority_id||null, marketing_objective_id||null, budget_allocated||0, success_metric||'', target_value||0, rag_status||'green', notes||'', maxOrder+1);
  res.json(db.prepare('SELECT * FROM quarterly_plans WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/quarterly-plans/:id', (req, res) => {
  const { quarter, year, title, company_priority_id, marketing_objective_id, budget_allocated, budget_spent, success_metric, target_value, actual_value, rag_status, notes } = req.body;
  db.prepare(`UPDATE quarterly_plans SET quarter=?, year=?, title=?, company_priority_id=?, marketing_objective_id=?, budget_allocated=?, budget_spent=?, success_metric=?, target_value=?, actual_value=?, rag_status=?, notes=? WHERE id=?`)
    .run(quarter, year, title, company_priority_id||null, marketing_objective_id||null, budget_allocated||0, budget_spent||0, success_metric, target_value||0, actual_value||0, rag_status||'green', notes||'', req.params.id);
  res.json(db.prepare('SELECT * FROM quarterly_plans WHERE id = ?').get(req.params.id));
});

router.delete('/quarterly-plans/:id', (req, res) => {
  db.prepare('DELETE FROM quarterly_plans WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
