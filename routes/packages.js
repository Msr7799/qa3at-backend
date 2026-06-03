const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');

// GET /api/packages/addons  — must be before /:id
router.get('/addons', packageController.getAddons);

// GET /api/packages/time-slots
router.get('/time-slots', packageController.getTimeSlots);

// GET /api/packages
router.get('/', packageController.getPackages);

module.exports = router;
