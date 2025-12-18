import React, { useState, useEffect } from 'react';
import { Users, Activity, TrendingUp, Clock } from 'lucide-react';
import api from '../services/api';

const GlassCard = ({ children, className = "", onClick, darkMode }) => (
  <div onClick={onClick} className={`${darkMode ? 'bg-[#1A2C20]/80 border-white/5' : 'bg-white border-gray-100'} backdrop-blur-md border rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#0df259]/30 ${className}`}>
    {children}
  </div>
);

const StatBar = ({ value, label, max, active, darkMode }) => (
    <div className="flex flex-col items-center gap-2 flex-1 group h-full justify-end">
      <div className={`w-full rounded-t-md relative flex items-end overflow-hidden transition-all duration-500 ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'} h-full`}>
        <div className={`w-full rounded-t-md transition-all duration-1000 ${active ? 'bg-[#0df259] shadow-[0_0_15px_rgba(13,242,89,0.4)]' : (darkMode ? 'bg-[#0df259]/30' : 'bg-[#0df259]/50')}`} style={{ height: `${(value / max) * 100}%` }}></div>
      </div>
      <span className={`text-xs font-semibold ${active ? 'text-[#0df259]' : (darkMode ? 'text-slate-400' : 'text-slate-500')}`}>{label}</span>
    </div>
);

