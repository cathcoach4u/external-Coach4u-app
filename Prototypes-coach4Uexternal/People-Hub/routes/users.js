const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/users  — all users (admin) or own team (manager) or self (staff)
router.get('/', requireAuth, (req, res) => {
  try {
    let users;
    if (req.user.role === 'admin') {
      users = db.prepare(`
        SELECT u.id,u.name,u.email,u.role,u.job_title,u.department_id,u.manager_id,
               d.name AS department_name, m.name AS manager_name
        FROM users u
        LEFT JOIN departments d ON u.department_id=d.id
        LEFT JOIN users m ON u.manager_id=m.id
        ORDER BY d.name, u.name
      `).all();
    } else if (req.user.role === 'manager') {
      users = db.prepare(`
        SELECT u.id,u.name,u.email,u.role,u.job_title,u.department_id,u.manager_id,
               d.name AS department_name, m.name AS manager_name
        FROM users u
        LEFT JOIN departments d ON u.department_id=d.id
        LEFT JOIN users m ON u.manager_id=m.id
        WHERE u.manager_id=? OR u.id=?
        ORDER BY u.name
      `).all(req.user.id, req.user.id);
    } else {
      users = db.prepare(`
        SELECT u.id,u.name,u.email,u.role,u.job_title,u.department_id,u.manager_id,
               d.name AS department_name, m.name AS manager_name
        FROM users u
        LEFT JOIN departments d ON u.department_id=d.id
        LEFT JOIN users m ON u.manager_id=m.id
        WHERE u.id=?
      `).all(req.user.id);
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/directory  — all users for strengths directory (any role)
router.get('/directory', requireAuth, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id,u.name,u.role,u.job_title,u.department_id,
             d.name AS department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id=d.id
      ORDER BY d.name, u.name
    `).all();

    const strengths = db.prepare(`SELECT user_id, strength, rank FROM clifton_strengths ORDER BY user_id, rank`).all();
    const strengthMap = {};
    for (const s of strengths) {
      if (!strengthMap[s.user_id]) strengthMap[s.user_id] = [];
      strengthMap[s.user_id].push({ strength: s.strength, rank: s.rank });
    }

    const result = users.map(u => ({ ...u, strengths: strengthMap[u.id] || [] }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', requireAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Staff can only see themselves; managers can see their own team
    if (req.user.role === 'staff' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = db.prepare(`
      SELECT u.id,u.name,u.email,u.role,u.job_title,u.department_id,u.manager_id,u.created_at,
             d.name AS department_name, m.name AS manager_name
      FROM users u
      LEFT JOIN departments d ON u.department_id=d.id
      LEFT JOIN users m ON u.manager_id=m.id
      WHERE u.id=?
    `).get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // If manager, check this person is in their team
    if (req.user.role === 'manager' && user.manager_id !== req.user.id && user.id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const strengths = db.prepare(`SELECT strength, rank FROM clifton_strengths WHERE user_id=? ORDER BY rank`).all(id);
    user.strengths = strengths;

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users  — admin only
router.post('/', requireAuth, requireAdmin, (req, res) => {
  try {
    const { name, email, password, role, job_title, department_id, manager_id } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (name,email,password_hash,role,job_title,department_id,manager_id)
      VALUES (?,?,?,?,?,?,?)
    `).run(name, email.toLowerCase(), hash, role||'staff', job_title||null, department_id||null, manager_id||null);
    const user = db.prepare('SELECT id,name,email,role,job_title,department_id,manager_id FROM users WHERE id=?').get(result.lastInsertRowid);
    res.status(201).json(user);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', requireAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { name, email, role, job_title, department_id, manager_id, password } = req.body;
    const current = db.prepare('SELECT * FROM users WHERE id=?').get(id);
    if (!current) return res.status(404).json({ error: 'User not found' });

    const newHash = password ? bcrypt.hashSync(password, 10) : current.password_hash;
    const newRole = (req.user.role === 'admin' && role) ? role : current.role;

    db.prepare(`
      UPDATE users SET name=?,email=?,password_hash=?,role=?,job_title=?,department_id=?,manager_id=? WHERE id=?
    `).run(
      name||current.name,
      email ? email.toLowerCase() : current.email,
      newHash, newRole,
      job_title !== undefined ? job_title : current.job_title,
      department_id !== undefined ? department_id : current.department_id,
      manager_id !== undefined ? manager_id : current.manager_id,
      id
    );
    const user = db.prepare('SELECT id,name,email,role,job_title,department_id,manager_id FROM users WHERE id=?').get(id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id  — admin only
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/strengths
router.put('/:id/strengths', requireAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role === 'staff' && req.user.id !== id) return res.status(403).json({ error: 'Access denied' });
    if (req.user.role === 'manager') {
      const target = db.prepare('SELECT manager_id FROM users WHERE id=?').get(id);
      if (target && target.manager_id !== req.user.id && req.user.id !== id) return res.status(403).json({ error: 'Access denied' });
    }

    const { strengths } = req.body; // [{strength, rank}]
    if (!Array.isArray(strengths)) return res.status(400).json({ error: 'strengths array required' });

    const del = db.prepare('DELETE FROM clifton_strengths WHERE user_id=?');
    const ins = db.prepare('INSERT OR REPLACE INTO clifton_strengths (user_id, strength, rank) VALUES (?,?,?)');
    db.transaction(() => {
      del.run(id);
      for (const s of strengths.slice(0,5)) ins.run(id, s.strength, s.rank);
    })();

    const updated = db.prepare('SELECT strength, rank FROM clifton_strengths WHERE user_id=? ORDER BY rank').all(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
