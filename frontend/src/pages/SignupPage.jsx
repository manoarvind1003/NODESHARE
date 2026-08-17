import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineArrowRight,
  HiOutlineIdentification
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedData = {
      ...formData,
      fullName: formData.fullName.trim(),
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
    };

    if (trimmedData.password !== trimmedData.confirmPassword) {
      return toast.error("Passwords don't match");
    }

    if (trimmedData.password.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }

    // Username validation: 3-30 chars, alphanumeric + underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(trimmedData.username)) {
      return toast.error("Username must be 3-30 characters and contain only letters, numbers, or underscores");
    }

    if (!trimmedData.fullName) {
      return toast.error("Full name is required");
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await signUp(
        trimmedData.email,
        trimmedData.password,
        trimmedData.username,
        trimmedData.fullName
      );

      if (error) {
        toast.error(error.message || 'Registration failed.');
      } else {
        toast.success('Registration submitted for review.');
        navigate('/pending-approval');
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center p-4 sm:p-6 overflow-hidden">

      {/* Background Soft Mesh Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-lg animate-fade-in my-8">

        {/* Main Glass Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 relative overflow-hidden">

          {/* Top Decorative Gradient Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />

          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Request <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Access</span>
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              Submit your details to request an administrator account. All requests are manually reviewed.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name Input */}
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-1">
                  Full Name
                </label>
                <div className="relative group">
                  <HiOutlineIdentification className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-white/90 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    placeholder="Mano Arvind"
                    required
                  />
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-1">
                  Username
                </label>
                <div className="relative group">
                  <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-white/90 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    placeholder="Mano11"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-1">
                Enter original email <span style={{ color: "red" }}>(used for password resets)</span>
              </label>

              <div className="relative group">
                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white/90 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  placeholder="Mano@gmail.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-1">
                Password
              </label>
              <div className="relative group">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white/90 border border-slate-200 rounded-2xl py-3 pl-12 pr-12 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <HiOutlineEyeOff className="w-4 h-4" />
                  ) : (
                    <HiOutlineEye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-1">
                Confirm Password
              </label>
              <div className="relative group">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-white/90 border border-slate-200 rounded-2xl py-3 pl-12 pr-12 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Submit Request
                  <HiOutlineArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Already have an account? <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline">Log in</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
