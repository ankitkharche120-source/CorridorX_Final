const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/reverse-geocode', locationController.reverseGeocode);
router.get('/autocomplete', locationController.autocomplete);
router.get('/place-details', locationController.getPlaceDetails);

module.exports = router;
