const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/vto?business_id=1
router.get('/vto', (req, res) => {
  try {
    const business_id = parseInt(req.query.business_id) || 1;
    const rows = db.prepare(
      'SELECT section, key, value, updated_at FROM vto WHERE business_id = ? ORDER BY id'
    ).all(business_id);
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.section]) grouped[row.section] = {};
      grouped[row.section][row.key] = { value: row.value, updated_at: row.updated_at };
    }
    res.json(grouped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch VTO data' });
  }
});

// PUT /api/vto/:section/:key?business_id=1
router.put('/vto/:section/:key', (req, res) => {
  try {
    const { section, key } = req.params;
    const { value, business_id: bodyBizId } = req.body;
    const business_id = parseInt(bodyBizId) || parseInt(req.query.business_id) || 1;
    const existing = db.prepare(
      'SELECT id FROM vto WHERE section = ? AND key = ? AND business_id = ?'
    ).get(section, key, business_id);
    if (existing) {
      db.prepare(
        'UPDATE vto SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE section = ? AND key = ? AND business_id = ?'
      ).run(value, section, key, business_id);
    } else {
      db.prepare(
        'INSERT INTO vto (section, key, value, business_id) VALUES (?, ?, ?, ?)'
      ).run(section, key, value, business_id);
    }
    res.json({ success: true, section, key, value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update VTO field' });
  }
});

module.exports = router;
