import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    HiOutlineDocumentText,
    HiOutlineCloudUpload,
    HiOutlineArrowRight,
    HiOutlineBookOpen,
    HiOutlineSparkles,
    HiOutlineFolderOpen,
    HiOutlineServer,
    HiOutlineCpu,
    HiOutlineGlobeAlt,
    HiOutlineChartBar
} from 'react-icons/hi';

const moduleCards = [
    { 
        id: 1, 
        label: 'Core Foundations', 
        tagline: 'Algorithms, Data Structures & Logic',
        gradient: 'from-blue-500 to-cyan-400', 
        glow: 'group-hover:shadow-blue-500/20',
        icon: HiOutlineBookOpen 
    },
    { 
        id: 2, 
        label: 'Data Systems', 
        tagline: 'Databases, SQL & Storage Engines',
        gradient: 'from-violet-500 to-purple-400', 
        glow: 'group-hover:shadow-violet-500/20',
        icon: HiOutlineFolderOpen 
    },
    { 
        id: 3, 
        label: 'Advanced Logic', 
        tagline: 'Distributed Systems & Computation',
        gradient: 'from-emerald-500 to-teal-400', 
        glow: 'group-hover:shadow-emerald-500/20',
        icon: HiOutlineCpu 
    },
    { 
        id: 4, 
        label: 'System Architecture', 
        tagline: 'Microservices, APIs & Patterns',
        gradient: 'from-amber-500 to-orange-400', 
        glow: 'group-hover:shadow-amber-500/20',
        icon: HiOutlineServer 
    },
    { 
        id: 5, 
        label: 'Performance Optima', 
        tagline: 'Profiling, Caching & Scalability',
        gradient: 'from-rose-500 to-pink-400', 
        glow: 'group-hover:shadow-rose-500/20',
        icon: HiOutlineChartBar 
    },
    { 
        id: 6, 
        label: 'Global Infrastructure', 
        tagline: 'Cloud Native, Edge & DevOps',
        gradient: 'from-indigo-500 to-blue-400', 
        glow: 'group-hover:shadow-indigo-500/20',
        icon: HiOutlineGlobeAlt 
    },
];

export default function Home() {
    const [liveStats, setLiveStats] = useState({ totalFiles: '—', totalVideos: '—' });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/resources/stats');
                if (res.ok) {
                    const data = await res.json();
                    setLiveStats(data);
                }
            } catch (err) {
                console.error('Stats load failed', err);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        { 
            label: 'Indexed Files', 
            value: liveStats.totalFiles, 
            icon: HiOutlineDocumentText, 
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10 border-blue-500/20'
        },
        { 
            label: 'Cloud Streams', 
            value: liveStats.totalVideos, 
            icon: HiOutlineCloudUpload, 
            color: 'text-indigo-400',
            bgColor: 'bg-indigo-500/10 border-indigo-500/20'
        }
    ];

    return (
        <div className="min-h-screen text-slate-100 space-y-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Bento Grid Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 pt-6">
                
                {/* Hero Module */}
                <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-8 sm:p-12 flex flex-col justify-between shadow-2xl backdrop-blur-xl group">
                    {/* Background Subtle Gradient Flares */}
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-600/30 transition-all duration-700" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-6">
                        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            <span className="text-xs font-semibold text-indigo-300 tracking-wide uppercase">Central Vault v2.0</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                            Your Academic <br />
                            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent">
                                Knowledge Base
                            </span>
                        </h1>

                        <p className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed">
                            Engineered for high-efficiency learning. High-precision lecture notes, code repositories, and archived lab modules organized by semester.
                        </p>
                    </div>

                    <div className="relative z-10 pt-8 mt-8 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs font-medium text-slate-400">
                        <div className="flex items-center gap-2">
                            <HiOutlineSparkles className="w-4 h-4 text-indigo-400" />
                            <span>Instant Access</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                        <div>Verified Curriculum</div>
                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                        <div>Direct Downloads</div>
                    </div>
                </div>

                {/* Stats Sidebar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
                    {stats.map((stat) => (
                        <div 
                            key={stat.label} 
                            className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between shadow-xl backdrop-blur-xl hover:border-slate-700/80 transition-all duration-300"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${stat.bgColor}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Live Sync</span>
                            </div>

                            <div>
                                <p className="text-4xl font-extrabold text-white tracking-tight">{stat.value}</p>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Semester Selection Grid */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Curriculum Modules</h2>
                        <p className="text-slate-400 text-sm mt-0.5">Select a semester to explore resources</p>
                    </div>
                    <span className="px-3 py-1 bg-slate-800/80 border border-slate-700/50 rounded-full text-xs font-medium text-slate-300">
                        6 Semesters
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {moduleCards.map(({ id, label, tagline, gradient, glow, icon: Icon }) => (
                        <Link
                            key={id}
                            to={`/semester/${id}`}
                            className="group relative rounded-3xl bg-slate-900/60 border border-slate-800 p-7 flex flex-col justify-between hover:bg-slate-900/90 hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-2xl"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md ${glow} transition-shadow duration-300`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-indigo-400 transition-colors">
                                        0{id}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                                    Semester {id}
                                </h3>
                                <p className="text-xs font-semibold text-indigo-400 tracking-wide mt-1">
                                    {label}
                                </p>
                                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                                    {tagline}
                                </p>
                            </div>

                            <div className="mt-8 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">
                                    View Repository
                                </span>
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-500 text-slate-300 group-hover:text-white transition-all duration-300">
                                    <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}