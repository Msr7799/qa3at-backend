require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ── Route imports ─────────────────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const venueRoutes     = require('./routes/venues');
const packageRoutes   = require('./routes/packages');
const bookingRoutes   = require('./routes/bookings');
const assistantRoutes = require('./routes/assistant');

// ── Error handler ─────────────────────────────────────────────────────────
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ── Global Middleware ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Qa3at API is running 🎉',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/venues',    venueRoutes);
app.use('/api/packages',  packageRoutes);
app.use('/api/bookings',  bookingRoutes);
app.use('/api/assistant', assistantRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ── Global error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ── MongoDB connection + server start ─────────────────────────────────────
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌  MONGODB_URI is not set in .env');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀  Server listening on http://localhost:${PORT}`);
      console.log(`📋  Health: http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  });

// ── Graceful shutdown ─────────────────────────────────────────────────────
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed. Bye! 👋');
  process.exit(0);
});

module.exports = app;
