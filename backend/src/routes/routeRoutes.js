const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');

router.post('/emergency-route', routeController.computeEmergencyRoute);
router.post('/snap-to-roads', routeController.snapToRoads);

module.exports = router;
