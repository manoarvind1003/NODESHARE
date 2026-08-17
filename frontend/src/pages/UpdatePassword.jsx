import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTokenValid, setIsTokenValid] = useState(null); // null = checking, true/false = result
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        let timeoutId = null;

        const validate = async () => {
            // 1. First, parse tokens directly from the URL hash (most reliable method)
            const hash = window.location.hash;
            const params = new URLSearchParams(hash.replace('#', ''));
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            const type = params.get('type');

            if (accessToken && type === 'recovery') {
                // Manually set the session using the tokens from the URL
                const { data, error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken || '',
                });

                if (!error && data?.session) {
                    if (mounted) setIsTokenValid(true);
                    return;
                }
            }

            // 2. Check if there's already an active recovery session
            const { data, error: sessionError } = await supabase.auth.getSession();
            if (data?.session) {
                if (mounted) setIsTokenValid(true);
                return;
            }

            // 3. Listen for auth state change (fallback)
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (!mounted) return;
                if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
                    setIsTokenValid(true);
                    subscription.unsubscribe();
                }
            });

            // 4. Timeout fallback — mark as invalid if nothing happened
            timeoutId = setTimeout(() => {
                if (mounted) {
                    setIsTokenValid(prev => prev === null ? false : prev);
                }
                subscription.unsubscribe();
            }, 5000);
        };

        validate();

        return () => {
            mounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return toast.error("Passwords don't match");
        }
        if (password.length < 8) {
            return toast.error('Password must be at least 8 characters');
        }

        // Check for strong password
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        if (!hasUpperCase || !hasNumber) {
            return toast.error('Password must contain at least one uppercase letter and one number');
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                toast.error(error.message || 'Failed to update password.');
            } else {
                toast.success('Password updated successfully! Please log in with your new password.');
                // Sign out so the user logs in fresh with the new password
                await supabase.auth.signOut();
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            toast.error('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Password strength calculation
    const getPasswordStrength = (pwd) => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return Math.min(score, 4);
    };

    const strengthLevel = getPasswordStrength(password);
    const strengthColors = ['bg-slate-200', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

    // Loading / checking token
    if (isTokenValid === null) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                    <p className="text-slate-500 text-sm font-medium">Verifying reset link…</p>
                </div>
            </div>
        );
    }

    // Expired / invalid token
    if (isTokenValid === false) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-400 rounded-full flex items-center justify-center mb-5">
                    <HiOutlineLockClosed className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Link Expired or Invalid</h1>
                <p className="text-slate-500 max-w-sm mb-6 text-sm leading-relaxed">
                    This password reset link has expired or is invalid. Reset links are single-use and expire after 1 hour. Please request a new one.
                </p>
                <button
                    onClick={() => navigate('/forgot-password')}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md shadow-indigo-500/20"
                >
                    Request New Link
                </button>
            </div>
        );
    }

    return (
        <div className="relative min-h-[85vh] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="w-full max-w-md animate-fade-in">
                <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />

                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/80 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-inner">
                            <HiOutlineLockClosed className="w-8 h-8" />
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100/80 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                            <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                            Link Verified
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Set New <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Password</span>
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm">Choose a strong password for your account.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* New password */}
                        <div className="space-y-1.5">
                            <label htmlFor="new-password" className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-1">
                                New Password
                            </label>
                            <div className="relative group">
                                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    id="new-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/90 border border-slate-200 rounded-2xl py-3 pl-12 pr-12 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                                >
                                    {showPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm password */}
                        <div className="space-y-1.5">
                            <label htmlFor="confirm-password" className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-1">
                                Confirm Password
                            </label>
                            <div className="relative group">
                                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    id="confirm-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full bg-white/90 border rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                                        confirmPassword && password !== confirmPassword
                                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                            : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                    }`}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="text-xs text-red-500 pl-1 font-medium">Passwords do not match</p>
                            )}
                        </div>

                        {/* Strength meter */}
                        {password.length > 0 && (
                            <div className="space-y-1.5">
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4].map((lvl) => (
                                        <div
                                            key={lvl}
                                            className={`h-1.5 flex-1 rounded-full transition-all ${
                                                strengthLevel >= lvl ? strengthColors[strengthLevel] : 'bg-slate-200'
                                            }`}
                                        />
                                    ))}
                                </div>
                                {strengthLevel > 0 && (
                                    <p className={`text-xs font-semibold pl-0.5 ${
                                        strengthLevel <= 1 ? 'text-red-500' : 
                                        strengthLevel <= 2 ? 'text-amber-600' : 'text-emerald-600'
                                    }`}>
                                        {strengthLabels[strengthLevel]}
                                    </p>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || (confirmPassword.length > 0 && password !== confirmPassword)}
                            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
