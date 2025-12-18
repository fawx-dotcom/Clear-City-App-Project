import React, { useState, useEffect } from 'react';
import { MapPin, Award, X, Lock, Camera, Edit2, LogOut, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const GlassCard = ({ children, className = "", onClick, darkMode }) => (
  <div onClick={onClick} className={`${darkMode ? 'bg-[#1A2C20]/80 border-white/5' : 'bg-white border-gray-100'} backdrop-blur-md border rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#0df259]/30 ${className}`}>
    {children}
  </div>
);

export default function ProfilePage({ currentUser, darkMode, reports, onLogout, onReportsUpdate }) {
  const [showAchievements, setShowAchievements] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.user.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Imaginea este prea mare! Maxim 10MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Te rog selectează o imagine validă!');
      return;
    }

    setUploadingImage(true);

    try {
      const result = await api.user.uploadProfileImage(file);
      setProfile(prev => ({ ...prev, profile_image: result.profile_image }));
      
      // Update localStorage
      const savedUser = JSON.parse(localStorage.getItem('user'));
      savedUser.profile_image = result.profile_image;
      localStorage.setItem('user', JSON.stringify(savedUser));
      
      alert('✅ Poza de profil a fost actualizată!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('❌ ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Sigur vrei să ștergi acest raport?')) return;

    try {
      await api.reports.delete(reportId);
      alert('✅ Raportul a fost șters!');
      if (onReportsUpdate) onReportsUpdate();
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('❌ ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto p-4 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0df259] mx-auto mb-4"></div>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Se încarcă profilul...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full max-w-md mx-auto p-4 flex items-center justify-center h-96">
        <p className="text-red-400">Eroare la încărcarea profilului</p>
      </div>
    );
  }

  const userReports = reports.filter(r => r.userId === 'current');
  const maxXp = (profile.level + 1) * (profile.level + 1) * 100;
  const xpProgress = (profile.xp % maxXp) / maxXp * 100;

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-6 pt-4 h-full relative">
        <section className="flex flex-col items-center pt-2">
            <div className="relative group cursor-pointer">
                <div 
                  className={`w-28 h-28 rounded-2xl bg-cover bg-center shadow-lg ring-4 transition-transform group-hover:scale-105 ${darkMode ? 'ring-[#1A2C20]' : 'ring-white'}`}
                  style={{
                    backgroundImage: profile.profile_image 
                      ? (profile.profile_image.startsWith('http') ? `url('${profile.profile_image}')` : `url('${API_URL}${profile.profile_image}')`)
                      : `url('https://i.pravatar.cc/150?u=${profile.id}')`
                  }}
                ></div>
                
                <label className={`absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer ${uploadingImage ? 'opacity-100' : ''}`}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  {uploadingImage ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors">
                      <Camera className="w-5 h-5" />
                    </button>
                  )}
                </label>
                
                <div className={`absolute -bottom-2 -right-2 bg-[#0df259] text-black text-xs font-bold px-2 py-1 rounded-full shadow-sm border-2 ${darkMode ? 'border-[#102216]' : 'border-white'}`}>
                  Nivel {profile.level}
                </div>
            </div>
            
            <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight">{profile.name}</h2>
                    <button className={`p-1 rounded-full ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-gray-500 text-sm mt-1 flex items-center justify-center gap-1">
                  <MapPin className="w-4 h-4" /> 
                  {profile.location || 'București, RO'}
                </p>
            </div>
        </section>

        <GlassCard darkMode={darkMode} className="p-5 border-[#0df259]/20">
            <div className="flex justify-between items-end mb-3">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-gray-500">Nivel Curent</span>
                  <h3 className="text-xl font-bold">Nivel {profile.level}: Eco-Warrior</h3>
                </div>
                <div className="text-right">
                  <span className="text-[#0df259] font-bold text-lg">{profile.xp.toLocaleString()}</span>
                  <span className="text-gray-500 text-xs font-medium"> / {maxXp.toLocaleString()} XP</span>
                </div>
             </div>
            <div className={`w-full rounded-full h-3 mb-4 overflow-hidden ${darkMode ? 'bg-black/40' : 'bg-gray-200'}`}>
              <div className="bg-[#0df259] h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${xpProgress}%` }}></div>
            </div>
            
            {/* Statistici */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className={`text-center p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                <p className="text-2xl font-bold text-[#0df259]">{profile.total_reports || 0}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className={`text-center p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                <p className="text-2xl font-bold text-green-400">{profile.resolved_reports || 0}</p>
                <p className="text-xs text-gray-500">Rezolvate</p>
              </div>
              <div className={`text-center p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                <p className="text-2xl font-bold text-yellow-400">{profile.pending_reports || 0}</p>
                <p className="text-xs text-gray-500">În Așteptare</p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowAchievements(true)} 
              className={`w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 border transition-colors ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              <Award className="w-4 h-4 text-[#0df259]" /> 
              Vezi Realizări ({profile.achievements?.length || 0})
            </button>
       </GlassCard>

       {/* Modal Achievements */}
       {showAchievements && (
           <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
               <GlassCard darkMode={darkMode} className="w-full max-w-sm p-6 relative">
                    <button onClick={() => setShowAchievements(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10">
                      <X className="w-6 h-6" />
                    </button>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Award className="text-[#0df259]" /> Realizări
                    </h3>
                   <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                       {profile.achievements && profile.achievements.length > 0 ? (
                         profile.achievements.map(ach => (
                           <div 
                             key={ach.achievement_id} 
                             className={`flex items-center gap-4 p-3 rounded-xl border ${darkMode ? 'bg-[#0df259]/10 border-[#0df259]/30' : 'bg-[#0df259]/5 border-[#0df259]/20'}`}
                           >
                             <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-[#0df259] text-black text-2xl">
                               🏆
                             </div>
                             <div>
                               <h4 className="font-bold text-sm">{ach.achievement_title}</h4>
                               <p className="text-xs text-gray-500">{ach.achievement_description}</p>
                               <p className="text-[10px] text-gray-600 mt-1">
                                 {new Date(ach.unlocked_at).toLocaleDateString('ro-RO')}
                               </p>
                             </div>
                           </div>
                         ))
                       ) : (
                         <p className="text-center text-gray-500 py-8">Nu ai încă realizări. Continuă să raportezi!</p>
                       )}
                    </div>
               </GlassCard>
           </div>
       )}

       <section className="flex-grow flex flex-col min-h-0">
           <div className="flex items-center justify-between mb-3 px-1">
             <h3 className="text-lg font-bold">Istoric Sesizări</h3>
             <span className={`text-xs font-bold px-2 py-1 rounded-full ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
               {userReports.length}
             </span>
           </div>
           <div className="flex flex-col gap-3 overflow-y-auto pb-4 pr-1">
                {userReports.length === 0 ? (
                  <GlassCard darkMode={darkMode} className="p-6 text-center">
                    <p className="text-gray-500">Nu ai încă rapoarte. Creează primul tău raport!</p>
                  </GlassCard>
                ) : (
                  userReports.map(report => (
                    <GlassCard key={report.id} darkMode={darkMode} className="p-3 flex items-center gap-4 hover:border-[#0df259]/40 cursor-pointer group relative">
                        <div 
                          className={`w-16 h-16 rounded-lg bg-cover bg-center shrink-0 border ${darkMode ? 'border-white/10' : 'border-gray-200'}`}
                          style={{
                            backgroundImage: report.image ? `url(${report.image})` : 'none', 
                            backgroundColor: darkMode ? '#333' : '#eee'
                          }}
                        >
                          {!report.image && <Camera className="w-6 h-6 m-auto h-full text-gray-400 opacity-50" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-start">
                               <h4 className="font-bold text-sm truncate">{report.type}</h4>
                               <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ml-2 ${
                                 report.status === 'resolved' ? 'bg-[#0df259]/20 text-[#0df259]' : 
                                 report.status === 'in_progress' ? 'bg-yellow-400/20 text-yellow-400' :
                                 'bg-blue-400/20 text-blue-400'
                               }`}>
                                 {report.status === 'resolved' ? 'Rezolvat' : report.status === 'in_progress' ? 'În Lucru' : 'Pending'}
                               </span>
                             </div>
                              <p className="text-xs text-gray-500 truncate mt-1">{report.description}</p>
                             <p className="text-[10px] text-gray-600 mt-1">{report.date}</p>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(report.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                    </GlassCard>
                  ))
                )}
           </div>
       </section>
       
       <button 
         onClick={handleLogoutClick} 
         className={`mt-auto w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition-all active:scale-[0.98] ${darkMode ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-red-200 text-red-500 hover:bg-red-50'}`}
       >
         <LogOut className="w-5 h-5" /> Deconectare
       </button>
    </div>
  );
}