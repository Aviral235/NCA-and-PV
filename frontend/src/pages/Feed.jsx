import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Compass, Search, ExternalLink, LineChart, Loader2, Sparkles, AlertCircle } from 'lucide-react';

const CATEGORIES = [
    { label: 'All', value: 'all' },
    { label: 'Technology', value: 'technology' },
    { label: 'Science', value: 'science' },
    { label: 'Business', value: 'business' },
    { label: 'World', value: 'world' },
    { label: 'Politics', value: 'politics' }
];

const Feed = () => {
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

    const observer = useRef();

    // Show Toast Helper
    const triggerToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
    };

    // Load articles from backend
    const fetchArticles = useCallback(async (page, category, append = true) => {
        setIsLoading(true);
        try {
            const res = await api.get(`/api/news?page=${page}&limit=6&category=${category}`);
            if (res.data && res.data.success) {
                const newArticles = res.data.articles || [];
                
                if (append) {
                    setArticles(prev => {
                        // De-duplicate by title
                        const merged = [...prev, ...newArticles];
                        const seenTitles = new Set();
                        return merged.filter(a => {
                            const cleanTitle = a.title.toLowerCase().trim();
                            if (seenTitles.has(cleanTitle)) return false;
                            seenTitles.add(cleanTitle);
                            return true;
                        });
                    });
                } else {
                    setArticles(newArticles);
                }

                if (res.data.nextPage) {
                    setCurrentPage(res.data.nextPage);
                    setHasMore(true);
                } else {
                    setHasMore(false);
                }
            } else {
                throw new Error('Failed to load feed');
            }
        } catch (err) {
            console.error('Error fetching articles:', err);
            triggerToast('Could not load news feed. Please try again later.', 'error');
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch new category feed
    useEffect(() => {
        setArticles([]);
        setCurrentPage(1);
        setHasMore(true);
        fetchArticles(1, activeCategory, false);
    }, [activeCategory, fetchArticles]);

    // Intersection Observer callback to load more on scroll
    const lastArticleElementRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchArticles(currentPage, activeCategory, true);
            }
        }, {
            rootMargin: '150px'
        });
        
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore, currentPage, activeCategory, fetchArticles]);

    // Seeding detailed view workflow
    const handleViewAnalysis = async (articleUrl) => {
        setSeeding(true);
        try {
            const res = await api.post('/api/analyze/initialize', { url: articleUrl });
            if (res.data && res.data.success && res.data.id) {
                navigate(`/dashboard?id=${res.data.id}`);
            } else {
                throw new Error(res.data?.error || 'Database seeding failed.');
            }
        } catch (err) {
            console.error('Seeding analysis failed:', err);
            triggerToast(err.response?.data?.error || err.message || 'Failed to fetch full-text and run analytics.', 'error');
            setSeeding(false);
        }
    };

    // Clean description helper
    const cleanDescription = (text) => {
        if (!text) return '';
        return text
            .replace(/<\/?[^>]+(>|$)/g, "") // Strip HTML
            .replace(/\s+/g, " ")            // Normalize spaces
            .trim();
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                        <Compass className="w-4 h-4" /> Discovery Hub
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 light:text-slate-900">Trending Global Stories</h1>
                    <p className="text-slate-400 text-sm max-w-lg">
                        Select a category to view live authenticated web news. Click any article to initialize a full credibility analysis report.
                    </p>
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-3 overflow-x-auto pb-4 mb-8 no-scrollbar -mx-6 px-6">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => setActiveCategory(cat.value)}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border shrink-0 ${
                            activeCategory === cat.value
                                ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Articles Grid */}
            {articles.length === 0 && !isLoading ? (
                <div className="glassmorphism rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                    <Compass className="w-12 h-12 text-slate-600 animate-pulse" />
                    <h3 className="font-semibold text-slate-300">No Articles Found</h3>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                        There are no live articles available in this category. Please check again later.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map((article, idx) => {
                        const date = new Date(article.publishedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        const cleanedDesc = cleanDescription(article.description) || "No description provided for this trending story. Click Quick Analyze to read more.";
                        const isLastElement = idx === articles.length - 1;

                        return (
                            <div 
                                key={article.url + idx}
                                ref={isLastElement ? lastArticleElementRef : null}
                                className="glassmorphism bento-card rounded-3xl overflow-hidden flex flex-col justify-between h-full group"
                            >
                                <div 
                                    className="relative overflow-hidden cursor-pointer"
                                    onClick={() => handleViewAnalysis(article.url)}
                                >
                                    <img 
                                        src={article.imageUrl} 
                                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            e.target.src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80";
                                        }}
                                        alt="News Card Image"
                                    />
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest bg-slate-950/80 backdrop-blur-md text-cyan-400 rounded-full border border-cyan-500/20">
                                            {article.sourceName}
                                        </span>
                                        <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest bg-slate-950/80 backdrop-blur-md text-violet-400 rounded-full border border-violet-500/20">
                                            {article.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                                    <div className="space-y-2.5">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{date}</div>
                                        <h3 
                                            className="font-bold text-base leading-snug line-clamp-2 text-slate-100 group-hover:text-cyan-400 transition-colors cursor-pointer"
                                            onClick={() => handleViewAnalysis(article.url)}
                                        >
                                            {article.title}
                                        </h3>
                                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                                            {cleanedDesc}
                                        </p>
                                    </div>

                                    <div className="pt-2 flex items-center justify-between border-t border-slate-900/60 dark:border-slate-800/40 gap-2">
                                        <a 
                                            href={article.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-xs font-semibold text-slate-500 hover:text-slate-350 transition-colors shrink-0 flex items-center gap-1"
                                        >
                                            <span>Read Original</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                        <button 
                                            onClick={() => handleViewAnalysis(article.url)} 
                                            className="px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 hover:from-cyan-500 hover:to-violet-500 text-cyan-400 hover:text-slate-950 border border-cyan-500/20 hover:border-transparent rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                        >
                                            <span>Read Full Analysis</span>
                                            <LineChart className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Spinner Loader */}
            {isLoading && (
                <div className="w-full py-12 flex flex-col justify-center items-center gap-3">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                    <span className="text-xs text-slate-400 font-semibold animate-pulse">Loading more trending stories...</span>
                </div>
            )}

            {/* Catch Up Message */}
            {!hasMore && articles.length > 0 && (
                <div className="text-center text-xs font-semibold text-slate-500 py-12 tracking-wide">
                    ✨ You've caught up with all the news.
                </div>
            )}

            {/* Seeding Diagnostic Loading Overlay */}
            {seeding && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-4">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <Loader2 className="w-full h-full text-cyan-500 animate-spin" />
                        <Sparkles className="w-6 h-6 text-cyan-400 absolute animate-pulse" />
                    </div>
                    <div className="text-center space-y-1.5">
                        <h4 className="font-bold text-slate-100 tracking-tight text-base">Running credibility diagnostics...</h4>
                        <p className="text-[11px] text-slate-400 max-w-xs px-6 leading-relaxed">
                            Extracting clean full-text from the publication source and preparing bento analytics dashboard.
                        </p>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            {toast.show && (
                <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 p-4 rounded-2xl border shadow-2xl glassmorphism pointer-events-auto transition-all duration-300 max-w-sm">
                    <AlertCircle className={`w-5 h-5 shrink-0 ${toast.type === 'error' ? 'text-rose-450' : 'text-cyan-450'}`} />
                    <span className="text-xs font-semibold leading-relaxed text-slate-200">{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default Feed;
