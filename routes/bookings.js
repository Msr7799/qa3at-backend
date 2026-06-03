const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

// All booking routes are protected
router.use(protect);

// POST /api/bookings
router.post('/', bookingController.createBooking);

// GET  /api/bookings
router.get('/', bookingController.getMyBookings);

// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
