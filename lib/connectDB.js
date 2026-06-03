'use strict';
const mongoose = require('mongoose');

// ── Cached connection state ────────────────────────────────────────────────
// في بيئة Serverless (Vercel) كل طلب قد يُنشئ instance جديد
// نحفظ حالة الاتصال هنا لإعادة استخدامه بدلاً من فتح اتصال جديد في كل مرة
let cached = global._mongooseConnection;

if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

/**
 * connectDB — آمن للاستخدام في Serverless (Vercel, Netlify, AWS Lambda)
 * يتحقق أولاً من اتصال قائم قبل فتح اتصال جديد
 */
async function connectDB() {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!MONGO_URI) {
    throw new Error('❌  MONGODB_URI is not set in environment variables');
  }

  // ── الاتصال موجود بالفعل ─────────────────────────────────────────────────
  if (cached.conn) {
    return cached.conn;
  }

  // ── اتصال قيد الإنشاء (تجنب اتصالات متوازية) ──────────────────────────
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,       // لا نخزن الأوامر - نفشل بسرعة إذا انقطع الاتصال
      maxPoolSize: 10,             // Serverless يحتاج pool صغير
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(MONGO_URI, opts)
      .then((mongooseInstance) => {
        console.log('✅  MongoDB connected (new connection)');
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // أعد ضبط الـ promise عند الفشل حتى تتم إعادة المحاولة في الطلب التالي
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

module.exports = connectDB;
