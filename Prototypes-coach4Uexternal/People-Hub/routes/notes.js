const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/notes?user_id=X
router.get('/', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Manager access only' });
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    // Managers can only see notes they authored
    let notes;
    if (req.user.role === 'manager') {
      notes = db.prepare(`
        SELECT n.*, u.name AS author_name FROM person_notes n
        JOIN users u ON n.author_id=u.id
        WHERE n.about_user_id=? AND n.author_id=? ORDER BY n.created_at DESC
      `).all(user_id, req.user.id);
    } else {
      notes = db.prepare(`
        SELECT n.*, u.name AS author_name FROM person_notes n
        JOIN users u ON n.author_id=u.id
        WHERE n.about_user_id=? ORDER BY n.created_at DESC
      `).all(user_id);
    }
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notes
router.post('/', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Manager access only' });
    const { about_user_id, content, tags } = req.body;
    if (!about_user_id || !content) return res.status(400).json({ error: 'about_user_id and content required' });
    const result = db.prepare(`
      INSERT INTO person_notes (about_user_id, author_id, content, tags) VALUES (?,?,?,?)
    `).run(about_user_id, req.user.id, content, JSON.stringify(tags||[]));
    res.status(201).json(db.prepare('SELECT * FROM person_notes WHERE id=?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notes/:id
router.put('/:id', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Manager access only' });
    const note = db.prepare('SELECT * FROM person_notes WHERE id=?').get(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.author_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Can only edit your own notes' });

    const { content, tags } = req.body;
    db.prepare('UPDATE person_notes SET content=?,tags=? WHERE id=?')
      .run(content||note.content, JSON.stringify(tags||JSON.parse(note.tags||'[]')), note.id);
    res.json(db.prepare('SELECT * FROM person_notes WHERE id=?').get(note.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notes/:id
router.delete('/:id', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Manager access only' });
    const note = db.prepare('SELECT * FROM person_notes WHERE id=?').get(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.author_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    db.prepare('DELETE FROM person_notes WHERE id=?').run(note.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
