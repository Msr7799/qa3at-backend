require('dotenv').config();
const express = require('express');
const cors    = require('cors');

// ── Cached MongoDB connection (ضروري لـ Vercel Serverless) ────────────────
const connectDB = require('./lib/connectDB');

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

// ── Health check (قبل الـ DB middleware لمعرفة ما إذا كان السيرفر يعمل بشكل مستقل) 
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Qa3at API is running 🎉',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ── DB Middleware: اتصل بـ MongoDB قبل كل request ────────────────────────
// هذا هو مفتاح عمل Vercel Serverless - كل invocation تتصل بـ DB عبر الـ cache
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌  DB connection failed:', err.message);
    res.status(503).json({ success: false, message: 'Database unavailable. Try again.' });
  }
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

// ── Local Development only: تشغيل السيرفر محلياً فقط ─────────────────────
// في Vercel لا يعمل app.listen — Vercel يستدعي handler مباشرة عبر module.exports
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;

  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀  Server listening on http://localhost:${PORT}`);
        console.log(`📋  Health: http://localhost:${PORT}/health`);
      });
    })
    .catch((err) => {
      console.error('❌  Startup error:', err.message);
      process.exit(1);
    });

  process.on('SIGINT', async () => {
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('MongoDB connection closed. Bye! 👋');
    process.exit(0);
  });
}

// ── تصدير app لـ Vercel Serverless (لا تحذف هذا السطر) ──────────────────
module.exports = app;
