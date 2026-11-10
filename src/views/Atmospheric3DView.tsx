import React, { useState, useEffect } from 'react';
import {
  Layers,
  Wind,
  Sun,
  Eye,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
  RotateCcw,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { LocationData, AqiStandard } from '../types/aqi';
import { getAqiCategory } from '../lib/aqi';
import {
  Atmospheric3DScene,
  CameraViewPreset,
} from '../components/3d/Atmospheric3DScene';

interface Atmospheric3DViewProps {
  currentLocation: LocationData | null;
  standard: AqiStandard;
  onSelectCity: (city: string) => void;
  onUseCurrentLocation: () => void;
  isLocating?: boolean;
}

export const Atmospheric3DView: React.FC<Atmospheric3DViewProps> = ({
  currentLocation,
  standard,
  onSelectCity,
  onUseCurrentLocation,
  isLocating,
}) => {
  const [cameraPreset, setCameraPreset] = useState<CameraViewPreset>('hero');
  const [explodedFactor, setExplodedFactor] = useState<number>(0.0);
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [timeOfDay, setTimeOfDay] = useState<number>(0.5); // 0.5 = midday
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [activeDockTab, setActiveDockTab] = useState<'assembly' | 'atmosphere' | 'cities'>('assembly');

  const popularCities = ['Delhi', 'London', 'New York', 'Tokyo', 'Sydney', 'Paris'];

  // Keyboard shortcut 'H' to toggle dock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setIsDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const curAqi = currentLocation?.aqi ?? 100;
  const category = getAqiCategory(curAqi, standard);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden select-none">
      {/* Full-Bleed 3D WebGL Canvas */}
      <div className="absolute inset-0 z-0">
        <Atmospheric3DScene
          locationData={currentLocation}
          standard={standard}
          cameraPreset={cameraPreset}
          explodedFactor={explodedFactor}
          showParticles={showParticles}
          timeOfDay={timeOfDay}
        />
      </div>

      {/* Top-Left: Minimal Telemetry Pill (Spec Badge) */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl max-w-sm pointer-events-auto space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-slate-100 tracking-tight">
                {currentLocation?.city || 'Selected Station'}
              </h2>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{
                backgroundColor: `${category.color}20`,
                color: category.color,
                borderColor: `${category.color}40`,
              }}
            >
              {category.name}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-0.5 border-t border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 block">Air Quality Index</span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-2xl font-black font-mono tracking-tight"
                  style={{ color: category.color }}
                >
                  {curAqi}
                </span>
                <span className="text-xs text-slate-400">AQI ({standard === 'US_EPA' ? 'EPA' : 'CPCB'})</span>
              </div>
            </div>

            <div className="text-right text-[11px] space-y-0.5">
              <span className="text-slate-400 block">Wind: <strong className="text-slate-200">{currentLocation?.weather.windSpeed ?? 5} km/h</strong></span>
              <span className="text-slate-400 block">PM2.5: <strong className="text-slate-200">{currentLocation?.pollutants.pm25 ?? 'N/A'} µg/m³</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Top-Right: Camera View Angle Presets */}
      <div className="absolute top-4 right-4 z-10">
        <div className="p-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center gap-1 text-xs">
          <button
            onClick={() => setCameraPreset('hero')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              cameraPreset === 'hero'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hero Station
          </button>
          <button
            onClick={() => setCameraPreset('dispersion')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              cameraPreset === 'dispersion'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Wind Dispersion
          </button>
          <button
            onClick={() => setCameraPreset('panorama')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              cameraPreset === 'panorama'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            City Panorama
          </button>
        </div>
      </div>

      {/* Collapsible Ergonomic Floating Bottom Dock (<= 15% Viewport Footprint) */}
      <div
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-[840px] transition-all duration-300 ease-out ${
          isDockCollapsed ? 'translate-y-[calc(100%-2.25rem)]' : 'translate-y-0'
        }`}
      >
        {/* Dock Header & Collapse Toggle Button */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="px-3 py-1 rounded-full bg-slate-900/95 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
                <span>Show Controls (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
                <span>Hide Controls (H)</span>
              </>
            )}
          </button>
        </div>

        {/* Dock Body (Solid surface: No backdrop-filter over WebGL) */}
        <div className="p-4 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl space-y-3">
          {/* Tab Selection */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveDockTab('assembly')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeDockTab === 'assembly'
                    ? 'bg-slate-800 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Exploded Assembly</span>
              </button>

              <button
                onClick={() => setActiveDockTab('atmosphere')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeDockTab === 'atmosphere'
                    ? 'bg-slate-800 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wind className="w-3.5 h-3.5" />
                <span>Atmospheric Dispersion</span>
              </button>

              <button
                onClick={() => setActiveDockTab('cities')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeDockTab === 'cities'
                    ? 'bg-slate-800 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Live City Sync</span>
              </button>
            </div>

            <button
              onClick={() => {
                setExplodedFactor(0);
                setShowParticles(true);
                setTimeOfDay(0.5);
                setCameraPreset('hero');
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Reset View Parameters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab 1: Exploded Assembly Slider */}
          {activeDockTab === 'assembly' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  Kinematic Layer Separation (Exploded View):
                </span>
                <span className="font-mono text-sky-400 font-bold">
                  {Math.round(explodedFactor * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500">Assembled</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodedFactor}
                  onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] text-slate-500">Separated</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Separates concrete pedestal, titanium mast, nephelometer, radiometer dome, solar wing, and beacon along the Y-axis.
              </p>
            </div>
          )}

          {/* Tab 2: Atmospheric Dispersion & Sun Position */}
          {activeDockTab === 'atmosphere' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    Sun Azimuth (Time of Day):
                  </span>
                  <span className="font-mono text-amber-400">
                    {timeOfDay < 0.3 ? 'Morning' : timeOfDay > 0.7 ? 'Golden Hour' : 'Midday'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.02"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 sm:pt-0">
                <div>
                  <span className="text-xs text-slate-300 font-medium block">
                    Particulate Aerosol Flow
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Simulate real-time PM2.5 dispersion plumes
                  </span>
                </div>
                <button
                  onClick={() => setShowParticles(!showParticles)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    showParticles
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {showParticles ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Quick Live City Telemetry Sync */}
          {activeDockTab === 'cities' && (
            <div className="space-y-2">
              <span className="text-[11px] text-slate-400 block">
                Load real-time atmospheric telemetry into the 3D twin:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onUseCurrentLocation}
                  disabled={isLocating}
                  className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold hover:bg-sky-500/20 transition-colors"
                >
                  {isLocating ? 'Locating...' : 'My Location'}
                </button>
                {popularCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => onSelectCity(city)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      currentLocation?.city.toLowerCase().includes(city.toLowerCase())
                        ? 'bg-sky-500 text-white border-sky-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
