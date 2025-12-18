import React from 'react';
import { Leaf, CheckCircle, Trophy, Recycle, Trash2, Info, Battery, ArrowRight } from 'lucide-react';

const GlassCard = ({ children, className = "", onClick, darkMode }) => (
  <div onClick={onClick} className={`${darkMode ? 'bg-[#1A2C20]/80 border-white/5' : 'bg-white border-gray-100'} backdrop-blur-md border rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#0df259]/30 ${className}`}>
    {children}
  </div>
);

const PrimaryButton = ({ children, onClick, className = "", icon: Icon }) => (
  <button onClick={onClick} className={`bg-[#0df259] text-[#102216] font-bold rounded-xl py-3 px-6 shadow-[0_0_20px_rgba(13,242,89,0.3)] hover:shadow-[0_0_30px_rgba(13,242,89,0.5)] transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${className}`}>
    {Icon && <Icon className="w-5 h-5" />}
    {children}
  </button>
);

export default function HomePage({ darkMode, leaderboard = [] }) {
  const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
  
  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <section className="relative w-full h-[320px] group overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" 
             style={{backgroundImage: "url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')"}}>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <div className="relative h-full flex flex-col justify-end p-6 md:p-12 max-w-7xl mx-auto w-full">
            <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0df259]/20 backdrop-blur-sm w-fit border border-[#0df259]/30">
                <Leaf className="text-[#0df259] w-3 h-3 animate-pulse" />
                <span className="text-xs font-bold text-[#0df259] uppercase tracking-wider">Misiune Națională</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mt-2 mb-2 tracking-tight">
                România Curată <br />
                <span className="text-[#0df259]">Începe cu Noi!</span>
            </h1>
            <p className="text-gray-200 text-sm md:text-base font-medium max-w-xl opacity-90">
                O țară mai curată nu e doar un vis, e o responsabilitate comună. Raportează problemele, fii eroul orașului tău și inspiră schimbarea.
            </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-12 py-8 space-y-10">
        <div className={`rounded-2xl p-1 shadow-lg border overflow-hidden relative group transform transition-all hover:scale-[1.01] ${darkMode ? 'bg-gradient-to-br from-[#1A2C20] to-black border-white/10' : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-200'}`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#0df259]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-[#0df259]/20 transition-all"></div>
            <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-transparent relative z-10">
                <div className="flex-1">
                     <div className="flex items-center gap-2 mb-3">
                        <span className="bg-[#0df259] text-black text-xs font-bold px-2 py-0.5 rounded uppercase">Activ Acum</span>
                        <p className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle className="text-[#0df259] w-4 h-4" /> Provocarea Săptămânii
                        </p>
                     </div>
                    <h3 className="text-white text-2xl font-bold mb-2">Reciclează 5 obiecte de plastic</h3>
                    <p className="text-gray-300 text-sm mb-4">Ajută la reducerea poluării în parcurile din România. Fă o poză la punctul de colectare.</p>
                    <div className="flex items-center gap-3 max-w-md">
                        <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                             <div className="bg-[#0df259] h-full rounded-full transition-all duration-1000" style={{ width: '40%' }}></div>
                        </div>
                        <span className="text-sm font-bold text-[#0df259]">2/5</span>
                    </div>
                </div>
                <PrimaryButton className="w-full md:w-auto shrink-0" icon={ArrowRight}>Acceptă Provocarea</PrimaryButton>
            </div>
        </div>

        <section className="relative pt-4">
             <div className="flex items-center gap-4 mb-6">
                 <div className="h-px bg-gray-700 flex-1 opacity-20"></div>
                  <div className="flex items-center gap-2 px-4 py-1 rounded-full border border-[#0df259]/30 bg-[#0df259]/5 shadow-[0_0_15px_rgba(13,242,89,0.1)]">
                     <Trophy className="text-[#0df259] w-5 h-5" />
                     <h3 className="text-lg font-bold text-[#0df259] uppercase tracking-wider">Top Reciclatori</h3>
                  </div>
                 <div className="h-px bg-gray-700 flex-1 opacity-20"></div>
             </div>
             
              <div className="flex flex-col gap-3">
                 {leaderboard.length === 0 ? (
                   <GlassCard darkMode={darkMode} className="p-6 text-center">
                     <p className="text-gray-500">Se încarcă leaderboard-ul...</p>
                   </GlassCard>
                 ) : (
                   leaderboard.slice(0, 10).map((user, index) => (
                     <GlassCard 
                       key={user.id} 
                       darkMode={darkMode} 
                       className={`p-4 flex items-center gap-4 relative overflow-hidden group hover:bg-[#0df259]/5 ${index === 0 ? 'border-[#0df259]/30' : ''}`}
                     >
                       {index === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0df259]"></div>}
                       
                       <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0 ${
                         index === 0 ? 'bg-[#0df259] text-[#102216] shadow-lg shadow-[#0df259]/20 group-hover:scale-110' :
                         index === 1 ? 'bg-gray-400 text-white' :
                         index === 2 ? 'bg-orange-600 text-white' :
                         'bg-gray-700 text-white'
                       } transition-transform`}>
                         {index + 1}
                       </div>
                       
                       <div 
                         className={`w-10 h-10 rounded-full bg-gray-500 bg-cover ${index === 0 ? 'ring-2 ring-[#0df259]/30' : ''}`}
                         style={{
                           backgroundImage: user.profile_image 
                             ? (user.profile_image.startsWith('http') ? `url('${user.profile_image}')` : `url('${API_URL}${user.profile_image}')`)
                             : `url('https://i.pravatar.cc/150?u=${user.id}')`
                         }}
                       ></div>
                       
                       <div className="flex-1">
                         <p className="font-bold text-base">{user.name}</p>
                         <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                           Nivel {user.level} • {user.report_count || 0} rapoarte
                         </p>
                       </div>
                       
                       <div className="text-right">
                         <p className={`font-bold ${index === 0 ? 'text-[#0df259]' : (darkMode ? 'text-gray-200' : 'text-gray-700')}`}>
                           {user.xp.toLocaleString()}
                         </p>
                         <p className="text-[10px] uppercase font-bold text-gray-500">pct</p>
                       </div>
                     </GlassCard>
                   ))
                 )}
              </div>
         </section>

         <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
                  <h3 className="text-xl font-bold flex items-center gap-2"><Recycle className="text-[#0df259] w-5 h-5" /> Ghid & Sfaturi</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard darkMode={darkMode} className="p-4 flex flex-col items-center gap-2 text-center group cursor-pointer hover:border-yellow-400/50">
                    <div className="bg-yellow-400/10 w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Trash2 className="text-yellow-400 w-6 h-6"/></div>
                    <h4 className="font-bold text-sm">Plastic/Metal</h4>
                    <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Curat & Strivit</p>
                </GlassCard>
                <GlassCard darkMode={darkMode} className="p-4 flex flex-col items-center gap-2 text-center group cursor-pointer hover:border-blue-400/50">
                    <div className="bg-blue-400/10 w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Info className="text-blue-400 w-6 h-6"/></div>
                    <h4 className="font-bold text-sm">Hârtie</h4>
                     <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fără Ulei</p>
                </GlassCard>
                <GlassCard darkMode={darkMode} className="p-4 flex flex-col items-center gap-2 text-center group cursor-pointer hover:border-green-400/50">
                    <div className="bg-green-400/10 w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><CheckCircle className="text-green-400 w-6 h-6"/></div>
                    <h4 className="font-bold text-sm">Sticlă</h4>
                     <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fără Capace</p>
                </GlassCard>
                <GlassCard darkMode={darkMode} className="p-4 flex flex-col items-center gap-2 text-center group cursor-pointer hover:border-purple-400/50">
                    <div className="bg-purple-400/10 w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Battery className="text-purple-400 w-6 h-6"/></div>
                    <h4 className="font-bold text-sm">Baterii</h4>
                     <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Puncte Speciale</p>
                </GlassCard>
            </div>
        </section>
      </div>
    </div>
  );
}