import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldCheck, Moon, Sun, LogOut, Menu, X } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    const linkClasses = (path) => 
        `transition-colors py-1 ${
            isActive(path) 
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-500' 
                : 'text-slate-300 hover:text-cyan-400 font-medium'
        }`;

    return (
        <nav className="fixed top-0 left-0 w-full z-50 glassmorphism border-b transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 h-[4.5rem] flex items-center justify-between">
                <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-cyan-500" />
                    <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">VeritasAI</span>
                </Link>

                {user ? (
                    <>
                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-6 text-sm">
                            <Link to="/dashboard" className={linkClasses('/dashboard')}>Dashboard</Link>
                            <Link to="/feed" className={linkClasses('/feed')}>Discovery Feed</Link>
                            <Link to="/profile" className={linkClasses('/profile')}>Profile</Link>
                        </div>

                        <div className="hidden md:flex items-center gap-4">
                            {/* Theme toggle */}
                            <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-slate-900/60 dark:hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 transition-all">
                                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                            </button>

                            {/* User details & logout */}
                            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                                <span className="text-xs font-semibold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                                    {user.fullName}
                                </span>
                                <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 border border-rose-500/20 hover:border-transparent rounded-xl text-xs font-bold transition-all">
                                    <span>Logout</span>
                                    <LogOut className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center gap-3">
                            <button onClick={toggleTheme} className="p-2 rounded-xl text-slate-400 hover:text-slate-200">
                                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                            </button>
                            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-xl text-slate-400 hover:text-slate-200">
                                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 rounded-xl text-slate-400 hover:text-slate-200">
                            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors">Login</Link>
                        <Link to="/signup" className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]">Get Started</Link>
                    </div>
                )}
            </div>

            {/* Mobile menu panel */}
            {user && mobileOpen && (
                <div className="md:hidden glassmorphism border-t p-4 flex flex-col gap-4 text-sm font-medium">
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)} className={`px-2 py-1.5 rounded-lg ${isActive('/dashboard') ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300'}`}>Dashboard</Link>
                    <Link to="/feed" onClick={() => setMobileOpen(false)} className={`px-2 py-1.5 rounded-lg ${isActive('/feed') ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300'}`}>Discovery Feed</Link>
                    <Link to="/profile" onClick={() => setMobileOpen(false)} className={`px-2 py-1.5 rounded-lg ${isActive('/profile') ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300'}`}>Profile</Link>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 pl-2">Logged in as {user.fullName}</span>
                        <button onClick={handleLogout} className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/15 text-rose-400 rounded-lg text-xs font-bold">
                            <span>Logout</span>
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
