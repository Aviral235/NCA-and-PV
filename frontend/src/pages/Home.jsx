import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BarChart3, AlertOctagon, FlameKindling, ShieldCheck, ArrowRight } from 'lucide-react';

const Home = () => {
    const [typedText, setTypedText] = useState('');
    const [phraseIdx, setPhraseIdx] = useState(0);
    const [charIdx, setCharIdx] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    const phrases = ["Filter the Hate.", "Scrape Article Links.", "Analyze Bias & Validity."];

    useEffect(() => {
        const currentPhrase = phrases[phraseIdx];
        let timer;

        if (isDeleting) {
            timer = setTimeout(() => {
                setTypedText(currentPhrase.substring(0, charIdx - 1));
                setCharIdx(prev => prev - 1);
            }, 50);
        } else {
            timer = setTimeout(() => {
                setTypedText(currentPhrase.substring(0, charIdx + 1));
                setCharIdx(prev => prev + 1);
            }, 100);
        }

        // Handle switching phrase / deletion direction
        if (!isDeleting && charIdx === currentPhrase.length) {
            timer = setTimeout(() => setIsDeleting(true), 1500); // Wait before deleting
        } else if (isDeleting && charIdx === 0) {
            setIsDeleting(false);
            setPhraseIdx(prev => (prev + 1) % phrases.length);
        }

        return () => clearTimeout(timer);
    }, [charIdx, isDeleting, phraseIdx]);

    return (
        <div className="flex flex-col min-h-[calc(100vh-4.5rem)]">
            {/* Hero Section */}
            <section className="relative px-6 max-w-7xl mx-auto flex-grow flex flex-col justify-center items-center text-center py-20">
                <div className="max-w-3xl">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 dark:bg-cyan-500/5 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" /> AI-Powered News Trust Suite
                    </div>
                    
                    <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight mb-6 text-slate-100 light:text-slate-900">
                        Verify the Truth.<br />
                        <span className="bg-gradient-to-r from-cyan-400 via-brand-purple to-brand-rose bg-clip-text text-transparent">
                            {typedText}
                            <span className="animate-ping">|</span>
                        </span>
                    </h1>
                    
                    <p className="text-base sm:text-lg text-slate-400 dark:text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
                        VeritasAI analyzes article credibility and filters out hate speech, profanity, and offensive text. Scan raw text or extract content instantly from article URLs.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto">
                        <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-slate-950 hover:text-slate-950 font-bold rounded-xl shadow-xl shadow-cyan-500/10 hover:shadow-cyan-400/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
                            <span>Start Analyzing Free</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <a href="#features" className="w-full sm:w-auto px-8 py-4 glassmorphism hover:bg-slate-900/60 text-slate-300 hover:text-slate-100 rounded-xl font-semibold transition-all flex items-center justify-center">
                            Explore Features
                        </a>
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section id="features" className="py-24 px-6 max-w-7xl mx-auto w-full border-t border-slate-900/40 dark:border-slate-800/40">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-100 light:text-slate-900">Powerful Real-time Protection</h2>
                    <p className="text-slate-400 dark:text-slate-400 mt-3 max-w-md mx-auto text-sm">Discover the dual power of credibility checks and content validation built into a unified SaaS experience.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="glassmorphism p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-cyan-500/5 hover:border-cyan-500/30 group">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all duration-300">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <h3 class="text-xl font-semibold mb-3 text-slate-100 light:text-slate-900">News Credibility</h3>
                        <p className="text-slate-400 leading-relaxed text-xs">Validate the authenticity and reliability of news articles in real-time, detecting fake claims using our advanced NLP model.</p>
                    </div>

                    {/* Feature 2 */}
                    <div className="glassmorphism p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-emerald-500/5 hover:border-emerald-500/30 group">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-300">
                            <AlertOctagon className="w-6 h-6" />
                        </div>
                        <h3 class="text-xl font-semibold mb-3 text-slate-100 light:text-slate-900">Profanity Filter</h3>
                        <p className="text-slate-400 leading-relaxed text-xs">Filter out offensive language, hate speech, and toxicity with custom dictionaries, regex models, and smart leetspeak translation.</p>
                    </div>

                    {/* Feature 3 */}
                    <div className="glassmorphism p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-teal-500/5 hover:border-teal-500/30 group">
                        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-6 group-hover:bg-violet-500 group-hover:text-slate-950 transition-all duration-300">
                            <FlameKindling className="w-6 h-6" />
                        </div>
                        <h3 class="text-xl font-semibold mb-3 text-slate-100 light:text-slate-900">Web Scraper Proxy</h3>
                        <p className="text-slate-400 leading-relaxed text-xs">Simply paste any online article link. Our backend parser automatically scrapes the text content, making validations quick and seamless.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
