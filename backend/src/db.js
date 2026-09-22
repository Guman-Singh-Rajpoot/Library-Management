/**
 * db.js — minimal JSON-file data store.
 *
 * This is intentionally simple for an MVP: no server process to install,
 * runs anywhere Node runs. It is NOT safe for concurrent production
 * traffic (no real transactions, no row locking) — see ARCHITECTURE.md
 * for the PostgreSQL schema this is meant to be swapped for.
 *
 * Every exported function reads the whole file, mutates in memory, and
 * writes it back. That's fine for demo/dev traffic on a single process.
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data.json');

const EMPTY_DB = {
  users: [],       // { id, name, phone, passwordHash, role }
  libraries: [],   // { id, ownerId, name, ownerName, structure, fees, shifts[], facilities[], coupons[], seats[], totalSeats, charge, videoName, other, createdAt }
  bookings: []      // { id, libraryId, seatId, seatLabel, studentId, studentName, phone, aadhaar, status, method, coupon, amount, createdAt }
};

function load() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY_DB, null, 2));
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    return JSON.parse(JSON.stringify(EMPTY_DB));
  }
}

function save(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = { load, save };
