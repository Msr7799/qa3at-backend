const { catchAsync } = require('../middleware/errorHandler');

/**
 * POST /api/assistant/chat
 *
 * Dummy AI assistant endpoint.
 * Replace the logic here with a real LLM call when ready.
 */
exports.chat = catchAsync(async (req, res) => {
  const { message, language = 'en' } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'message field is required.',
    });
  }

  // ── Static reply map (placeholder until real AI is wired) ────────────────
  const replies = {
    en: [
      "Hello! I'm Qa3at's wedding assistant. How can I help you plan your perfect event?",
      "Great question! I can help you find the ideal venue, packages and add-ons for your wedding.",
      "Sure! Browse our venues at /api/venues and I'll help you compare options.",
      "For pricing details, please check the venue page or contact the venue directly.",
      "I'm still learning! Please contact our support team for detailed assistance.",
    ],
    ar: [
      'مرحباً! أنا مساعد قعات للأعراس. كيف يمكنني مساعدتك في تخطيط حفل زفافك؟',
      'سؤال رائع! يمكنني مساعدتك في إيجاد القاعة المثالية والباقات والإضافات لزفافك.',
      'بالتأكيد! تصفح قاعاتنا على /api/venues وسأساعدك في مقارنة الخيارات.',
      'للاطلاع على تفاصيل الأسعار، يرجى مراجعة صفحة القاعة أو التواصل معها مباشرة.',
      'أنا لا تزال أتعلم! يرجى التواصل مع فريق الدعم للحصول على مساعدة مفصلة.',
    ],
  };

  const pool = replies[language] || replies.en;
  const reply = pool[Math.floor(Math.random() * pool.length)];

  res.status(200).json({
    success: true,
    data: {
      reply,
      language,
      timestamp: new Date().toISOString(),
    },
  });
});
