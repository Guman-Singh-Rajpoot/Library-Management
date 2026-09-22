const express = require('express');
const { v4: uuid } = require('uuid');
const { load, save } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ownerChargeForSeats } = require('../utils/pricing');

const router = express.Router();

/* ---------- helpers ---------- */

function seatSummary(lib) {
  const total = lib.seats.length;
  const booked = lib.seats.filter(s => s.booked).length;
  return { totalSeats: total, bookedSeats: booked, availableSeats: total - booked };
}

// Shape returned by search/detail — omit internal seat IDs, keep counts.
function publicLibrary(lib) {
  const { ownerId, seats, ...rest } = lib;
  return { ...rest, ...seatSummary(lib) };
}

/* ---------- pricing estimate (used by the "create library" wizard step) ---------- */

// GET /api/libraries/pricing/estimate?seats=20
router.get('/pricing/estimate', (req, res) => {
  const seats = parseInt(req.query.seats, 10) || 0;
  res.json({ seats, charge: ownerChargeForSeats(seats) });
});

/* ---------- public search & detail ---------- */

// GET /api/libraries?q=search
router.get('/', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  const db = load();
  const results = db.libraries
    .filter(l => !q || l.name.toLowerCase().includes(q))
    .map(publicLibrary);
  res.json({ libraries: results });
});

// GET /api/libraries/:id
router.get('/:id', (req, res) => {
  const db = load();
  const lib = db.libraries.find(l => l.id === req.params.id);
  if (!lib) return res.status(404).json({ error: 'Library not found' });
  res.json({ library: publicLibrary(lib) });
});

/* ---------- owner: my library ---------- */

// GET /api/libraries/mine/summary  (owner)
router.get('/mine/summary', requireAuth, requireRole('owner'), (req, res) => {
  const db = load();
  const lib = db.libraries.find(l => l.ownerId === req.user.id);
  if (!lib) return res.status(404).json({ error: 'You have not created a library yet' });
  res.json({ library: publicLibrary(lib) });
});

// GET /api/libraries/:id/dashboard  (owner, must own it)
router.get('/:id/dashboard', requireAuth, requireRole('owner'), (req, res) => {
  const db = load();
  const lib = db.libraries.find(l => l.id === req.params.id);
  if (!lib) return res.status(404).json({ error: 'Library not found' });
  if (lib.ownerId !== req.user.id) return res.status(403).json({ error: 'Not your library' });

  const bookings = db.bookings.filter(b => b.libraryId === lib.id && b.status === 'confirmed');
  const revenue = bookings.reduce((sum, b) => sum + b.amount, 0);
  const { totalSeats, bookedSeats, availableSeats } = seatSummary(lib);

  res.json({
    library: publicLibrary(lib),
    stats: {
      joinedStudents: bookings.length,
      totalRevenue: revenue,
      totalSeats, bookedSeats, availableSeats,
      progressPercent: totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0
    },
    bookings: bookings.map(b => ({
      id: b.id, studentName: b.studentName, phone: b.phone,
      seatLabel: b.seatLabel, amount: b.amount, method: b.method, coupon: b.coupon
    }))
  });
});

/* ---------- owner: create library (single submit, per SPEC.md) ---------- */

// POST /api/libraries  (owner)
router.post('/', requireAuth, requireRole('owner'), (req, res) => {
  const {
    name, structure, fees, shifts, facilities, seats, other, videoName
  } = req.body || {};

  if (!name || !seats || Number(seats) < 1) {
    return res.status(400).json({ error: 'name and a positive seat count are required' });
  }

  const db = load();
  if (db.libraries.some(l => l.ownerId === req.user.id)) {
    return res.status(409).json({ error: 'You already have a library. This MVP supports one library per owner.' });
  }

  const seatCount = parseInt(seats, 10);
  const seatObjs = Array.from({ length: seatCount }, (_, i) => ({
    id: uuid(), label: `S${i + 1}`, booked: false
  }));

  const library = {
    id: uuid(),
    ownerId: req.user.id,
    ownerName: req.user.name,
    name: name.trim(),
    structure: structure || 'Open hall seating',
    fees: Number(fees) || 0,
    shifts: Array.isArray(shifts) ? shifts : [],
    facilities: Array.isArray(facilities) ? facilities : [],
    other: other || '',
    videoName: videoName || null,
    totalSeats: seatCount,
    charge: ownerChargeForSeats(seatCount),
    coupons: [],
    seats: seatObjs,
    createdAt: Date.now()
  };

  db.libraries.push(library);
  save(db);
  res.status(201).json({ library: publicLibrary(library) });
});

/* ---------- owner actions ---------- */

// POST /api/libraries/:id/seats  { count }
router.post('/:id/seats', requireAuth, requireRole('owner'), (req, res) => {
  const db = load();
  const lib = db.libraries.find(l => l.id === req.params.id);
  if (!lib) return res.status(404).json({ error: 'Library not found' });
  if (lib.ownerId !== req.user.id) return res.status(403).json({ error: 'Not your library' });

  const count = parseInt(req.body?.count, 10);
  if (!count || count < 1) return res.status(400).json({ error: 'count must be a positive number' });

  for (let i = 0; i < count; i++) {
    lib.seats.push({ id: uuid(), label: `S${lib.seats.length + 1}`, booked: false });
  }
  lib.totalSeats = lib.seats.length;
  save(db);
  res.json({ library: publicLibrary(lib) });
});

// POST /api/libraries/:id/coupons  { code, percent }
router.post('/:id/coupons', requireAuth, requireRole('owner'), (req, res) => {
  const db = load();
  const lib = db.libraries.find(l => l.id === req.params.id);
  if (!lib) return res.status(404).json({ error: 'Library not found' });
  if (lib.ownerId !== req.user.id) return res.status(403).json({ error: 'Not your library' });

  const { code, percent } = req.body || {};
  if (!code || !percent) return res.status(400).json({ error: 'code and percent are required' });

  const upperCode = String(code).toUpperCase().trim();
  if (lib.coupons.some(c => c.code === upperCode)) {
    return res.status(409).json({ error: 'A coupon with this code already exists' });
  }
  lib.coupons.push({ code: upperCode, percent: Math.min(Math.max(Number(percent), 1), 100) });
  save(db);
  res.json({ library: publicLibrary(lib) });
});

// POST /api/libraries/:id/facilities  { name }
router.post('/:id/facilities', requireAuth, requireRole('owner'), (req, res) => {
  const db = load();
  const lib = db.libraries.find(l => l.id === req.params.id);
  if (!lib) return res.status(404).json({ error: 'Library not found' });
  if (lib.ownerId !== req.user.id) return res.status(403).json({ error: 'Not your library' });

  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  lib.facilities.push(String(name).trim());
  save(db);
  res.json({ library: publicLibrary(lib) });
});

module.exports = router;
