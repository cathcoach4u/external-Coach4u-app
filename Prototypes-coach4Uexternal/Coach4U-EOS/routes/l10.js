const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/meetings?business_id=1
router.get('/meetings', (req, res) => {
  try {
    const business_id = parseInt(req.query.business_id) || 1;
    const meetings = db.prepare(
      'SELECT * FROM meetings WHERE business_id = ? ORDER BY meeting_date DESC'
    ).all(business_id);
    res.json(meetings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// POST /api/meetings
router.post('/meetings', (req, res) => {
  try {
    const { meeting_date, quarter, status, notes, business_id: bodyBizId } = req.body;
    const business_id = parseInt(bodyBizId) || 1;
    if (!meeting_date) return res.status(400).json({ error: 'meeting_date is required' });
    const result = db.prepare(
      'INSERT INTO meetings (meeting_date, quarter, status, notes, business_id) VALUES (?, ?, ?, ?, ?)'
    ).run(meeting_date, quarter || null, status || 'scheduled', notes || null, business_id);
    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(meeting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// GET /api/meetings/:id — with todos, headlines, issues
router.get('/meetings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    const todos = db.prepare(
      'SELECT * FROM meeting_todos WHERE meeting_id = ? ORDER BY created_at'
    ).all(id);

    const headlines = db.prepare(
      'SELECT * FROM meeting_headlines WHERE meeting_id = ? ORDER BY id'
    ).all(id);

    const issues = db.prepare(
      'SELECT * FROM issues WHERE meeting_id = ? ORDER BY priority DESC, created_at'
    ).all(id);

    res.json({ ...meeting, todos, headlines, issues });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

// PUT /api/meetings/:id
router.put('/meetings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { meeting_date, quarter, status, rating, notes } = req.body;
    db.prepare(
      'UPDATE meetings SET meeting_date = ?, quarter = ?, status = ?, rating = ?, notes = ? WHERE id = ?'
    ).run(meeting_date, quarter || null, status || 'scheduled', rating || null, notes || null, id);
    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json(meeting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// POST /api/meetings/:id/todos
router.post('/meetings/:id/todos', (req, res) => {
  try {
    const { id } = req.params;
    const { description, owner, due_date, status } = req.body;
    if (!description) return res.status(400).json({ error: 'description is required' });
    const result = db.prepare(
      'INSERT INTO meeting_todos (meeting_id, description, owner, due_date, status) VALUES (?, ?, ?, ?, ?)'
    ).run(id, description, owner || null, due_date || null, status || 'pending');
    const todo = db.prepare('SELECT * FROM meeting_todos WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(todo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PUT /api/meetings/todos/:id
router.put('/meetings/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { description, owner, due_date, status } = req.body;
    db.prepare(
      'UPDATE meeting_todos SET description = ?, owner = ?, due_date = ?, status = ? WHERE id = ?'
    ).run(description, owner || null, due_date || null, status || 'pending', id);
    const todo = db.prepare('SELECT * FROM meeting_todos WHERE id = ?').get(id);
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.json(todo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// POST /api/meetings/:id/headlines
router.post('/meetings/:id/headlines', (req, res) => {
  try {
    const { id } = req.params;
    const { type, description } = req.body;
    if (!description) return res.status(400).json({ error: 'description is required' });
    const result = db.prepare(
      'INSERT INTO meeting_headlines (meeting_id, type, description) VALUES (?, ?, ?)'
    ).run(id, type || 'good_news', description);
    const headline = db.prepare('SELECT * FROM meeting_headlines WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(headline);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create headline' });
  }
});

// DELETE /api/meetings/todos/:id
router.delete('/meetings/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM meeting_todos WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Todo not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// DELETE /api/meetings/headlines/:id
router.delete('/meetings/headlines/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM meeting_headlines WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Headline not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete headline' });
  }
});

module.exports = router;
