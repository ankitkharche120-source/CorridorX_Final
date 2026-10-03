const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

router.post('/request', tripController.requestTrip);
router.post('/qr-session', tripController.createQRSession);
router.get('/active', tripController.getActiveTrips);
router.get('/:id', tripController.getTripById);
router.post('/:id/select-ambulance', tripController.selectAmbulance);
router.post('/:id/select-hospital', tripController.selectHospital);
router.get('/:id/corridor', tripController.getTripCorridor);
router.patch('/:id/status', tripController.updateTripStatus);

module.exports = router;
