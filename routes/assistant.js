const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');

// POST /api/assistant/chat
router.post('/chat', assistantController.chat);

module.exports = router;
