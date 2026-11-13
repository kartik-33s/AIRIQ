import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  Layers,
  Flame,
  Search,
  Filter,
  RefreshCw,
  X,
  Compass,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Wind,
  CloudRain,
  Plus,
  Minus,
} from 'lucide-react';
import { MapStation, AqiStandard, LocationData, WindDispersionData } from '../types/aqi';
import { getAqiCategory } from '../lib/aqi';
import { WindDispersionOverlay } from '../components/WindDispersionOverlay';
import { WindDispersionHud } from '../components/WindDispersionHud';

interface MapViewProps {
  currentLocation: LocationData | null;
  standard: AqiStandard;
  onSelectStation: (city: string) => void;
  onUseCurrentLocation: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  currentLocation,
  standard,
  onSelectStation,
  onUseCurrentLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [stations, setStations] = useState<MapStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showStations, setShowStations] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [selectedStation, setSelectedStation] = useState<MapStation | null>(null);
  const [mapSearch, setMapSearch] = useState('');

  // Wind Vector & Smoke Dispersion states
  const [dispersionData, setDispersionData] = useState<WindDispersionData | null>(null);
  const [loadingDispersion, setLoadingDispersion] = useState(false);
  const [showWindParticles, setShowWindParticles] = useState(true);
  const [showSmokeMode, setShowSmokeMode] = useState(false);
  const [showVectorArrows, setShowVectorArrows] = useState(true);
  const [isHudExpanded, setIsHudExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1280 && window.innerHeight >= 820;
    }
    return false;
  });

  // Default center
  const initialLat = currentLocation?.coordinates.lat || 28.6139;
  const initialLng = currentLocation?.coordinates.lng || 77.209;

  // Fetch real-time wind vectors & transboundary dispersion metrics from server
  const fetchDispersionData = useCallback((lat: number, lng: number) => {
    setLoadingDispersion(true);
    fetch(`/api/aqi/dispersion?lat=${lat}&lng=${lng}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.center) {
          setDispersionData(data);
        }
        setLoadingDispersion(false);
      })
      .catch(() => setLoadingDispersion(false));
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 11,
      zoomControl: false,
    });

    // Public OpenStreetMap tiles (100% free, no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Layer groups
    markersLayerRef.current = L.layerGroup().addTo(map);
    heatmapLayerRef.current = L.layerGroup().addTo(map);
    hotspotLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    setMapInstance(map);

    // Load bounds & dispersion telemetry on move end
    const fetchBoundsStations = () => {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const center = map.getCenter();

      // Trigger wind & dispersion telemetry update for the viewport center
      fetchDispersionData(center.lat, center.lng);

      setLoading(true);
      fetch(`/api/aqi/map-bounds?lat1=${sw.lat}&lng1=${sw.lng}&lat2=${ne.lat}&lng2=${ne.lng}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.stations && Array.isArray(data.stations)) {
            setStations(data.stations);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    map.on('moveend', fetchBoundsStations);
    // Initial fetch
    fetchBoundsStations();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      setMapInstance(null);
    };
  }, [initialLat, initialLng, fetchDispersionData]);

  // Center map if location changes externally
  useEffect(() => {
    if (mapInstanceRef.current && currentLocation) {
      mapInstanceRef.current.setView(
        [currentLocation.coordinates.lat, currentLocation.coordinates.lng],
        11,
        { animate: true }
      );
      fetchDispersionData(currentLocation.coordinates.lat, currentLocation.coordinates.lng);
    }
  }, [currentLocation?.coordinates.lat, currentLocation?.coordinates.lng, fetchDispersionData]);

  // Update map markers when stations or layer toggles change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear previous layers
    markersLayerRef.current?.clearLayers();
    heatmapLayerRef.current?.clearLayers();
    hotspotLayerRef.current?.clearLayers();

    // Always plot the current primary location marker
    if (currentLocation && markersLayerRef.current && showStations) {
      const currentCat = getAqiCategory(currentLocation.aqi, standard);
      const primaryIcon = L.divIcon({
        className: 'custom-aqi-marker',
        html: `
          <div style="
            background-color: ${currentCat.color};
            color: #ffffff;
            font-weight: 800;
            font-size: 13px;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 15px ${currentCat.color}99, 0 4px 6px -1px rgba(0,0,0,0.4);
            border: 3px solid #ffffff;
          " class="pulsing-beacon">
            ${currentLocation.aqi}
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const primaryMarker = L.marker(
        [currentLocation.coordinates.lat, currentLocation.coordinates.lng],
        { icon: primaryIcon }
      );

      primaryMarker.on('click', () => {
        setSelectedStation({
          uid: 'primary',
          lat: currentLocation.coordinates.lat,
          lng: currentLocation.coordinates.lng,
          aqi: currentLocation.aqi,
          name: currentLocation.city,
          time: currentLocation.lastUpdated,
          badge: currentLocation.badge,
          source: currentLocation.sourceName,
        });
      });

      markersLayerRef.current.addLayer(primaryMarker);
    }

    // Add stations from bounds
    stations.forEach((st) => {
      const cat = getAqiCategory(st.aqi, standard);

      // 1. Heatmap layer: semi-transparent colored circle
      if (showHeatmap && heatmapLayerRef.current) {
        const radius = Math.min(6000, Math.max(1500, st.aqi * 25));
        const circle = L.circle([st.lat, st.lng], {
          radius,
          color: cat.color,
          fillColor: cat.color,
          fillOpacity: 0.18,
          stroke: false,
        });
        heatmapLayerRef.current.addLayer(circle);
      }

      // 2. Hotspots: If AQI is high (> 150), add pulsing beacon
      if (showHotspots && st.aqi >= 150 && hotspotLayerRef.current) {
        const hotspotIcon = L.divIcon({
          className: 'hotspot-marker',
          html: `
            <div style="
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background-color: ${cat.color};
              box-shadow: 0 0 12px ${cat.color};
            " class="pulsing-beacon"></div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        const hm = L.marker([st.lat, st.lng], { icon: hotspotIcon });
        hotspotLayerRef.current.addLayer(hm);
      }

      // 3. Station markers
      if (showStations && markersLayerRef.current) {
        const markerIcon = L.divIcon({
          className: 'station-badge',
          html: `
            <div style="
              background-color: ${cat.color};
              color: ${cat.textColor === '#d97706' || cat.textColor === '#65a30d' ? '#000000' : '#ffffff'};
              font-weight: 700;
              font-size: 11px;
              padding: 2px 7px;
              border-radius: 9999px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              border: 1.5px solid rgba(255,255,255,0.8);
              white-space: nowrap;
            ">
              ${st.aqi}
            </div>
          `,
          iconSize: [32, 22],
          iconAnchor: [16, 11],
        });

        const marker = L.marker([st.lat, st.lng], { icon: markerIcon });
        marker.on('click', () => {
          setSelectedStation(st);
        });
        markersLayerRef.current.addLayer(marker);
      }
    });
  }, [stations, showStations, showHeatmap, showHotspots, standard, currentLocation]);

  // Jump to location from map search
  const handleMapSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearch.trim()) return;

    try {
      const resp = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          mapSearch
        )}&count=1&language=en`
      );
      const data = await resp.json();
      if (data.results && data.results[0]) {
        const { latitude, longitude } = data.results[0];
        mapInstanceRef.current?.setView([latitude, longitude], 12, { animate: true });
        setMapSearch('');
      }
    } catch {
      // Ignore
    }
  };

  // Handle corridor preset jump
  const handleSelectPreset = (lat: number, lng: number, _name: string) => {
    mapInstanceRef.current?.setView([lat, lng], 11, { animate: true });
    fetchDispersionData(lat, lng);
  };

  // Top polluted stations nearby
  const sortedPolluted = [...stations].sort((a, b) => b.aqi - a.aqi).slice(0, 4);
  // Cleanest stations nearby
  const sortedCleanest = [...stations].sort((a, b) => a.aqi - b.aqi).slice(0, 4);

  return (
    <div className="relative w-full h-[calc(100dvh-8rem)] sm:h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-8.35rem)] flex flex-col overflow-hidden">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-4 z-[1000] flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3 pointer-events-none">
        {/* Search Input Box */}
        <form
          onSubmit={handleMapSearchSubmit}
          className="pointer-events-auto flex items-center bg-slate-900/95 light:bg-white/95 backdrop-blur-md rounded-xl border border-slate-700/80 light:border-slate-300 shadow-xl px-3 py-1 w-full md:w-56 lg:w-72 shrink-0 min-h-[42px]"
        >
          <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={mapSearch}
            onChange={(e) => setMapSearch(e.target.value)}
            placeholder="Search map location..."
            className="w-full bg-transparent text-xs text-slate-100 light:text-slate-900 focus:outline-none placeholder:text-slate-500 min-h-[36px]"
          />
          <button
            type="button"
            onClick={onUseCurrentLocation}
            title="Pan to My Location"
            aria-label="Pan to My Location"
            className="p-1.5 text-slate-400 hover:text-sky-400 transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
          >
            <Compass className="w-4 h-4" />
          </button>
        </form>

        {/* Layer Toggles & Refresh Status */}
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 bg-slate-900/95 light:bg-white/95 backdrop-blur-md rounded-xl border border-slate-700/80 light:border-slate-300 shadow-xl px-2 py-1 text-xs text-slate-300 light:text-slate-700 overflow-x-auto no-scrollbar max-w-full min-w-0">
          <button
            type="button"
            onClick={() => setShowStations(!showStations)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 min-h-[36px] touch-manipulation ${
              showStations ? 'bg-sky-500/20 text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> Stations
          </button>

          <button
            type="button"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 min-h-[36px] touch-manipulation ${
              showHeatmap ? 'bg-indigo-500/20 text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Heatmap
          </button>

          <button
            type="button"
            onClick={() => setShowHotspots(!showHotspots)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 min-h-[36px] touch-manipulation ${
              showHotspots ? 'bg-rose-500/20 text-rose-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Hotspots
          </button>

          <span className="w-px h-4 bg-slate-700 light:bg-slate-300 mx-0.5 flex-shrink-0" />

          <button
            type="button"
            onClick={() => setShowWindParticles(!showWindParticles)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 min-h-[36px] touch-manipulation ${
              showWindParticles ? 'bg-sky-500/25 text-sky-400 font-semibold border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Animated Wind Streamlines"
          >
            <Wind className="w-3.5 h-3.5" /> Streamlines
          </button>

          <button
            type="button"
            onClick={() => setShowSmokeMode(!showSmokeMode)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 min-h-[36px] touch-manipulation ${
              showSmokeMode ? 'bg-amber-500/25 text-amber-400 font-semibold border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Transboundary Smoke Dispersion"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Smoke
          </button>

          {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400 ml-1 flex-shrink-0" />}
        </div>
      </div>

      {/* Main Leaflet Map Viewport */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-950" />

      {/* Responsive Touch-Friendly Map Zoom Controls */}
      <div className="absolute top-[116px] md:top-[76px] left-2.5 sm:left-4 z-[999] flex flex-col bg-slate-900/95 light:bg-white/95 backdrop-blur-md rounded-xl border border-slate-700/80 light:border-slate-300 shadow-xl overflow-hidden">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          aria-label="Zoom in map"
          title="Zoom in"
          className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-200 light:text-slate-800 hover:bg-slate-800 light:hover:bg-slate-100 border-b border-slate-700/80 light:border-slate-200 transition-colors touch-manipulation"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          aria-label="Zoom out map"
          title="Zoom out"
          className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-200 light:text-slate-800 hover:bg-slate-800 light:hover:bg-slate-100 transition-colors touch-manipulation"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Wind Particles & Smoke Dispersion Layer */}
      <WindDispersionOverlay
        map={mapInstance}
        active={showWindParticles || showSmokeMode}
        showSmoke={showSmokeMode}
        showVectors={showVectorArrows}
        data={dispersionData}
      />

      {/* Floating Map Legend (Bottom Left Tablet+) */}
      <div className="absolute bottom-4 left-4 z-[1000] hidden md:block bg-slate-950/85 light:bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 light:border-slate-300 text-xs shadow-lg space-y-1.5">
        <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider block">
          AQI Scale ({standard === 'US_EPA' ? 'US EPA' : 'India CPCB'})
        </span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-300 light:text-slate-700">0 - 50 Good</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-slate-300 light:text-slate-700">51 - 100 Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-slate-300 light:text-slate-700">101 - 150 Poor / Sensitive</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-slate-300 light:text-slate-700">151 - 200 Unhealthy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-slate-300 light:text-slate-700">201 - 300 Very Unhealthy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-950 border border-rose-500" />
          <span className="text-slate-300 light:text-slate-700">301+ Severe / Hazardous</span>
        </div>
      </div>

      {/* Slide-Out Side Panel on Desktop or Bottom Sheet on Mobile */}
      {selectedStation && (
        <div className="absolute bottom-2.5 right-2.5 left-2.5 sm:left-auto sm:right-4 sm:top-20 sm:bottom-auto sm:w-80 z-[1001] bg-slate-900/95 light:bg-white/95 backdrop-blur-md rounded-2xl border border-slate-700 light:border-slate-300 shadow-2xl p-4 text-xs max-h-[58%] sm:max-h-[calc(100%-6.5rem)] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 light:border-slate-200">
            <h4 className="font-bold text-slate-100 light:text-slate-900 text-sm truncate pr-2">
              {selectedStation.name}
            </h4>
            <button
              type="button"
              onClick={() => setSelectedStation(null)}
              aria-label="Close Station Details"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {(() => {
            const cat = getAqiCategory(selectedStation.aqi, standard);
            return (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">CURRENT AQI</span>
                    <span
                      className="text-3xl font-black tabular-nums"
                      style={{ color: cat.color }}
                    >
                      {selectedStation.aqi}
                    </span>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-bold border"
                    style={{
                      backgroundColor: cat.bgColor,
                      borderColor: cat.borderColor,
                      color: cat.color,
                    }}
                  >
                    {cat.name}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 light:text-slate-600 space-y-1 bg-slate-800/50 light:bg-slate-100 p-2.5 rounded-lg">
                  <p>
                    <strong>Source:</strong> {selectedStation.source}
                  </p>
                  <p>
                    <strong>Badge:</strong> {selectedStation.badge}
                  </p>
                  <p>
                    <strong>Coordinates:</strong> {selectedStation.lat.toFixed(3)},{' '}
                    {selectedStation.lng.toFixed(3)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectStation(selectedStation.name);
                    setSelectedStation(null);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[42px] touch-manipulation"
                >
                  View Full Station Analysis <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Clean Air Finder & Hotspots Panel (Top Right Desktop - shifts beside HUD on xl or hides when HUD expanded on smaller heights) */}
      {!selectedStation && sortedCleanest.length > 0 && (
        <div
          className={`absolute top-20 z-[999] hidden w-72 bg-slate-900/90 light:bg-white/95 backdrop-blur-md rounded-2xl border border-slate-800 light:border-slate-300 shadow-xl p-3 text-xs space-y-3 transition-all ${
            isHudExpanded
              ? 'xl:block xl:right-[26rem]'
              : 'lg:block right-4'
          }`}
        >
          <div>
            <span className="font-bold text-[11px] text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Cleanest Air in View
            </span>
            <div className="space-y-1">
              {sortedCleanest.map((st, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    mapInstanceRef.current?.setView([st.lat, st.lng], 13);
                    setSelectedStation(st);
                  }}
                  className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/70 light:hover:bg-slate-100 cursor-pointer text-left"
                >
                  <span className="truncate pr-2 text-slate-300 light:text-slate-700">{st.name.split(',')[0]}</span>
                  <span className="font-bold text-emerald-400 font-mono">{st.aqi}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 light:border-slate-200">
            <span className="font-bold text-[11px] text-rose-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
              <Flame className="w-3.5 h-3.5" /> High Pollution Hotspots
            </span>
            <div className="space-y-1">
              {sortedPolluted.map((st, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    mapInstanceRef.current?.setView([st.lat, st.lng], 13);
                    setSelectedStation(st);
                  }}
                  className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/70 light:hover:bg-slate-100 cursor-pointer text-left"
                >
                  <span className="truncate pr-2 text-slate-300 light:text-slate-700">{st.name.split(',')[0]}</span>
                  <span className="font-bold text-rose-400 font-mono">{st.aqi}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Wind Vector & Smoke Dispersion HUD */}
      <WindDispersionHud
        data={dispersionData}
        loading={loadingDispersion}
        showWindParticles={showWindParticles}
        onToggleWindParticles={() => setShowWindParticles((prev) => !prev)}
        showSmokeMode={showSmokeMode}
        onToggleSmokeMode={() => setShowSmokeMode((prev) => !prev)}
        showVectorArrows={showVectorArrows}
        onToggleVectorArrows={() => setShowVectorArrows((prev) => !prev)}
        onSelectPreset={handleSelectPreset}
        activeCityName={currentLocation?.city || 'Selected Region'}
        isExpanded={isHudExpanded}
        onToggleExpand={setIsHudExpanded}
      />
    </div>
  );
};
