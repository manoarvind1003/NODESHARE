/**
 * Middleware factory for role-based access control.
 * Must be used AFTER requireAuth middleware.
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles.
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        // Super admins can generally do what admins can do, so we might want to include them by default
        // But for strict checks, we just check against the provided roles array.
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Also check if the user is active (unless they are a pending_admin accessing a route specifically for pending)
        if (req.user.role !== 'pending_admin' && req.user.status !== 'active') {
             return res.status(403).json({ error: `Account is ${req.user.status}. Contact super admin.` });
        }

        next();
    };
};

module.exports = requireRole;
