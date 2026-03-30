const express = require('express');
const router = express.Router();
const db = require('../database/db');

const CAMPAIGN_SELECT = `
  SELECT c.*,
         cp.title  as priority_title,
         qp.title  as plan_title,
         tm.name   as assignee_name,
         ROUND((c.actual_revenue - c.budget_spent) / NULLIF(c.budget_spent,0) * 100, 1) as roi_pct
  FROM campaigns c
  LEFT JOIN company_priorities cp ON cp.id = c.company_priority_id
  LEFT JOIN quarterly_plans    qp ON qp.id = c.quarterly_plan_id
  LEFT JOIN team_members       tm ON tm.id = c.assigned_to`;

router.get('/campaigns', (req, res) => {
  const filters = []; const params = [];
  if (req.query.status)    { filters.push('c.status = ?');               params.push(req.query.status); }
  if (req.query.priority)  { filters.push('c.company_priority_id = ?');  params.push(req.query.priority); }
  if (req.query.assignee)  { filters.push('c.assigned_to = ?');          params.push(req.query.assignee); }
  const where = filters.length ? ' WHERE ' + filters.join(' AND ') : '';
  res.json(db.prepare(CAMPAIGN_SELECT + where + ' ORDER BY c.id DESC').all(...params));
});

router.get('/campaigns/:id', (req, res) => {
  const c = db.prepare(CAMPAIGN_SELECT + ' WHERE c.id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'not found' });
  c.ab_tests = db.prepare('SELECT * FROM ab_tests WHERE campaign_id = ? ORDER BY id').all(c.id);
  res.json(c);
});

router.post('/campaigns', (req, res) => {
  const f = req.body;
  if (!f.name) return res.status(400).json({ error: 'name required' });
  const r = db.prepare(`
    INSERT INTO campaigns (name, objective, company_priority_id, quarterly_plan_id, start_date, end_date,
      budget_allocated, budget_spent, target_leads, actual_leads, target_conversions, actual_conversions,
      target_revenue, actual_revenue, target_ctr, actual_ctr, channel, status, assigned_to, insights, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      f.name, f.objective||'', f.company_priority_id||null, f.quarterly_plan_id||null,
      f.start_date||'', f.end_date||'', f.budget_allocated||0, f.budget_spent||0,
      f.target_leads||0, f.actual_leads||0, f.target_conversions||0, f.actual_conversions||0,
      f.target_revenue||0, f.actual_revenue||0, f.target_ctr||0, f.actual_ctr||0,
      f.channel||'', f.status||'planning', f.assigned_to||null, f.insights||'', f.notes||'');
  res.json(db.prepare(CAMPAIGN_SELECT + ' WHERE c.id = ?').get(r.lastInsertRowid));
});

router.put('/campaigns/:id', (req, res) => {
  const f = req.body;
  db.prepare(`UPDATE campaigns SET name=?, objective=?, company_priority_id=?, quarterly_plan_id=?,
    start_date=?, end_date=?, budget_allocated=?, budget_spent=?, target_leads=?, actual_leads=?,
    target_conversions=?, actual_conversions=?, target_revenue=?, actual_revenue=?, target_ctr=?,
    actual_ctr=?, channel=?, status=?, assigned_to=?, insights=?, notes=? WHERE id=?`).run(
      f.name, f.objective||'', f.company_priority_id||null, f.quarterly_plan_id||null,
      f.start_date||'', f.end_date||'', f.budget_allocated||0, f.budget_spent||0,
      f.target_leads||0, f.actual_leads||0, f.target_conversions||0, f.actual_conversions||0,
      f.target_revenue||0, f.actual_revenue||0, f.target_ctr||0, f.actual_ctr||0,
      f.channel||'', f.status||'planning', f.assigned_to||null, f.insights||'', f.notes||'',
      req.params.id);
  res.json(db.prepare(CAMPAIGN_SELECT + ' WHERE c.id = ?').get(req.params.id));
});

router.delete('/campaigns/:id', (req, res) => {
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Summary stats
router.get('/campaigns-summary', (req, res) => {
  const s = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active,
      SUM(budget_allocated) as total_budget,
      SUM(budget_spent) as total_spent,
      SUM(actual_leads) as total_leads,
      SUM(actual_revenue) as total_revenue
    FROM campaigns`).get();
  res.json(s);
});

// ── A/B Tests ────────────────────────────────────────────────────────────────

router.get('/ab-tests', (req, res) => {
  const q = req.query.campaign_id
    ? 'SELECT * FROM ab_tests WHERE campaign_id = ? ORDER BY id'
    : 'SELECT ab.*, c.name as campaign_name FROM ab_tests ab LEFT JOIN campaigns c ON c.id=ab.campaign_id ORDER BY ab.id DESC';
  const rows = req.query.campaign_id ? db.prepare(q).all(req.query.campaign_id) : db.prepare(q).all();
  res.json(rows);
});

router.post('/ab-tests', (req, res) => {
  const { campaign_id, name, variant_a, variant_b, metric, result_a, result_b, winner, insight, status } = req.body;
  const r = db.prepare(`INSERT INTO ab_tests (campaign_id, name, variant_a, variant_b, metric, result_a, result_b, winner, insight, status) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(campaign_id||null, name, variant_a||'', variant_b||'', metric||'', result_a||null, result_b||null, winner||'', insight||'', status||'running');
  res.json(db.prepare('SELECT * FROM ab_tests WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/ab-tests/:id', (req, res) => {
  const { campaign_id, name, variant_a, variant_b, metric, result_a, result_b, winner, insight, status } = req.body;
  db.prepare(`UPDATE ab_tests SET campaign_id=?, name=?, variant_a=?, variant_b=?, metric=?, result_a=?, result_b=?, winner=?, insight=?, status=? WHERE id=?`)
    .run(campaign_id||null, name, variant_a, variant_b, metric, result_a||null, result_b||null, winner, insight, status, req.params.id);
  res.json(db.prepare('SELECT * FROM ab_tests WHERE id = ?').get(req.params.id));
});

router.delete('/ab-tests/:id', (req, res) => {
  db.prepare('DELETE FROM ab_tests WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
