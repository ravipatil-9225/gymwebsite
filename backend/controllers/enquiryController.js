const FormSubmission = require('../models/FormSubmission');
const emailService = require('../services/emailService');
const socket = require('../socket');

// @desc    Handle Plan Interest
// @route   POST /api/plan-interest
const handlePlanInterest = async (req, res) => {
    try {
        const { name, email, planName, planPrice } = req.body;
        if (!name || !email || !planName)
            return res.status(400).json({ message: 'Name, email and plan are required.' });

        // Save as FormSubmission
        await new FormSubmission({ type: 'enquiry', name, email, message: `Interested in: ${planName} - ₹${planPrice}` }).save();

        emailService.sendPlanInterestConfirmation({ name, email, planName, planPrice }).catch(console.error);
        emailService.sendAdminPlanInterestAlert({ name, email, planName, planPrice }).catch(console.error);

        res.json({ success: true, message: 'Plan interest recorded! We will contact you shortly.' });
        socket.getIO().emit('db_changed');
    } catch (err) {
        console.error('Plan interest error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

// @desc    Handle Join Request / Lead Capture
// @route   POST /api/join
const handleJoinRequest = async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required.' });
        }

        // Save to Database
        await new FormSubmission({ type: 'join', name, email, phone, message }).save();

        emailService.sendJoinRequestConfirmation({ name, email, phone, message }).catch(console.error);
        emailService.sendAdminJoinAlert({ name, email, phone, message }).catch(console.error);

        res.status(200).json({ success: true, message: 'Your request has been submitted successfully. We will contact you soon!' });
        socket.getIO().emit('db_changed');
    } catch (error) {
        console.error('Error processing join request:', error);
        res.status(500).json({ success: false, message: 'Failed to submit request. Please try again later.' });
    }
};

module.exports = {
    handlePlanInterest,
    handleJoinRequest
};
