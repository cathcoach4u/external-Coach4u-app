const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

// GET /api/alignment?business_id=1
router.get('/alignment', (req, res) => {
  try {
    const business_id = parseInt(req.query.business_id) || 1;
    const members  = db.prepare(`SELECT * FROM team_members WHERE active=1 AND business_id=? ORDER BY id`).all(business_id);
    const values   = db.prepare(`SELECT key, value AS label FROM vto WHERE section='core_values' AND business_id=? AND value IS NOT NULL AND value != '' ORDER BY key`).all(business_id);
    const memberIds = members.map(m => m.id);
    const vRatings = memberIds.length
      ? db.prepare(`SELECT * FROM values_ratings WHERE member_id IN (${memberIds.map(() => '?').join(',')})`).all(...memberIds)
      : [];
    const gwc = memberIds.length
      ? db.prepare(`SELECT * FROM gwc_ratings WHERE member_id IN (${memberIds.map(() => '?').join(',')})`).all(...memberIds)
      : [];
    const seats = db.prepare(`SELECT id, title FROM seats WHERE business_id=?`).all(business_id);
    res.json({ members, core_values: values, values_ratings: vRatings, gwc_ratings: gwc, seats });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/alignment/members
router.post('/alignment/members', (req, res) => {
  try {
    const { name, seat_id, business_id: bodyBizId } = req.body;
    const business_id = parseInt(bodyBizId) || 1;
    if (!name?.trim()) return res.status(400).json({ error: 'name required' });
    const r = db.prepare(`INSERT INTO team_members (name, seat_id, business_id) VALUES (?, ?, ?)`).run(name.trim(), seat_id || null, business_id);
    res.json({ id: r.lastInsertRowid, name: name.trim(), seat_id: seat_id || null, active: 1 });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/alignment/members/:id
router.put('/alignment/members/:id', (req, res) => {
  try {
    const { name, seat_id, active } = req.body;
    db.prepare(`UPDATE team_members SET name=COALESCE(?,name), seat_id=COALESCE(?,seat_id), active=COALESCE(?,active) WHERE id=?`)
      .run(name ?? null, seat_id ?? null, active ?? null, req.params.id);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/alignment/members/:id
router.delete('/alignment/members/:id', (req, res) => {
  try {
    db.prepare(`DELETE FROM team_members WHERE id=?`).run(req.params.id);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/alignment/values/:member_id/:value_key
router.put('/alignment/values/:member_id/:value_key', (req, res) => {
  try {
    const { rating } = req.body;
    db.prepare(`INSERT INTO values_ratings (member_id, value_key, rating, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(member_id, value_key) DO UPDATE SET rating=excluded.rating, updated_at=excluded.updated_at`)
      .run(req.params.member_id, req.params.value_key, rating);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/alignment/gwc/:member_id
router.put('/alignment/gwc/:member_id', (req, res) => {
  try {
    const { get_it, want_it, capacity } = req.body;
    db.prepare(`INSERT INTO gwc_ratings (member_id, get_it, want_it, capacity, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(member_id) DO UPDATE SET
                  get_it=COALESCE(excluded.get_it, get_it),
                  want_it=COALESCE(excluded.want_it, want_it),
                  capacity=COALESCE(excluded.capacity, capacity),
                  updated_at=excluded.updated_at`)
      .run(req.params.member_id, get_it ?? null, want_it ?? null, capacity ?? null);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
