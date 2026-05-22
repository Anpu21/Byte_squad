const jwt = require('jsonwebtoken');
const { User } = require('../models');

const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }
    return process.env.JWT_SECRET;
};

const verifyAccessToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token required' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, getJwtSecret());

        const user = await User.findByPk(decoded.sub);
        if (!user || user.Status !== 'Active') {
            return res.status(401).json({ error: 'Account inactive or disabled' });
        }

        req.user = decoded;
        return next();
    } catch (error) {
        if (error.message === 'JWT_SECRET is not configured') {
            return res.status(500).json({ error: error.message });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Token invalid' });
    }
};

/**
 * requireModule Middleware
 * SECTION 4 Implementation
 */
const requireModule = (moduleName) => {
    return async (req, res, next) => {
        verifyAccessToken(req, res, () => {
            const decoded = req.user;

            // 2. Check module access from token claims
            if (!decoded.modules || !decoded.modules.includes(moduleName)) {
                return res.status(403).json({
                    error: `Access denied: '${moduleName}' module not assigned`
                });
            }

            return next();
        });
    };
};

module.exports = {
    verifyAccessToken,
    requireModule
};
