const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/rocks?quarter=Q2+2026&business_id=1
// Pass all_businesses=true to get rocks from all sub-businesses (for holding co rollup)
router.get('/rocks', (req, res) => {
  try {
    const { quarter, all_businesses } = req.query;
    const business_id = parseInt(req.query.business_id) || 1;
    let rows;

    if (all_businesses === 'true') {
      // Join with businesses to get name + color for rollup view
      if (quarter) {
        rows = db.prepare(`
          SELECT r.*, b.name as business_name, b.color as business_color
          FROM rocks r LEFT JOIN businesses b ON r.business_id = b.id
          WHERE r.quarter = ?
          ORDER BY r.business_id, r.company_rock DESC, r.created_at
        `).all(quarter);
      } else {
        rows = db.prepare(`
          SELECT r.*, b.name as business_name, b.color as business_color
          FROM rocks r LEFT JOIN businesses b ON r.business_id = b.id
          ORDER BY r.quarter DESC, r.business_id, r.company_rock DESC, r.created_at
        `).all();
      }
    } else {
      if (quarter) {
        rows = db.prepare(
          'SELECT * FROM rocks WHERE quarter = ? AND business_id = ? ORDER BY company_rock DESC, created_at'
        ).all(quarter, business_id);
      } else {
        rows = db.prepare(
          'SELECT * FROM rocks WHERE business_id = ? ORDER BY quarter DESC, company_rock DESC, created_at'
        ).all(business_id);
      }
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rocks' });
  }
});

// POST /api/rocks
router.post('/rocks', (req, res) => {
  try {
    const { quarter, description, owner, seat_id, status, company_rock, business_id: bodyBizId } = req.body;
    const business_id = parseInt(bodyBizId) || 1;
    if (!quarter || !description) {
      return res.status(400).json({ error: 'quarter and description are required' });
    }
    const result = db.prepare(
      'INSERT INTO rocks (quarter, description, owner, seat_id, status, company_rock, business_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(quarter, description, owner || null, seat_id || null, status || 'on_track', company_rock ? 1 : 0, business_id);
    const rock = db.prepare('SELECT * FROM rocks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(rock);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create rock' });
  }
});

// PUT /api/rocks/:id
router.put('/rocks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { quarter, description, owner, seat_id, status, company_rock } = req.body;
    db.prepare(
      'UPDATE rocks SET quarter = ?, description = ?, owner = ?, seat_id = ?, status = ?, company_rock = ? WHERE id = ?'
    ).run(quarter, description, owner || null, seat_id || null, status || 'on_track', company_rock ? 1 : 0, id);
    const rock = db.prepare('SELECT * FROM rocks WHERE id = ?').get(id);
    if (!rock) return res.status(404).json({ error: 'Rock not found' });
    res.json(rock);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update rock' });
  }
});

// DELETE /api/rocks/:id
router.delete('/rocks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM rocks WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Rock not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete rock' });
  }
});

module.exports = router;
