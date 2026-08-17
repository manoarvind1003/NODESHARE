import { HiOutlineClock, HiOutlineLogout } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PendingApproval() {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-inner relative">
                <div className="absolute inset-0 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin opacity-50" />
                <HiOutlineClock className="w-12 h-12 relative z-10" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Account Pending Review</h1>
            <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
                Your request for administrator access has been received and is currently waiting for approval from a Super Admin. You will be able to access the dashboard once approved.
            </p>
            <button 
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl shadow-sm transition-all"
            >
                <HiOutlineLogout className="w-5 h-5" />
                Sign Out
            </button>
        </div>
    );
}
