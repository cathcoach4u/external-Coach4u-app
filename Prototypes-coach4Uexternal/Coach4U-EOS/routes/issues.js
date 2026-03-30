const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/issues?business_id=1&status=open&all_businesses=true
router.get('/issues', (req, res) => {
  try {
    const { status, owner, all_businesses } = req.query;
    const business_id = parseInt(req.query.business_id) || 1;

    let query, params;

    if (all_businesses === 'true') {
      // Return all issues with business name + color
      query = `
        SELECT i.*, b.name as business_name, b.color as business_color
        FROM issues i LEFT JOIN businesses b ON i.business_id = b.id
        WHERE 1=1
      `;
      params = [];
      if (status) { query += ' AND i.status = ?'; params.push(status); }
      if (owner)  { query += ' AND i.owner = ?';  params.push(owner); }
      query += ` ORDER BY CASE i.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END, i.business_id, i.created_at`;
    } else {
      query = 'SELECT * FROM issues WHERE business_id = ?';
      params = [business_id];
      if (status) { query += ' AND status = ?'; params.push(status); }
      if (owner)  { query += ' AND owner = ?';  params.push(owner); }
      query += ` ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END, created_at`;
    }

    const issues = db.prepare(query).all(...params);
    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// POST /api/issues
router.post('/issues', (req, res) => {
  try {
    const { description, owner, priority, status, solution, meeting_id, business_id: bodyBizId } = req.body;
    const business_id = parseInt(bodyBizId) || 1;
    if (!description) return res.status(400).json({ error: 'description is required' });
    const result = db.prepare(
      'INSERT INTO issues (description, owner, priority, status, solution, meeting_id, business_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(description, owner || null, priority || 'medium', status || 'open', solution || null, meeting_id || null, business_id);
    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// PUT /api/issues/:id
router.put('/issues/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { description, owner, priority, status, solution, meeting_id } = req.body;
    db.prepare(
      'UPDATE issues SET description = ?, owner = ?, priority = ?, status = ?, solution = ?, meeting_id = ? WHERE id = ?'
    ).run(description, owner || null, priority || 'medium', status || 'open', solution || null, meeting_id || null, id);
    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// DELETE /api/issues/:id
router.delete('/issues/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM issues WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Issue not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

module.exports = router;