const DonutSegment = ({ color, percent, offset }) => {
    const circumference = 2 * Math.PI * 40;
    const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((offset / 100) * circumference);
    return (<circle r="40" cx="50" cy="50" fill="transparent" stroke={color} strokeWidth="15" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out hover:opacity-80" />);
};

export default function AdminPage({ darkMode }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.admin.getStats();
      setStats(data);
      setError(null);
    } catch (error) {
      console.error('Error loading stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0df259] mx-auto mb-4"></div>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Se încarcă statisticile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <GlassCard darkMode={darkMode} className="p-6 text-center">
          <p className="text-red-400 mb-2">⚠️ Eroare la încărcarea statisticilor</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button 
            onClick={loadStats}
            className="px-4 py-2 bg-[#0df259] text-[#102216] rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            Reîncearcă
          </button>
        </GlassCard>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <GlassCard darkMode={darkMode} className="p-6 text-center">
          <p className="text-gray-500">Nu sunt date disponibile</p>
        </GlassCard>
      </div>
    );
  }

  // Calculează statusurile pentru carduri
  const statusData = stats.reportsByStatus.reduce((acc, item) => {
    acc[item.status] = parseInt(item.count);
    return acc;
  }, {});

  const pendingCount = statusData.pending || 0;
  const inProgressCount = statusData.in_progress || 0;
  const resolvedCount = statusData.resolved || 0;

  // Calculează rata de rezolvare
  const resolutionRate = stats.totalReports > 0 
    ? Math.round((resolvedCount / stats.totalReports) * 100) 
    : 0;

  // Pregătește datele pentru graficul săptămânal
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const today = new Date().getDay();
  const activityData = Array(7).fill(0);
  
  stats.recentActivity.forEach(activity => {
    const date = new Date(activity.date);
    const dayIndex = date.getDay();
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Ajustare pentru luni = 0
    activityData[adjustedIndex] = parseInt(activity.count);
  });

  const maxActivity = Math.max(...activityData, 1);
  const currentDayIndex = today === 0 ? 6 : today - 1;

  // Calculează datele pentru donut (tipuri de deșeuri)
  const wasteTypes = stats.reportsByType.slice(0, 4); // Top 4
  const totalWasteReports = wasteTypes.reduce((sum, item) => sum + parseInt(item.count), 0);
  
  const donutData = wasteTypes.map((item, index) => {
    const colors = ['#0df259', '#3b82f6', '#f59e0b', '#ef4444'];
    const percent = totalWasteReports > 0 ? (parseInt(item.count) / totalWasteReports) * 100 : 0;
    const offset = wasteTypes.slice(0, index).reduce((sum, i) => 
      sum + (totalWasteReports > 0 ? (parseInt(i.count) / totalWasteReports) * 100 : 0), 0
    );
    return { type: item.type, percent, offset, color: colors[index], count: item.count };
  });

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col gap-6 pt-4">
        {/* Cards superioare */}
        <div className="grid grid-cols-2 gap-4">
            <GlassCard darkMode={darkMode} className="p-4 flex flex-col justify-between h-[140px]">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Users className="text-blue-500 w-5 h-5"/>
                  </div>
                  <span className="flex items-center text-xs font-bold text-[#0df259] bg-[#0df259]/10 px-2 py-1 rounded-full">
                    Activ
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-bold tracking-tight">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-sm font-medium text-gray-500">Utilizatori Activi</p>
                </div>
            </GlassCard>
            
            <GlassCard darkMode={darkMode} className="p-4 flex flex-col justify-between h-[140px]">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Activity className="text-orange-500 w-5 h-5"/>
                  </div>
                  <span className="flex items-center text-xs font-bold text-[#0df259] bg-[#0df259]/10 px-2 py-1 rounded-full">
                    +{stats.recentActivity.reduce((sum, a) => sum + parseInt(a.count), 0)}
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-bold tracking-tight">{stats.totalReports.toLocaleString()}</p>
                  <p className="text-sm font-medium text-gray-500">Total Rapoarte</p>
                </div>
            </GlassCard>
        </div>

        {/* Grafic activitate săptămânală */}
        <GlassCard darkMode={darkMode} className="p-5">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Activitate Săptămânală</p>
                <h3 className="text-4xl font-bold">
                  {stats.recentActivity.reduce((sum, a) => sum + parseInt(a.count), 0)}
                  <span className="text-sm text-gray-500 font-normal ml-2">sesizări</span>
                </h3>
              </div>
            </div>
            <div className="h-40 flex items-end justify-between gap-2 px-1">
              {activityData.map((val, idx) => (
                <StatBar 
                  key={idx} 
                  value={val} 
                  max={maxActivity} 
                  label={weekDays[idx]} 
                  active={idx === currentDayIndex} 
                  darkMode={darkMode} 
                />
              ))}
            </div>
        </GlassCard>

        {/* Statistici detaliate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipuri Deșeuri */}
            <GlassCard darkMode={darkMode} className="p-5 flex flex-col items-center justify-center">
                <h4 className="text-sm font-bold text-gray-500 mb-4 w-full text-left">Tipuri Deșeuri</h4>
                <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                        {donutData.map((segment, idx) => (
                          <DonutSegment 
                            key={idx}
                            color={segment.color} 
                            percent={segment.percent} 
                            offset={segment.offset} 
                          />
                        ))}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold">{stats.totalReports}</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-4 text-xs justify-center">
                    {donutData.map((segment, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: segment.color}}></div>
                        <span>{segment.type} ({segment.count})</span>
                      </div>
                    ))}
                </div>
            </GlassCard>
            
            {/* Rată Rezolvare */}
            <GlassCard darkMode={darkMode} className="p-5 flex flex-col justify-center">
                <h4 className="text-sm font-bold text-gray-500 mb-4">Rată Rezolvare</h4>
                <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Rezolvate</span>
                        <span className="text-[#0df259]">{resolutionRate}%</span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div className="bg-[#0df259] h-2 rounded-full transition-all duration-1000" style={{width: `${resolutionRate}%`}}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{resolvedCount} din {stats.totalReports}</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>În Lucru</span>
                        <span className="text-yellow-400">
                          {stats.totalReports > 0 ? Math.round((inProgressCount / stats.totalReports) * 100) : 0}%
                        </span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div 
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-1000" 
                          style={{width: `${stats.totalReports > 0 ? (inProgressCount / stats.totalReports) * 100 : 0}%`}}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{inProgressCount} rapoarte</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Timp Mediu Răspuns</span>
                        <span className="text-blue-400">{stats.avgResolutionTime || 0}h</span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div 
                          className="bg-blue-400 h-2 rounded-full transition-all duration-1000" 
                          style={{width: '65%'}}
                        ></div>
                      </div>
                    </div>
                </div>
           </GlassCard>
        </div>

        {/* Card-uri status rapid */}
        <div className="grid grid-cols-3 gap-3">
          <GlassCard darkMode={darkMode} className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{pendingCount}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </GlassCard>
          
          <GlassCard darkMode={darkMode} className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-yellow-400">{inProgressCount}</p>
            <p className="text-xs text-gray-500">În Lucru</p>
          </GlassCard>
          
          <GlassCard darkMode={darkMode} className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-5 h-5 text-[#0df259]" />
            </div>
            <p className="text-2xl font-bold text-[#0df259]">{resolvedCount}</p>
            <p className="text-xs text-gray-500">Rezolvate</p>
          </GlassCard>
        </div>
    </div>
  );
}