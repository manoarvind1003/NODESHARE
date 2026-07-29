import { useState, useEffect, useMemo } from 'react';
import { HiOutlineVideoCamera, HiOutlineSearch, HiOutlinePlay, HiOutlineArrowLeft } from 'react-icons/hi';
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
                    // Ignore JSON parse error if response is not JSON
                }
                throw new Error(errorMsg);
            }
            const data = await res.json();
            
            if (Array.isArray(data)) {
                setVideos(data);
            } else if (data && Array.isArray(data.data)) {
                // Fallback just in case backend wraps response
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

    // Extract unique subjects for chips
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
    }

    // Queue for the watch mode sidebar (filtering out active video)
    const queueVideos = filtered.filter(v => v.id !== activeVideo?.id);

    return (
        <div className="page-enter pb-16 space-y-6 max-w-[1600px] mx-auto">
            {/* Header & Search */}
            {!activeVideo && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pt-4">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="bg-red-600 text-white p-2 rounded-xl">
                            <HiOutlineVideoCamera className="w-6 h-6" />
                        </span>
                        NodeTube
                    </h1>
                    <div className="relative w-full md:w-96">
                        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search videos..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-100 border-none rounded-full text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                        />
                    </div>
                </div>
            )}

            {/* Filter Chips - Only show when NOT in watch mode */}
            {!activeVideo && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    <button
                        onClick={() => { setFilterSemester(null); setFilterSubject(null); }}
                        className={`snap-start whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                            !filterSemester && !filterSubject
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        All
                    </button>
                    
                    <div className="w-px h-6 bg-slate-200 mx-1 shrink-0"></div>

                    {semesters.map(s => (
                        <button
                            key={`sem-${s}`}
                            onClick={() => { setFilterSemester(s); setFilterSubject(null); }}
                            className={`snap-start whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                filterSemester === s && !filterSubject
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            Semester {s}
                        </button>
                    ))}

                    {subjects.length > 0 && (
                        <div className="w-px h-6 bg-slate-200 mx-1 shrink-0"></div>
                    )}

                    {subjects.map(sub => (
                        <button
                            key={`sub-${sub}`}
                            onClick={() => setFilterSubject(sub)}
                            className={`snap-start whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                filterSubject === sub
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                        <div className="aspect-video bg-slate-100 rounded-2xl animate-pulse" />
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="space-y-3">
                                <div className="aspect-video bg-slate-100 rounded-xl animate-pulse" />
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
                                        <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : filtered.length === 0 ? (
                <div className="py-32 text-center">
                    <HiOutlineVideoCamera className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-slate-900">No videos found</h3>
                    <p className="text-slate-500 mt-2 font-medium">Try adjusting your filters or search terms.</p>
                </div>
            ) : (
                /* ─── MAIN CONTENT ─── */
                <div className={`transition-opacity duration-300 ${videoTransition ? 'opacity-0' : 'opacity-100'}`}>
                    
                    {!activeVideo ? (
                        /* ─── BROWSE MODE (GRID) ─── */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                            {filtered.map(video => {
                                const thumbnail = getYouTubeThumbnail(video.url);
                                const subjectText = video.subject || 'General';
                                // Generate a deterministic color based on subject for the avatar
                                const charCode = subjectText.charCodeAt(0) || 65;
                                const avatarColor = `hsl(${charCode * 15 % 360}, 70%, 50%)`;

                                return (
                                    <div 
                                        key={video.id} 
                                        onClick={() => handleVideoSwitch(video)}
                                        className="group cursor-pointer flex flex-col gap-3"
                                    >
                                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100">
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
                                                        background: `linear-gradient(135deg, hsl(${((video.title || 'V').charCodeAt(0) || 65) * 25 % 360}, 70%, 60%), hsl(${(((video.title || 'V').charCodeAt(0) || 65) * 25 + 40) % 360}, 80%, 40%))`
                                                    }}
                                                >
                                                    <span className="text-white font-black text-lg sm:text-xl drop-shadow-md line-clamp-3 leading-tight px-2">
                                                        {video.title || 'Untitled Video'}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Duration overlay (placeholder) */}
                                            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                                                Play
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-3 px-1">
                                            <div 
                                                className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                                                style={{ backgroundColor: avatarColor }}
                                            >
                                                {subjectText.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-red-600 transition-colors">
                                                    {video.title || 'Untitled Video'}
                                                </h3>
                                                <p className="text-[13px] text-slate-500 mt-1 line-clamp-1 hover:text-slate-700">
                                                    {subjectText}
                                                </p>
                                                <p className="text-[12px] text-slate-500">
                                                    Semester {video.semester || '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        /* ─── WATCH MODE (PLAYER) ─── */
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
                            {/* Left: Player & Info */}
                            <div className="space-y-4">
                                <button 
                                    onClick={handleCloseVideo}
                                    className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full w-max"
                                >
                                    <HiOutlineArrowLeft className="w-4 h-4" />
                                    Back to Home
                                </button>
                                
                                <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-xl">
                                    <iframe
                                        key={activeVideo.id}
                                        src={getEmbedUrl(activeVideo.url)}
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>

                                <div className="p-2 space-y-4">
                                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                                        {activeVideo.title || 'Untitled Video'}
                                    </h2>
                                    
                                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                                style={{ backgroundColor: `hsl(${((activeVideo.subject || 'G').charCodeAt(0) || 65) * 15 % 360}, 70%, 50%)` }}
                                            >
                                                {(activeVideo.subject || 'G').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 leading-none">
                                                    {activeVideo.subject || 'General'}
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-1">Course Module</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-100 rounded-xl p-4 hover:bg-slate-200 transition-colors cursor-pointer">
                                        <p className="font-bold text-sm text-slate-900 mb-1">
                                            Semester {activeVideo.semester || '-'}
                                        </p>
                                        <p className="text-sm text-slate-700">
                                            Video lecture for {activeVideo.subject || 'this module'}. Dive deep into the core concepts covered in this module.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Up Next Queue */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x mb-2">
                                     <button className="snap-start whitespace-nowrap px-3 py-1 rounded-lg text-sm font-semibold bg-slate-900 text-white">
                                         All
                                     </button>
                                     <button className="snap-start whitespace-nowrap px-3 py-1 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200">
                                         Related
                                     </button>
                                     <button className="snap-start whitespace-nowrap px-3 py-1 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200">
                                         From {activeVideo.subject || 'General'}
                                     </button>
                                </div>
                                
                                {queueVideos.map(video => {
                                    const thumbnail = getYouTubeThumbnail(video.url);
                                    const subjectText = video.subject || 'General';
                                    return (
                                        <div 
                                            key={video.id}
                                            onClick={() => handleVideoSwitch(video)}
                                            className="flex gap-2 group cursor-pointer"
                                        >
                                            <div className="relative w-40 min-w-[160px] aspect-video rounded-xl overflow-hidden bg-slate-100">
                                                {thumbnail ? (
                                                    <img
                                                        src={thumbnail}
                                                        alt={video.title || 'Video'}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div 
                                                        className="w-full h-full flex items-center justify-center p-2 text-center group-hover:scale-105 transition-transform duration-300"
                                                        style={{ 
                                                            background: `linear-gradient(135deg, hsl(${((video.title || 'V').charCodeAt(0) || 65) * 25 % 360}, 70%, 60%), hsl(${(((video.title || 'V').charCodeAt(0) || 65) * 25 + 40) % 360}, 80%, 40%))`
                                                        }}
                                                    >
                                                        <span className="text-white font-bold text-xs drop-shadow-md line-clamp-2 leading-tight">
                                                            {video.title || 'Untitled Video'}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-semibold px-1 rounded">
                                                    10:00
                                                </div>
                                            </div>
                                            <div className="flex flex-col py-0.5 min-w-0 pr-2">
                                                <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-red-600 transition-colors">
                                                    {video.title || 'Untitled Video'}
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1 hover:text-slate-700">
                                                    {subjectText}
                                                </p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    Sem {video.semester || '-'}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
