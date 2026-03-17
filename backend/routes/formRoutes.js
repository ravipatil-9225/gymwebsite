const express = require('express');
const { handleFormSubmission } = require('../controllers/bookingController');

const router = express.Router();

router.post('/', handleFormSubmission);

module.exports = router;
