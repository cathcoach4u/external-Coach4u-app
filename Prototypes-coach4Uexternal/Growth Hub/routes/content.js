const express = require('express');
const router = express.Router();
const db = require('../database/db');

const CONTENT_SELECT = `
  SELECT ci.*,
         c.name  as campaign_name,
         tm.name as assignee_name
  FROM content_items ci
  LEFT JOIN campaigns    c  ON c.id  = ci.campaign_id
  LEFT JOIN team_members tm ON tm.id = ci.assigned_to`;

router.get('/content', (req, res) => {
  const filters = []; const params = [];
  if (req.query.campaign_id) { filters.push('ci.campaign_id = ?');  params.push(req.query.campaign_id); }
  if (req.query.assignee)    { filters.push('ci.assigned_to = ?');  params.push(req.query.assignee); }
  if (req.query.status)      { filters.push('ci.status = ?');       params.push(req.query.status); }
  if (req.query.type)        { filters.push('ci.content_type = ?'); params.push(req.query.type); }
  if (req.query.month) {
    filters.push("strftime('%Y-%m', ci.scheduled_date) = ?");
    params.push(req.query.month);
  }
  const where = filters.length ? ' WHERE ' + filters.join(' AND ') : '';
  res.json(db.prepare(CONTENT_SELECT + where + ' ORDER BY ci.scheduled_date, ci.id').all(...params));
});

router.post('/content', (req, res) => {
  const f = req.body;
  if (!f.title) return res.status(400).json({ error: 'title required' });
  const r = db.prepare(`
    INSERT INTO content_items (title, content_type, platform, campaign_id, assigned_to, status, scheduled_date, tags, notes)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(
      f.title, f.content_type||'blog', f.platform||'', f.campaign_id||null, f.assigned_to||null,
      f.status||'ideation', f.scheduled_date||null, f.tags||'', f.notes||'');
  res.json(db.prepare(CONTENT_SELECT + ' WHERE ci.id = ?').get(r.lastInsertRowid));
});

router.put('/content/:id', (req, res) => {
  const f = req.body;
  db.prepare(`UPDATE content_items SET title=?, content_type=?, platform=?, campaign_id=?, assigned_to=?, status=?, scheduled_date=?, published_date=?, tags=?, notes=? WHERE id=?`)
    .run(f.title, f.content_type||'blog', f.platform||'', f.campaign_id||null, f.assigned_to||null,
         f.status||'ideation', f.scheduled_date||null, f.published_date||null, f.tags||'', f.notes||'', req.params.id);
  res.json(db.prepare(CONTENT_SELECT + ' WHERE ci.id = ?').get(req.params.id));
});

// Quick reschedule (drag-and-drop)
router.patch('/content/:id/reschedule', (req, res) => {
  const { scheduled_date } = req.body;
  db.prepare('UPDATE content_items SET scheduled_date = ? WHERE id = ?').run(scheduled_date || null, req.params.id);
  res.json(db.prepare(CONTENT_SELECT + ' WHERE ci.id = ?').get(req.params.id));
});

router.delete('/content/:id', (req, res) => {
  db.prepare('DELETE FROM content_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
