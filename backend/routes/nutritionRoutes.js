const express = require('express');
const router = express.Router();
const { generatePlan } = require('../controllers/nutritionController');
const verifyAdmin = require('../middleware/verifyAdmin');

router.post('/generate', verifyAdmin, generatePlan);

module.exports = router;
