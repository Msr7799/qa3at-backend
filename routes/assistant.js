import express from 'express';
const router = express.Router();
import { chat } from '../controllers/assistantController.js';

// POST /api/assistant/chat
router.post('/chat', chat);

export default router;
