const FormSubmission = require('../models/FormSubmission');
const emailService = require('../services/emailService');
const socket = require('../socket');

// @desc    Handle all generic form submissions (Enquiry, Feedback, Classes, PT)
// @route   POST /api/forms
const handleFormSubmission = async (req, res) => {
    try {
        const { type, name, email, phone, message, date, service, rating } = req.body;

        if (!type || !name || !email) {
            return res.status(400).json({ message: 'Type, Name, and Email are required.' });
        }

        // Save to Database
        const newSubmission = new FormSubmission({ type, name, email, phone, message, date, service, rating });
        await newSubmission.save();

        // Route to the correct email handler based on form type
        const formData = { name, email, phone, message, date, service, rating };
        switch (type) {
            case 'enquiry':
                emailService.sendEnquiryConfirmation(formData).catch(console.error);
                emailService.sendAdminEnquiryAlert(formData).catch(console.error);
                break;
            case 'feedback':
                emailService.sendFeedbackConfirmation(formData).catch(console.error);
                emailService.sendAdminFeedbackAlert(formData).catch(console.error);
                break;
            case 'group-class':
                emailService.sendGroupClassConfirmation(formData).catch(console.error);
                emailService.sendAdminGroupClassAlert(formData).catch(console.error);
                break;
            case 'pt-session':
                emailService.sendPTSessionConfirmation(formData).catch(console.error);
                emailService.sendAdminPTSessionAlert(formData).catch(console.error);
                break;
            case 'par-q':
                emailService.sendParQConfirmation(formData).catch(console.error);
                emailService.sendAdminParQAlert(formData).catch(console.error);
                break;
            case 'trial-waiver':
                emailService.sendTrialWaiverConfirmation(formData).catch(console.error);
                emailService.sendAdminTrialWaiverAlert(formData).catch(console.error);
                break;
            case 'pt-contract':
                emailService.sendPTContractConfirmation(formData).catch(console.error);
                emailService.sendAdminPTContractAlert(formData).catch(console.error);
                break;
            default:
                console.log(`Unhandled form type: ${type}`);
        }

        res.status(200).json({ success: true, message: 'Form submitted successfully!' });
        socket.getIO().emit('db_changed');
    } catch (error) {
        console.error('Error processing form:', error);
        res.status(500).json({ success: false, message: 'Failed to submit the form. Please try again.' });
    }
};

module.exports = { handleFormSubmission };
