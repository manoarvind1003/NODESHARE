import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { SkeletonGrid } from '../components/SkeletonCard';
import {
  HiOutlineSearch,
  HiOutlineDownload,
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineFolder,
  HiOutlineEye,
  HiX,
  HiOutlineFilter,
  HiOutlineSparkles,
  HiOutlineAcademicCap
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const API_URL = '';

const semesterNames = {
  1: 'First', 2: 'Second', 3: 'Third', 4: 'Fourth',
  5: 'Fifth', 6: 'Sixth'
};

const categories = [
  'All', 'Notes', 'Practical', 'Assignment', 
  'Case Studies', 'Question Papers', 'Reference Material', 'Datasets'
];

function formatFileSize(bytes) {
  if (!bytes) return '—';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(dateStr) {
  if (!dateStr) return 'Recently';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function getSubject(filename, fallbackCategory) {
  if (!filename) return fallbackCategory || 'General';
  if (filename.includes('_')) {
    return filename.split('_')[0].trim();
  }
  return fallbackCategory || 'General';
}

function getFileExtensionBadge(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase() || 'file';
  
  const styles = {
    pdf: 'bg-rose-50/80 text-rose-600 border-rose-200/60',
    doc: 'bg-blue-50/80 text-blue-600 border-blue-200/60',
    docx: 'bg-blue-50/80 text-blue-600 border-blue-200/60',
    zip: 'bg-amber-50/80 text-amber-600 border-amber-200/60',
    rar: 'bg-amber-50/80 text-amber-600 border-amber-200/60',
    py: 'bg-emerald-50/80 text-emerald-600 border-emerald-200/60',
    js: 'bg-amber-50/80 text-amber-700 border-amber-200/60',
  };

  return (
    <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md border ${styles[ext] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      .{ext}
    </span>
  );
}

export default function SemesterPage() {
  const { semesterId } = useParams();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [downloading, setDownloading] = useState(null);
  const [previewing, setPreviewing] = useState(null);

  useEffect(() => {
    fetchResources();
  }, [semesterId]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resources?semester=${semesterId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setResources(data);
    } catch (err) {
      toast.error('Failed to load resources');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resource) => {
    setDownloading(resource.id);
    try {
      const res = await fetch(`/api/resources/download/${resource.id}`);
      if (!res.ok) throw new Error('Failed to get download URL');
      const { url, fileName } = await res.json();

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloading ${fileName || resource.title}`);
    } catch (err) {
      toast.error('Download failed');
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  const handleView = async (resource) => {
    setPreviewing(resource.id);
    try {
      const res = await fetch(`${API_URL}/api/resources/download/${resource.id}`);
      if (!res.ok) throw new Error('Failed to get view URL');
      const { url } = await res.json();
      window.open(url, '_blank');
    } catch (err) {
      toast.error('Preview failed');
      console.error(err);
    } finally {
      setPreviewing(null);
    }
  };

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        r.title?.toLowerCase().includes(query) ||
        r.category?.toLowerCase().includes(query) ||
        r.file_name?.toLowerCase().includes(query);
      const matchesCategory = activeCategory === 'All' || r.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [resources, search, activeCategory]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc, resource) => {
      const subject = getSubject(resource.file_name, resource.category);
      if (!acc[subject]) acc[subject] = [];
      acc[subject].push(resource);
      return acc;
    }, {});
  }, [filtered]);

  const sortedSubjects = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  const clearFilters = () => {
    setSearch('');
    setActiveCategory('All');
  };

  return (
    <div className="relative min-h-screen bg-slate-50/50 pb-20 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Background Soft Mesh Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Bento Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Title & Info Card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 p-6 sm:p-8 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100/50 via-purple-100/30 to-rose-100/40 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold mb-4 shadow-sm">
              <HiOutlineSparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              Academic Repository
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              {semesterNames[semesterId] || `Semester ${semesterId}`}{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Semester
              </span>
            </h1>
            
            <p className="text-slate-600 mt-2 font-medium text-sm sm:text-base leading-relaxed">
              {loading 
                ? 'Indexing repository assets...' 
                : `${filtered.length} verified asset${filtered.length !== 1 ? 's' : ''} organized across ${sortedSubjects.length} subject areas.`
              }
            </p>
          </div>

          <div className="mt-6 flex items-center gap-4 text-xs text-slate-500 font-semibold pt-4 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <HiOutlineAcademicCap className="w-4 h-4 text-indigo-500" />
              Semester ID: #{semesterId}
            </span>
            <span>•</span>
            <span className="text-slate-400">Auto-synced Resources</span>
          </div>
        </div>

        {/* Search Control Bento Card (Vibrant Light Gradient) */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 sm:p-8 shadow-xl shadow-indigo-500/20 flex flex-col justify-center relative overflow-hidden border border-indigo-400/30">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-8 -top-8 w-32 h-32 bg-purple-400/20 rounded-full blur-lg pointer-events-none" />
          
          <label htmlFor="search-resources" className="block text-xs font-bold uppercase tracking-wider text-indigo-100 mb-2">
            Search Repository
          </label>
          
          <div className="relative group">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-200 group-focus-within:text-white transition-colors" />
            <input
              id="search-resources"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title or file name..."
              className="w-full bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl py-3 pl-11 pr-10 text-sm text-white placeholder-indigo-100/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-200 hover:text-white p-1 rounded-md transition-colors"
              >
                <HiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Horizontal List */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          <HiOutlineFilter className="w-4 h-4 text-indigo-500" /> Filter Categories
        </div>
        
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none pt-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2 border ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-lg shadow-indigo-500/25 scale-[1.02]'
                    : 'bg-white/80 backdrop-blur-md text-slate-600 border-white/80 hover:bg-white hover:border-slate-200 hover:shadow-sm'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : filtered.length === 0 ? (
        /* Empty State Card */
        <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xl shadow-slate-200/50 my-12">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-500 shadow-inner">
            <HiOutlineFolder className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No resources found</h3>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            {search || activeCategory !== 'All'
              ? 'Try tweaking your search term or active category filters.'
              : 'There are currently no files uploaded for this semester.'}
          </p>
          {(search || activeCategory !== 'All') && (
            <button
              onClick={clearFilters}
              className="mt-6 px-5 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 hover:from-indigo-100 hover:to-purple-100 border border-indigo-100 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* Subject Group Sections */
        <div className="space-y-12">
          {sortedSubjects.map((subject) => (
            <div key={subject} className="space-y-5">
              
              {/* Subject Divider Header with Gradient Badge */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-widest bg-white/80 backdrop-blur-md border border-indigo-100/80 shadow-sm px-3.5 py-1.5 rounded-xl">
                  {subject}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  ({grouped[subject].length})
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-200/80 via-slate-200/40 to-transparent" />
              </div>

              {/* Resource Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {grouped[subject].map((resource) => (
                  <div
                    key={resource.id}
                    className="group bg-white/80 backdrop-blur-xl rounded-3xl border border-white/80 p-5 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                            <HiOutlineDocumentText className="w-5 h-5" />
                          </div>
                          {getFileExtensionBadge(resource.file_name)}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleView(resource)}
                            disabled={previewing === resource.id}
                            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl transition-colors disabled:opacity-50"
                            title="Preview file"
                          >
                            {previewing === resource.id ? (
                              <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <HiOutlineEye className="w-4 h-4" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleDownload(resource)}
                            disabled={downloading === resource.id}
                            className="p-2 text-indigo-600 bg-indigo-50/80 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:text-white rounded-xl transition-all shadow-sm disabled:opacity-50"
                            title="Download file"
                          >
                            {downloading === resource.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <HiOutlineDownload className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Content Title */}
                      <h3 className="text-base font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {resource.title}
                      </h3>

                      {/* Metadata Chips */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-slate-100/80 text-slate-600 text-[11px] font-semibold rounded-lg border border-slate-200/50">
                          {formatFileSize(resource.file_size)}
                        </span>
                        {resource.category && (
                          <span className="px-2.5 py-0.5 bg-slate-100/80 text-slate-600 text-[11px] font-semibold rounded-lg border border-slate-200/50">
                            {resource.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Metadata Footer */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <HiOutlineCalendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(resource.created_at)}
                      </div>
                      <span className="text-slate-400 truncate max-w-[120px]" title={resource.file_name}>
                        {resource.file_name}
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}