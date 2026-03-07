const jwt = require('jsonwebtoken');

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin_super_secret_2024';

const adminProtect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
            if (decoded.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized as admin' });
            }
            req.admin = decoded;
            next();
        } catch (err) {
            return res.status(401).json({ message: 'Not authorized, admin token failed' });
        }
    }
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no admin token' });
    }
};

module.exports = { adminProtect, ADMIN_JWT_SECRET };
