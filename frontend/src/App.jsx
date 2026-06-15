import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Feed from './pages/Feed';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

const AppContent = () => {
    const { user } = useAuth();
    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 light:bg-slate-50 light:text-slate-900 transition-colors duration-300">
            {/* Ambient background mesh */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-cyan-500/10 blur-[130px] dark:bg-cyan-500/5 transition-opacity duration-300"></div>
                <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-violet-500/10 blur-[130px] dark:bg-violet-500/5 transition-opacity duration-300"></div>
            </div>

            <Navbar />
            
            {/* Main content with padding-top for fixed navbar */}
            <main className="flex-grow pt-[4.5rem]">
                <Routes>
                    <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
                    <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
                    <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
                    
                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/feed" element={
                        <PrivateRoute>
                            <Feed />
                        </PrivateRoute>
                    } />
                    <Route path="/profile" element={
                        <PrivateRoute>
                            <Profile />
                        </PrivateRoute>
                    } />
                    
                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>

            <Footer />
        </div>
    );
};

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <AppContent />
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
