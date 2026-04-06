const express = require('express');
const router = express.Router();
const {
    getSubscription,
    createSubscription,
    updateSubscription
} = require('../controllers/subscriptionController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getSubscription);
router.post('/', protect, createSubscription);
router.put('/', protect, updateSubscription);

module.exports = router;
