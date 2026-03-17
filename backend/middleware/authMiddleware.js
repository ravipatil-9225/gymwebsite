const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'tara_fitness_secret_2024';

const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorised, no token' });
    }
    try {
        const token = authHeader.split(' ')[1];
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ message: 'Token invalid or expired' });
    }
};

module.exports = { protect };
