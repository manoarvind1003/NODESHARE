import { useState, useEffect, useMemo } from 'react';
import { 
    HiOutlineVideoCamera, 
    HiOutlineSearch, 
    HiOutlineArrowLeft,
    HiOutlineAcademicCap,
    HiOutlineSparkles,
    HiOutlineFilm
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '';
const semesters = [1, 2, 3, 4, 5, 6];

export default function VideoLibrary() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeVideo, setActiveVideo] = useState(null);
    const [filterSemester, setFilterSemester] = useState(null);
    const [filterSubject, setFilterSubject] = useState(null);
    const [videoTransition, setVideoTransition] = useState(false);

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/videos`);
            if (!res.ok) {
                let errorMsg = 'Failed to fetch library';
                try {
                    const errorData = await res.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) {
                    // Non-JSON error fallback
                }
                throw new Error(errorMsg);
            }
            const data = await res.json();
            
            if (Array.isArray(data)) {
                setVideos(data);
            } else if (data && Array.isArray(data.data)) {
                setVideos(data.data);
            } else {
                setVideos([]);
            }
        } catch (err) {
            toast.error('Failed to load video catalog');
            console.error('VideoLibrary Fetch Error:', err);
            setVideos([]);
        } finally {
            setLoading(false);
        }
    };

    const subjects = useMemo(() => {
        const subs = new Set();
        (videos || []).forEach(v => {
            if (v && v.subject) subs.add(v.subject);
        });
        return Array.from(subs).sort();
    }, [videos]);

    const filtered = (videos || []).filter((v) => {
        if (!v) return false;
        const title = v.title || '';
        const subject = v.subject || '';
        
        const matchSearch = title.toLowerCase().includes(search.toLowerCase()) ||
            subject.toLowerCase().includes(search.toLowerCase());
        const matchSem = filterSemester ? v.semester === parseInt(filterSemester) : true;
        const matchSub = filterSubject ? subject === filterSubject : true;
        
        return matchSearch && matchSem && matchSub;
    });

    const getEmbedUrl = (url) => {
        if (!url) return '';
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            try {
                const id = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
                return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
            } catch (e) {
                return url;
            }
        }
        return url;
    };

    const getYouTubeThumbnail = (url) => {
        if (!url) return null;
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            try {
                const id = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
                return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    const handleVideoSwitch = (video) => {
        if (activeVideo?.id === video.id) return;
        setVideoTransition(true);
        setTimeout(() => {
            setActiveVideo(video);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setVideoTransition(false);
        }, 200);
    };
    
    const handleCloseVideo = () => {
        setVideoTransition(true);
        setTimeout(() => {
            setActiveVideo(null);
            setVideoTransition(false);
        }, 200);
    };

    const queueVideos = filtered.filter(v => v.id !== activeVideo?.id);

    return (
        <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-24 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-8">
            
            {/* Header & Search Bar */}
            {!activeVideo && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-b border-slate-200/80 pb-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full mb-2">
                            <HiOutlineSparkles className="w-3.5 h-3.5 text-rose-600" />
                            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wide">Video Streaming Vault</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <span className="bg-gradient-to-tr from-rose-600 to-red-500 text-white p-2.5 rounded-2xl shadow-md shadow-rose-500/20">
                                <HiOutlineVideoCamera className="w-6 h-6" />
                            </span>
                            NodeTube
                        </h1>
                    </div>

                    <div className="relative w-full md:w-96">
                        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search video lectures, subjects..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 shadow-sm transition-all"
                        />
                    </div>
                </div>
            )}

            {/* Filter Chips - Hide during watch mode */}
            {!activeVideo && (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    <button
                        onClick={() => { setFilterSemester(null); setFilterSubject(null); }}
                        className={`snap-start whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            !filterSemester && !filterSubject
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200/80 hover:border-slate-300 hover:text-slate-900'
                        }`}
                    >
                        All Videos
                    </button>
                    
                    <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />

                    {semesters.map(s => (
                        <button
                            key={`sem-${s}`}
                            onClick={() => { setFilterSemester(s); setFilterSubject(null); }}
                            className={`snap-start whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                filterSemester === s && !filterSubject
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/20'
                                    : 'bg-white text-slate-600 border-slate-200/80 hover:border-slate-300 hover:text-slate-900'
                            }`}
                        >
                            Semester {s}
                        </button>
                    ))}

                    {subjects.length > 0 && <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />}

                    {subjects.map(sub => (
                        <button
                            key={`sub-${sub}`}
                            onClick={() => setFilterSubject(sub)}
                            className={`snap-start whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                filterSubject === sub
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/20'
                                    : 'bg-white text-slate-600 border-slate-200/80 hover:border-slate-300 hover:text-slate-900'
                            }`}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
            )}

            {/* LOADING STATE */}
            {loading ? (
                activeVideo ? (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
                        <div className="aspect-video bg-slate-200/60 rounded-3xl animate-pulse" />
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-200/60 rounded-2xl animate-pulse" />)}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="space-y-3">
                                <div className="aspect-video bg-slate-200/60 rounded-2xl animate-pulse" />
                                <div className="flex gap-3">
                                    <div className="w-9 h-9 rounded-full bg-slate-200/60 shrink-0 animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200/60 rounded animate-pulse w-full" />
                                        <div className="h-3 bg-slate-200/60 rounded animate-pulse w-2/3" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : filtered.length === 0 ? (
                /* EMPTY STATE */
                <div className="py-24 text-center bg-white border border-slate-200/80 rounded-3xl shadow-sm p-8 max-w-lg mx-auto my-12">
                    <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-600">
                        <HiOutlineFilm className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No matching videos found</h3>
                    <p className="text-slate-500 text-sm mt-1">Try clearing your filters or testing another search term.</p>
                    <button
                        onClick={() => { setSearch(''); setFilterSemester(null); setFilterSubject(null); }}
                        className="mt-5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 transition-colors"
                    >
                        Reset All Filters
                    </button>
                </div>
            ) : (
                /* MAIN CONTENT */
                <div className={`transition-opacity duration-300 ${videoTransition ? 'opacity-0' : 'opacity-100'}`}>
                    
                    {!activeVideo ? (
                        /* BROWSE GRID */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
                            {filtered.map(video => {
                                const thumbnail = getYouTubeThumbnail(video.url);
                                const subjectText = video.subject || 'General';
                                const charCode = subjectText.charCodeAt(0) || 65;
                                const avatarColor = `hsl(${charCode * 15 % 360}, 65%, 48%)`;

                                return (
                                    <div 
                                        key={video.id} 
                                        onClick={() => handleVideoSwitch(video)}
                                        className="group cursor-pointer flex flex-col gap-3"
                                    >
                                        {/* Thumbnail Box */}
                                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-sm group-hover:shadow-md transition-all">
                                            {thumbnail ? (
                                                <img
                                                    src={thumbnail}
                                                    alt={video.title || 'Video'}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div 
                                                    className="w-full h-full flex items-center justify-center p-4 text-center group-hover:scale-105 transition-transform duration-500"
                                                    style={{ 
                                                        background: `linear-gradient(135deg, hsl(${((video.title || 'V').charCodeAt(0) || 65) * 25 % 360}, 60%, 92%), hsl(${(((video.title || 'V').charCodeAt(0) || 65) * 25 + 40) % 360}, 70%, 82%))`
                                                    }}
                                                >
                                                    <span className="text-slate-800 font-extrabold text-sm sm:text-base line-clamp-3 leading-snug px-2">
                                                        {video.title || 'Untitled Video'}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="absolute bottom-2.5 right-2.5 bg-slate-900/85 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase">
                                                Watch
                                            </div>
                                        </div>
                                        
                                        {/* Card Info */}
                                        <div className="flex gap-3 px-1">
                                            <div 
                                                className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-extrabold text-xs shadow-sm"
                                                style={{ backgroundColor: avatarColor }}
                                            >
                                                {subjectText.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors">
                                                    {video.title || 'Untitled Video'}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                                                    <span>{subjectText}</span>
                                                    <span>•</span>
                                                    <span className="text-slate-600 font-semibold">Sem {video.semester || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* WATCH MODE */
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
                            {/* Left: Player Section */}
                            <div className="space-y-5">
                                <button 
                                    onClick={handleCloseVideo}
                                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-all px-4 py-2.5 rounded-2xl shadow-sm"
                                >
                                    <HiOutlineArrowLeft className="w-4 h-4 text-slate-500" />
                                    Back to Catalog
                                </button>
                                
                                <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
                                    <iframe
                                        key={activeVideo.id}
                                        src={getEmbedUrl(activeVideo.url)}
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>

                                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                                        {activeVideo.title || 'Untitled Video'}
                                    </h2>
                                    
                                    <div className="flex items-center justify-between border-t border-b border-slate-100 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-sm"
                                                style={{ backgroundColor: `hsl(${((activeVideo.subject || 'G').charCodeAt(0) || 65) * 15 % 360}, 65%, 48%)` }}
                                            >
                                                {(activeVideo.subject || 'G').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    {activeVideo.subject || 'General'}
                                                </h3>
                                                <p className="text-xs font-semibold text-slate-400">Curriculum Video</p>
                                            </div>
                                        </div>

                                        <span className="px-3 py-1 bg-slate-100 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700">
                                            Semester {activeVideo.semester || '-'}
                                        </span>
                                    </div>
                                    
                                    <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed">
                                        <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                                            <HiOutlineAcademicCap className="w-4 h-4 text-rose-600" />
                                            Overview
                                        </p>
                                        In-depth video lecture covering core topics for {activeVideo.subject || 'this module'}. Use this resource alongside official course notes.
                                    </div>
                                </div>
                            </div>

                            {/* Right: Up Next Sidebar */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Up Next</h3>
                                    <span className="text-xs font-bold text-slate-400">{queueVideos.length} Videos</span>
                                </div>
                                
                                <div className="space-y-3">
                                    {queueVideos.map(video => {
                                        const thumbnail = getYouTubeThumbnail(video.url);
                                        const subjectText = video.subject || 'General';
                                        
                                        return (
                                            <div 
                                                key={video.id}
                                                onClick={() => handleVideoSwitch(video)}
                                                className="flex gap-3 p-2 bg-white border border-slate-200/80 hover:border-rose-300 rounded-2xl cursor-pointer group hover:shadow-md transition-all"
                                            >
                                                <div className="relative w-36 min-w-[140px] aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                                                    {thumbnail ? (
                                                        <img
                                                            src={thumbnail}
                                                            alt={video.title || 'Video'}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div 
                                                            className="w-full h-full flex items-center justify-center p-2 text-center"
                                                            style={{ 
                                                                background: `linear-gradient(135deg, hsl(${((video.title || 'V').charCodeAt(0) || 65) * 25 % 360}, 60%, 92%), hsl(${(((video.title || 'V').charCodeAt(0) || 65) * 25 + 40) % 360}, 70%, 82%))`
                                                            }}
                                                        >
                                                            <span className="text-slate-800 font-extrabold text-[10px] line-clamp-2">
                                                                {video.title || 'Untitled'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col justify-center min-w-0 pr-1">
                                                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors">
                                                        {video.title || 'Untitled Video'}
                                                    </h4>
                                                    <p className="text-[11px] font-medium text-slate-500 mt-1 line-clamp-1">
                                                        {subjectText}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                                        Sem {video.semester || '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}