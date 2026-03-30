const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// ─── 1:1 Schedules ───────────────────────────────────────────────────────────

// GET /api/meetings/schedules
router.get('/schedules', requireAuth, (req, res) => {
  try {
    let rows;
    if (req.user.role === 'admin') {
      rows = db.prepare(`
        SELECT o.*, m.name AS manager_name, s.name AS staff_name,
               s.job_title AS staff_job_title, d.name AS department_name
        FROM one_on_ones o
        JOIN users m ON o.manager_id=m.id
        JOIN users s ON o.staff_id=s.id
        LEFT JOIN departments d ON s.department_id=d.id
        ORDER BY m.name, s.name
      `).all();
    } else if (req.user.role === 'manager') {
      rows = db.prepare(`
        SELECT o.*, m.name AS manager_name, s.name AS staff_name,
               s.job_title AS staff_job_title, d.name AS department_name
        FROM one_on_ones o
        JOIN users m ON o.manager_id=m.id
        JOIN users s ON o.staff_id=s.id
        LEFT JOIN departments d ON s.department_id=d.id
        WHERE o.manager_id=? ORDER BY s.name
      `).all(req.user.id);
    } else {
      rows = db.prepare(`
        SELECT o.*, m.name AS manager_name, s.name AS staff_name,
               s.job_title AS staff_job_title, d.name AS department_name
        FROM one_on_ones o
        JOIN users m ON o.manager_id=m.id
        JOIN users s ON o.staff_id=s.id
        LEFT JOIN departments d ON s.department_id=d.id
        WHERE o.staff_id=?
      `).all(req.user.id);
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meetings/schedules
router.post('/schedules', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Managers create 1:1 schedules' });
    const { manager_id, staff_id, frequency, next_date } = req.body;
    if (!manager_id || !staff_id) return res.status(400).json({ error: 'manager_id and staff_id required' });
    const result = db.prepare(`
      INSERT INTO one_on_ones (manager_id, staff_id, frequency, next_date) VALUES (?,?,?,?)
    `).run(manager_id, staff_id, frequency||'biweekly', next_date||null);
    res.status(201).json(db.prepare('SELECT * FROM one_on_ones WHERE id=?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/meetings/schedules/:id
router.put('/schedules/:id', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Access denied' });
    const { frequency, next_date, active } = req.body;
    db.prepare('UPDATE one_on_ones SET frequency=?,next_date=?,active=? WHERE id=?')
      .run(frequency, next_date, active !== undefined ? active : 1, req.params.id);
    res.json(db.prepare('SELECT * FROM one_on_ones WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Meeting Sessions ────────────────────────────────────────────────────────

// GET /api/meetings/sessions?one_on_one_id=X
router.get('/sessions', requireAuth, (req, res) => {
  try {
    const { one_on_one_id } = req.query;
    if (!one_on_one_id) return res.status(400).json({ error: 'one_on_one_id required' });

    const schedule = db.prepare('SELECT * FROM one_on_ones WHERE id=?').get(one_on_one_id);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

    // Access control
    if (req.user.role === 'staff' && schedule.staff_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (req.user.role === 'manager' && schedule.manager_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    let sessions = db.prepare('SELECT * FROM meetings WHERE one_on_one_id=? ORDER BY meeting_date DESC').all(one_on_one_id);

    // Strip private notes for non-managers
    if (req.user.role === 'staff') {
      sessions = sessions.map(s => ({ ...s, manager_private_notes: undefined }));
    }

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/meetings/sessions/:id
router.get('/sessions/:id', requireAuth, (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM meetings WHERE id=?').get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Meeting not found' });

    const schedule = db.prepare('SELECT * FROM one_on_ones WHERE id=?').get(session.one_on_one_id);
    if (req.user.role === 'staff' && schedule.staff_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (req.user.role === 'manager' && schedule.manager_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    // Load action items
    const actionItems = db.prepare(`
      SELECT a.*, u.name AS owner_name FROM action_items a
      LEFT JOIN users u ON a.owner_id=u.id
      WHERE a.one_on_one_id=? ORDER BY a.status, a.due_date
    `).all(session.one_on_one_id);

    const result = { ...session, action_items: actionItems };
    if (req.user.role === 'staff') delete result.manager_private_notes;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meetings/sessions
router.post('/sessions', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'staff') return res.status(403).json({ error: 'Managers create meeting sessions' });
    const { one_on_one_id, meeting_date, status } = req.body;
    if (!one_on_one_id || !meeting_date) return res.status(400).json({ error: 'one_on_one_id and meeting_date required' });

    const result = db.prepare(`
      INSERT INTO meetings (one_on_one_id, meeting_date, status) VALUES (?,?,?)
    `).run(one_on_one_id, meeting_date, status||'scheduled');

    // Advance next_date on the schedule
    const schedule = db.prepare('SELECT * FROM one_on_ones WHERE id=?').get(one_on_one_id);
    if (schedule) {
      const d = new Date(meeting_date);
      if (schedule.frequency === 'biweekly') d.setDate(d.getDate() + 14);
      else if (schedule.frequency === 'monthly') d.setMonth(d.getMonth() + 1);
      else d.setDate(d.getDate() + 14);
      db.prepare('UPDATE one_on_ones SET next_date=? WHERE id=?').run(d.toISOString().slice(0,10), one_on_one_id);
    }

    res.status(201).json(db.prepare('SELECT * FROM meetings WHERE id=?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/meetings/sessions/:id
router.put('/sessions/:id', requireAuth, (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM meetings WHERE id=?').get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Meeting not found' });

    const { meeting_date, status, kpi_review_notes, blockers_notes, development_notes, general_notes, manager_private_notes, rating } = req.body;

    if (req.user.role === 'staff') {
      // Staff can add general notes only
      db.prepare('UPDATE meetings SET general_notes=? WHERE id=?').run(general_notes||session.general_notes, session.id);
    } else {
      db.prepare(`
        UPDATE meetings SET meeting_date=?,status=?,kpi_review_notes=?,blockers_notes=?,
        development_notes=?,general_notes=?,manager_private_notes=?,rating=? WHERE id=?
      `).run(
        meeting_date||session.meeting_date, status||session.status,
        kpi_review_notes, blockers_notes, development_notes, general_notes,
        manager_private_notes, rating||null, session.id
      );
    }
    res.json(db.prepare('SELECT * FROM meetings WHERE id=?').get(session.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Action Items ────────────────────────────────────────────────────────────

// GET /api/meetings/action-items?one_on_one_id=X
router.get('/action-items', requireAuth, (req, res) => {
  try {
    const { one_on_one_id, status } = req.query;
    let query = `
      SELECT a.*, u.name AS owner_name FROM action_items a
      LEFT JOIN users u ON a.owner_id=u.id
      WHERE a.one_on_one_id=?
    `;
    const params = [one_on_one_id];
    if (status) { query += ' AND a.status=?'; params.push(status); }
    query += ' ORDER BY a.status, a.due_date';
    res.json(db.prepare(query).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meetings/action-items
router.post('/action-items', requireAuth, (req, res) => {
  try {
    const { meeting_id, one_on_one_id, description, owner_id, due_date } = req.body;
    if (!one_on_one_id || !description) return res.status(400).json({ error: 'one_on_one_id and description required' });
    const result = db.prepare(`
      INSERT INTO action_items (meeting_id, one_on_one_id, description, owner_id, due_date)
      VALUES (?,?,?,?,?)
    `).run(meeting_id||null, one_on_one_id, description, owner_id||null, due_date||null);
    res.status(201).json(db.prepare('SELECT * FROM action_items WHERE id=?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/meetings/action-items/:id
router.put('/action-items/:id', requireAuth, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM action_items WHERE id=?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Action item not found' });
    const { description, owner_id, due_date, status } = req.body;
    db.prepare('UPDATE action_items SET description=?,owner_id=?,due_date=?,status=? WHERE id=?')
      .run(description||item.description, owner_id||item.owner_id, due_date||item.due_date, status||item.status, item.id);
    res.json(db.prepare('SELECT * FROM action_items WHERE id=?').get(item.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/meetings/action-items/:id
router.delete('/action-items/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM action_items WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
