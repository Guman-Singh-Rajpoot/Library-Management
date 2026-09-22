require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const libraryRoutes = require('./routes/library.routes');
const bookingRoutes = require('./routes/booking.routes');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'studyseat-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/libraries', libraryRoutes);
app.use('/api/bookings', bookingRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`StudySeat backend listening on http://localhost:${PORT}`);
});
