const Subscription = require('../models/Subscription');

// @desc    Get user's current subscription
// @route   GET /api/subscription/
// @access  Private
const getSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
        
        if (!subscription) {
            return res.status(404).json({ message: 'No active plan found' });
        }

        // Check if subscription has expired
        if (new Date() > new Date(subscription.endDate) && subscription.status !== 'expired') {
            subscription.status = 'expired';
            await subscription.save();
        }

        res.json(subscription);
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create or completely replace/update a new subscription (Purchase Plan)
// @route   POST /api/subscription/
// @access  Private
const createSubscription = async (req, res) => {
    try {
        const { planName, planDuration, price, paymentMethod, transactionId } = req.body;

        if (!planName || !planDuration || !price) {
            return res.status(400).json({ message: 'Plan name, duration, and price are required' });
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + parseInt(planDuration));

        // Let's create the new subscription
        const subscription = await Subscription.create({
            userId: req.user.id,
            planName,
            planDuration,
            price,
            startDate,
            endDate,
            status: 'active',
            paymentMethod: paymentMethod || 'card',
            transactionId: transactionId || `txn_${Date.now()}`
        });

        res.status(201).json(subscription);
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Upgrade or downgrade a current subscription
// @route   PUT /api/subscription/
// @access  Private
const updateSubscription = async (req, res) => {
    try {
        const { planName, planDuration, price } = req.body;

        const subscription = await Subscription.findOne({ userId: req.user.id }).sort({ createdAt: -1 });

        if (!subscription) {
            return res.status(404).json({ message: 'No subscription found to update' });
        }

        if (planName) subscription.planName = planName;
        if (price !== undefined) subscription.price = price;
        
        // If duration is updated, recalculate endDate from existing startDate
        if (planDuration) {
            subscription.planDuration = planDuration;
            const newEndDate = new Date(subscription.startDate);
            newEndDate.setMonth(newEndDate.getMonth() + parseInt(planDuration));
            subscription.endDate = newEndDate;
            
            // Check status against new endDate
            if (new Date() > newEndDate) {
                subscription.status = 'expired';
            } else {
                subscription.status = 'active';
            }
        }

        const updatedSubscription = await subscription.save();
        res.json(updatedSubscription);
    } catch (error) {
        console.error('Error updating subscription:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getSubscription,
    createSubscription,
    updateSubscription
};
