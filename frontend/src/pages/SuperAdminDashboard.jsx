import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { 
    HiOutlineShieldCheck, 
    HiOutlineUsers, 
    HiOutlineClipboardList,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineBan,
    HiOutlineRefresh,
    HiOutlineMail
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
    const { session } = useAuth();
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users');

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/auth/users', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/auth/audit-logs', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch logs');
            const data = await res.json();
            setLogs(data);
        } catch (err) {
            toast.error(err.message);
        }
    };

    useEffect(() => {
        if (session) {
            Promise.all([fetchUsers(), fetchLogs()]).finally(() => setLoading(false));
        }
    }, [session]);

    const handleAction = async (userId, action) => {
        const actionLabels = {
            approve: 'approve',
            reject: 'reject',
            suspend: 'suspend',
            reinstate: 'reinstate',
        };
        const successLabels = {
            approve: 'approved',
            reject: 'rejected',
            suspend: 'suspended',
            reinstate: 'reinstated',
        };

        if (!window.confirm(`Are you sure you want to ${actionLabels[action] || action} this user?`)) return;

        try {
            const res = await fetch(`/api/auth/users/${userId}/${action}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `Failed to ${action} user`);
            }
            
            toast.success(`User successfully ${successLabels[action] || action + 'ed'}`);
            fetchUsers();
            fetchLogs();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleSendPasswordReset = async (email) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`
            });
            if (error) throw error;
            toast.success(`Password reset link sent to ${email}`);
        } catch (err) {
            toast.error(err.message || 'Failed to send reset email');
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    const pendingUsers = users.filter(u => u.status === 'pending');
    const activeUsers = users.filter(u => u.status === 'active' && u.role !== 'super_admin');
    const otherUsers = users.filter(u => ['rejected', 'suspended'].includes(u.status));

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-4">
                        <HiOutlineShieldCheck className="w-4 h-4" />
                        Super Admin Console
                    </div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">Access Management</h1>
                    <p className="text-indigo-200 text-sm max-w-xl">
                        Review pending requests, manage active administrators, and monitor system audit logs.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-200/50 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'users' 
                            ? 'bg-white text-indigo-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                >
                    <HiOutlineUsers className="w-5 h-5" />
                    Users & Requests
                    {pendingUsers.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                            {pendingUsers.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'logs' 
                            ? 'bg-white text-indigo-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                >
                    <HiOutlineClipboardList className="w-5 h-5" />
                    Audit Logs
                </button>
            </div>

            {/* Content */}
            {activeTab === 'users' && (
                <div className="space-y-6">
                    {/* Pending Approvals */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-amber-50/50 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Pending Requests</h2>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {pendingUsers.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">No pending requests.</div>
                            ) : (
                                pendingUsers.map(user => (
                                    <div key={user.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div>
                                            <p className="font-bold text-slate-900">{user.full_name || 'No Name'}</p>
                                            <p className="text-sm text-slate-500">{user.email} • {user.username}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleAction(user.id, 'approve')}
                                                className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                                title="Approve"
                                            >
                                                <HiOutlineCheckCircle className="w-6 h-6" />
                                            </button>
                                            <button 
                                                onClick={() => handleAction(user.id, 'reject')}
                                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                title="Reject"
                                            >
                                                <HiOutlineXCircle className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Active Admins */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Active Administrators</h2>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {activeUsers.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">No active administrators found.</div>
                            ) : (
                                activeUsers.map(user => (
                                    <div key={user.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div>
                                            <p className="font-bold text-slate-900">{user.full_name || 'No Name'}</p>
                                            <p className="text-sm text-slate-500">{user.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleSendPasswordReset(user.email)}
                                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                                title="Send password reset email"
                                            >
                                                <HiOutlineMail className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleAction(user.id, 'suspend')}
                                                className="px-4 py-2 text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-xl transition-colors"
                                            >
                                                Suspend Access
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    
                    {/* Suspended/Rejected */}
                    {otherUsers.length > 0 && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden opacity-75">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Inactive Accounts</h2>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {otherUsers.map(user => (
                                    <div key={user.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div>
                                            <p className="font-bold text-slate-900">{user.full_name || 'No Name'} <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${user.status === 'suspended' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{user.status.toUpperCase()}</span></p>
                                            <p className="text-sm text-slate-500">{user.email}</p>
                                        </div>
                                        <div>
                                            <button 
                                                onClick={() => handleAction(user.id, 'reinstate')}
                                                className="px-4 py-2 text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-colors inline-flex items-center gap-2"
                                            >
                                                <HiOutlineRefresh className="w-4 h-4" />
                                                Reinstate
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Recent Activity</h2>
                        <button onClick={fetchLogs} className="text-slate-400 hover:text-indigo-600"><HiOutlineRefresh className="w-5 h-5" /></button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 text-xs uppercase text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Time</th>
                                    <th className="px-6 py-4 font-bold">Action</th>
                                    <th className="px-6 py-4 font-bold">Actor</th>
                                    <th className="px-6 py-4 font-bold">Target</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No logs found.</td>
                                    </tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-slate-900">{log.profiles?.email || 'System'}</div>
                                                <div className="text-xs text-slate-500">{log.actor_role}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {log.target_email || 'N/A'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
