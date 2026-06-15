import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { 
    AlignLeft, Link2, Play, ShieldAlert, ShieldCheck, 
    HelpCircle, Eye, EyeOff, Clipboard, Sparkles, Loader2 
} from 'lucide-react';

const LOADING_TEXTS = [
    "Scanning for bias leans...",
    "Analyzing vocabulary patterns...",
    "Cross-referencing publisher source...",
    "Calculating clickbait sensationalism...",
    "Generating NLP extractive summary...",
    "Detecting content toxicity & profanity..."
];

const Dashboard = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const articleIdParam = searchParams.get('id');
    const analyzeUrlParam = searchParams.get('analyzeUrl');

    const [currentTab, setCurrentTab] = useState('text');
    const [rawText, setRawText] = useState('');
    const [articleUrl, setArticleUrl] = useState('');
    const [readSafeMode, setReadSafeMode] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0]);
    const [results, setResults] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [savedId, setSavedId] = useState(null);

    // Latest News state
    const [newsArticles, setNewsArticles] = useState([]);
    const [visibleCount, setVisibleCount] = useState(6);
    const [fetchingNews, setFetchingNews] = useState(false);

    // Helper for showing toast
    const triggerToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
    };

    // Cycle status texts when analyzing
    useEffect(() => {
        if (!analyzing) return;
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % LOADING_TEXTS.length;
            setLoadingText(LOADING_TEXTS[index]);
        }, 1800);
        return () => clearInterval(interval);
    }, [analyzing]);

    // Fetch trending headlines
    const fetchLatestNews = async () => {
        setFetchingNews(true);
        try {
            const res = await api.get('/api/news');
            if (res.data && res.data.articles) {
                setNewsArticles(res.data.articles);
            }
        } catch (err) {
            console.error('Failed to load news headlines', err);
        } finally {
            setFetchingNews(false);
        }
    };

    // Load details of an existing analysis by ID
    const loadArticleDetails = async (id) => {
        setAnalyzing(true);
        setResults(null);
        try {
            const res = await api.get(`/api/analysis/${id}`);
            if (res.data && res.data.success && res.data.report) {
                const report = res.data.report;
                setSavedId(report._id);
                setResults(mapDocToData(report));
            } else {
                throw new Error(res.data?.error || 'Failed to load report.');
            }
        } catch (err) {
            console.error(err);
            triggerToast(err.response?.data?.error || 'Failed to fetch article details.', 'error');
        } finally {
            setAnalyzing(false);
        }
    };

    // Map database document structure to frontend layout model
    const mapDocToData = (report) => {
        return {
            inputType: report.inputType,
            inputSource: report.inputSource,
            textContent: report.textContent,
            headline: report.headline,
            credibility: {
                prediction: report.prediction,
                score: report.credibilityScore
            },
            profanity: {
                contains_profanity: report.containsProfanity,
                profanity_count: report.profanityCount,
                flagged_words: report.flaggedWords || []
            },
            nlp: {
                bias: report.bias,
                clickbait_score: report.clickbaitScore,
                tldr: report.tldr || [],
                source_reputation: report.sourceReputation
            }
        };
    };

    // Execute active analysis
    const handleStartAnalysis = async (e) => {
        if (e) e.preventDefault();
        
        if (currentTab === 'text' && !rawText.trim()) {
            triggerToast('Please enter some text to analyze.', 'warning');
            return;
        }
        if (currentTab === 'url' && !articleUrl.trim()) {
            triggerToast('Please enter a valid URL link.', 'warning');
            return;
        }

        setAnalyzing(true);
        setResults(null);
        setSavedId(null);

        try {
            const res = await api.post('/api/analyze', {
                inputType: currentTab,
                text: currentTab === 'text' ? rawText : '',
                url: currentTab === 'url' ? articleUrl : ''
            });

            if (res.data) {
                setSavedId(res.data.savedId);
                setResults(res.data);
                triggerToast('Analysis completed successfully!', 'success');
            }
        } catch (err) {
            console.error(err);
            triggerToast(err.response?.data?.error || 'Analysis failed.', 'error');
        } finally {
            setAnalyzing(false);
        }
    };

    // Trigger URL analysis on route query parameters
    useEffect(() => {
        if (articleIdParam) {
            loadArticleDetails(articleIdParam);
        } else if (analyzeUrlParam) {
            setCurrentTab('url');
            setArticleUrl(decodeURIComponent(analyzeUrlParam));
            // Trigger analysis directly
            setRawText('');
            // Use setTimeout to allow state batching before calling analysis
            setTimeout(() => {
                const triggerForm = document.getElementById('analysis-form');
                if (triggerForm) triggerForm.requestSubmit();
            }, 100);
        }
        fetchLatestNews();
    }, [articleIdParam, analyzeUrlParam]);

    // Handle Quick Scan clicks from trending articles
    const handleQuickScan = (url) => {
        setSearchParams({ analyzeUrl: encodeURIComponent(url) });
    };

    // Generate Share Link
    const handleShareReport = () => {
        if (!savedId) {
            triggerToast('Please analyze content first to generate a share link.', 'warning');
            return;
        }
        const reportUrl = `${window.location.origin}/report.html?id=${savedId}`;
        navigator.clipboard.writeText(reportUrl)
            .then(() => {
                triggerToast('Public Report Link copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error(err);
                triggerToast(`Share Link: ${reportUrl}`, 'info');
            });
    };

    // HTML-highlighted profane text builder
    const highlightedText = useMemo(() => {
        if (!results) return '';
        let html = results.textContent || '';
        
        // Escape HTML tags
        html = html
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        if (results.profanity.contains_profanity && results.profanity.flagged_words) {
            results.profanity.flagged_words.forEach(badWord => {
                if (!badWord) return;
                const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b(${escapeRegExp(badWord)})\\b`, 'gi');
                html = html.replace(regex, `<span class="profane-word px-1.5 py-0.5 rounded border border-rose-500/30 font-semibold text-rose-400 bg-rose-500/20">$1</span>`);
            });
        }
        return html;
    }, [results]);

    // Circular SVG Gauge Sub-component
    const Gauge = ({ percent, strokeColor, labelColor, verdict }) => {
        const radius = 50;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (Math.max(0, Math.min(100, percent)) / 100) * circumference;

        return (
            <div className="relative w-32 h-32 flex items-center justify-center my-3">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="50" className="stroke-slate-900 dark:stroke-slate-800/80" strokeWidth="8" fill="transparent" />
                    <circle 
                        cx="64" 
                        cy="64" 
                        r="50" 
                        className="gauge-circle transition-all duration-1000 ease-out"
                        style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
                        strokeWidth="8" 
                        fill="transparent"
                        stroke={strokeColor}
                        strokeLinecap="round"
                    />
                </svg>
                <span className="absolute text-2xl font-black text-slate-100 dark:text-slate-100 light:text-slate-900">
                    {Math.round(percent)}%
                </span>
            </div>
        );
    };

    // Political Bias layout details
    const biasInfo = useMemo(() => {
        if (!results) return null;
        const bias = results.nlp.bias;
        if (bias === 'LEFT') {
            return { label: 'LEFT', style: 'text-cyan-400', markerStyle: 'bg-cyan-400 shadow-[0_0_10px_#06b6d4]', left: '10%' };
        }
        if (bias === 'RIGHT') {
            return { label: 'RIGHT', style: 'text-rose-400', markerStyle: 'bg-rose-400 shadow-[0_0_10px_#fb7185]', left: '90%' };
        }
        return { label: 'CENTER', style: 'text-slate-300', markerStyle: 'bg-slate-400 shadow-[0_0_10px_#94a3b8]', left: '50%' };
    }, [results]);

    // Publisher Reputation details
    const reputationInfo = useMemo(() => {
        if (!results) return null;
        const rep = results.nlp.source_reputation;
        
        let domain = 'Self-Pasted Text';
        if (results.inputType === 'url' && results.inputSource) {
            try {
                const u = new URL(results.inputSource);
                domain = u.hostname.replace('www.', '');
            } catch (e) {}
        }

        if (rep === 'RELIABLE') {
            return {
                label: 'RELIABLE',
                style: 'text-emerald-400',
                badgeStyle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
                icon: <ShieldCheck className="w-6 h-6" />,
                domain,
                desc: 'High journalistic standards verification.'
            };
        }
        if (rep === 'UNRELIABLE') {
            return {
                label: 'UNRELIABLE',
                style: 'text-rose-500',
                badgeStyle: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
                icon: <ShieldAlert className="w-6 h-6" />,
                domain,
                desc: 'Known satirical, biased, or untrusted source.'
            };
        }
        return {
            label: 'UNVERIFIED',
            style: 'text-slate-400',
            badgeStyle: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
            icon: <HelpCircle className="w-6 h-6" />,
            domain,
            desc: 'Unregistered independent domain checklist.'
        };
    }, [results]);

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-8 relative">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 light:text-slate-900">Trust Center</h1>
                <p className="text-slate-400 text-sm mt-1">
                    Verify credibility, check political bias, sensationalism, and filter toxic profanities.
                </p>
            </div>

            {/* Input & Form Area */}
            <div className="glassmorphism p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
                {/* Tabs */}
                <div className="flex border-b border-slate-900/60 dark:border-slate-800/40">
                    <button
                        onClick={() => setCurrentTab('text')}
                        className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                            currentTab === 'text'
                                ? 'border-cyan-500 text-cyan-400'
                                : 'border-transparent text-slate-450 hover:text-slate-200'
                        }`}
                    >
                        <AlignLeft className="w-4.5 h-4.5" /> Paste Raw Text
                    </button>
                    <button
                        onClick={() => setCurrentTab('url')}
                        className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                            currentTab === 'url'
                                ? 'border-cyan-500 text-cyan-400'
                                : 'border-transparent text-slate-450 hover:text-slate-200'
                        }`}
                    >
                        <Link2 className="w-4.5 h-4.5" /> Analyze via URL
                    </button>
                </div>

                {/* Form */}
                <form id="analysis-form" onSubmit={handleStartAnalysis} className="space-y-4">
                    {currentTab === 'text' ? (
                        <div className="space-y-2">
                            <label htmlFor="raw-text" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Article or Content Text
                            </label>
                            <textarea
                                id="raw-text"
                                rows="6"
                                className="w-full p-4 bg-slate-900/40 dark:bg-slate-950/30 border border-slate-800 dark:border-slate-800/60 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm leading-relaxed"
                                placeholder="Type or paste the claim or article content here to scan..."
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label htmlFor="article-url" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                News Article Link
                            </label>
                            <input
                                type="url"
                                id="article-url"
                                className="w-full px-4 py-3.5 bg-slate-900/40 dark:bg-slate-950/30 border border-slate-800 dark:border-slate-800/60 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
                                placeholder="https://example.com/news-story-path"
                                value={articleUrl}
                                onChange={(e) => setArticleUrl(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={analyzing}
                            className="px-6 py-4 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-slate-950 hover:text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/20 text-sm transition-all hover:scale-102 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>Start Analysis</span>
                            <Play className="w-4 h-4 fill-slate-950" />
                        </button>

                        {results && (
                            <button
                                type="button"
                                onClick={handleShareReport}
                                className="px-6 py-4 glassmorphism hover:bg-slate-900/60 text-slate-300 hover:text-slate-100 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                            >
                                <Clipboard className="w-4 h-4" /> Share Report
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Loading Panel */}
            {analyzing && (
                <div className="glassmorphism p-12 rounded-3xl flex flex-col justify-center items-center gap-4 text-center min-h-[300px]">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <Loader2 className="w-full h-full text-cyan-500 animate-spin" />
                        <Sparkles className="w-4 h-4 text-cyan-400 absolute animate-pulse" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-bold text-slate-150 tracking-tight text-sm">Processing content diagnostic modules...</h4>
                        <p id="loading-status-text" className="text-xs text-slate-400 font-semibold animate-pulse">
                            {loadingText}
                        </p>
                    </div>
                </div>
            )}

            {/* Results Grid */}
            {results && !analyzing && (
                <div className="space-y-4">
                    <h3 id="article-headline-display" className="text-lg font-bold text-slate-200 border-b border-slate-900 pb-2">
                        Headline: {results.headline || "Scraped News Article"}
                    </h3>

                    {/* Bento Box Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Credibility Score */}
                        <div className="glassmorphism p-6 rounded-3xl flex flex-col items-center justify-between min-h-[220px]">
                            <div className="w-full text-left">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Credibility Check</span>
                                <h4 className={`text-xl font-extrabold mt-1 ${results.credibility.prediction === 'REAL' ? 'text-emerald-400' : 'text-rose-500'}`}>
                                    {results.credibility.prediction}
                                </h4>
                            </div>
                            <Gauge 
                                percent={results.credibility.score} 
                                strokeColor={results.credibility.prediction === 'REAL' ? '#10b981' : '#f43f5e'} 
                            />
                            <p className="text-slate-400 text-[10px] text-center leading-relaxed">
                                Probability score of factual accuracy compared to ML model index.
                            </p>
                        </div>

                        {/* Sensationalism Clickbait */}
                        <div className="glassmorphism p-6 rounded-3xl flex flex-col items-center justify-between min-h-[220px]">
                            <div className="w-full text-left">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Sensationalism Radar</span>
                                <h4 className={`text-xl font-extrabold mt-1 ${
                                    results.nlp.clickbait_score > 65 
                                        ? 'text-rose-400' 
                                        : results.nlp.clickbait_score > 35 
                                            ? 'text-amber-400' 
                                            : 'text-emerald-400'
                                }`}>
                                    {results.nlp.clickbait_score > 65 
                                        ? 'HIGH CLICKBAIT' 
                                        : results.nlp.clickbait_score > 35 
                                            ? 'MODERATE SENSATIONALISM' 
                                            : 'LOW CLICKBAIT'}
                                </h4>
                            </div>
                            <Gauge 
                                percent={results.nlp.clickbait_score} 
                                strokeColor={
                                    results.nlp.clickbait_score > 65 
                                        ? '#f43f5e' 
                                        : results.nlp.clickbait_score > 35 
                                            ? '#f59e0b' 
                                            : '#10b981'
                                } 
                            />
                            <p className="text-slate-400 text-[10px] text-center leading-relaxed">
                                Measures headline capitalization, clickbait tokens, and body alignment.
                            </p>
                        </div>

                        {/* Political Bias */}
                        <div className="glassmorphism p-6 rounded-3xl flex flex-col justify-between min-h-[220px]">
                            <div>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Political Leanings</span>
                                <h4 className={`text-xl font-extrabold mt-1 ${biasInfo.style}`}>
                                    {biasInfo.label}
                                </h4>
                            </div>
                            <div className="w-full space-y-4 my-auto">
                                <div className="relative pt-1">
                                    <div className="flex mb-2 items-center justify-between text-xs font-bold text-slate-400">
                                        <span>LEFT</span>
                                        <span>CENTER</span>
                                        <span>RIGHT</span>
                                    </div>
                                    <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-900 dark:bg-slate-800/80 relative">
                                        <div 
                                            className={`absolute top-0 bottom-0 w-3 rounded-full transition-all duration-500 -translate-x-1/2 ${biasInfo.markerStyle}`}
                                            style={{ left: biasInfo.left }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-slate-400 text-[10px] leading-relaxed">
                                Categorized via lexical density markers matching partisan syntax structures.
                            </p>
                        </div>

                        {/* Publisher Reputation */}
                        <div className="glassmorphism p-6 rounded-3xl flex flex-col justify-between min-h-[200px]">
                            <div>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Publisher Integrity</span>
                                <h4 className={`text-xl font-extrabold mt-1 ${reputationInfo.style}`}>
                                    {reputationInfo.label}
                                </h4>
                            </div>
                            <div className="my-3 flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl shrink-0 ${reputationInfo.badgeStyle}`}>
                                    {reputationInfo.icon}
                                </div>
                                <div className="min-w-0">
                                    <span className="text-sm font-bold text-slate-200 block truncate">{reputationInfo.domain}</span>
                                    <p className="text-slate-400 text-[10px] mt-0.5 leading-tight">{reputationInfo.desc}</p>
                                </div>
                            </div>
                            <p className="text-slate-400 text-[10px] leading-relaxed">
                                Cross-referenced domain names against standard press directories.
                            </p>
                        </div>

                        {/* Extractive Summary TLDR */}
                        <div className="glassmorphism p-6 rounded-3xl md:col-span-2 min-h-[200px] flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Extractive Summary (TL;DR)</span>
                                <ul className="mt-3.5 space-y-2.5">
                                    {results.nlp.tldr && results.nlp.tldr.length > 0 ? (
                                        results.nlp.tldr.map((point, i) => (
                                            <li key={i} className="text-xs text-slate-350 leading-relaxed flex items-start gap-2.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-450 mt-1.5 shrink-0 shadow-[0_0_6px_#06b6d4]"></span>
                                                <span>{point}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-xs text-slate-450 leading-relaxed flex items-start gap-2.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1.5 shrink-0"></span>
                                            <span>Summary snippet extraction was unavailable for this body text.</span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                            <div className="text-[9px] text-slate-500 mt-3 font-semibold">
                                Extracted sentences optimized via token density frequency score.
                            </div>
                        </div>

                        {/* Validated Content & Read-Safe */}
                        <div className="glassmorphism p-6 rounded-3xl md:col-span-3 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900/60 dark:border-slate-800/40 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Validated Content Text</span>
                                    {results.profanity.contains_profanity && (
                                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                            ⚠️ {results.profanity.profanity_count} Toxins Detected
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xs font-semibold text-slate-450">Read-Safe Mode (Redact Profanity)</span>
                                    <button 
                                        type="button"
                                        onClick={() => setReadSafeMode(!readSafeMode)}
                                        className={`w-12 h-6.5 rounded-full border flex items-center p-0.5 transition-colors relative ${
                                            readSafeMode 
                                                ? 'bg-cyan-950 border-cyan-500/30' 
                                                : 'bg-slate-900 border-slate-800'
                                        }`}
                                    >
                                        <div 
                                            className={`w-5.5 h-5.5 rounded-full transition-all duration-300 transform ${
                                                readSafeMode 
                                                    ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4] translate-x-5' 
                                                    : 'bg-slate-500 translate-x-0'
                                            }`} 
                                        />
                                    </button>
                                </div>
                            </div>
                            
                            <div className={readSafeMode ? 'read-safe-active' : ''}>
                                <div 
                                    className="text-sm leading-relaxed text-slate-300 max-h-80 overflow-y-auto whitespace-pre-wrap pr-2 text-slate-300 light:text-slate-700"
                                    dangerouslySetInnerHTML={{ __html: highlightedText || 'Validated text contents will appear here.' }}
                                />
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Trending Headlines */}
            <div className="space-y-6 pt-12 border-t border-slate-900/60 dark:border-slate-800/40">
                <h3 className="text-xl font-extrabold tracking-tight text-slate-100 light:text-slate-900">Trending Headlines</h3>
                
                {fetchingNews && newsArticles.length === 0 ? (
                    <p className="text-slate-500 text-center animate-pulse text-sm">Fetching news headlines...</p>
                ) : newsArticles.length === 0 ? (
                    <p className="text-slate-500 text-center text-sm">No news headlines available.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {newsArticles.slice(0, visibleCount).map((article, idx) => {
                            // Strip HTML & spacing from headlines
                            const cleanDesc = (article.description || 'No description available for this headline.')
                                .replace(/<\/?[^>]+(>|$)/g, "")
                                .replace(/\s+/g, " ")
                                .trim();

                            return (
                                <div key={idx} className="glassmorphism rounded-3xl overflow-hidden hover:-translate-y-1 hover:border-cyan-500/20 transition-all flex flex-col justify-between h-full group">
                                    <div>
                                        <img 
                                            src={article.imageUrl} 
                                            className="w-full h-44 object-cover border-b border-slate-900/60 dark:border-slate-800/40" 
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80';
                                            }}
                                            alt="Trending Headline Image" 
                                        />
                                        <div className="p-5 space-y-2.5">
                                            <h5 className="font-bold tracking-tight text-slate-200 text-sm leading-snug line-clamp-2 group-hover:text-cyan-400 transition-colors">
                                                <a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a>
                                            </h5>
                                            <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{cleanDesc}</p>
                                        </div>
                                    </div>
                                    <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-900/60 dark:border-slate-800/40">
                                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1">
                                            <span>Read Original</span>
                                        </a>
                                        <button 
                                            onClick={() => handleQuickScan(article.url)} 
                                            className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 rounded-lg text-[10px] font-bold transition-all"
                                        >
                                            Quick Scan
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                {visibleCount < newsArticles.length && (
                    <div className="text-center">
                        <button 
                            onClick={() => setVisibleCount(prev => prev + 3)} 
                            className="px-6 py-3 glassmorphism hover:bg-slate-900/60 text-slate-350 hover:text-slate-100 rounded-xl font-medium text-sm transition-all"
                        >
                            Load More Headlines
                        </button>
                    </div>
                )}
            </div>

            {/* Toast Notifications */}
            {toast.show && (
                <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 p-4 rounded-2xl border shadow-2xl glassmorphism pointer-events-auto transition-all duration-300 max-w-sm">
                    <span className="text-xs font-semibold leading-relaxed text-slate-200">{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
