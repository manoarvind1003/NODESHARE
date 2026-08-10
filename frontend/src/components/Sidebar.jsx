import { NavLink, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import {
    HiOutlineHome,
    HiOutlineAcademicCap,
    HiOutlineShieldCheck,
    HiOutlineX,
    HiOutlineLogout,
    HiOutlineVideoCamera,
    HiOutlineBookOpen,
    HiOutlineCube
} from 'react-icons/hi';

const sidebarSections = [
    { title: "BSc Semesters", items: [1, 2, 3, 4, 5, 6].map(id => ({ id, name: `Semester ${id}` })) },
    { title: "Honors", items: [
        { id: 7, name: "Semester 7" },
        { id: 8, name: "Semester 8" }
    ]},
    { title: "M.Sc.", items: [
        { id: 10, name: "Semester 1" },
        { id: 11, name: "Semester 2" },
        { id: 12, name: "Semester 3" },
        { id: 13, name: "Semester 4" }
    ]}
];

// These will be applied to the icons for a vibrant, varied look
const moduleColors = [
    'text-blue-500 bg-blue-50 border-blue-100',
    'text-purple-500 bg-purple-50 border-purple-100',
    'text-emerald-500 bg-emerald-50 border-emerald-100',
    'text-amber-500 bg-amber-50 border-amber-100',
    'text-rose-500 bg-rose-50 border-rose-100',
    'text-indigo-500 bg-indigo-50 border-indigo-100'
];

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { isAdmin, logout } = useAdmin();

    const linkClass = ({ isActive }) =>
        `group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${
            isActive
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:scale-[1.01]'
        }`;

    const iconClass = (isActive) => 
        `w-5 h-5 transition-transform duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500 group-hover:scale-110'}`;

    const handleLogout = () => {
        logout();
        navigate('/');
        if (onClose) onClose();
    };

    return (
        <>
            {/* Mobile overlay with enhanced frosted glass */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Panel */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-72 bg-white/95 backdrop-blur-2xl border-r border-slate-200/80 shadow-2xl shadow-slate-200/50 lg:shadow-none
          transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
            >
                <div className="flex flex-col h-full relative overflow-hidden">
                    
                    {/* Ambient Background Glow */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

                    {/* Header / Branding */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-100/80">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center shadow-inner p-2 group hover:scale-105 transition-transform">
                                <img src="favicon.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h1 className="text-lg font-black uppercase tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    Node Share
                                </h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Infrastructure
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        
                        <NavLink to="/" end className={linkClass} onClick={onClose}>
                            {({ isActive }) => (
                                <>
                                    <HiOutlineHome className={iconClass(isActive)} />
                                    Home
                                </>
                            )}
                        </NavLink>

                        <NavLink to="/videos" className={linkClass} onClick={onClose}>
                            {({ isActive }) => (
                                <>
                                    <HiOutlineVideoCamera className={iconClass(isActive)} />
                                    Video Library
                                </>
                            )}
                        </NavLink>

                        {sidebarSections.map((section, secIdx) => (
                            <div key={section.title}>
                                {/* Section Header */}
                                <div className={`pb-2 flex items-center gap-3 ${secIdx === 0 ? 'pt-6' : 'pt-4'}`}>
                                    <p className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {section.title}
                                    </p>
                                    <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                                </div>

                                {/* Section Links */}
                                {section.items.map((item, i) => {
                                    const iconStyle = moduleColors[i % moduleColors.length];
                                    return (
                                        <NavLink
                                            key={item.id}
                                            to={`/semester/${item.id}`}
                                            className={linkClass}
                                            onClick={onClose}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${isActive ? 'bg-white/20 border-white/20 text-white' : iconStyle}`}>
                                                        <HiOutlineBookOpen className="w-4 h-4" />
                                                    </div>
                                                    {item.name}
                                                </>
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        ))}

                        {/* Management Section Header */}
                        <div className="pt-8 pb-2 flex items-center gap-3">
                            <p className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Management
                            </p>
                            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                        </div>
                        
                        <NavLink to="/admin" className={linkClass} onClick={onClose}>
                            {({ isActive }) => (
                                <>
                                    <HiOutlineShieldCheck className={iconClass(isActive)} />
                                    Admin Terminal
                                </>
                            )}
                        </NavLink>

                        {isAdmin && (
                            <button
                                onClick={handleLogout}
                                className="w-full mt-4 group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-rose-500 hover:bg-gradient-to-r hover:from-rose-50 hover:to-red-50 hover:text-rose-600 transition-all duration-300 border border-transparent hover:border-rose-100"
                            >
                                <HiOutlineLogout className="w-5 h-5 text-rose-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
                                Terminate Session
                            </button>
                        )}
                    </nav>

                    {/* Branding Footer */}
                    <div className="p-4 border-t border-slate-100/80 bg-slate-50/50">
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm text-center">
                            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider leading-relaxed">
                                &copy; 2026 NODE SHARE <br/> 
                                <span className="text-slate-400">Developed by</span> <b className="text-indigo-500">MANO ARVIND</b>
                            </p>
                            <div className="mt-2 inline-block px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-md">
                                <p className="text-[8px] font-bold text-indigo-600 uppercase tracking-[0.2em]">
                                    Open Source Repo
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}