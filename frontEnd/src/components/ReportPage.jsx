import React, { useState, useEffect } from 'react';
import { MapPin, Info, Camera, ChevronRight, X } from 'lucide-react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useNavigate, useLocation } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

const GlassCard = ({ children, className = "", onClick, darkMode }) => (
  <div onClick={onClick} className={`${darkMode ? 'bg-[#1A2C20]/80 border-white/5' : 'bg-white border-gray-100'} backdrop-blur-md border rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#0df259]/30 ${className}`}>
    {children}
  </div>
);

const PrimaryButton = ({ children, onClick, className = "", icon: Icon, disabled }) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`bg-[#0df259] text-[#102216] font-bold rounded-xl py-3 px-6 shadow-[0_0_20px_rgba(13,242,89,0.3)] hover:shadow-[0_0_30px_rgba(13,242,89,0.5)] transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
  >
    {Icon && <Icon className="w-5 h-5" />}
    {children}
  </button>
);

function MapController({ center, zoom }) {
    const map = useMap();
    useEffect(() => { 
      if(center) map.flyTo(center, zoom); 
    }, [center, zoom, map]);
    return null;
}

function MapFixer() {
    const map = useMapEvents({});
    const location = useLocation();
    useEffect(() => { 
      setTimeout(() => { map.invalidateSize(); }, 150); 
    }, [location, map]);
    return null;
}

function ReportMapListener({ setCoords }) {
    const map = useMapEvents({ 
      moveend: () => { 
        const center = map.getCenter(); 
        setCoords([center.lat, center.lng]); 
      } 
    });
    return null;
}

export default function ReportPage({ darkMode, onReportSubmit, currentUser }) {
  const [reportCoords, setReportCoords] = useState([44.4268, 26.1025]); 
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('București');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const navigate = useNavigate();

  const handleReportAddressSearch = async (e) => {
    if (e.key === 'Enter' && locationName.trim() !== '') {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${locationName}&format=json&limit=1&countrycodes=ro`);
            const data = await response.json();
            if (data && data.length > 0) {
                setReportCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]); 
                setLocationName(data[0].display_name);
            } else { 
              alert('❌ Adresa nu a fost găsită în România.'); 
            }
        } catch (error) { 
          console.error(error);
          alert('❌ Eroare la căutarea adresei.');
        }
    }
  };

  const handleGetGeolocation = () => {
    if (navigator.geolocation) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setReportCoords([latitude, longitude]);
          
          try {
             const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
             const data = await response.json();
             setLocationName(data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } catch (e) { 
            setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`); 
          }
          setGettingLocation(false);
        },
        (error) => {
          alert('❌ Nu am putut obține locația. Activați locația în browser.');
          setGettingLocation(false);
        }, 
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('❌ Geolocation nu este suportat de acest browser.');
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('❌ Imaginea este prea mare! Maxim 10MB.');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('❌ Te rog selectează o imagine validă!');
        return;
      }
      
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!imageFile) {
      alert('📸 Te rog adaugă o poză cu deșeurile!');
      return;
    }
    
    if (!description.trim()) {
      alert('📝 Te rog adaugă o descriere!');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const reportData = {
        latitude: reportCoords[0],
        longitude: reportCoords[1],
        location_name: locationName,
        description: description,
        image: imageFile
      };
      
      await onReportSubmit(reportData);
      
      // Reset form
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      setLocationName('București');
      
      navigate('/map');
      
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-6 pt-6 pb-8">
        {/* LOCAȚIE */}
        <GlassCard darkMode={darkMode} className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="text-[#0df259]" /> 1. Locație
            </h2>
            
            <div className="h-48 w-full rounded-xl overflow-hidden relative mb-4 border border-white/10 z-0 bg-gray-800">
                <MapContainer 
                  center={reportCoords} 
                  zoom={16} 
                  style={{ height: "100%", width: "100%" }} 
                  zoomControl={false} 
                  attributionControl={false}
                >
                    <MapFixer />
                    <MapController center={reportCoords} zoom={16} /> 
                    <ReportMapListener setCoords={setReportCoords} />
                    <TileLayer url={darkMode ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'} />
                    
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[100%] z-[1000] pointer-events-none">
                        <MapPin 
                          className="w-8 h-8 text-[#0df259] drop-shadow-lg animate-bounce" 
                          style={{filter: "drop-shadow(0px 5px 5px rgba(0,0,0,0.5))"}} 
                          fill="currentColor" 
                        />
                    </div>
                </MapContainer>
            </div>
            
            <p className="text-xs text-gray-500 mb-2">
               Lat: {reportCoords[0].toFixed(6)}, Lng: {reportCoords[1].toFixed(6)}
            </p>
            
            <input 
              type="text" 
              placeholder="Scrie strada și apasă Enter..." 
              value={locationName} 
              onChange={(e) => setLocationName(e.target.value)} 
              onKeyDown={handleReportAddressSearch} 
              className={`w-full rounded-lg border px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0df259] focus:outline-none mb-2 ${darkMode ? 'bg-black/20 border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-black'}`} 
            />
            
            <button 
              onClick={handleGetGeolocation} 
              disabled={gettingLocation}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0df259]/10 py-3 text-sm font-bold text-[#0df259] hover:bg-[#0df259]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {gettingLocation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0df259] border-t-transparent"></div>
                  Se obține locația...
                </>
              ) : (
                <>Folosește Locația Curentă GPS</>
              )}
            </button>
        </GlassCard>

        {/* IMAGINE */}
        <GlassCard darkMode={darkMode} className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Camera className="text-[#0df259]" /> 2. Adaugă Poză
            </h2>
            
            {!imagePreview ? (
              <label className={`group relative flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors hover:border-[#0df259]/50 ${darkMode ? 'border-white/10 bg-[#1A2C20]' : 'border-gray-300 bg-white'}`}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageSelect} 
                  className="hidden" 
                />
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${darkMode ? 'bg-black/20 text-gray-500' : 'bg-gray-100 text-gray-400'} group-hover:text-[#0df259] transition-colors`}>
                  <Camera className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold">Click pentru a adăuga poză</p>
                <p className="text-xs text-gray-500">Max 10MB - JPEG, PNG, GIF</p>
              </label>
            ) : (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-64 object-cover rounded-xl"
                />
                <button 
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors shadow-lg"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  {imageFile?.name} ({(imageFile?.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              </div>
            )}
        </GlassCard>

        {/* DETALII */}
        <GlassCard darkMode={darkMode} className="p-6">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
               <Info className="text-[#0df259]" /> 3. Detalii
             </h2>
             
            <textarea 
              rows="4" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Descrie problema: tip de deșeu, cantitate aproximativă, alte detalii relevante..."
              className={`w-full rounded-lg border p-3 text-sm font-medium focus:ring-1 focus:ring-[#0df259] focus:outline-none ${darkMode ? 'bg-black/20 border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-black'}`} 
            ></textarea>
            
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-400">
                💡 <strong>Sfat:</strong> Imaginea va fi analizată de AI. Asigură-te că deșeurile sunt vizibile clar în poză!
              </p>
            </div>
        </GlassCard>

        {/* BUTON SUBMIT */}
        <PrimaryButton 
          className="w-full mt-2" 
          onClick={handleSubmit} 
          icon={ChevronRight}
          disabled={submitting || !imageFile || !description.trim()}
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#102216] border-t-transparent"></div>
              Se trimite...
            </>
          ) : (
            'Trimite Raport'
          )}
        </PrimaryButton>
        
        {submitting && (
          <div className="text-center text-sm text-gray-400 animate-pulse">
             Se analizează imaginea cu AI...
          </div>
        )}
        
        <div className={`text-center text-xs p-3 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
          <p className="text-gray-500">
            După trimitere, raportul va fi verificat de echipa noastră. Vei primi +10 XP! 🎉
          </p>
        </div>
    </div>
  );
}