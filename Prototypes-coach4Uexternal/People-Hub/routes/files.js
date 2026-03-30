const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/files?user_id=X
router.get('/', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Manager access only' });
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    let files;
    if (req.user.role === 'manager') {
      // Managers see files they added, or files for their team
      const target = db.prepare('SELECT manager_id FROM users WHERE id=?').get(user_id);
      if (!target || target.manager_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
      files = db.prepare(`
        SELECT f.*, u.name AS added_by_name FROM person_files f
        JOIN users u ON f.added_by_id=u.id
        WHERE f.user_id=? ORDER BY f.created_at DESC
      `).all(user_id);
    } else {
      files = db.prepare(`
        SELECT f.*, u.name AS added_by_name FROM person_files f
        JOIN users u ON f.added_by_id=u.id
        WHERE f.user_id=? ORDER BY f.created_at DESC
      `).all(user_id);
    }
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files
router.post('/', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Manager access only' });
    const { user_id, link_path, description, file_type, date_added } = req.body;
    if (!user_id || !link_path) return res.status(400).json({ error: 'user_id and link_path required' });
    const result = db.prepare(`
      INSERT INTO person_files (user_id, added_by_id, link_path, description, file_type, date_added)
      VALUES (?,?,?,?,?,?)
    `).run(user_id, req.user.id, link_path, description||null, file_type||'other', date_added||new Date().toISOString().slice(0,10));
    res.status(201).json(db.prepare('SELECT * FROM person_files WHERE id=?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/files/:id
router.put('/:id', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Manager access only' });
    const file = db.prepare('SELECT * FROM person_files WHERE id=?').get(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    const { link_path, description, file_type, date_added } = req.body;
    db.prepare('UPDATE person_files SET link_path=?,description=?,file_type=?,date_added=? WHERE id=?')
      .run(link_path||file.link_path, description||file.description, file_type||file.file_type, date_added||file.date_added, file.id);
    res.json(db.prepare('SELECT * FROM person_files WHERE id=?').get(file.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/files/:id
router.delete('/:id', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Manager access only' });
    db.prepare('DELETE FROM person_files WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
