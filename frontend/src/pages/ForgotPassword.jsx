import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { HiOutlineMail, HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineShieldCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`
            });

            if (error) {
                toast.error(error.message || 'Failed to send reset email.');
            } else {
                setSent(true);
            }
        } catch (err) {
            toast.error('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-[85vh] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="w-full max-w-md animate-fade-in">
                <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                    {/* Top gradient bar */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />

                    {sent ? (
                        /* Success state */
                        <div className="text-center space-y-5 py-4">
                            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-500">
                                <HiOutlineCheckCircle className="w-9 h-9" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold text-slate-900">Check your inbox</h1>
                                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                                    A password reset link has been sent to <strong className="text-slate-700">{email}</strong>.
                                    Click the link in the email to set a new password.
                                </p>
                                <p className="text-xs text-slate-400 mt-3">
                                    Didn't receive it? Check your spam folder or try again in a few minutes.
                                </p>
                            </div>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md shadow-indigo-500/20"
                            >
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        /* Form state */
                        <>
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/80 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-inner">
                                    <HiOutlineShieldCheck className="w-8 h-8" />
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                                    Password Recovery
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                    Reset <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Password</span>
                                </h1>
                                <p className="text-slate-500 mt-2 text-sm">
                                    Enter your email and we'll send you a secure reset link.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="reset-email" className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-1">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                        <input
                                            id="reset-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white/90 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 font-semibold transition-colors"
                                >
                                    <HiOutlineArrowLeft className="w-4 h-4" />
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
