const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/priorities
router.get('/', requireAuth, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM priorities ORDER BY quarter DESC, created_at').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/priorities/sync  — pull rocks from Strategic Hub
router.post('/sync', requireAuth, async (req, res) => {
  if (req.user.role === 'staff') return res.status(403).json({ error: 'Access denied' });
  try {
    const hubUrl = (process.env.STRATEGIC_HUB_URL || 'http://localhost:3000') + '/api/rocks';
    let rocks;
    try {
      const response = await fetch(hubUrl, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`Strategic Hub returned ${response.status}`);
      rocks = await response.json();
    } catch (fetchErr) {
      return res.status(502).json({ error: 'Cannot reach Strategic Hub at localhost:3000. Make sure it is running.' });
    }

    const upsert = db.prepare(`
      INSERT INTO priorities (source_id, quarter, original_description, owner, status, is_synced, synced_at)
      VALUES (?,?,?,?,?,1,CURRENT_TIMESTAMP)
      ON CONFLICT DO NOTHING
    `);
    // Use a unique constraint workaround — check by source_id
    const checkExisting = db.prepare('SELECT id FROM priorities WHERE source_id=? AND is_synced=1');
    const updateStatus = db.prepare('UPDATE priorities SET status=?, synced_at=CURRENT_TIMESTAMP WHERE source_id=? AND is_synced=1');

    let added = 0, updated = 0;
    const doSync = db.transaction(() => {
      for (const r of rocks) {
        const existing = checkExisting.get(r.id);
        if (!existing) {
          upsert.run(r.id, r.quarter, r.description, r.owner||null, r.status||'on_track');
          added++;
        } else {
          updateStatus.run(r.status||'on_track', r.id);
          updated++;
        }
      }
    });
    doSync();

    const all = db.prepare('SELECT * FROM priorities ORDER BY quarter DESC, created_at').all();
    res.json({ added, updated, priorities: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/priorities  — manually add a priority
router.post('/', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Access denied' });
    const { quarter, description, owner, status } = req.body;
    if (!quarter || !description) return res.status(400).json({ error: 'quarter and description required' });
    const result = db.prepare(`
      INSERT INTO priorities (source_id, quarter, original_description, owner, status, is_synced)
      VALUES (null,?,?,?,?,0)
    `).run(quarter, description, owner||null, status||'on_track');
    res.status(201).json(db.prepare('SELECT * FROM priorities WHERE id=?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/priorities/:id  — amend (not allowed on synced originals for description, but status/notes ok)
router.put('/:id', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Access denied' });
    const priority = db.prepare('SELECT * FROM priorities WHERE id=?').get(req.params.id);
    if (!priority) return res.status(404).json({ error: 'Priority not found' });

    const { amended_description, owner, status, quarter, description } = req.body;

    if (priority.is_synced) {
      // Synced priorities: only allow amendments — not changing the original
      db.prepare('UPDATE priorities SET amended_description=?,owner=?,status=? WHERE id=?')
        .run(amended_description||null, owner||priority.owner, status||priority.status, priority.id);
    } else {
      // Manual priorities: can edit everything
      db.prepare('UPDATE priorities SET original_description=?,amended_description=?,owner=?,status=?,quarter=? WHERE id=?')
        .run(description||priority.original_description, amended_description||null,
             owner||priority.owner, status||priority.status,
             quarter||priority.quarter, priority.id);
    }

    res.json(db.prepare('SELECT * FROM priorities WHERE id=?').get(priority.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/priorities/:id  — admin only, and only non-synced
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const priority = db.prepare('SELECT * FROM priorities WHERE id=?').get(req.params.id);
    if (!priority) return res.status(404).json({ error: 'Not found' });
    if (priority.is_synced) return res.status(400).json({ error: 'Cannot delete synced priorities. Remove them from the Strategic Hub instead.' });
    db.prepare('DELETE FROM priorities WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
