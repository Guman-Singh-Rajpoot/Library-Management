# StudySeat — Full MVP (Backend + Frontend)

A real, runnable version of the library seat-booking platform: an Express
REST API and a React (Vite) frontend, wired together end to end. This
replaces the earlier browser-only demo — data now lives in an actual
backend, and the frontend is a real API client, not a local-state mock.

## What's real here

- **Backend** (`/backend`) — Express API, JWT auth (bcrypt-hashed
  passwords), owner/student roles enforced server-side, seat-reservation
  logic that prevents double-booking, coupon validation at payment time.
  Data is stored in a JSON file (`backend/data.json`) so it runs with zero
  external services — see "Going to production" below for the swap to
  PostgreSQL.
- **Frontend** (`/frontend`) — React + Vite + React Router. Every screen
  calls the real backend: signup/login, create library with a live charge
  estimate, submit library details, owner dashboard with live stats,
  add seat/coupon/facility, student search, book, pay (with coupon), and
  a printable confirmation receipt.

This has been tested end-to-end via the API (signup → create library →
search → book → pay → dashboard) and the frontend build has been verified
to compile cleanly.

## Quick start

**1. Backend**
```bash
cd backend
npm install
cp .env.example .env
npm start
# → StudySeat backend listening on http://localhost:4000
```

**2. Frontend** (in a second terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# → open http://localhost:5173
```

That's it — no database to install, no Docker required. `backend/data.json`
is created automatically on first run and holds all users, libraries, and
bookings.

## Try the full flow

1. Open `http://localhost:5173`, click **Register as Owner**.
2. Sign up, enter a seat count (watch the live charge estimate), fill in
   library details, submit.
3. You land on your **owner dashboard** — try "Add coupon" and "Add
   facility".
4. Log out, click **Register as Student**, sign up with a different phone
   number.
5. Search for the library you just created, click **Book Now**, fill in
   your details, apply the coupon you created, choose UPI or Card, pay.
6. You'll land on a confirmation page with a printable receipt — and if
   you log back in as the owner, the dashboard now shows the booking,
   revenue, and occupancy.

## Project layout

```
studyseat/
├── backend/
│   ├── src/
│   │   ├── server.js           # Express app entry
│   │   ├── db.js                # JSON file data store
│   │   ├── middleware/auth.js   # JWT sign/verify, role guard
│   │   ├── utils/pricing.js     # owner seat-charge formula
│   │   └── routes/
│   │       ├── auth.routes.js
│   │       ├── library.routes.js
│   │       └── booking.routes.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx               # routes + role guards
    │   ├── AuthContext.jsx       # session stored in localStorage
    │   ├── api.js                # fetch wrapper for the backend
    │   ├── index.css
    │   └── pages/
    │       ├── Landing.jsx
    │       ├── Auth.jsx
    │       ├── OwnerCreate.jsx
    │       ├── OwnerDetails.jsx
    │       ├── OwnerDashboard.jsx
    │       ├── StudentSearch.jsx
    │       ├── StudentDetails.jsx
    │       ├── StudentPayment.jsx
    │       └── StudentConfirmation.jsx
    └── .env.example
```

## API summary

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Create an owner or student account |
| POST | `/api/auth/login` | — | Log in |
| GET | `/api/libraries/pricing/estimate?seats=N` | — | Owner charge preview |
| GET | `/api/libraries?q=` | — | Search libraries |
| GET | `/api/libraries/:id` | — | Library detail |
| POST | `/api/libraries` | owner | Create your library (one per owner in this MVP) |
| GET | `/api/libraries/mine/summary` | owner | Your library |
| GET | `/api/libraries/:id/dashboard` | owner | Stats + joined students |
| POST | `/api/libraries/:id/seats` | owner | Add seats |
| POST | `/api/libraries/:id/coupons` | owner | Add a coupon |
| POST | `/api/libraries/:id/facilities` | owner | Add a facility |
| POST | `/api/bookings` | student | Reserve a seat |
| POST | `/api/bookings/:id/pay` | student | Pay (coupon applied here) |
| GET | `/api/bookings/:id` | owner or student | Booking / receipt |
| GET | `/api/bookings/mine/list` | student | Your booking history |

## Known MVP limitations (by design)

These are the honest trade-offs made to get a working full-stack app
without external services — see `ARCHITECTURE.md` and `DEPLOY.md` (from
the earlier docs set) for how each becomes production-grade:

- **JSON file storage, not PostgreSQL.** Fine for a single dev process;
  not safe for concurrent production traffic. Swap `backend/src/db.js`
  for the Postgres schema in `ARCHITECTURE.md`.
- **One library per owner.** The schema supports more; the create-library
  route currently blocks a second one to keep the MVP simple.
- **Payments are simulated**, not routed through a real Razorpay order —
  `POST /bookings/:id/pay` just validates the coupon and confirms the
  booking. Wiring in Razorpay's actual checkout + webhook flow is the next
  step before this touches real money.
- **Aadhaar number is stored in plaintext** in the JSON file for demo
  purposes. Encrypt at rest before this holds real user data.
- **No file upload backend** — the "intro video" field only captures the
  selected filename; actual upload to Cloudinary/S3 isn't wired up yet.

## Going to production

Follow `DEPLOY.md` from the earlier docs set: deploy `backend/` to
Render/Railway with a real PostgreSQL database (migrating `db.js`'s shape
into the tables in `ARCHITECTURE.md`), deploy `frontend/` to Vercel with
`VITE_API_URL` pointed at the live backend, and replace the simulated
payment step with Razorpay's real order + webhook flow.
