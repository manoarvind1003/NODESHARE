import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    HiOutlineCloudUpload,
    HiOutlineTrash,
    HiOutlineDocumentText,
    HiOutlineCheck,
    HiOutlineX,
    HiOutlineVideoCamera,
    HiOutlineLink,
    HiOutlineTag,
    HiOutlineChartBar,
    HiOutlineRefresh,
    HiOutlineSearch,
    HiOutlineFilter,
    HiOutlineCollection,
    HiOutlinePlay,
    HiOutlineLightningBolt,
    HiOutlineExclamation,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const API_URL = '';

const categories = ['General', 'Notes', 'Practical', 'Assignment', 'Case Studies', 'Question Papers', 'Reference Material', 'Datasets'];
const modules = [1, 2, 3, 4, 5, 6];

function formatFileSize(bytes) {
    if (!bytes) return '—';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getYouTubeThumbnail(url) {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        try {
            const id = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
            return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
        } catch (e) { return null; }
    }
    return null;
}

const TABS = [
    { id: 'overview',   label: 'Overview',   icon: HiOutlineChartBar },
    { id: 'resources',  label: 'Resources',  icon: HiOutlineCollection },
    { id: 'videos',     label: 'Videos',     icon: HiOutlineVideoCamera },
];

// ─── Sub-components ───────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, loading }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-6 bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm group hover:border-${color}-500/40 transition-all duration-300`}>
            <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="text-4xl font-black text-white mt-2">
                        {loading ? <span className="inline-block w-16 h-9 bg-slate-700 rounded animate-pulse" /> : value}
                    </p>
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center`}>
                    <Icon className={`w-7 h-7 text-${color}-400`} />
                </div>
            </div>
        </div>
    );
}

function SectionHeader({ title, count, countColor = 'indigo' }) {
    const colorMap = { indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20', emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">{title}</h3>
            {count !== undefined && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${colorMap[countColor]}`}>{count}</span>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [resources, setResources] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [videoDeleteConfirm, setVideoDeleteConfirm] = useState(null);

    // Catalog filters
    const [resourceSearch, setResourceSearch] = useState('');
    const [resourceSemFilter, setResourceSemFilter] = useState('');
    const [resourceCatFilter, setResourceCatFilter] = useState('');
    const [videoSearch, setVideoSearch] = useState('');

    // Bulk File Upload
    const [moduleId, setModuleId] = useState('1');
    const [category, setCategory] = useState('General');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});
    const [selectedResourceIds, setSelectedResourceIds] = useState([]);

    // Video Registration
    const [videoTitle, setVideoTitle] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [videoSubject, setVideoSubject] = useState('');
    const [videoModule, setVideoModule] = useState('1');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [r, v] = await Promise.all([fetch(`${API_URL}/api/resources`), fetch(`${API_URL}/api/videos`)]);
            if (r.ok) setResources(await r.json());
            if (v.ok) setVideos(await v.json());
        } catch (err) {
            toast.error('Failed to sync with server');
        } finally {
            setLoading(false);
        }
    };

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) setSelectedFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            'application/ms-powerpoint': ['.ppt'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/plain': ['.txt'],
            'application/zip': ['.zip'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'application/vnd.ms-powerbi.pbix': ['.pbix'],
        }
    });

    const handleBulkUpload = async (e) => {
        e.preventDefault();
        if (!selectedFiles.length) { toast.error('No files staged'); return; }
        setUploading(true);
        let ok = 0, fail = 0;
        for (const file of selectedFiles) {
            const fileId = `${file.name}-${file.size}`;
            setUploadProgress(p => ({ ...p, [fileId]: 'uploading' }));
            try {
                const fd = new FormData();
                fd.append('file', file);
                fd.append('title', file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
                fd.append('semester', moduleId);
                fd.append('category', category);
                const res = await fetch(`${API_URL}/api/resources/upload`, { method: 'POST', body: fd });
                if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.details || d.error || 'Failed'); }
                setUploadProgress(p => ({ ...p, [fileId]: 'done' })); ok++;
            } catch (err) {
                setUploadProgress(p => ({ ...p, [fileId]: 'error' })); fail++;
            }
        }
        setUploading(false);
        if (ok > 0) toast.success(`${ok} file${ok > 1 ? 's' : ''} uploaded successfully`);
        if (fail > 0) toast.error(`${fail} upload${fail > 1 ? 's' : ''} failed`);
        setSelectedFiles([]); setUploadProgress({}); fetchData();
    };

    const handleBulkDelete = async () => {
        if (!selectedResourceIds.length) return;
        setDeleteConfirm(null);
        toast.promise(
            (async () => {
                const res = await fetch(`${API_URL}/api/resources/bulk-delete`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: selectedResourceIds })
                });
                if (!res.ok) throw new Error('Bulk delete failed');
                setSelectedResourceIds([]); fetchData();
            })(),
            { loading: 'Deleting selected files...', success: 'Files deleted', error: 'Delete failed' }
        );
    };

    const toggleSelection = (id) => setSelectedResourceIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);

    const handleVideoRegister = async (e) => {
        e.preventDefault(); setRegistering(true);
        try {
            const res = await fetch(`${API_URL}/api/videos`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: videoTitle, url: videoUrl, subject: videoSubject, semester: videoModule })
            });
            if (!res.ok) throw new Error('Registration failed');
            toast.success('Video registered successfully');
            setVideoTitle(''); setVideoUrl(''); setVideoSubject(''); setVideoModule('1');
            fetchData();
        } catch (err) { toast.error('Registration failed'); } finally { setRegistering(false); }
    };

    const handleDeleteResource = async (id) => {
        if (deleteConfirm !== id) { setDeleteConfirm(id); return; }
        setDeleteConfirm(null);
        try {
            const res = await fetch(`${API_URL}/api/resources/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            toast.success('Resource deleted'); fetchData();
        } catch { toast.error('Delete failed'); }
    };

    const handleDeleteVideo = async (id) => {
        if (videoDeleteConfirm !== id) { setVideoDeleteConfirm(id); return; }
        setVideoDeleteConfirm(null);
        try {
            const res = await fetch(`${API_URL}/api/videos/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            toast.success('Video removed'); fetchData();
        } catch { toast.error('Delete failed'); }
    };

    const filteredResources = useMemo(() => resources.filter(r => {
        const matchS = !resourceSearch || (r.title || '').toLowerCase().includes(resourceSearch.toLowerCase());
        const matchSem = !resourceSemFilter || String(r.semester) === resourceSemFilter;
        const matchCat = !resourceCatFilter || r.category === resourceCatFilter;
        return matchS && matchSem && matchCat;
    }), [resources, resourceSearch, resourceSemFilter, resourceCatFilter]);

    const filteredVideos = useMemo(() => videos.filter(v => {
        return !videoSearch || (v.title || '').toLowerCase().includes(videoSearch.toLowerCase()) || (v.subject || '').toLowerCase().includes(videoSearch.toLowerCase());
    }), [videos, videoSearch]);

    const recentResources = useMemo(() => [...resources].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5), [resources]);
    const recentVideos = useMemo(() => [...videos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5), [videos]);

    // ─── Render Overview ───────────────────────────────────────────
    const renderOverview = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={HiOutlineCollection} label="Total Resources" value={resources.length} color="indigo" loading={loading} />
                <StatCard icon={HiOutlineVideoCamera} label="Total Videos" value={videos.length} color="purple" loading={loading} />
                <StatCard icon={HiOutlineDocumentText} label="Semesters" value={6} color="emerald" loading={loading} />
                <StatCard icon={HiOutlineTag} label="Categories" value={categories.length} color="amber" loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Resources */}
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                    <SectionHeader title="Recent Uploads" count={recentResources.length} countColor="indigo" />
                    <div className="divide-y divide-slate-700/30">
                        {loading ? (
                            [1,2,3].map(i => <div key={i} className="p-4 flex gap-3 animate-pulse"><div className="w-8 h-8 rounded-lg bg-slate-700" /><div className="flex-1 space-y-2"><div className="h-3 bg-slate-700 rounded w-3/4" /><div className="h-3 bg-slate-700 rounded w-1/2" /></div></div>)
                        ) : recentResources.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-8">No resources yet</p>
                        ) : recentResources.map(r => (
                            <div key={r.id} className="px-6 py-3 flex items-center gap-3 hover:bg-slate-700/30 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                    <HiOutlineDocumentText className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-200 truncate">{r.title}</p>
                                    <p className="text-xs text-slate-500">Sem {r.semester} · {r.category}</p>
                                </div>
                                <span className="text-xs text-slate-600 shrink-0">{formatDate(r.created_at)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Videos */}
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                    <SectionHeader title="Recent Videos" count={recentVideos.length} countColor="purple" />
                    <div className="divide-y divide-slate-700/30">
                        {loading ? (
                            [1,2,3].map(i => <div key={i} className="p-4 flex gap-3 animate-pulse"><div className="w-16 h-10 rounded-lg bg-slate-700" /><div className="flex-1 space-y-2"><div className="h-3 bg-slate-700 rounded w-3/4" /><div className="h-3 bg-slate-700 rounded w-1/2" /></div></div>)
                        ) : recentVideos.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-8">No videos yet</p>
                        ) : recentVideos.map(v => {
                            const thumb = getYouTubeThumbnail(v.url);
                            return (
                                <div key={v.id} className="px-6 py-3 flex items-center gap-3 hover:bg-slate-700/30 transition-colors">
                                    <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700">
                                        {thumb ? <img src={thumb} alt={v.title} className="w-full h-full object-cover" /> : (
                                            <div className="w-full h-full flex items-center justify-center"
                                                style={{ background: `linear-gradient(135deg, hsl(${(v.title || 'V').charCodeAt(0) * 25 % 360}, 70%, 50%), hsl(${(v.title || 'V').charCodeAt(0) * 25 % 360 + 40}, 80%, 35%))` }}>
                                                <HiOutlinePlay className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-200 truncate">{v.title}</p>
                                        <p className="text-xs text-slate-500">Sem {v.semester} · {v.subject}</p>
                                    </div>
                                    <span className="text-xs text-slate-600 shrink-0">{formatDate(v.created_at)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    // ─── Render Resources ──────────────────────────────────────────
    const renderResources = () => (
        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 items-start">
            {/* Upload Panel */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                <SectionHeader title="Upload Files" countColor="indigo" />
                <div className="p-6 space-y-5">
                    <form onSubmit={handleBulkUpload} className="space-y-5">
                        {/* Dropzone */}
                        <div
                            {...getRootProps()}
                            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
                                ${isDragActive ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
                                : selectedFiles.length > 0 ? 'border-emerald-500/60 bg-emerald-500/5'
                                : 'border-slate-600 hover:border-indigo-500/60 hover:bg-indigo-500/5'}`}
                        >
                            <input {...getInputProps()} />
                            {isDragActive ? (
                                <div className="space-y-2">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto animate-bounce">
                                        <HiOutlineCloudUpload className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <p className="text-indigo-400 font-bold text-sm">Drop files here!</p>
                                </div>
                            ) : selectedFiles.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
                                        <HiOutlineCheck className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <p className="text-emerald-400 font-bold text-sm">{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} staged</p>
                                    <div className="max-h-36 overflow-y-auto space-y-1.5 text-left">
                                        {selectedFiles.map(f => {
                                            const fileId = `${f.name}-${f.size}`;
                                            const status = uploadProgress[fileId];
                                            return (
                                                <div key={fileId} className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2">
                                                    <span className="text-xs text-slate-300 truncate max-w-[180px]">{f.name}</span>
                                                    {status === 'uploading' && <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                                                    {status === 'done' && <HiOutlineCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                                                    {status === 'error' && <HiOutlineX className="w-4 h-4 text-red-400 flex-shrink-0" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button type="button" onClick={e => { e.stopPropagation(); setSelectedFiles([]); setUploadProgress({}); }}
                                        className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors">
                                        Clear all files
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-700/60 border border-slate-600 flex items-center justify-center mx-auto">
                                        <HiOutlineCloudUpload className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-slate-300 font-semibold text-sm">Drag & drop files here</p>
                                        <p className="text-slate-500 text-xs mt-1">or click to browse · PDF, DOCX, PPTX, XLSX, ZIP</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selectors */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Semester</label>
                                <select value={moduleId} onChange={e => setModuleId(e.target.value)}
                                    className="w-full bg-slate-700/60 border border-slate-600 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors">
                                    {modules.map(s => <option key={s} value={s}>Semester {s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Category</label>
                                <select value={category} onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-slate-700/60 border border-slate-600 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors">
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <button type="submit" disabled={uploading || !selectedFiles.length}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-all duration-200 text-sm disabled:cursor-not-allowed">
                            {uploading ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
                            ) : (
                                <><HiOutlineLightningBolt className="w-4 h-4" /> Upload {selectedFiles.length > 0 ? `${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}` : 'Files'}</>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Resources Catalog */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="px-6 py-4 border-b border-slate-700/50 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Resource Catalog</h3>
                        <div className="flex items-center gap-2">
                            {selectedResourceIds.length > 0 && (
                                <button onClick={handleBulkDelete}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors">
                                    <HiOutlineTrash className="w-3.5 h-3.5" />
                                    Delete {selectedResourceIds.length}
                                </button>
                            )}
                            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">{filteredResources.length} / {resources.length}</span>
                        </div>
                    </div>
                    {/* Filters */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input type="text" value={resourceSearch} onChange={e => setResourceSearch(e.target.value)}
                                placeholder="Search resources..."
                                className="w-full bg-slate-700/50 border border-slate-600/50 text-slate-200 placeholder-slate-500 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                        </div>
                        <select value={resourceSemFilter} onChange={e => setResourceSemFilter(e.target.value)}
                            className="bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors">
                            <option value="">All Sems</option>
                            {modules.map(s => <option key={s} value={String(s)}>Sem {s}</option>)}
                        </select>
                        <select value={resourceCatFilter} onChange={e => setResourceCatFilter(e.target.value)}
                            className="bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors">
                            <option value="">All Cats</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-700/30">
                    {loading ? (
                        [1,2,3,4,5].map(i => (
                            <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                                <div className="w-4 h-4 rounded bg-slate-700" />
                                <div className="w-9 h-9 rounded-lg bg-slate-700" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 bg-slate-700 rounded w-2/3" />
                                    <div className="h-3 bg-slate-700 rounded w-1/3" />
                                </div>
                            </div>
                        ))
                    ) : filteredResources.length === 0 ? (
                        <div className="py-16 text-center">
                            <HiOutlineDocumentText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm">No resources found</p>
                        </div>
                    ) : filteredResources.map(res => (
                        <div key={res.id}
                            className={`px-6 py-3.5 flex items-center gap-4 transition-colors group ${selectedResourceIds.includes(res.id) ? 'bg-indigo-500/10' : 'hover:bg-slate-700/30'}`}>
                            <input type="checkbox" checked={selectedResourceIds.includes(res.id)} onChange={() => toggleSelection(res.id)}
                                className="w-4 h-4 rounded accent-indigo-500 cursor-pointer flex-shrink-0" />
                            <div className="w-9 h-9 rounded-lg bg-slate-700/60 border border-slate-600/50 flex items-center justify-center flex-shrink-0">
                                <HiOutlineDocumentText className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-200 truncate">{res.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-slate-500">Sem {res.semester}</span>
                                    <span className="text-slate-700">·</span>
                                    <span className="text-xs text-indigo-400">{res.category}</span>
                                    {res.file_size && <><span className="text-slate-700">·</span><span className="text-xs text-slate-500">{formatFileSize(res.file_size)}</span></>}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {deleteConfirm === res.id ? (
                                    <>
                                        <button onClick={() => handleDeleteResource(res.id)} className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/40 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-colors">
                                            <HiOutlineExclamation className="w-3 h-3" /> Confirm
                                        </button>
                                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-slate-400 hover:text-slate-200 text-xs transition-colors">Cancel</button>
                                    </>
                                ) : (
                                    <button onClick={() => handleDeleteResource(res.id)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
                                        <HiOutlineTrash className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // ─── Render Videos ─────────────────────────────────────────────
    const renderVideos = () => (
        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">
            {/* Register Video */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                <SectionHeader title="Register Video" countColor="purple" />
                <div className="p-6">
                    <form onSubmit={handleVideoRegister} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Video Title</label>
                            <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} required
                                placeholder="e.g. Data Structures - Lecture 5"
                                className="w-full bg-slate-700/60 border border-slate-600 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Video URL</label>
                            <div className="relative">
                                <HiOutlineLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} required
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="w-full bg-slate-700/60 border border-slate-600 text-slate-200 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Subject</label>
                                <div className="relative">
                                    <HiOutlineTag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input type="text" value={videoSubject} onChange={e => setVideoSubject(e.target.value)} required
                                        placeholder="e.g. DSA"
                                        className="w-full bg-slate-700/60 border border-slate-600 text-slate-200 placeholder-slate-500 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Semester</label>
                                <select value={videoModule} onChange={e => setVideoModule(e.target.value)}
                                    className="w-full bg-slate-700/60 border border-slate-600 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors">
                                    {modules.map(s => <option key={s} value={s}>Semester {s}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Live thumbnail preview */}
                        {videoUrl && getYouTubeThumbnail(videoUrl) && (
                            <div className="rounded-xl overflow-hidden border border-slate-700/50">
                                <img src={getYouTubeThumbnail(videoUrl)} alt="Preview" className="w-full object-cover" />
                                <p className="text-xs text-emerald-400 font-semibold px-3 py-2 bg-emerald-500/10 flex items-center gap-1.5">
                                    <HiOutlineCheck className="w-3.5 h-3.5" /> YouTube thumbnail detected
                                </p>
                            </div>
                        )}

                        <button type="submit" disabled={registering}
                            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-all duration-200 text-sm disabled:cursor-not-allowed">
                            {registering ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registering...</>
                            ) : (
                                <><HiOutlineVideoCamera className="w-4 h-4" /> Register Video</>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Video Catalog */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="px-6 py-4 border-b border-slate-700/50 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Video Library</h3>
                        <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">{filteredVideos.length} / {videos.length}</span>
                    </div>
                    <div className="relative">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input type="text" value={videoSearch} onChange={e => setVideoSearch(e.target.value)}
                            placeholder="Search by title or subject..."
                            className="w-full bg-slate-700/50 border border-slate-600/50 text-slate-200 placeholder-slate-500 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors" />
                    </div>
                </div>
                <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-700/30">
                    {loading ? (
                        [1,2,3,4].map(i => (
                            <div key={i} className="p-4 flex gap-4 animate-pulse">
                                <div className="w-28 h-16 rounded-lg bg-slate-700 flex-shrink-0" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-3.5 bg-slate-700 rounded w-3/4" />
                                    <div className="h-3 bg-slate-700 rounded w-1/2" />
                                </div>
                            </div>
                        ))
                    ) : filteredVideos.length === 0 ? (
                        <div className="py-16 text-center">
                            <HiOutlineVideoCamera className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm">No videos found</p>
                        </div>
                    ) : filteredVideos.map(vid => {
                        const thumb = getYouTubeThumbnail(vid.url);
                        const charCode = (vid.title || 'V').charCodeAt(0);
                        return (
                            <div key={vid.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-700/30 transition-colors group">
                                <div className="w-28 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700/50">
                                    {thumb ? (
                                        <img src={thumb} alt={vid.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"
                                            style={{ background: `linear-gradient(135deg, hsl(${charCode * 25 % 360}, 70%, 50%), hsl(${(charCode * 25 + 40) % 360}, 80%, 35%))` }}>
                                            <HiOutlinePlay className="w-5 h-5 text-white drop-shadow" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-200 line-clamp-2 leading-snug">{vid.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-purple-400 font-medium">{vid.subject}</span>
                                        <span className="text-slate-700">·</span>
                                        <span className="text-xs text-slate-500">Semester {vid.semester}</span>
                                        <span className="text-slate-700">·</span>
                                        <span className="text-xs text-slate-600">{formatDate(vid.created_at)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {videoDeleteConfirm === vid.id ? (
                                        <>
                                            <button onClick={() => handleDeleteVideo(vid.id)} className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/40 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-colors">
                                                <HiOutlineExclamation className="w-3 h-3" /> Confirm
                                            </button>
                                            <button onClick={() => setVideoDeleteConfirm(null)} className="px-2 py-1 text-slate-400 hover:text-slate-200 text-xs transition-colors">Cancel</button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleDeleteVideo(vid.id)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
                                            <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    // ─── Page Shell ────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-900 -m-4 md:-m-8 px-4 md:px-8 pb-16">
            {/* Header */}
            <div className="relative overflow-hidden border-b border-slate-700/50 px-0 py-10 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-transparent" />
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">System Online</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                            Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Dashboard</span>
                        </h1>
                        <p className="text-slate-400 mt-2 text-sm">NodeShare Academic Repository · Control Panel</p>
                    </div>
                    <button onClick={fetchData} disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:border-slate-500 transition-all text-sm font-semibold self-start md:self-auto">
                        <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-1.5 mb-8 w-fit backdrop-blur-sm">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                            ${activeTab === id
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}>
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="page-enter">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'resources' && renderResources()}
                {activeTab === 'videos' && renderVideos()}
            </div>
        </div>
    );
}