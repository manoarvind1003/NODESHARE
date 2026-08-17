const supabase = require('../lib/supabase');

/**
 * Middleware to verify Supabase JWT and attach user profile to request.
 */
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token missing' });
        }

        // Verify the token using Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error('Auth verification error:', authError);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Fetch user profile to get role and status
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            console.error('Profile fetch error:', profileError);
            return res.status(403).json({ error: 'User profile not found' });
        }

        // Attach profile to request for subsequent middleware/routes
        req.user = profile;
        next();
    } catch (err) {
        console.error('Unexpected auth middleware error:', err);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

module.exports = requireAuth;
