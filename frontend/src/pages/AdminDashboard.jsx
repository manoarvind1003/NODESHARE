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
    HiOutlineCollection,
    HiOutlinePlay,
    HiOutlineLightningBolt,
    HiOutlineExclamation,
    HiOutlinePencil,
    HiOutlineDotsVertical,
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
    const colorStyles = {
        indigo: 'from-indigo-500/10 to-indigo-500/0 text-indigo-600 bg-indigo-50 border-indigo-100 hover:border-indigo-200',
        purple: 'from-purple-500/10 to-purple-500/0 text-purple-600 bg-purple-50 border-purple-100 hover:border-purple-200',
        emerald: 'from-emerald-500/10 to-emerald-500/0 text-emerald-600 bg-emerald-50 border-emerald-100 hover:border-emerald-200',
        amber: 'from-amber-500/10 to-amber-500/0 text-amber-600 bg-amber-50 border-amber-100 hover:border-amber-200',
    };

    return (
        <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 border border-slate-200/80 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
            <div className={`absolute inset-0 bg-gradient-to-br ${colorStyles[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="text-3xl font-extrabold text-slate-800 mt-2">
                        {loading ? <span className="inline-block w-16 h-8 bg-slate-100 rounded animate-pulse" /> : value}
                    </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorStyles[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}

function SectionHeader({ title, count, countColor = 'indigo' }) {
    const colorMap = { 
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100', 
        purple: 'text-purple-600 bg-purple-50 border-purple-100', 
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100' 
    };
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
            {count !== undefined && (
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${colorMap[countColor]}`}>{count}</span>
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
    
    // Delete states
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [videoDeleteConfirm, setVideoDeleteConfirm] = useState(null);

    // Edit Modal State (Resource & Video)
    const [editingResource, setEditingResource] = useState(null);
    const [editingVideo, setEditingVideo] = useState(null);

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

    // ── Update Handlers ──────────────────────────────────────────
    const handleUpdateResource = async (e) => {
        e.preventDefault();
        if (!editingResource) return;
        try {
            const res = await fetch(`${API_URL}/api/resources/${editingResource.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editingResource.title,
                    semester: editingResource.semester,
                    category: editingResource.category
                })
            });
            if (!res.ok) throw new Error();
            toast.success('Resource updated');
            setEditingResource(null);
            fetchData();
        } catch { toast.error('Failed to update resource'); }
    };

    const handleUpdateVideo = async (e) => {
        e.preventDefault();
        if (!editingVideo) return;
        try {
            const res = await fetch(`${API_URL}/api/videos/${editingVideo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editingVideo.title,
                    url: editingVideo.url,
                    subject: editingVideo.subject,
                    semester: editingVideo.semester
                })
            });
            if (!res.ok) throw new Error();
            toast.success('Video details updated');
            setEditingVideo(null);
            fetchData();
        } catch { toast.error('Failed to update video'); }
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
                <div className="bg-white/80 border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm backdrop-blur-md">
                    <SectionHeader title="Recent Uploads" count={recentResources.length} countColor="indigo" />
                    <div className="divide-y divide-slate-100">
                        {loading ? (
                            [1,2,3].map(i => <div key={i} className="p-4 flex gap-3 animate-pulse"><div className="w-8 h-8 rounded-lg bg-slate-100" /><div className="flex-1 space-y-2"><div className="h-3 bg-slate-100 rounded w-3/4" /><div className="h-3 bg-slate-100 rounded w-1/2" /></div></div>)
                        ) : recentResources.length === 0 ? (
                            <p className="text-slate-400 text-sm text-center py-8">No resources yet</p>
                        ) : recentResources.map(r => (
                            <div key={r.id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-slate-50/80 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                                    <HiOutlineDocumentText className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                                    <p className="text-xs text-slate-400">Sem {r.semester} · {r.category}</p>
                                </div>
                                <span className="text-xs text-slate-400 shrink-0">{formatDate(r.created_at)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Videos */}
                <div className="bg-white/80 border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm backdrop-blur-md">
                    <SectionHeader title="Recent Videos" count={recentVideos.length} countColor="purple" />
                    <div className="divide-y divide-slate-100">
                        {loading ? (
                            [1,2,3].map(i => <div key={i} className="p-4 flex gap-3 animate-pulse"><div className="w-16 h-10 rounded-lg bg-slate-100" /><div className="flex-1 space-y-2"><div className="h-3 bg-slate-100 rounded w-3/4" /><div className="h-3 bg-slate-100 rounded w-1/2" /></div></div>)
                        ) : recentVideos.length === 0 ? (
                            <p className="text-slate-400 text-sm text-center py-8">No videos yet</p>
                        ) : recentVideos.map(v => {
                            const thumb = getYouTubeThumbnail(v.url);
                            return (
                                <div key={v.id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-slate-50/80 transition-colors">
                                    <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200/60">
                                        {thumb ? <img src={thumb} alt={v.title} className="w-full h-full object-cover" /> : (
                                            <div className="w-full h-full flex items-center justify-center"
                                                style={{ background: `linear-gradient(135deg, hsl(${(v.title || 'V').charCodeAt(0) * 25 % 360}, 80%, 85%), hsl(${(v.title || 'V').charCodeAt(0) * 25 % 360 + 40}, 80%, 75%))` }}>
                                                <HiOutlinePlay className="w-4 h-4 text-slate-700" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{v.title}</p>
                                        <p className="text-xs text-slate-400">Sem {v.semester} · {v.subject}</p>
                                    </div>
                                    <span className="text-xs text-slate-400 shrink-0">{formatDate(v.created_at)}</span>
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
            <div className="bg-white/80 border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm backdrop-blur-md">
                <SectionHeader title="Upload Files" countColor="indigo" />
                <div className="p-6 space-y-5">
                    <form onSubmit={handleBulkUpload} className="space-y-5">
                        <div
                            {...getRootProps()}
                            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
                                ${isDragActive ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
                                : selectedFiles.length > 0 ? 'border-emerald-500/60 bg-emerald-50/40'
                                : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/80'}`}
                        >
                            <input {...getInputProps()} />
                            {isDragActive ? (
                                <div className="space-y-2">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center mx-auto animate-bounce">
                                        <HiOutlineCloudUpload className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <p className="text-indigo-600 font-bold text-sm">Drop files here!</p>
                                </div>
                            ) : selectedFiles.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto">
                                        <HiOutlineCheck className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <p className="text-emerald-700 font-bold text-sm">{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} staged</p>
                                    <div className="max-h-36 overflow-y-auto space-y-1.5 text-left">
                                        {selectedFiles.map(f => {
                                            const fileId = `${f.name}-${f.size}`;
                                            const status = uploadProgress[fileId];
                                            return (
                                                <div key={fileId} className="flex items-center justify-between bg-white/80 border border-slate-200/60 rounded-lg px-3 py-2">
                                                    <span className="text-xs font-medium text-slate-700 truncate max-w-[180px]">{f.name}</span>
                                                    {status === 'uploading' && <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                                                    {status === 'done' && <HiOutlineCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                                                    {status === 'error' && <HiOutlineX className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button type="button" onClick={e => { e.stopPropagation(); setSelectedFiles([]); setUploadProgress({}); }}
                                        className="text-xs text-red-500 hover:text-red-600 font-semibold transition-colors">
                                        Clear all files
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/60 flex items-center justify-center mx-auto">
                                        <HiOutlineCloudUpload className="w-6 h-6 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-slate-700 font-semibold text-sm">Drag & drop files here</p>
                                        <p className="text-slate-400 text-xs mt-1">or click to browse · PDF, DOCX, PPTX, XLSX, ZIP</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Semester</label>
                                <select value={moduleId} onChange={e => setModuleId(e.target.value)}
                                    className="w-full bg-slate-50/80 border border-slate-200 text-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                                    {modules.map(s => <option key={s} value={s}>Semester {s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Category</label>
                                <select value={category} onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-slate-50/80 border border-slate-200 text-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <button type="submit" disabled={uploading || !selectedFiles.length}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl shadow-md shadow-indigo-500/15 transition-all text-sm disabled:cursor-not-allowed">
                            {uploading ? (
                                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Uploading...</>
                            ) : (
                                <><HiOutlineLightningBolt className="w-4 h-4" /> Upload {selectedFiles.length > 0 ? `${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}` : 'Files'}</>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Resources Catalog */}
            <div className="bg-white/80 border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm backdrop-blur-md">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resource Catalog</h3>
                        <div className="flex items-center gap-2">
                            {selectedResourceIds.length > 0 && (
                                <button onClick={handleBulkDelete}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                                    <HiOutlineTrash className="w-3.5 h-3.5" />
                                    Delete {selectedResourceIds.length}
                                </button>
                            )}
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">{filteredResources.length} / {resources.length}</span>
                        </div>
                    </div>
                    {/* Filters */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" value={resourceSearch} onChange={e => setResourceSearch(e.target.value)}
                                placeholder="Search resources..."
                                className="w-full bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
                        </div>
                        <select value={resourceSemFilter} onChange={e => setResourceSemFilter(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all">
                            <option value="">All Sems</option>
                            {modules.map(s => <option key={s} value={String(s)}>Sem {s}</option>)}
                        </select>
                        <select value={resourceCatFilter} onChange={e => setResourceCatFilter(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all">
                            <option value="">All Cats</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-100">
                    {loading ? (
                        [1,2,3,4,5].map(i => (
                            <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                                <div className="w-4 h-4 rounded bg-slate-100" />
                                <div className="w-9 h-9 rounded-lg bg-slate-100" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 bg-slate-100 rounded w-2/3" />
                                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                                </div>
                            </div>
                        ))
                    ) : filteredResources.length === 0 ? (
                        <div className="py-16 text-center">
                            <HiOutlineDocumentText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No resources found</p>
                        </div>
                    ) : filteredResources.map(res => (
                        <div key={res.id}
                            className={`px-6 py-3.5 flex items-center gap-4 transition-colors group ${selectedResourceIds.includes(res.id) ? 'bg-indigo-50/60' : 'hover:bg-slate-50/80'}`}>
                            <input type="checkbox" checked={selectedResourceIds.includes(res.id)} onChange={() => toggleSelection(res.id)}
                                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer flex-shrink-0" />
                            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center flex-shrink-0">
                                <HiOutlineDocumentText className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{res.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-slate-400">Sem {res.semester}</span>
                                    <span className="text-slate-300">·</span>
                                    <span className="text-xs text-indigo-600 font-medium">{res.category}</span>
                                    {res.file_size && <><span className="text-slate-300">·</span><span className="text-xs text-slate-400">{formatFileSize(res.file_size)}</span></>}
                                </div>
                            </div>

                            {/* Options & Action Controls */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingResource(res)} 
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Edit & Rename">
                                    <HiOutlinePencil className="w-4 h-4" />
                                </button>
                                {deleteConfirm === res.id ? (
                                    <>
                                        <button onClick={() => handleDeleteResource(res.id)} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                                            <HiOutlineExclamation className="w-3 h-3" /> Confirm
                                        </button>
                                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs transition-colors">Cancel</button>
                                    </>
                                ) : (
                                    <button onClick={() => handleDeleteResource(res.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50" title="Delete">
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
            <div className="bg-white/80 border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm backdrop-blur-md">
                <SectionHeader title="Register Video" countColor="purple" />
                <div className="p-6">
                    <form onSubmit={handleVideoRegister} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Video Title</label>
                            <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} required
                                placeholder="e.g. Data Structures - Lecture 5"
                                className="w-full bg-slate-50/80 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Video URL</label>
                            <div className="relative">
                                <HiOutlineLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} required
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="w-full bg-slate-50/80 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-all" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Subject</label>
                                <div className="relative">
                                    <HiOutlineTag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="text" value={videoSubject} onChange={e => setVideoSubject(e.target.value)} required
                                        placeholder="e.g. DSA"
                                        className="w-full bg-slate-50/80 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Semester</label>
                                <select value={videoModule} onChange={e => setVideoModule(e.target.value)}
                                    className="w-full bg-slate-50/80 border border-slate-200 text-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-all">
                                    {modules.map(s => <option key={s} value={s}>Semester {s}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Live thumbnail preview */}
                        {videoUrl && getYouTubeThumbnail(videoUrl) && (
                            <div className="rounded-xl overflow-hidden border border-emerald-200/80 bg-emerald-50/30">
                                <img src={getYouTubeThumbnail(videoUrl)} alt="Preview" className="w-full object-cover" />
                                <p className="text-xs text-emerald-700 font-semibold px-3 py-2 flex items-center gap-1.5">
                                    <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-600" /> YouTube thumbnail detected
                                </p>
                            </div>
                        )}

                        <button type="submit" disabled={registering}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-200 disabled:to-slate-200 text-white font-bold py-3 rounded-xl shadow-md shadow-purple-500/15 transition-all text-sm disabled:cursor-not-allowed">
                            {registering ? (
                                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Registering...</>
                            ) : (
                                <><HiOutlineVideoCamera className="w-4 h-4" /> Register Video</>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Video Catalog */}
            <div className="bg-white/80 border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm backdrop-blur-md">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Video Library</h3>
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full">{filteredVideos.length} / {videos.length}</span>
                    </div>
                    <div className="relative">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={videoSearch} onChange={e => setVideoSearch(e.target.value)}
                            placeholder="Search by title or subject..."
                            className="w-full bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-all" />
                    </div>
                </div>
                <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-100">
                    {loading ? (
                        [1,2,3,4].map(i => (
                            <div key={i} className="p-4 flex gap-4 animate-pulse">
                                <div className="w-28 h-16 rounded-lg bg-slate-100 flex-shrink-0" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                                </div>
                            </div>
                        ))
                    ) : filteredVideos.length === 0 ? (
                        <div className="py-16 text-center">
                            <HiOutlineVideoCamera className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No videos found</p>
                        </div>
                    ) : filteredVideos.map(vid => {
                        const thumb = getYouTubeThumbnail(vid.url);
                        const charCode = (vid.title || 'V').charCodeAt(0);
                        return (
                            <div key={vid.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/80 transition-colors group">
                                <div className="w-28 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200/80">
                                    {thumb ? (
                                        <img src={thumb} alt={vid.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"
                                            style={{ background: `linear-gradient(135deg, hsl(${charCode * 25 % 360}, 80%, 85%), hsl(${(charCode * 25 + 40) % 360}, 80%, 75%))` }}>
                                            <HiOutlinePlay className="w-5 h-5 text-slate-700" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">{vid.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-purple-600 font-medium">{vid.subject}</span>
                                        <span className="text-slate-300">·</span>
                                        <span className="text-xs text-slate-400">Semester {vid.semester}</span>
                                        <span className="text-slate-300">·</span>
                                        <span className="text-xs text-slate-400">{formatDate(vid.created_at)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingVideo(vid)} 
                                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                        title="Edit Video Details">
                                        <HiOutlinePencil className="w-4 h-4" />
                                    </button>
                                    {videoDeleteConfirm === vid.id ? (
                                        <>
                                            <button onClick={() => handleDeleteVideo(vid.id)} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                                                <HiOutlineExclamation className="w-3 h-3" /> Confirm
                                            </button>
                                            <button onClick={() => setVideoDeleteConfirm(null)} className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs transition-colors">Cancel</button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleDeleteVideo(vid.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50" title="Delete Video">
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

    // ─── Modals for Rename / Edit ──────────────────────────────────
    const renderModals = () => (
        <>
            {/* Resource Edit Modal */}
            {editingResource && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-base">Edit & Rename Resource</h3>
                            <button onClick={() => setEditingResource(null)} className="text-slate-400 hover:text-slate-600">
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateResource} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Resource Title</label>
                                <input type="text" value={editingResource.title} 
                                    onChange={e => setEditingResource({ ...editingResource, title: e.target.value })} required
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Semester</label>
                                    <select value={editingResource.semester} 
                                        onChange={e => setEditingResource({ ...editingResource, semester: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                                        {modules.map(s => <option key={s} value={s}>Semester {s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Category</label>
                                    <select value={editingResource.category} 
                                        onChange={e => setEditingResource({ ...editingResource, category: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setEditingResource(null)} 
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm">
                                    Cancel
                                </button>
                                <button type="submit" 
                                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-500/10">
                                    Update Details
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Video Edit Modal */}
            {editingVideo && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-base">Edit Video Registration</h3>
                            <button onClick={() => setEditingVideo(null)} className="text-slate-400 hover:text-slate-600">
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateVideo} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Video Title</label>
                                <input type="text" value={editingVideo.title} 
                                    onChange={e => setEditingVideo({ ...editingVideo, title: e.target.value })} required
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Video URL</label>
                                <input type="url" value={editingVideo.url} 
                                    onChange={e => setEditingVideo({ ...editingVideo, url: e.target.value })} required
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Subject</label>
                                    <input type="text" value={editingVideo.subject} 
                                        onChange={e => setEditingVideo({ ...editingVideo, subject: e.target.value })} required
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Semester</label>
                                    <select value={editingVideo.semester} 
                                        onChange={e => setEditingVideo({ ...editingVideo, semester: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-purple-500">
                                        {modules.map(s => <option key={s} value={s}>Semester {s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setEditingVideo(null)} 
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm">
                                    Cancel
                                </button>
                                <button type="submit" 
                                    className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-purple-500/10">
                                    Update Video
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );

    // ─── Page Shell ────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-slate-50/50 to-purple-50/50 -m-4 md:-m-8 px-4 md:px-8 pb-16">
            {/* Header */}
            <div className="relative overflow-hidden border-b border-slate-200/80 px-0 py-10 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-300/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">System Online</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                            Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Dashboard</span>
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">NodeShare Academic Repository · Control Panel</p>
                    </div>
                    <button onClick={fetchData} disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-slate-700 hover:text-indigo-600 hover:border-slate-300 shadow-2xs hover:shadow-sm transition-all text-sm font-semibold self-start md:self-auto">
                        <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex items-center gap-1 bg-white/80 border border-slate-200/80 rounded-2xl p-1.5 mb-8 w-fit shadow-xs backdrop-blur-md">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                            ${activeTab === id
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'}`}>
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

            {/* Render Modals */}
            {renderModals()}
        </div>
    );
}