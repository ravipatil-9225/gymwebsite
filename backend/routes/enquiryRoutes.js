const express = require('express');
const { handlePlanInterest, handleJoinRequest } = require('../controllers/enquiryController');

const router = express.Router();

router.post('/plan-interest', handlePlanInterest);
router.post('/join', handleJoinRequest);

module.exports = router;
