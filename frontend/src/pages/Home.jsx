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
    HiOutlineChip,
    HiOutlineGlobe,
    HiOutlineChartBar
} from 'react-icons/hi';

const moduleCards = [
    { 
        id: 1, 
        label: 'Core Foundations', 
        tagline: 'Algorithms, Data Structures & Logic',
        gradient: 'from-blue-600 to-cyan-500', 
        glow: 'group-hover:shadow-blue-500/25',
        badgeColor: 'text-blue-700 bg-blue-50 border-blue-200/60',
        icon: HiOutlineBookOpen 
    },
    { 
        id: 2, 
        label: 'Data Systems', 
        tagline: 'Databases, SQL & Storage Engines',
        gradient: 'from-violet-600 to-purple-500', 
        glow: 'group-hover:shadow-violet-500/25',
        badgeColor: 'text-violet-700 bg-violet-50 border-violet-200/60',
        icon: HiOutlineFolderOpen 
    },
    { 
        id: 3, 
        label: 'Advanced Logic', 
        tagline: 'Distributed Systems & Computation',
        gradient: 'from-emerald-600 to-teal-500', 
        glow: 'group-hover:shadow-emerald-500/25',
        badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200/60',
        icon: HiOutlineChip 
    },
    { 
        id: 4, 
        label: 'System Architecture', 
        tagline: 'Microservices, APIs & Patterns',
        gradient: 'from-amber-500 to-orange-500', 
        glow: 'group-hover:shadow-amber-500/25',
        badgeColor: 'text-amber-700 bg-amber-50 border-amber-200/60',
        icon: HiOutlineServer 
    },
    { 
        id: 5, 
        label: 'Performance Optima', 
        tagline: 'Profiling, Caching & Scalability',
        gradient: 'from-rose-600 to-pink-500', 
        glow: 'group-hover:shadow-rose-500/25',
        badgeColor: 'text-rose-700 bg-rose-50 border-rose-200/60',
        icon: HiOutlineChartBar 
    },
    { 
        id: 6, 
        label: 'Global Infrastructure', 
        tagline: 'Cloud Native, Edge & DevOps',
        gradient: 'from-indigo-600 to-blue-600', 
        glow: 'group-hover:shadow-indigo-500/25',
        badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200/60',
        icon: HiOutlineGlobe 
    },
];

export default function Home() {
    const [liveStats, setLiveStats] = useState({ totalFiles: '128', totalVideos: '42' });

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
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 border-blue-100'
        },
        { 
            label: 'Cloud Streams', 
            value: liveStats.totalVideos, 
            icon: HiOutlineCloudUpload, 
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50 border-indigo-100'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50/60 text-slate-900 space-y-10 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Bento Grid Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 pt-6">
                
                {/* Hero Module */}
                <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-12 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-300">
                    {/* Background Light Ambient Glows */}
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-6">
                        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100/80 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                            </span>
                            <span className="text-xs font-semibold text-indigo-700 tracking-wide uppercase">Central Vault v2.0</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                            Your Academic <br />
                            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                Knowledge Base
                            </span>
                        </h1>

                        <p className="text-slate-600 text-base sm:text-lg max-w-xl leading-relaxed">
                            Engineered for high-efficiency learning. High-precision lecture notes, code repositories, and archived lab modules organized by semester.
                        </p>
                    </div>

                    <div className="relative z-10 pt-8 mt-8 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                            <HiOutlineSparkles className="w-4 h-4" />
                            <span>Instant Access</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <div>Verified Curriculum</div>
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <div>Direct Downloads</div>
                    </div>
                </div>

                {/* Stats Sidebar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5 lg:gap-6">
                    {stats.map((stat) => (
                        <div 
                            key={stat.label} 
                            className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-all duration-300"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${stat.bgColor}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Live Sync</span>
                            </div>

                            <div>
                                <p className="text-4xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Semester Selection Grid */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Curriculum Modules</h2>
                        <p className="text-slate-500 text-sm mt-0.5">Select a semester to explore resources</p>
                    </div>
                    <span className="px-3 py-1 bg-white border border-slate-200/80 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                        6 Semesters
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {moduleCards.map(({ id, label, tagline, gradient, glow, badgeColor, icon: Icon }) => (
                        <Link
                            key={id}
                            to={`/semester/${id}`}
                            className="group relative rounded-3xl bg-white border border-slate-200/80 p-7 flex flex-col justify-between hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md transition-shadow duration-300 ${glow}`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                                        0{id}
                                    </span>
                                </div>

                                <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    Semester {id}
                                </h3>
                                
                                <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold border mt-2 ${badgeColor}`}>
                                    {label}
                                </span>

                                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                                    {tagline}
                                </p>
                            </div>

                            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                                    View Repository
                                </span>
                                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 text-slate-600 group-hover:text-white transition-all duration-300">
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