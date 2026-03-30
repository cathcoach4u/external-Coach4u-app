const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/seats?business_id=1
router.get('/seats', (req, res) => {
  try {
    const business_id = parseInt(req.query.business_id) || 1;
    const seats = db.prepare(
      'SELECT * FROM seats WHERE business_id = ? ORDER BY sort_order'
    ).all(business_id);
    res.json(seats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch seats' });
  }
});

// POST /api/seats
router.post('/seats', (req, res) => {
  try {
    const { title, person, parent_id, responsibilities, sort_order, business_id: bodyBizId } = req.body;
    const business_id = parseInt(bodyBizId) || 1;
    const resp = Array.isArray(responsibilities)
      ? JSON.stringify(responsibilities)
      : responsibilities || '[]';
    const result = db.prepare(
      'INSERT INTO seats (title, person, parent_id, responsibilities, sort_order, business_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(title, person || null, parent_id || null, resp, sort_order || 0, business_id);
    const seat = db.prepare('SELECT * FROM seats WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(seat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create seat' });
  }
});

// PUT /api/seats/:id
router.put('/seats/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, person, parent_id, responsibilities, sort_order } = req.body;
    const resp = Array.isArray(responsibilities)
      ? JSON.stringify(responsibilities)
      : responsibilities || '[]';
    db.prepare(
      'UPDATE seats SET title = ?, person = ?, parent_id = ?, responsibilities = ?, sort_order = ? WHERE id = ?'
    ).run(title, person || null, parent_id || null, resp, sort_order || 0, id);
    const seat = db.prepare('SELECT * FROM seats WHERE id = ?').get(id);
    if (!seat) return res.status(404).json({ error: 'Seat not found' });
    res.json(seat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update seat' });
  }
});

// DELETE /api/seats/:id
router.delete('/seats/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM seats WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Seat not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete seat' });
  }
});

module.exports = router;
