const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');

router.get('/status', boardController.getBoardsStatus);
router.post('/:id/override', boardController.overrideBoard);

module.exports = router;
