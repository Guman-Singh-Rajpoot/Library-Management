const express = require('express');
const { v4: uuid } = require('uuid');
const { load, save } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function bookingReceipt(b, lib) {
  return {
    id: b.id,
    libraryName: lib ? lib.name : null,
    seatLabel: b.seatLabel,
    studentName: b.studentName,
    phone: b.phone,
    status: b.status,
    method: b.method,
    coupon: b.coupon,
    amount: b.amount,
    createdAt: b.createdAt
  };
}

/* ---------- create booking (reserves a seat, awaiting payment) ---------- */

// POST /api/bookings  (student)  { libraryId, name, phone, aadhaar }
router.post('/', requireAuth, requireRole('student'), (req, res) => {
  const { libraryId, name, phone, aadhaar } = req.body || {};
  if (!libraryId || !name || !phone || !aadhaar) {
    return res.status(400).json({ error: 'libraryId, name, phone, and aadhaar are required' });
  }

  const db = load();
  const lib = db.libraries.find(l => l.id === libraryId);
  if (!lib) return res.status(404).json({ error: 'Library not found' });

  // Best-effort seat lock: find first unbooked seat with no pending hold.
  // NOTE: this JSON-file store is single-process only; see ARCHITECTURE.md
  // for how this becomes a real DB row lock in production.
  const seat = lib.seats.find(s => !s.booked && !s.reserved);
  if (!seat) return res.status(409).json({ error: 'No seats available' });

  seat.reserved = true; // held until payment succeeds or is abandoned

  const booking = {
    id: uuid(),
    libraryId: lib.id,
    seatId: seat.id,
    seatLabel: seat.label,
    studentId: req.user.id,
    studentName: name.trim(),
    phone: phone.trim(),
    aadhaar: aadhaar.trim(), // demo only — encrypt at rest in production, see ARCHITECTURE.md
    status: 'pending_payment',
    method: null,
    coupon: null,
    amount: lib.fees,
    createdAt: Date.now()
  };

  db.bookings.push(booking);
  save(db);
  res.status(201).json({ booking: bookingReceipt(booking, lib) });
});

/* ---------- pay for a booking (coupon applied here, per SPEC.md) ---------- */

// POST /api/bookings/:id/pay  (student, must own booking)  { method, couponCode }
router.post('/:id/pay', requireAuth, requireRole('student'), (req, res) => {
  const db = load();
  const booking = db.bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.studentId !== req.user.id) return res.status(403).json({ error: 'Not your booking' });
  if (booking.status !== 'pending_payment') {
    return res.status(409).json({ error: `Booking is already ${booking.status}` });
  }

  const { method, couponCode } = req.body || {};
  if (!['UPI', 'Card'].includes(method)) {
    return res.status(400).json({ error: "method must be 'UPI' or 'Card'" });
  }

  const lib = db.libraries.find(l => l.id === booking.libraryId);
  let amount = lib.fees;
  let appliedCoupon = null;

  if (couponCode) {
    const found = lib.coupons.find(c => c.code === String(couponCode).toUpperCase().trim());
    if (!found) return res.status(400).json({ error: 'Invalid coupon code' });
    appliedCoupon = found.code;
    amount = Math.max(Math.round(lib.fees * (1 - found.percent / 100)), 0);
  }

  // "Payment" is simulated here — swap for a real Razorpay order/webhook
  // flow per ARCHITECTURE.md before going live.
  booking.status = 'confirmed';
  booking.method = method;
  booking.coupon = appliedCoupon;
  booking.amount = amount;
  booking.paidAt = Date.now();

  const seat = lib.seats.find(s => s.id === booking.seatId);
  if (seat) { seat.booked = true; seat.reserved = false; }

  save(db);
  res.json({ booking: bookingReceipt(booking, lib) });
});

/* ---------- fetch a booking (receipt / confirmation page) ---------- */

// GET /api/bookings/:id  (student who owns it, or the library's owner)
router.get('/:id', requireAuth, (req, res) => {
  const db = load();
  const booking = db.bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const lib = db.libraries.find(l => l.id === booking.libraryId);
  const isOwner = lib && lib.ownerId === req.user.id;
  const isStudent = booking.studentId === req.user.id;
  if (!isOwner && !isStudent) return res.status(403).json({ error: 'Not authorized to view this booking' });

  res.json({ booking: bookingReceipt(booking, lib) });
});

// GET /api/bookings/mine/list  (student — their own booking history)
router.get('/mine/list', requireAuth, requireRole('student'), (req, res) => {
  const db = load();
  const mine = db.bookings.filter(b => b.studentId === req.user.id);
  const withLibs = mine.map(b => {
    const lib = db.libraries.find(l => l.id === b.libraryId);
    return bookingReceipt(b, lib);
  });
  res.json({ bookings: withLibs });
});

module.exports = router;
