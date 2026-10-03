const express = require('express');
const router = express.Router();
const ambulanceController = require('../controllers/ambulanceController');

router.get('/nearby', ambulanceController.getNearbyAmbulances);
router.get('/:id', ambulanceController.getAmbulanceById);
router.patch('/:id/status', ambulanceController.updateAmbulanceStatus);

module.exports = router;
