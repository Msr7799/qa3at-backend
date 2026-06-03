import express from 'express';
const router = express.Router();
import { getCities, getVenues, getVenueById } from '../controllers/venueController.js';

// NOTE: /cities must come BEFORE /:id so Express doesn't treat "cities" as an id
// GET /api/venues/cities
router.get('/cities', getCities);

// GET /api/venues
router.get('/', getVenues);

// GET /api/venues/:id
router.get('/:id', getVenueById);

export default router;
