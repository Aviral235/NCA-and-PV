import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

const Signup = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!fullName.trim()) {
            setErrorMsg('Please enter your full name.');
            return;
        }
        if (!email || !email.includes('@')) {
            setErrorMsg('Please enter a valid email address.');
            return;
        }
        if (!password || password.length < 6) {
            setErrorMsg('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            await signup(fullName, email, password);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setErrorMsg(err.response?.data?.error || 'Registration failed. Please check details or connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md glassmorphism p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold tracking-tight mb-2 text-slate-100 light:text-slate-900">Create Account</h3>
                    <p className="text-slate-400 text-sm">Join VeritasAI to start verifying articles</p>
                </div>
                
                {/* Status Alert */}
                {errorMsg && (
                    <div className="mb-4 p-4 rounded-xl text-sm font-medium border bg-rose-500/10 border-rose-500/20 text-rose-400">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div>
                        <label htmlFor="name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                <User className="w-4.5 h-4.5" />
                            </span>
                            <input 
                                type="text" 
                                id="name" 
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/40 dark:bg-slate-950/30 border border-slate-800 dark:border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm" 
                                placeholder="John Doe" 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required 
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                <Mail className="w-4.5 h-4.5" />
                            </span>
                            <input 
                                type="email" 
                                id="email" 
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/40 dark:bg-slate-950/30 border border-slate-800 dark:border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm" 
                                placeholder="name@domain.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                                autoComplete="username" 
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                <Lock className="w-4.5 h-4.5" />
                            </span>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                id="password" 
                                className="w-full pl-11 pr-12 py-3.5 bg-slate-900/40 dark:bg-slate-950/30 border border-slate-800 dark:border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm" 
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                                autoComplete="new-password" 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)} 
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-slate-950 hover:text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/20 text-sm transition-all hover:scale-102 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>Sign Up</span>
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-400">
                    Already have an account? <Link to="/login" className="text-cyan-400 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
