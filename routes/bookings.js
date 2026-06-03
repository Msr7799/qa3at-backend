import express from 'express';
const router = express.Router();
import { createBooking, getMyBookings, cancelBooking } from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';

// All booking routes are protected
router.use(protect);

// POST /api/bookings
router.post('/', createBooking);

// GET  /api/bookings
router.get('/', getMyBookings);

// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', cancelBooking);

export default router;
