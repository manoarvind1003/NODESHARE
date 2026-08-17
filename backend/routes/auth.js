const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// POST /api/auth/bootstrap
// One-time secure creation of the super admin.
router.post('/bootstrap', async (req, res) => {
    try {
        const { secret, email, username, password, full_name } = req.body;

        if (!process.env.BOOTSTRAP_SECRET) {
            return res.status(500).json({ error: 'BOOTSTRAP_SECRET not configured on server' });
        }

        if (secret !== process.env.BOOTSTRAP_SECRET) {
            return res.status(401).json({ error: 'Invalid bootstrap secret' });
        }

        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if super admin already exists
        const { data: existingSuperAdmins, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'super_admin');

        if (fetchError) {
            return res.status(500).json({ error: 'Error checking existing super admins', details: fetchError.message });
        }

        if (existingSuperAdmins.length > 0) {
            return res.status(400).json({ error: 'Super admin already exists. Bootstrap disabled.' });
        }

        let userId;

        // Create user in Supabase Auth using admin API
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                username: username,
                full_name: full_name || 'System Admin'
            }
        });

        if (authError) {
            // If user already exists in auth.users, update user password & reuse user ID
            if (authError.message.includes('already been registered') || authError.status === 422) {
                const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
                const existingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
                
                if (existingUser) {
                    userId = existingUser.id;
                    await supabase.auth.admin.updateUserById(userId, {
                        password: password,
                        email_confirm: true,
                        user_metadata: { username, full_name: full_name || 'System Admin' }
                    });
                } else {
                    return res.status(500).json({ error: 'Failed to create auth user', details: authError.message });
                }
            } else {
                return res.status(500).json({ error: 'Failed to create auth user', details: authError.message });
            }
        } else {
            userId = authData.user.id;
        }

        // Upsert the profile to be super_admin and active
        const { error: profileUpdateError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                username: username,
                full_name: full_name || 'System Admin',
                role: 'super_admin',
                status: 'active',
                must_change_password: false
            }, { onConflict: 'id' });

        if (profileUpdateError) {
            return res.status(500).json({ error: 'Failed to promote profile to super admin', details: profileUpdateError.message });
        }

        // Log bootstrap action
        await supabase.from('audit_logs').insert({
            actor_id: userId,
            actor_role: 'system',
            action: 'bootstrap_super_admin',
            target_id: userId,
            target_email: email
        });

        res.status(201).json({ message: 'Super admin successfully bootstrapped' });
    } catch (err) {
        console.error('Bootstrap error:', err);
        res.status(500).json({ error: 'Internal server error during bootstrap' });
    }
});

// GET /api/auth/me
// Get current user profile (using jwt)
router.get('/me', requireAuth, (req, res) => {
    res.json(req.user);
});

// --- USER MANAGEMENT (SUPER ADMIN ONLY) ---

// Helper function to log audit
const logAudit = async (actorId, actorRole, action, targetId, targetEmail, metadata = {}) => {
    try {
        await supabase.from('audit_logs').insert({
            actor_id: actorId,
            actor_role: actorRole,
            action: action,
            target_id: targetId,
            target_email: targetEmail,
            metadata: metadata
        });
    } catch (err) {
        console.error('Failed to log audit:', err);
    }
};

// GET /api/auth/users
router.get('/users', requireAuth, requireRole('super_admin'), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Fetch users error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// PATCH /api/auth/users/:id/approve
router.patch('/users/:id/approve', requireAuth, requireRole('super_admin'), async (req, res) => {
    try {
        const targetId = req.params.id;

        // Fetch target
        const { data: targetUser, error: targetError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetId)
            .single();

        if (targetError || !targetUser) return res.status(404).json({ error: 'User not found' });
        
        if (targetUser.role === 'super_admin') {
            return res.status(403).json({ error: 'Cannot modify super admin' });
        }

        const { data, error } = await supabase
            .from('profiles')
            .update({ 
                role: 'admin', 
                status: 'active',
                approved_at: new Date().toISOString(),
                approved_by: req.user.id
            })
            .eq('id', targetId)
            .select()
            .single();

        if (error) throw error;

        await logAudit(req.user.id, req.user.role, 'approve_admin', targetId, targetUser.email);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Approval failed' });
    }
});

// PATCH /api/auth/users/:id/reject
router.patch('/users/:id/reject', requireAuth, requireRole('super_admin'), async (req, res) => {
    try {
        const targetId = req.params.id;

        const { data: targetUser } = await supabase.from('profiles').select('*').eq('id', targetId).single();
        if (!targetUser || targetUser.role === 'super_admin') return res.status(403).json({ error: 'Invalid target' });

        const { data, error } = await supabase
            .from('profiles')
            .update({ status: 'rejected' })
            .eq('id', targetId)
            .select()
            .single();

        if (error) throw error;

        await logAudit(req.user.id, req.user.role, 'reject_admin', targetId, targetUser.email);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Rejection failed' });
    }
});

// PATCH /api/auth/users/:id/suspend
router.patch('/users/:id/suspend', requireAuth, requireRole('super_admin'), async (req, res) => {
    try {
        const targetId = req.params.id;

        const { data: targetUser } = await supabase.from('profiles').select('*').eq('id', targetId).single();
        if (!targetUser || targetUser.role === 'super_admin') return res.status(403).json({ error: 'Invalid target' });

        const { data, error } = await supabase
            .from('profiles')
            .update({ status: 'suspended' })
            .eq('id', targetId)
            .select()
            .single();

        if (error) throw error;

        await logAudit(req.user.id, req.user.role, 'suspend_admin', targetId, targetUser.email);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Suspension failed' });
    }
});

// PATCH /api/auth/users/:id/reinstate
router.patch('/users/:id/reinstate', requireAuth, requireRole('super_admin'), async (req, res) => {
    try {
        const targetId = req.params.id;

        const { data: targetUser } = await supabase.from('profiles').select('*').eq('id', targetId).single();
        if (!targetUser || targetUser.role === 'super_admin') return res.status(403).json({ error: 'Invalid target' });

        // Determine correct status based on role
        const newStatus = targetUser.role === 'admin' ? 'active' : 'pending';

        const { data, error } = await supabase
            .from('profiles')
            .update({ status: newStatus })
            .eq('id', targetId)
            .select()
            .single();

        if (error) throw error;

        await logAudit(req.user.id, req.user.role, 'reinstate_admin', targetId, targetUser.email);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Reinstatement failed' });
    }
});

// GET /api/auth/audit-logs
router.get('/audit-logs', requireAuth, requireRole('super_admin'), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*, profiles!actor_id(email, username)')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

module.exports = router;
