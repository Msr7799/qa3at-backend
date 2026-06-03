import express from 'express';
const router = express.Router();
import { getAddons, getTimeSlots, getPackages } from '../controllers/packageController.js';

// GET /api/packages/addons  — must be before /:id
router.get('/addons', getAddons);

// GET /api/packages/time-slots
router.get('/time-slots', getTimeSlots);

// GET /api/packages
router.get('/', getPackages);

export default router;
