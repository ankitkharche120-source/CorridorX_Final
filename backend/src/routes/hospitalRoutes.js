const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');

router.get('/', hospitalController.getAllHospitals);
router.get('/nearby-places', hospitalController.searchNearbyPlaces);
router.get('/search', hospitalController.searchHospitalsByQuery);
router.get('/:id', hospitalController.getHospitalById);
router.patch('/:id/beds', hospitalController.updateHospitalBeds);
router.patch('/:id/status', hospitalController.updateHospitalBeds);

module.exports = router;
