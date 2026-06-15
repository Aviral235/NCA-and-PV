import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { Line } from 'react-chartjs-2';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    Title, 
    Tooltip, 
    Legend, 
    Filler 
} from 'chart.js';
import { 
    User, Shield, History, Settings, Key, Trash, Laptop, Smartphone,
    ChevronDown, ChevronUp, FileSpreadsheet, Copy, Check, X, Camera,
    CloudUpload, RefreshCw, AlertTriangle, ShieldAlert, Eye
} from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const TABS = [
    { label: 'General Info', icon: <User className="w-4.5 h-4.5" /> },
    { label: 'Security & Auth', icon: <Shield className="w-4.5 h-4.5" /> },
    { label: 'History & Analytics', icon: <History className="w-4.5 h-4.5" /> },
    { label: 'Preferences & API', icon: <Settings className="w-4.5 h-4.5" /> }
];

const Profile = () => {
    const { user, updateUserState, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState(0);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

    // Profile form states
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [organization, setOrganization] = useState('');
    const [bio, setBio] = useState('');
    const [twitter, setTwitter] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [avatarBase64, setAvatarBase64] = useState('');

    // Accordions / Modals
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Delete Account
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');

    // History and API States
    const [historyList, setHistoryList] = useState([]);
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('v_api_key') || '');
    const [copySuccess, setCopySuccess] = useState(false);

    // Details Modal
    const [selectedItem, setSelectedItem] = useState(null);

    // Initialize profile form values
    useEffect(() => {
        if (user) {
            setFullName(user.fullName || '');
            setEmail(user.email || '');
            setRole(user.role || '');
            setOrganization(user.organization || '');
            setBio(user.bio || '');
            setTwitter(user.twitter || '');
            setLinkedin(user.linkedin || '');
            setAvatarBase64(user.avatar || '');
        }
    }, [user]);

    // Toast helper
    const triggerToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
    };

    // Profile Completion Logic
    const completionDetails = useMemo(() => {
        let score = 0;
        const items = [];

        if (fullName.trim()) {
            score += 10;
            items.push({ text: 'Full Name set', done: true });
        } else {
            items.push({ text: 'Add your Full Name', done: false });
        }

        if (email.trim()) {
            score += 10;
            items.push({ text: 'Email set', done: true });
        } else {
            items.push({ text: 'Add your Email Address', done: false });
        }

        if (avatarBase64) {
            score += 20;
            items.push({ text: 'Avatar uploaded', done: true });
        } else {
            items.push({ text: 'Upload a Profile Photo', done: false });
        }

        if (role) {
            score += 15;
            items.push({ text: `Role set (${role})`, done: true });
        } else {
            items.push({ text: 'Select your Role / Job Title', done: false });
        }

        if (organization.trim()) {
            score += 15;
            items.push({ text: `Organization set (${organization})`, done: true });
        } else {
            items.push({ text: 'Enter Organization / University', done: false });
        }

        if (bio.trim()) {
            score += 15;
            items.push({ text: 'Bio written', done: true });
        } else {
            items.push({ text: 'Add a Bio / Research Focus', done: false });
        }

        if (twitter.trim()) {
            score += 7.5;
            items.push({ text: 'Twitter / X linked', done: true });
        } else {
            items.push({ text: 'Link your Twitter / X profile', done: false });
        }

        if (linkedin.trim()) {
            score += 7.5;
            items.push({ text: 'LinkedIn linked', done: true });
        } else {
            items.push({ text: 'Link your LinkedIn profile', done: false });
        }

        return { percent: Math.round(score), items };
    }, [fullName, email, avatarBase64, role, organization, bio, twitter, linkedin]);

    // Save Profile settings
    const handleSaveProfile = async () => {
        if (!fullName.trim() || !email.trim()) {
            triggerToast('Full name and Email address are required.', 'error');
            return;
        }

        setSaving(true);
        try {
            const res = await api.post('/api/auth/update', {
                fullName,
                email,
                role,
                organization,
                bio,
                twitter,
                linkedin,
                avatar: avatarBase64
            });

            if (res.data) {
                updateUserState(res.data);
                triggerToast('Profile settings saved successfully!', 'success');
            }
        } catch (err) {
            console.error(err);
            triggerToast(err.response?.data?.error || 'Failed to update profile.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Update password
    const handleUpdatePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            triggerToast('All password fields are required.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            triggerToast('Confirm Password does not match.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            triggerToast('New password must be at least 6 characters long.', 'error');
            return;
        }

        setSaving(true);
        try {
            const res = await api.post('/api/auth/update', {
                currentPassword,
                newPassword
            });
            if (res.data) {
                triggerToast('Account password updated successfully!', 'success');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordOpen(false);
            }
        } catch (err) {
            console.error(err);
            triggerToast(err.response?.data?.error || 'Failed to change password.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Fetch user history logs
    const loadHistory = async () => {
        try {
            const res = await api.get('/api/analyses/history');
            if (res.data && res.data.analyses) {
                setHistoryList(res.data.analyses);
            }
        } catch (err) {
            console.error('Failed to load user scan logs', err);
        }
    };

    useEffect(() => {
        if (activeTab === 2) {
            loadHistory();
        }
    }, [activeTab]);

    // Delete history logs item
    const handleDeleteHistory = async (id) => {
        if (!window.confirm('Are you sure you want to delete this check from history?')) return;
        try {
            const res = await api.delete(`/api/analyses/history/${id}`);
            if (res.data && res.data.success) {
                triggerToast('Analysis deleted from history.', 'success');
                loadHistory();
            }
        } catch (err) {
            console.error(err);
            triggerToast('Failed to delete history item.', 'error');
        }
    };

    // Delete account permanently
    const handleDeleteAccount = async () => {
        if (deleteConfirm !== 'DELETE') return;
        try {
            const res = await api.delete('/api/auth/delete');
            if (res.status === 200) {
                logout();
                alert('Your account has been deleted successfully.');
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to delete account.');
        }
    };

    // Image Upload / Drag Drop handlers
    const processImage = (file) => {
        if (file.size > 2 * 1024 * 1024) {
            triggerToast('File size must be less than 2MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarBase64(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) processImage(file);
    };

    // Drag-Drop events
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) processImage(file);
    };

    // API Key generation
    const handleGenerateApiKey = () => {
        const key = 'v_live_' + Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
        localStorage.setItem('v_api_key', key);
        setApiKey(key);
        triggerToast('Developer API key generated successfully.', 'success');
    };

    const handleRevokeApiKey = () => {
        if (!window.confirm('Are you sure you want to revoke this API key?')) return;
        localStorage.removeItem('v_api_key');
        setApiKey('');
        triggerToast('API key revoked.', 'success');
    };

    const handleCopyApiKey = async () => {
        if (!apiKey) {
            triggerToast('Generate a key first.', 'warning');
            return;
        }
        try {
            await navigator.clipboard.writeText(apiKey);
            setCopySuccess(true);
            triggerToast('API Key copied to clipboard!', 'success');
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            triggerToast('Failed to copy key.', 'error');
        }
    };

    // Export CSV Data
    const handleDownloadCSV = () => {
        if (historyList.length === 0) {
            triggerToast('No history available to download.', 'warning');
            return;
        }
        
        let csvRows = [];
        csvRows.push("ID,Date,Input Type,Source/Snippet,Credibility Score,Verdict,Contains Profanity,Profanity Count");
        
        historyList.forEach(item => {
            const id = item._id;
            const date = new Date(item.createdAt).toISOString();
            const type = item.inputType;
            const source = `"${item.inputSource.replace(/"/g, '""')}"`;
            const score = item.credibilityScore;
            const verdict = item.prediction;
            const hasProf = item.containsProfanity ? "Yes" : "No";
            const profCount = item.profanityCount;
            
            csvRows.push(`${id},${date},${type},${source},${score},${verdict},${hasProf},${profCount}`);
        });
        
        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `veritasai_history_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ChartJS Data setup
    const chartData = useMemo(() => {
        let labels = ["Jun 10", "Jun 11", "Jun 12", "Jun 13", "Jun 14", "Jun 15", "Jun 16"];
        let scanCounts = [2, 5, 3, 8, 4, 6, 7];
        let avgCredibility = [80, 85, 75, 90, 88, 92, 85];

        if (historyList.length > 0) {
            const groups = {};
            historyList.forEach(a => {
                const dateStr = new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                if (!groups[dateStr]) {
                    groups[dateStr] = { count: 0, totalCred: 0 };
                }
                groups[dateStr].count += 1;
                groups[dateStr].totalCred += a.credibilityScore;
            });
            
            const sortedDates = Object.keys(groups).reverse().slice(-7);
            labels = [];
            scanCounts = [];
            avgCredibility = [];

            sortedDates.forEach(date => {
                labels.push(date);
                scanCounts.push(groups[date].count);
                avgCredibility.push(Math.round(groups[date].totalCred / groups[date].count));
            });
        }

        const isDark = theme === 'dark';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)';
        const textColor = isDark ? '#94a3b8' : '#475569';

        return {
            data: {
                labels,
                datasets: [
                    {
                        label: 'Scans Performed',
                        data: scanCounts,
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6, 182, 212, 0.05)',
                        borderWidth: 2,
                        tension: 0.35,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Average Trust %',
                        data: avgCredibility,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                        borderWidth: 2,
                        tension: 0.35,
                        fill: true,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: textColor,
                            font: { family: 'sans-serif', size: 10, weight: '500' }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor, font: { size: 9 } }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: gridColor },
                        ticks: { color: textColor, font: { size: 9 } },
                        title: { display: true, text: 'No. of Scans', color: textColor, font: { size: 9, weight: '600' } }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { color: textColor, font: { size: 9 } },
                        title: { display: true, text: 'Trust Score %', color: textColor, font: { size: 9, weight: '600' } },
                        min: 0,
                        max: 100
                    }
                }
            }
        };
    }, [historyList, theme]);

    // Modal data details
    const highlightedModalText = useMemo(() => {
        if (!selectedItem) return '';
        let html = selectedItem.textContent || '';
        
        // Escape HTML
        html = html
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        if (selectedItem.containsProfanity && selectedItem.flaggedWords) {
            selectedItem.flaggedWords.forEach(badWord => {
                const regex = new RegExp(`\\b(${badWord})\\b`, "gi");
                html = html.replace(regex, `<span class="bg-rose-500/25 text-rose-450 border border-rose-500/30 px-1.5 py-0.5 rounded font-semibold">$1</span>`);
            });
        }
        return html;
    }, [selectedItem]);

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 relative">
            {/* Page Header */}
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 light:text-slate-900">User Settings</h1>
                <p className="text-slate-400 text-sm">Manage your Identity, Security keys, Analytics, and API endpoints.</p>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                
                {/* LEFT COL: Sidebar Overview & Checklist */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Avatar Display Card */}
                    <div className="glassmorphism p-6 rounded-3xl shadow-xl text-center space-y-4 border-slate-800">
                        <div 
                            className="relative w-24 h-24 mx-auto group cursor-pointer"
                            onClick={() => {
                                setActiveTab(0);
                                setTimeout(() => {
                                    const fileInput = document.getElementById('avatar-file-selector');
                                    if (fileInput) fileInput.click();
                                }, 100);
                            }}
                        >
                            <div className="w-full h-full rounded-full bg-slate-900 border-2 border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
                                {avatarBase64 ? (
                                    <img src={avatarBase64} className="w-full h-full object-cover" alt="Sidebar avatar" />
                                ) : (
                                    <User className="w-10 h-10 text-slate-500" />
                                )}
                            </div>
                            <div className="absolute inset-0 bg-slate-950/70 rounded-full flex flex-col items-center justify-center text-[9px] font-bold text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Camera className="w-4 h-4 mb-1" />
                                <span>Upload Avatar</span>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-slate-200">
                                {fullName || user?.fullName || 'VeritasAI User'}
                            </h2>
                            <div className="text-[11px] text-slate-400 bg-slate-900/60 inline-block px-3 py-1 rounded-full border border-slate-800/40 mt-1.5 font-medium">
                                {role && organization ? `${role} @ ${organization}` : role || organization || 'Verified Member'}
                            </div>
                        </div>
                    </div>

                    {/* Navigation Pills */}
                    <div className="glassmorphism p-2.5 rounded-3xl shadow-xl border-slate-800 flex flex-col gap-1">
                        {TABS.map((tab, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveTab(idx)}
                                className={`w-full px-5 py-3.5 flex items-center gap-3 text-sm font-semibold rounded-r-xl border-l-2 transition-all ${
                                    activeTab === idx
                                        ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/20 border-transparent'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Completion Checklist */}
                    <div className="glassmorphism p-6 rounded-3xl shadow-xl border-slate-800 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                                <span>Profile Completion</span>
                                <span className="text-cyan-400">{completionDetails.percent}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-900 dark:bg-slate-950/60 rounded-full overflow-hidden border border-slate-800/60">
                                <div 
                                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500" 
                                    style={{ width: `${completionDetails.percent}%` }}
                                />
                            </div>
                        </div>
                        <div className="border-t border-slate-900/60 dark:border-slate-800/40 pt-3.5 space-y-2.5">
                            {completionDetails.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs font-medium">
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                                        item.done 
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                                            : 'border-slate-800 bg-slate-900/50 text-slate-500'
                                    }`}>
                                        {item.done ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5" />}
                                    </div>
                                    <span className={item.done ? 'text-slate-300' : 'text-slate-500 line-through decoration-slate-800'}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COL: Tab Panes */}
                <div className="lg:col-span-3">

                    {/* Tab 0: General Info */}
                    {activeTab === 0 && (
                        <div className="glassmorphism p-6 sm:p-8 rounded-3xl shadow-xl border-slate-800 space-y-6">
                            <div className="border-b border-slate-900/60 dark:border-slate-800/40 pb-4">
                                <h2 className="text-xl font-bold tracking-tight text-slate-100 light:text-slate-900">General Information</h2>
                                <p className="text-slate-400 text-xs mt-1">Configure your personal and professional profile details.</p>
                            </div>

                            {/* Dropzone Photo Upload */}
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Profile Photo</label>
                                <div 
                                    className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 bg-slate-900/20"
                                    onClick={() => document.getElementById('avatar-file-selector').click()}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                >
                                    <input 
                                        type="file" 
                                        id="avatar-file-selector" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleAvatarChange} 
                                    />
                                    
                                    <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                                        {avatarBase64 ? (
                                            <img src={avatarBase64} className="w-full h-full object-cover" alt="Avatar Preview" />
                                        ) : (
                                            <CloudUpload className="w-6 h-6 text-slate-500" />
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-300">
                                        <span className="text-cyan-400 font-semibold">Click to upload</span> or drag and drop
                                    </div>
                                    <p className="text-[10px] text-slate-500">PNG, JPG, or WEBP up to 2MB</p>
                                </div>
                            </div>

                            {/* Info Form */}
                            <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={e => e.preventDefault()}>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-slate-900/40 dark:bg-slate-950/30 border border-slate-800 dark:border-slate-800/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                                    <input 
                                        type="email" 
                                        className="w-full px-4 py-3 bg-slate-900/40 dark:bg-slate-950/30 border border-slate-800 dark:border-slate-800/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Title / Role</label>
                                    <select 
                                        className="w-full px-4 py-3 bg-slate-900/40 dark:bg-slate-950/30 border border-slate-800 dark:border-slate-800/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="" className="bg-slate-950">Select your role</option>
                                        <option value="Journalist" className="bg-slate-950">Journalist</option>
                                        <option value="Researcher" className="bg-slate-950">Researcher</option>
                                        <option value="Student" className="bg-slate-950">Student</option>
                                        <option value="Fact Checker" className="bg-slate-950">Fact Checker</option>
                                        <option value="Other" className="bg-slate-950">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Organization / University</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-slate-900/40 dark:bg-slate-950/30 border border-slate-800 dark:border-slate-800/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                                        value={organization}
                                        onChange={(e) => setOrganization(e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bio / Research Focus</label>
                                    <textarea 
                                        rows="3" 
                                        className="w-full px-4 py-3 bg-slate-900/40 dark:bg-slate-950/30 border border-slate-800 dark:border-slate-800/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all resize-none"
                                        placeholder="Tell us about your background and credibility research..."
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Twitter / X Link</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-slate-900/40 dark:bg-slate-950/30 border border-slate-800 dark:border-slate-800/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                                        placeholder="https://x.com/username"
                                        value={twitter}
                                        onChange={(e) => setTwitter(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">LinkedIn Link</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-slate-900/40 dark:bg-slate-950/30 border border-slate-800 dark:border-slate-800/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                                        placeholder="https://linkedin.com/in/username"
                                        value={linkedin}
                                        onChange={(e) => setLinkedin(e.target.value)}
                                    />
                                </div>
                            </form>
                            
                            <div className="flex justify-end pt-4 border-t border-slate-900/60 dark:border-slate-800/40">
                                <button 
                                    onClick={handleSaveProfile} 
                                    disabled={saving}
                                    className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 hover:text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/10 text-sm transition-all hover:scale-102 flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <span>Save Profile Settings</span>
                                    {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tab 1: Security & Auth */}
                    {activeTab === 1 && (
                        <div className="glassmorphism p-6 sm:p-8 rounded-3xl shadow-xl border-slate-800 space-y-6">
                            <div className="border-b border-slate-900/60 dark:border-slate-800/40 pb-4">
                                <h2 className="text-xl font-bold tracking-tight text-slate-100 light:text-slate-900">Security & Authentication</h2>
                                <p className="text-slate-400 text-xs mt-1">Manage password credentials and review active session logs.</p>
                            </div>

                            {/* Accordion Password Update */}
                            <div className="border border-slate-800 dark:border-slate-800/60 rounded-2xl overflow-hidden glassmorphism bg-slate-900/5">
                                <button 
                                    type="button" 
                                    onClick={() => setPasswordOpen(!passwordOpen)}
                                    className="w-full px-6 py-4 flex items-center justify-between font-bold text-sm text-slate-200 hover:bg-slate-900/30 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Key className="w-4.5 h-4.5 text-cyan-400" />
                                        <span>Update Account Password</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${passwordOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {passwordOpen && (
                                    <div className="px-6 pb-6 pt-2 space-y-4 border-t border-slate-900/60 dark:border-slate-800/40">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Password</label>
                                            <input 
                                                type="password" 
                                                className="w-full px-4 py-3 bg-slate-900/40 dark:bg-slate-950/30 border border-slate-800 dark:border-slate-800/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                                                <input 
                                                    type="password" 
                                                    className="w-full px-4 py-3 bg-slate-900/40 dark:bg-slate-950/30 border border-slate-800 dark:border-slate-800/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm New Password</label>
                                                <input 
                                                    type="password" 
                                                    className="w-full px-4 py-3 bg-slate-900/40 dark:bg-slate-950/30 border border-slate-800 dark:border-slate-800/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <button 
                                                onClick={handleUpdatePassword} 
                                                disabled={saving}
                                                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:text-slate-950 font-bold rounded-xl text-xs tracking-wider transition-all hover:scale-102 flex items-center gap-1.5"
                                            >
                                                <span>Update Password</span>
                                                {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Active Sessions */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-200">Active Login Sessions</h3>
                                <div className="divide-y divide-slate-900/60 dark:divide-slate-800/40 border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/5">
                                    <div className="px-5 py-4 flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-3">
                                            <Laptop className="w-5 h-5 text-cyan-450" />
                                            <div>
                                                <p className="font-bold text-slate-200">Chrome on Windows 11</p>
                                                <p className="text-[10px] text-slate-500">192.168.1.15 • Current Session</p>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">Active Now</span>
                                    </div>
                                    <div className="px-5 py-4 flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-3">
                                            <Smartphone className="w-5 h-5 text-slate-500" />
                                            <div>
                                                <p className="font-bold text-slate-350">Safari on iPhone 15</p>
                                                <p className="text-[10px] text-slate-500">172.56.21.89 • New York, USA</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-semibold">Active 2 hrs ago</span>
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone Permanent Deletion */}
                            <div className="pt-6 border-t border-slate-900/60 dark:border-slate-800/40 space-y-4">
                                <h3 className="text-sm font-bold text-rose-500 flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" /> Danger Zone
                                </h3>
                                <div className="p-5 border border-rose-500/20 rounded-2xl bg-rose-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="font-bold text-xs text-rose-500">Delete Account Permanently</p>
                                        <p className="text-[11px] text-slate-400 leading-normal">
                                            This erases all your history and credibility metrics. This is not reversible.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setDeleteModalOpen(true)} 
                                        className="px-5 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-450 border border-rose-500/25 hover:border-rose-500 rounded-xl text-xs font-bold transition-all hover:scale-102 shrink-0"
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: History & Analytics */}
                    {activeTab === 2 && (
                        <div className="glassmorphism p-6 sm:p-8 rounded-3xl shadow-xl border-slate-800 space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-900/60 dark:border-slate-800/40 pb-4">
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-slate-100 light:text-slate-900">Analysis History & Analytics</h2>
                                    <p className="text-slate-400 text-xs mt-1">Review credibility scores, toxicity analysis records, and stats.</p>
                                </div>
                                <button 
                                    onClick={handleDownloadCSV} 
                                    className="px-4 py-2.5 bg-slate-900/40 dark:bg-slate-950/30 hover:bg-slate-900/60 border border-slate-800 dark:border-slate-800/60 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                                    <span>Export CSV Data</span>
                                </button>
                            </div>

                            {/* Line Chart */}
                            <div className="border border-slate-800 rounded-2xl p-5 bg-slate-900/5">
                                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider mb-4">Historical Scanning Analytics</h3>
                                <div className="relative h-64 w-full">
                                    <Line data={chartData.data} options={chartData.options} />
                                </div>
                            </div>

                            {/* Scan History Table */}
                            <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/5">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-900 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/30">
                                            <th className="py-3.5 px-5">Content Source</th>
                                            <th className="py-3.5 px-5">Type</th>
                                            <th className="py-3.5 px-5">Credibility</th>
                                            <th className="py-3.5 px-5">Toxicity</th>
                                            <th className="py-3.5 px-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs divide-y divide-slate-900 dark:divide-slate-800/65">
                                        {historyList.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="py-8 text-center text-slate-500 font-medium">
                                                    No past analyses found. Go to the dashboard to scan an article!
                                                </td>
                                            </tr>
                                        ) : (
                                            historyList.map(item => {
                                                const date = new Date(item.createdAt).toLocaleDateString(undefined, {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                });
                                                return (
                                                    <tr key={item._id} className="hover:bg-slate-900/30 dark:hover:bg-slate-850/30 transition-colors">
                                                        <td className="py-4 px-5 font-medium text-slate-200">
                                                            <div className="max-w-[280px] truncate" title={item.inputSource}>{item.inputSource || 'Raw Text Content'}</div>
                                                            <div className="text-[10px] text-slate-500 mt-0.5">{date}</div>
                                                        </td>
                                                        <td className="py-4 px-5 text-slate-400 font-medium capitalize">
                                                            {item.inputType === 'url' ? 'URL' : 'Text'}
                                                        </td>
                                                        <td className="py-4 px-5">
                                                            {item.prediction === 'REAL' ? (
                                                                <span className="text-[11px] font-bold text-emerald-450 dark:text-emerald-400 inline-flex items-center gap-1">
                                                                    <Check className="w-3 h-3 stroke-[3]" /> {item.credibilityScore}% Real
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] font-bold text-rose-450 inline-flex items-center gap-1">
                                                                    <X className="w-3 h-3 stroke-[3]" /> {item.credibilityScore}% Fake
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-5">
                                                            {item.containsProfanity ? (
                                                                <span className="px-2.5 py-1 text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full inline-flex items-center gap-1">
                                                                    Toxic
                                                                </span>
                                                            ) : (
                                                                <span className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full inline-flex items-center gap-1">
                                                                    Clean
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-5 text-right flex justify-end gap-1">
                                                            <button 
                                                                onClick={() => setSelectedItem(item)} 
                                                                className="p-2 text-slate-400 hover:text-cyan-400 transition-all hover:scale-110" 
                                                                title="View details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteHistory(item._id)} 
                                                                className="p-2 text-slate-400 hover:text-rose-500 transition-all hover:scale-110" 
                                                                title="Delete from history"
                                                            >
                                                                <Trash className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Preferences & API */}
                    {activeTab === 3 && (
                        <div className="glassmorphism p-6 sm:p-8 rounded-3xl shadow-xl border-slate-800 space-y-6">
                            <div className="border-b border-slate-900/60 dark:border-slate-800/40 pb-4">
                                <h2 className="text-xl font-bold tracking-tight text-slate-100 light:text-slate-900">Preferences & API</h2>
                                <p className="text-slate-400 text-xs mt-1">Configure layout preferences and generate SaaS API credentials.</p>
                            </div>

                            {/* System Preferences */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-200">System Preferences</h3>
                                <div className="border border-slate-800 rounded-2xl p-5 bg-slate-900/5 space-y-4 text-xs">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p class="font-bold text-slate-200">Application Color Theme</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Toggle between Dark Mode and Light Mode settings.</p>
                                        </div>
                                        <button 
                                            onClick={toggleTheme} 
                                            className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl font-semibold transition-all"
                                        >
                                            {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-900/40 dark:border-slate-800/30 pt-4">
                                        <div>
                                            <p className="font-bold text-slate-200">Email Scan Reports</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Receive weekly reports summarizing news scans and toxic content flags.</p>
                                        </div>
                                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-900 border-slate-800 cursor-pointer" />
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-900/40 dark:border-slate-800/30 pt-4">
                                        <div>
                                            <p className="font-bold text-slate-200">Security Alerts</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Get notified immediately upon logins from new devices/IP addresses.</p>
                                        </div>
                                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-900 border-slate-800 cursor-pointer" />
                                    </div>
                                </div>
                            </div>

                            {/* SaaS API credentials */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-200">Developer API Key</h3>
                                <div className="border border-slate-800 rounded-2xl p-5 bg-slate-900/5 space-y-4 text-xs">
                                    <div>
                                        <p className="font-bold text-slate-200">Personal API Key</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            Integrate VeritasAI's fact-checking and profanity-validation engines into your own application or CMS.
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            readOnly 
                                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-355 text-xs font-mono focus:outline-none" 
                                            placeholder="No API key generated yet" 
                                            value={apiKey}
                                        />
                                        <button 
                                            onClick={handleCopyApiKey} 
                                            className="px-4 py-3 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 min-w-[90px]"
                                        >
                                            {copySuccess ? <Check className="w-4 h-4 text-emerald-450" /> : <Copy className="w-4 h-4" />}
                                            <span>{copySuccess ? 'Copied' : 'Copy'}</span>
                                        </button>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={handleGenerateApiKey} 
                                            className="py-2.5 px-4 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-xl text-[10px] font-bold tracking-wide transition-all hover:scale-102"
                                        >
                                            Generate Key
                                        </button>
                                        {apiKey && (
                                            <button 
                                                onClick={handleRevokeApiKey} 
                                                className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/25 rounded-xl text-[10px] font-bold tracking-wide transition-all hover:scale-102"
                                            >
                                                Revoke Key
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>

            {/* Permanent Account Deletion Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-md glassmorphism rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800 shadow-2xl relative">
                        <button 
                            className="absolute top-6 right-6 text-slate-450 hover:text-slate-200 transition-colors"
                            onClick={() => setDeleteModalOpen(false)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="space-y-2 text-center">
                            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
                            <h3 className="text-xl font-bold text-rose-500">Delete Account Permanently</h3>
                            <p className="text-xs text-slate-400 leading-normal">
                                This action is permanent and deletes all scans history, credits, and reputation metrics from the server.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                    Type "DELETE" to confirm
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-850 rounded-xl text-center text-slate-200 text-sm font-bold uppercase placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                                    placeholder="DELETE"
                                    value={deleteConfirm}
                                    onChange={(e) => setDeleteConfirm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setDeleteModalOpen(false)} 
                                    className="w-1/2 py-3 bg-slate-900 border border-slate-800 text-slate-350 hover:text-slate-100 rounded-xl text-xs font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirm !== 'DELETE'}
                                    className="w-1/2 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Scan details modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-2xl glassmorphism rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative border-slate-850">
                        <button 
                            className="absolute top-6 right-6 text-slate-450 hover:text-slate-200 transition-colors"
                            onClick={() => setSelectedItem(null)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="border-b border-slate-900/60 dark:border-slate-800/40 pb-3">
                            <h3 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                                Analysis Details
                            </h3>
                            <p className="text-[10px] text-slate-500 mt-1">
                                Scanned on {new Date(selectedItem.createdAt).toLocaleString()}
                            </p>
                        </div>
                        
                        {/* Gauges */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="glassmorphism p-4 rounded-xl flex items-center justify-between border-slate-850">
                                <div>
                                    <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider block">Credibility Prediction</span>
                                    <span className={`text-base font-extrabold ${selectedItem.prediction === 'REAL' ? 'text-emerald-400' : 'text-rose-500'}`}>
                                        {selectedItem.prediction}
                                    </span>
                                </div>
                                <span className="text-lg font-black text-slate-200">{selectedItem.credibilityScore}%</span>
                            </div>
                            <div className="glassmorphism p-4 rounded-xl flex items-center justify-between border-slate-850">
                                <div>
                                    <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider block">Toxicity Verdict</span>
                                    <span className={`text-base font-extrabold ${selectedItem.containsProfanity ? 'text-rose-500' : 'text-emerald-450'}`}>
                                        {selectedItem.containsProfanity ? 'TOXIC' : 'CLEAN'}
                                    </span>
                                </div>
                                <span className="text-lg font-black text-slate-200">
                                    {selectedItem.containsProfanity ? Math.min(100, selectedItem.profanityCount * 20) : 0}%
                                </span>
                            </div>
                        </div>

                        {/* Source link */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Source or Text Snippet</h4>
                            <div className="p-3 bg-slate-900/50 dark:bg-slate-950/40 border border-slate-850 rounded-xl text-slate-350 text-xs select-all break-all leading-normal">
                                {selectedItem.inputSource || 'Self-Pasted Text Snippet'}
                            </div>
                        </div>
                        
                        {/* Validation markup text */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Validated Text Highlights</h4>
                            <div 
                                className="p-4 bg-slate-900/40 dark:bg-slate-950/20 border border-slate-850 rounded-2xl text-slate-300 text-xs leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: highlightedModalText }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            {toast.show && (
                <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 p-4 rounded-2xl border shadow-2xl glassmorphism pointer-events-auto transition-all duration-300 max-w-sm">
                    <span className="text-xs font-semibold leading-relaxed text-slate-200">{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default Profile;
