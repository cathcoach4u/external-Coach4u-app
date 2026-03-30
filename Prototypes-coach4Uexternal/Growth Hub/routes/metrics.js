const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/metrics', (req, res) => {
  res.json(db.prepare('SELECT * FROM metrics_snapshots ORDER BY snapshot_date').all());
});

router.get('/metrics/latest', (req, res) => {
  res.json(db.prepare('SELECT * FROM metrics_snapshots ORDER BY snapshot_date DESC LIMIT 1').get() || {});
});

router.post('/metrics', (req, res) => {
  const f = req.body;
  if (!f.snapshot_date) return res.status(400).json({ error: 'snapshot_date required' });
  const r = db.prepare(`
    INSERT INTO metrics_snapshots
      (snapshot_date, period, website_visitors, website_sessions, avg_time_on_site,
       mqls, sqls, lead_conversion_rate, organic_leads, paid_leads, social_leads, email_leads,
       cost_per_lead_organic, cost_per_lead_paid, cost_per_lead_social, cost_per_lead_email,
       total_ad_spend, total_revenue_attributed)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      f.snapshot_date, f.period||'month', f.website_visitors||0, f.website_sessions||0, f.avg_time_on_site||0,
      f.mqls||0, f.sqls||0, f.lead_conversion_rate||0, f.organic_leads||0, f.paid_leads||0,
      f.social_leads||0, f.email_leads||0, f.cost_per_lead_organic||0, f.cost_per_lead_paid||0,
      f.cost_per_lead_social||0, f.cost_per_lead_email||0, f.total_ad_spend||0, f.total_revenue_attributed||0);
  res.json(db.prepare('SELECT * FROM metrics_snapshots WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/metrics/:id', (req, res) => {
  const f = req.body;
  db.prepare(`UPDATE metrics_snapshots SET
    snapshot_date=?, period=?, website_visitors=?, website_sessions=?, avg_time_on_site=?,
    mqls=?, sqls=?, lead_conversion_rate=?, organic_leads=?, paid_leads=?, social_leads=?, email_leads=?,
    cost_per_lead_organic=?, cost_per_lead_paid=?, cost_per_lead_social=?, cost_per_lead_email=?,
    total_ad_spend=?, total_revenue_attributed=? WHERE id=?`).run(
      f.snapshot_date, f.period||'month', f.website_visitors||0, f.website_sessions||0, f.avg_time_on_site||0,
      f.mqls||0, f.sqls||0, f.lead_conversion_rate||0, f.organic_leads||0, f.paid_leads||0,
      f.social_leads||0, f.email_leads||0, f.cost_per_lead_organic||0, f.cost_per_lead_paid||0,
      f.cost_per_lead_social||0, f.cost_per_lead_email||0, f.total_ad_spend||0, f.total_revenue_attributed||0,
      req.params.id);
  res.json(db.prepare('SELECT * FROM metrics_snapshots WHERE id = ?').get(req.params.id));
});

router.delete('/metrics/:id', (req, res) => {
  db.prepare('DELETE FROM metrics_snapshots WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
