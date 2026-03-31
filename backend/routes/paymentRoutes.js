const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const upload = require('../middleware/multer');

const { protect } = require('../middleware/authMiddleware');

// POST /api/payments/verify-and-upload
router.post('/verify-and-upload', protect, upload.single('screenshot'), paymentController.verifyAndUpload);

// GET /api/payments/check-discount
router.get('/check-discount', protect, paymentController.checkDiscount);

module.exports = router;
