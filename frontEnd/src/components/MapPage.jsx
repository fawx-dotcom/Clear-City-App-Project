import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl, useMapEvents } from 'react-leaflet';
import { useLocation } from 'react-router-dom'; // CERINTA: Pentru fix randare
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// CERINTA 2: Limite Stricte
const romaniaBounds = [ [43.6, 20.2], [48.3, 29.7] ];

const createCustomIcon = (type, isUser) => {
  const color = isUser ? '#facc15' : '#ef4444'; 
  const html = `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color}; display: flex; align-items: center; justify-content: center;"></div>`;
  return L.divIcon({ className: 'custom-marker', html: html, iconSize: [24, 24], iconAnchor: [12, 12] });
};

function MapController({ center, zoom, onMove }) {
  const map = useMap();
  useEffect(() => {
      if(center) {
          map.flyTo(center, zoom, { duration: 1.5 });
          if (onMove) onMove(); 
      }
  }, [center, zoom, map, onMove]);
  return null;
}

function MapFixer() {
  const map = useMapEvents({});
  const location = useLocation();
  useEffect(() => { setTimeout(() => { map.invalidateSize(); }, 150); }, [location, map]);
  return null;
}

export default function MapPage({ darkMode, reports, externalcenter }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCenter, setSearchCenter] = useState(externalcenter || null);
  const [selectedReport, setSelectedReport] = useState(null);

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${searchTerm}&format=json&limit=1&countrycodes=ro`);
            const data = await response.json();
            if (data && data.length > 0) {
                setSearchCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
            } else {
                alert('Locația nu a fost găsită în România.');
            }
        } catch (error) { console.error(error); }
    }
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 flex flex-col pt-28 px-6 pb-6 md:pt-24 md:pb-6">
        <div className="flex-1 w-full rounded-3xl overflow-hidden border-4 border-[#0df259] relative shadow-2xl z-0 bg-white">
            <MapContainer 
            center={[45.9432, 24.9668]} zoom={7} minZoom={7} maxBounds={romaniaBounds} maxBoundsViscosity={1.0}
            style={{ height: "100%", width: "100%" }} zoomControl={false}
            >
            <MapFixer />
            <TileLayer
                attribution='&copy; OpenStreetMap & CARTO'
                url={darkMode ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}
            />
            <ZoomControl position="bottomright" />
            {searchCenter && <MapController center={searchCenter} zoom={13} onMove={() => setSearchCenter(null)} />}
            {reports.filter(r => r.status !== 'resolved').map(r => (
                <Marker key={r.id} position={[r.lat, r.lng]} icon={createCustomIcon(r.type, r.userId === 'current')}
                eventHandlers={{ click: () => setSelectedReport(r) }} />
            ))}
            </MapContainer>

            <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
                <div className="flex w-full max-w-md mx-auto items-center rounded-xl h-12 bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg pointer-events-auto">
                    <div className="pl-4 text-[#0df259]"><Search className="w-6 h-6"/></div>
                    <input type="text" placeholder="Caută zone în România..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleSearch} className="bg-transparent border-none w-full h-full px-4 text-black focus:ring-0 outline-none" />
                </div>
            </div>
        </div>

        <div className={`absolute top-0 right-0 h-full w-full md:w-[400px] z-[1001] pointer-events-none flex flex-col justify-end md:justify-start ${selectedReport ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300`}>
            {selectedReport && (
                <div className="pointer-events-auto h-[60%] md:h-full w-full bg-white shadow-2xl rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none flex flex-col border-l border-gray-200 mt-auto md:mt-20">
                    <div className="w-full flex justify-center pt-4 pb-2 md:hidden"><div className="w-12 h-1.5 bg-gray-400/20 rounded-full"></div></div>
                    <div className="p-6 flex-grow overflow-y-auto text-slate-900">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg">Detalii Sesizare</h3>
                            <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6"/></button>
                        </div>
                        <p className="text-sm">{selectedReport.description}</p>
                        <img src={selectedReport.image || "https://placehold.co/600x400"} className="mt-4 rounded-lg w-full h-48 object-cover" />
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}