const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');

// NOTE: /cities must come BEFORE /:id so Express doesn't treat "cities" as an id
// GET /api/venues/cities
router.get('/cities', venueController.getCities);

// GET /api/venues
router.get('/', venueController.getVenues);

// GET /api/venues/:id
router.get('/:id', venueController.getVenueById);

module.exports = router;
