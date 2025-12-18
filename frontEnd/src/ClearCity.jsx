import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Home, BarChart3, Plus, Map as MapIcon, User, Sun, Moon, Leaf } from 'lucide-react';

import api from './services/api';

import HomePage from './components/HomePage';
import MapPage from './components/MapPage';
import ReportPage from './components/ReportPage';
import ProfilePage from './components/ProfilePage';
import AdminPage from './components/AdminPage';
import AdminManagement from './components/AdminManagement';

const PrimaryButton = ({ children, onClick, className = "" }) => (
  <button onClick={onClick} className={`bg-[#0df259] text-[#102216] font-bold rounded-xl py-3 px-6 shadow-[0_0_20px_rgba(13,242,89,0.3)] hover:shadow-[0_0_30px_rgba(13,242,89,0.5)] transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${className}`}>
    {children}
  </button>
);

export default function ClearCity() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [reports, setReports] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState(null);
  
  const [email, setEmail] = useState('alex@demo.com');
  const [password, setPassword] = useState('password');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Load data when logged in
  useEffect(() => {
    if (isLoggedIn) {
      loadReports();
      loadLeaderboard();
    }
  }, [isLoggedIn]);

  const loadReports = async () => {
    try {
      const data = await api.reports.getAll();
      
      const formattedReports = data.map(report => ({
        id: report.id,
        lat: parseFloat(report.latitude),
        lng: parseFloat(report.longitude),
        status: report.status,
        userId: report.user_id === currentUser?.id ? 'current' : 'other',
        type: report.type || 'Raport Nou',
        description: report.description || 'Fără descriere',
        date: formatDate(report.created_at),
        user: report.user_name || 'Anonim',
        image: report.image_url ? `http://localhost:5000${report.image_url}` : null,
        location_name: report.location_name
      }));
      
      setReports(formattedReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await api.user.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Chiar acum';
    if (diffMins < 60) return `${diffMins}min în urmă`;
    if (diffHours < 24) return `${diffHours}h în urmă`;
    if (diffDays < 7) return `${diffDays} zile în urmă`;
    return date.toLocaleDateString('ro-RO');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      let data;
      
      if (isRegistering) {
        data = await api.auth.register(name, email, password);
      } else {
        data = await api.auth.login(email, password);
      }
      
      setIsLoggedIn(true);
      setCurrentUser(data.user);
      
    } catch (error) {
      setError(error.message || 'Eroare la autentificare');
      console.error('Auth error:', error);
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setReports([]);
    setLeaderboard([]);
  };

  const handleReportSubmit = async (reportData) => {
    try {
      const result = await api.reports.create(reportData);
      
      if (result.classification && !result.classification.isWaste) {
        alert('⚠️ Imaginea nu conține deșeuri conform AI. Raportul nu a fost salvat.');
        return;
      }
      
      await loadReports();
      
      const newReport = {
        lat: parseFloat(result.report.latitude),
        lng: parseFloat(result.report.longitude)
      };
      
      setMapCenter([newReport.lat, newReport.lng]);
      
      alert(`✅ Raport trimis! AI a detectat: ${result.classification?.wasteType} (${Math.round(result.classification?.confidence * 100)}% încredere)`);
      
    } catch (error) {
      console.error('Error creating report:', error);
      alert('❌ ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#102216] flex items-center justify-center">
        <div className="text-white text-xl">Se încarcă...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen relative flex items-center justify-center p-4 overflow-hidden ${darkMode ? 'bg-[#102216] text-white' : 'bg-[#f5f8f6] text-slate-900'}`}>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[40%] bg-[#0df259]/10 rounded-full blur-[80px]"></div>
            <div className="absolute -bottom-[10%] -left-[10%] w-[60%] h-[40%] bg-[#0df259]/5 rounded-full blur-[80px]"></div>
            <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(13, 242, 89, 0.15) 1px, transparent 0)', backgroundSize: '24px 24px'}}></div>
        </div>
        
        <div className="w-full max-w-[400px] flex flex-col gap-6 z-10 animate-in fade-in zoom-in duration-500">
             <div className="flex flex-col items-center justify-center pt-8 pb-4">
                <div className="relative flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-[#0df259]/20 to-transparent border border-white/10 mb-4 backdrop-blur-md shadow-[0_0_15px_rgba(13,242,89,0.15)] animate-pulse">
                     <Leaf className="text-[#0df259] w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-center">ClearCity România</h2>
            </div>
            
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                    {isRegistering ? 'Crează Cont' : 'Bine ai revenit'}
                </h1>
                <p className="text-gray-400 text-sm">Pentru o România curată, pas cu pas.</p>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            
            <form onSubmit={handleAuth} className="flex flex-col gap-4">
                {isRegistering && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2">
                        <label className="text-xs font-medium text-[#0df259] ml-1 uppercase tracking-wider">Nume Complet</label>
                        <input 
                          type="text" 
                          placeholder="Ion Popescu" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className={`block w-full rounded-xl border border-white/10 ${darkMode ? 'bg-[#1A2C20]/80 text-white' : 'bg-white text-black'} py-3.5 px-4 focus:border-[#0df259] focus:ring-1 focus:ring-[#0df259] focus:outline-none`} 
                        />
                    </div>
                )}
                
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#0df259] ml-1 uppercase tracking-wider">Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`block w-full rounded-xl border border-white/10 ${darkMode ? 'bg-[#1A2C20]/80 text-white' : 'bg-white text-black'} py-3.5 px-4 focus:border-[#0df259] focus:ring-1 focus:ring-[#0df259] focus:outline-none`} 
                    />
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#0df259] ml-1 uppercase tracking-wider">Parolă</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`block w-full rounded-xl border border-white/10 ${darkMode ? 'bg-[#1A2C20]/80 text-white' : 'bg-white text-black'} py-3.5 px-4 focus:border-[#0df259] focus:ring-1 focus:ring-[#0df259] focus:outline-none`} 
                    />
                </div>
                
                <PrimaryButton className="mt-4 w-full">
                  {isRegistering ? 'Înregistrează-te' : 'Autentificare'}
                </PrimaryButton>
            </form>
            
            <div className="text-center">
                <button 
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                  }} 
                  className="text-sm text-gray-400 hover:text-[#0df259] transition-colors"
                >
                    {isRegistering ? 'Ai deja cont? Autentifică-te' : 'Nu ai cont? Creează unul acum'}
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className={`min-h-screen font-sans ${darkMode ? 'bg-[#102216] text-white' : 'bg-[#f5f8f6] text-slate-900'} transition-colors duration-300 pb-20 md:pb-0`}>
        
        {/* DESKTOP HEADER */}
        <header className={`hidden md:flex sticky top-0 z-30 ${darkMode ? 'bg-[#102216]/90 border-white/5' : 'bg-[#f5f8f6]/90 border-gray-200'} backdrop-blur-md px-6 py-4 items-center justify-between border-b`}>
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Salutare,</span>
              <h1 className="text-2xl font-bold tracking-tight">{currentUser?.name}</h1>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}>
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <NavLink to="/" className={({isActive}) => `px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive ? 'bg-[#0df259]/10 text-[#0df259] border border-[#0df259]/20' : 'text-gray-400 hover:text-gray-200'}`}>Acasă</NavLink>
                <NavLink to="/map" className={({isActive}) => `px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive ? 'bg-[#0df259]/10 text-[#0df259] border border-[#0df259]/20' : 'text-gray-400 hover:text-gray-200'}`}>Harta</NavLink>
                <NavLink to="/report" className={({isActive}) => `px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive ? 'bg-[#0df259]/10 text-[#0df259] border border-[#0df259]/20' : 'text-gray-400 hover:text-gray-200'}`}>Report</NavLink>
                <NavLink to="/profile" className={({isActive}) => `px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive ? 'bg-[#0df259]/10 text-[#0df259] border border-[#0df259]/20' : 'text-gray-400 hover:text-gray-200'}`}>Profil</NavLink>
                {currentUser?.role === 'admin' && (
                  <>
                    <NavLink to="/admin" className={({isActive}) => `px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive ? 'bg-[#0df259]/10 text-[#0df259] border border-[#0df259]/20' : 'text-gray-400 hover:text-gray-200'}`}>Stats</NavLink>
                    <NavLink to="/admin/users" className={({isActive}) => `px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive ? 'bg-[#0df259]/10 text-[#0df259] border border-[#0df259]/20' : 'text-gray-400 hover:text-gray-200'}`}>Admini</NavLink>
                  </>
                )}
            </div>
        </header>

        {/* MOBILE HEADER */}
        <header className={`md:hidden sticky top-0 z-30 ${darkMode ? 'bg-[#102216]/90 border-white/5' : 'bg-[#f5f8f6]/90 border-gray-200'} backdrop-blur-md px-4 py-4 flex items-center justify-between border-b`}>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center size-8 rounded-lg bg-[#0df259]/20 border border-white/10">
                <Leaf className="text-[#0df259] w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">ClearCity</span>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
        </header>

        {/* ROUTES */}
        <main className="flex flex-col w-full min-h-[calc(100vh-80px)]">
            <Routes>
                <Route path="/" element={<HomePage darkMode={darkMode} leaderboard={leaderboard} />} />
                <Route path="/map" element={<MapPage darkMode={darkMode} reports={reports} externalCenter={mapCenter} />} />
                <Route path="/report" element={<ReportPage darkMode={darkMode} onReportSubmit={handleReportSubmit} currentUser={currentUser} />} />
                <Route path="/profile" element={<ProfilePage currentUser={currentUser} darkMode={darkMode} reports={reports} onLogout={handleLogout} onReportsUpdate={loadReports} />} />
                {currentUser?.role === 'admin' && (
                  <>
                    <Route path="/admin" element={<AdminPage darkMode={darkMode} />} />
                    <Route path="/admin/users" element={<AdminManagement darkMode={darkMode} />} />
                  </>
                )}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </main>

        {/* BOTTOM NAV (MOBILE) */}
        <nav className={`md:hidden fixed bottom-0 left-0 w-full z-[1100] pb-safe ${darkMode ? 'bg-[#102216]/90 border-t border-white/5' : 'bg-white/90 border-t border-gray-200'} backdrop-blur-lg`}>
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
                <NavLink to="/" className={({isActive}) => `flex-1 flex flex-col items-center justify-center gap-1 group transition-colors ${isActive ? 'text-[#0df259]' : 'text-gray-500'}`}>
                  <Home className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Acasă</span>
                </NavLink>
                {currentUser?.role === 'admin' ? (
                  <NavLink to="/admin" className={({isActive}) => `flex-1 flex flex-col items-center justify-center gap-1 group transition-colors ${isActive ? 'text-[#0df259]' : 'text-gray-500'}`}>
                    <BarChart3 className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Admin</span>
                  </NavLink>
                ) : (
                  <div className="flex-1"></div>
                )}
                <div className="relative -top-5">
                  <NavLink to="/report" className="w-14 h-14 rounded-full bg-[#0df259] flex items-center justify-center shadow-[0_0_15px_rgba(13,242,89,0.5)] text-[#102216] border-4 border-[#102216]">
                    <Plus className="w-8 h-8" strokeWidth={3} />
                  </NavLink>
                </div>
                <NavLink to="/map" className={({isActive}) => `flex-1 flex flex-col items-center justify-center gap-1 group transition-colors ${isActive ? 'text-[#0df259]' : 'text-gray-500'}`}>
                  <MapIcon className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Harta</span>
                </NavLink>
                <NavLink to="/profile" className={({isActive}) => `flex-1 flex flex-col items-center justify-center gap-1 group transition-colors ${isActive ? 'text-[#0df259]' : 'text-gray-500'}`}>
                  <User className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Profil</span>
                </NavLink>
            </div>
        </nav>
      </div>
    </Router>
  );
}