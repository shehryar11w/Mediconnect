const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/response');

// Ensure JWT_SECRET is set
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set in environment variables');
    process.exit(1);
}

const auth = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return ApiResponse.error(res, 'No authorization header', 401);
        }

        // Check if token is in correct format
        if (!authHeader.startsWith('Bearer ')) {
            return ApiResponse.error(res, 'Invalid token format. Must be Bearer token', 401);
        }

        // Extract token from header and trim whitespace
        const token = authHeader.replace('Bearer ', '').trim();
        if (!token) {
            return ApiResponse.error(res, 'No token provided', 401);
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded || !decoded.id || !decoded.role) {
            return ApiResponse.error(res, 'Invalid token payload', 401);
        }

        // Attach user info to request
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token validation error:', error);
        
        // Handle specific JWT errors
        if (error.name === 'JsonWebTokenError') {
            return ApiResponse.error(res, 'Invalid token', 401);
        }
        if (error.name === 'TokenExpiredError') {
            return ApiResponse.error(res, 'Token expired', 401);
        }
        
        return ApiResponse.error(res, 'Authentication failed', 401);
    }
};

const generateToken = (user) => {
    if (!user) {
        throw new Error('User object is required to generate token');
    }

    const payload = {
        id: user.DoctorId || user.PatientId,
        role: user.DoctorId ? 'doctor' : 'patient',
        email: user.DoctorEmail || user.PatientEmail
    };

    if (!payload.id || !payload.role || !payload.email) {
        throw new Error('Invalid user object: missing required fields');
    }

    return jwt.sign(payload, JWT_SECRET);
};

module.exports = { auth, generateToken }; 