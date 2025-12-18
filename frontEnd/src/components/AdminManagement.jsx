import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, UserMinus, X, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const GlassCard = ({ children, className = "", darkMode }) => (
  <div className={`${darkMode ? 'bg-[#1A2C20]/80 border-white/5' : 'bg-white border-gray-100'} backdrop-blur-md border rounded-2xl shadow-sm transition-all duration-300 ${className}`}>
    {children}
  </div>
);

export default function AdminManagement({ darkMode }) {
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPromoteModal, setShowPromoteModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [adminData, allUsers] = await Promise.all([
        api.admin.getAdmins(),
        api.admin.getAllUsers()
      ]);
      
      setAdmins(adminData);
      
      // Filtrează doar useri normali
      const normalUsers = allUsers.filter(u => u.role === 'user');
      setUsers(normalUsers);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('❌ Eroare la încărcarea datelor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (email, name) => {
    if (!window.confirm(`Sigur vrei să promovezi "${name}" la admin?\n\nAcest user va avea acces la toate funcțiile admin.`)) return;

    try {
      await api.admin.promoteToAdmin(email);
      alert(`✅ ${name} a fost promovat la admin cu succes!`);
      setShowPromoteModal(false);
      loadData();
    } catch (error) {
      alert('❌ Eroare: ' + error.message);
    }
  };

  const handleDemote = async (email, name) => {
    if (admins.length <= 1) {
      alert('⚠️ Nu poți demite ultimul admin!\n\nTrebuie să existe cel puțin un admin în sistem.');
      return;
    }

    if (!window.confirm(`Sigur vrei să demiți pe "${name}"?\n\nAcest user va deveni user normal și va pierde accesul admin.`)) return;

    try {
      await api.admin.demoteAdmin(email);
      alert(`✅ ${name} a fost demis din admin cu succes!`);
      loadData();
    } catch (error) {
      alert('❌ Eroare: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0df259] mx-auto mb-4"></div>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Se încarcă datele...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-6 pt-4 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#0df259]/10 rounded-xl">
            <Shield className="w-8 h-8 text-[#0df259]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Management Admini</h1>
            <p className="text-sm text-gray-500">Administrează accesul la panoul de admin</p>
          </div>
        </div>
        <button
          onClick={() => setShowPromoteModal(true)}
          className="flex items-center gap-2 px-4 py-3 bg-[#0df259] text-[#102216] rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
        >
          <UserPlus className="w-5 h-5" />
          Adaugă Admin
        </button>
      </div>

      {/* Warning dacă e un singur admin */}
      {admins.length === 1 && (
        <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-yellow-500 text-sm">Atenție: Un singur admin în sistem</p>
            <p className="text-xs text-gray-500 mt-1">
              Recomandăm să aveți cel puțin 2 admini pentru siguranță. Adminul unic nu poate fi demis.
            </p>
          </div>
        </div>
      )}

      {/* Lista Admini */}
      <GlassCard darkMode={darkMode} className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0df259]" />
            Admini Activi
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
            {admins.length} {admins.length === 1 ? 'admin' : 'admini'}
          </span>
        </div>

        <div className="space-y-3">
          {admins.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Nu există admini în sistem</p>
            </div>
          ) : (
            admins.map(admin => (
              <div
                key={admin.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0df259] to-green-600 flex items-center justify-center text-[#102216] font-bold text-lg shadow-lg">
                    {admin.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{admin.name}</p>
                    <p className="text-sm text-gray-500">{admin.email}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      📅 Creat: {new Date(admin.created_at).toLocaleDateString('ro-RO', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                {admins.length > 1 ? (
                  <button
                    onClick={() => handleDemote(admin.email, admin.name)}
                    className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-bold border border-red-500/20"
                  >
                    <UserMinus className="w-4 h-4" />
                    Demite
                  </button>
                ) : (
                  <div className={`px-4 py-2 rounded-lg text-xs font-bold ${darkMode ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                    Admin Principal
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {/* Statistici rapide */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <GlassCard darkMode={darkMode} className="p-4 text-center">
          <Shield className="w-6 h-6 text-[#0df259] mx-auto mb-2" />
          <p className="text-2xl font-bold">{admins.length}</p>
          <p className="text-xs text-gray-500">Admini Activi</p>
        </GlassCard>
        <GlassCard darkMode={darkMode} className="p-4 text-center">
          <UserPlus className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{users.length}</p>
          <p className="text-xs text-gray-500">Useri Normali</p>
        </GlassCard>
        <GlassCard darkMode={darkMode} className="p-4 text-center col-span-2 md:col-span-1">
          <div className="w-6 h-6 bg-gradient-to-r from-[#0df259] to-blue-500 rounded-full mx-auto mb-2"></div>
          <p className="text-2xl font-bold">{admins.length + users.length}</p>
          <p className="text-xs text-gray-500">Total Utilizatori</p>
        </GlassCard>
      </div>

      {/* Modal Promovare */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <GlassCard darkMode={darkMode} className="w-full max-w-lg p-6 relative max-h-[80vh] flex flex-col">
            <button
              onClick={() => setShowPromoteModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <UserPlus className="text-[#0df259]" />
              Promovează la Admin
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Selectează un user pentru a-i acorda acces admin
            </p>

            <div className="space-y-3 overflow-y-auto flex-1">
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <UserMinus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">Nu există useri disponibili</p>
                  <p className="text-xs text-gray-600">Toți userii sunt deja admini</p>
                </div>
              ) : (
                users.map(user => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group ${darkMode ? 'bg-white/5 border-white/10 hover:border-[#0df259]/50 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:border-[#0df259]/50 hover:bg-gray-100'}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-600">Nivel {user.level}</span>
                          <span className="text-xs text-gray-600">•</span>
                          <span className="text-xs text-gray-600">{user.total_reports || 0} rapoarte</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePromote(user.email, user.name)}
                      className="px-4 py-2 bg-[#0df259] text-[#102216] rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shrink-0 ml-3"
                    >
                      Promovează
                    </button>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}