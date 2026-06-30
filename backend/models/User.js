const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user', enum: ['user', 'admin'] },
    phone: { type: String, required: [true, 'Contact number is required'], trim: true, minlength: 10 },
    dob: { type: String, required: [true, 'Date of birth is required'], trim: true },
    batchTime: { type: String, default: 'Not Assigned' },
    goal: { type: String, default: '' },
    profileImage: {
        url: { type: String, default: '' },
        public_id: { type: String, default: '' }
    },
    allowPendingPayment: { type: Boolean, default: true },
    pendingDaysLimit: { type: Number, default: 30 },
    lastLogin: { type: Date, default: null },
    registrationDate: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before saving (Mongoose 9: async hooks don't use next())
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(8);
    this.password = await bcrypt.hash(this.password, salt);
});

// Verify password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
