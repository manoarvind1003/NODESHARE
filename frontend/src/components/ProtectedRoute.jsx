import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles, allowedStatuses }) {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    // Not authenticated at all → send to login
    if (!user || !profile) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Route user based on their account status
    if (profile.status === 'suspended') {
        return <Navigate to="/account-suspended" replace />;
    }

    if (profile.status === 'rejected') {
        return <Navigate to="/account-rejected" replace />;
    }

    if (profile.status === 'pending') {
        return <Navigate to="/pending-approval" replace />;
    }

    // Check if user's role is in the allowed roles list
    if (allowedRoles && !allowedRoles.includes(profile.role)) {
        // If they're an admin but not super_admin, redirect to admin dashboard instead of login
        if (profile.role === 'admin' && profile.status === 'active') {
            return <Navigate to="/admin" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    // Check if user's status is allowed for this route
    if (allowedStatuses && !allowedStatuses.includes(profile.status)) {
        return <Navigate to="/pending-approval" replace />;
    }

    return children;
}
