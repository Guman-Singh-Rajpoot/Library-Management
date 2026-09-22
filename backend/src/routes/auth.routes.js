const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { load, save } = require('../db');
const { signToken } = require('../middleware/auth');

const router = express.Router();

function publicUser(u) {
  return { id: u.id, name: u.name, phone: u.phone, role: u.role };
}

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { name, phone, password, role } = req.body || {};
  if (!name || !phone || !password || !role) {
    return res.status(400).json({ error: 'name, phone, password, and role are required' });
  }
  if (!['owner', 'student'].includes(role)) {
    return res.status(400).json({ error: "role must be 'owner' or 'student'" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }

  const db = load();
  if (db.users.some(u => u.phone === phone)) {
    return res.status(409).json({ error: 'An account with this phone number already exists' });
  }

  const user = {
    id: uuid(),
    name: name.trim(),
    phone: phone.trim(),
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    createdAt: Date.now()
  };
  db.users.push(user);
  save(db);

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { phone, password } = req.body || {};
  if (!phone || !password) {
    return res.status(400).json({ error: 'phone and password are required' });
  }
  const db = load();
  const user = db.users.find(u => u.phone === phone.trim());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid phone number or password' });
  }
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
